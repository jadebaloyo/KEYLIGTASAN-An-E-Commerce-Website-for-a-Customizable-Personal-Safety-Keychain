<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Start session
session_start();

// Database configuration
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} elseif (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
} else {
    if (!defined('DB_HOST')) {
        define('DB_HOST', '127.0.0.1');
        define('DB_USER', 'root');
        define('DB_PASS', '');
        define('DB_NAME', 'keyligtasan_db');
    }
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate input
if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request data'
    ]);
    exit;
}

try {
    // Create database connection
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }

    // Get user_id from session
    $user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 1;

    // Validate that cart_items are present
    if (!isset($data['cart_items']) || empty($data['cart_items'])) {
        throw new Exception('Cart is empty. Please add items to your cart before checking out.');
    }

    // Extract shipping address and payment data
    $shipping = $data['shipping_address'];
    $payment_method = isset($data['payment_method']) ? $data['payment_method'] : 'Cash on Delivery';
    $order_notes = isset($data['order_notes']) ? $data['order_notes'] : '';
    
    // Validate required fields
    $required_fields = ['recipient_name', 'phone_number', 'address', 'city', 'province'];
    foreach ($required_fields as $field) {
        if (empty($shipping[$field])) {
            throw new Exception("Field '{$field}' is required");
        }
    }

    // Start transaction
    $conn->begin_transaction();

    // Calculate totals
    $subtotal = 0;
    foreach ($data['cart_items'] as $item) {
        $price = isset($item['price']) ? floatval($item['price']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        $subtotal += $price * $quantity;
    }
    
    $shipping_fee = isset($data['shipping']) ? floatval($data['shipping']) : 0;
    $total = isset($data['total']) ? floatval($data['total']) : ($subtotal + $shipping_fee);

    // Step 1: Insert or get shipping address
    $shipping_address_id = null;
    
    // Check if address already exists
    $check_sql = "SELECT id FROM shipping_addresses 
                  WHERE user_id = ? 
                  AND recipient_name = ? 
                  AND phone_number = ? 
                  AND address = ? 
                  AND city = ? 
                  AND province = ?
                  LIMIT 1";
    
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("isssss", 
        $user_id,
        $shipping['recipient_name'],
        $shipping['phone_number'],
        $shipping['address'],
        $shipping['city'],
        $shipping['province']
    );
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        // Address exists, use it
        $row = $check_result->fetch_assoc();
        $shipping_address_id = $row['id'];
    } else {
        // Insert new address
        $addr_sql = "INSERT INTO shipping_addresses 
                    (user_id, recipient_name, phone_number, address, city, province, postal_code, is_default) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 0)";
        
        $addr_stmt = $conn->prepare($addr_sql);
        $postal_code = isset($shipping['postal_code']) ? $shipping['postal_code'] : '';
        
        $addr_stmt->bind_param("issssss",
            $user_id,
            $shipping['recipient_name'],
            $shipping['phone_number'],
            $shipping['address'],
            $shipping['city'],
            $shipping['province'],
            $postal_code
        );
        
        if (!$addr_stmt->execute()) {
            throw new Exception('Failed to save shipping address: ' . $addr_stmt->error);
        }
        
        $shipping_address_id = $conn->insert_id;
        $addr_stmt->close();
    }
    $check_stmt->close();

    // Step 2: Insert order record (WITHOUT order_number column)
    $order_sql = "INSERT INTO orders 
                 (user_id, shipping_address_id, subtotal, shipping_fee, total, 
                  status, payment_method, order_notes) 
                 VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)";
    
    $order_stmt = $conn->prepare($order_sql);
    if (!$order_stmt) {
        throw new Exception('Failed to prepare order statement: ' . $conn->error);
    }
    
    $order_stmt->bind_param("iidddss",
        $user_id,
        $shipping_address_id,
        $subtotal,
        $shipping_fee,
        $total,
        $payment_method,
        $order_notes
    );
    
    if (!$order_stmt->execute()) {
        throw new Exception('Failed to create order: ' . $order_stmt->error);
    }
    
    $order_id = $conn->insert_id;
    $order_stmt->close();

    // Generate order number based on ID
    $order_number = 'ORD-' . str_pad($order_id, 5, '0', STR_PAD_LEFT);

    // Step 3: Ensure order_items table exists with correct structure
    $check_table = $conn->query("SHOW TABLES LIKE 'order_items'");
    
    if ($check_table->num_rows == 0) {
        // Create order_items table
        $create_table_sql = "CREATE TABLE `order_items` (
          `id` int(11) NOT NULL AUTO_INCREMENT,
          `order_id` int(11) NOT NULL,
          `product_id` int(11) NOT NULL DEFAULT 1,
          `product_name` varchar(255) NOT NULL DEFAULT 'KEYLIGTASAN Safety Keychain',
          `color` varchar(50) DEFAULT NULL,
          `engraved_name` varchar(100) DEFAULT NULL,
          `quantity` int(11) NOT NULL DEFAULT 1,
          `unit_price` decimal(10,2) NOT NULL DEFAULT 2999.00,
          `customization_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
          `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
          `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
          `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (`id`),
          KEY `order_id` (`order_id`),
          KEY `product_id` (`product_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        if (!$conn->query($create_table_sql)) {
            throw new Exception('Failed to create order_items table: ' . $conn->error);
        }
    } else {
        // Table exists, check if it has all required columns
        $columns_result = $conn->query("DESCRIBE order_items");
        $existing_columns = [];
        while ($col = $columns_result->fetch_assoc()) {
            $existing_columns[] = $col['Field'];
        }
        
        // Add missing columns
        $required_columns = [
            'color' => "ALTER TABLE order_items ADD COLUMN color varchar(50) DEFAULT NULL",
            'engraved_name' => "ALTER TABLE order_items ADD COLUMN engraved_name varchar(100) DEFAULT NULL",
            'product_name' => "ALTER TABLE order_items ADD COLUMN product_name varchar(255) NOT NULL DEFAULT 'KEYLIGTASAN Safety Keychain'",
            'customization_fee' => "ALTER TABLE order_items ADD COLUMN customization_fee decimal(10,2) NOT NULL DEFAULT 0.00"
        ];
        
        foreach ($required_columns as $col_name => $alter_sql) {
            if (!in_array($col_name, $existing_columns)) {
                $conn->query($alter_sql);
            }
        }
    }

    // Step 4: Insert order items
    $item_sql = "INSERT INTO order_items 
                (order_id, product_id, product_name, color, engraved_name, quantity, 
                 unit_price, customization_fee, subtotal) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $item_stmt = $conn->prepare($item_sql);
    if (!$item_stmt) {
        throw new Exception('Failed to prepare order items statement: ' . $conn->error);
    }
    
    foreach ($data['cart_items'] as $item) {
        $product_id = isset($item['id']) ? intval($item['id']) : 1;
        $product_name = isset($item['name']) ? $item['name'] : 'KEYLIGTASAN Safety Keychain';
        $color = isset($item['variant']) ? $item['variant'] : '';
        $engraved_name = isset($item['engraving']) ? $item['engraving'] : '';
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        $price = isset($item['price']) ? floatval($item['price']) : 0;
        
        // Calculate base price and customization fee
        $base_price = 2999.00;
        $customization_fee = max(0, $price - $base_price);
        $item_subtotal = $price * $quantity;
        
        $item_stmt->bind_param("iisssiddd",
            $order_id,
            $product_id,
            $product_name,
            $color,
            $engraved_name,
            $quantity,
            $base_price,
            $customization_fee,
            $item_subtotal
        );
        
        if (!$item_stmt->execute()) {
            throw new Exception('Failed to add order item: ' . $item_stmt->error);
        }
    }
    
    $item_stmt->close();

    // Step 5: Clear the user's cart
    $clear_cart_sql = "DELETE FROM cart WHERE user_id = ?";
    $clear_stmt = $conn->prepare($clear_cart_sql);
    $clear_stmt->bind_param("i", $user_id);
    $clear_stmt->execute();
    $clear_stmt->close();

    // Commit transaction
    $conn->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Order placed successfully',
        'order_id' => $order_id,
        'order_number' => $order_number,
        'subtotal' => $subtotal,
        'shipping' => $shipping_fee,
        'total' => $total
    ]);

} catch (Exception $e) {
    // Rollback on error
    if (isset($conn) && $conn->ping()) {
        $conn->rollback();
    }
    
    // Log the error
    error_log('Order processing error: ' . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Close connection
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>