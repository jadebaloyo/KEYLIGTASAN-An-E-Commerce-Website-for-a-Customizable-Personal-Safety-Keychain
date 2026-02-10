<?php
// =============================================
// CHECKOUT.PHP - Process checkout and create orders
// =============================================

session_start();
header('Content-Type: application/json');

// Database connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'keyligtasan_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error'
    ]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please login to continue'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request data'
    ]);
    exit;
}

// Validate required fields
$required = ['recipient_name', 'phone_number', 'address', 'city', 'province', 'payment_method'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing required field: ' . $field
        ]);
        exit;
    }
}

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Get cart items
    $stmt = $conn->prepare("SELECT * FROM cart WHERE user_id = ?");
    
    if (!$stmt) {
        throw new Exception('Failed to prepare cart query: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to execute cart query: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $cartItems = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    if (empty($cartItems)) {
        throw new Exception('Your cart is empty');
    }
    
    // Calculate totals
    $subtotal = 0;
    foreach ($cartItems as $item) {
        $unit_price = isset($item['unit_price']) ? floatval($item['unit_price']) : 0;
        $customization_fee = isset($item['customization_fee']) ? floatval($item['customization_fee']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        $subtotal += ($unit_price + $customization_fee) * $quantity;
    }
    
    // Calculate shipping
    $shipping_fee = $subtotal >= 5000 ? 0 : 150;
    $total = $subtotal + $shipping_fee;
    
    // Generate order number
    $order_number = 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Combine address into single string for delivery_address
    $delivery_address = $data['address'] . ', ' . $data['city'] . ', ' . $data['province'];
    if (!empty($data['postal_code'])) {
        $delivery_address .= ' ' . $data['postal_code'];
    }
    
    // Create one order for each cart item
    $first_order_id = null;
    
    foreach ($cartItems as $item) {
        $product_id = isset($item['product_id']) ? intval($item['product_id']) : 1;
        $color = isset($item['color']) ? $item['color'] : null;
        $engraved_name = isset($item['engraved_name']) ? $item['engraved_name'] : null;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;
        $unit_price = isset($item['unit_price']) ? floatval($item['unit_price']) : 0;
        $customization_fee = isset($item['customization_fee']) ? floatval($item['customization_fee']) : 0;
        $special_instructions = isset($data['order_notes']) ? $data['order_notes'] : null;
        
        // Calculate item total
        $item_total = ($unit_price + $customization_fee) * $quantity;
        
        // Insert order using correct column names from your database
        $stmt = $conn->prepare("
            INSERT INTO orders (
                order_number,
                user_id,
                product_id,
                quantity,
                color,
                engraved_name,
                special_instructions,
                base_price,
                customization_fee,
                shipping_fee,
                total_amount,
                recipient_name,
                recipient_phone,
                delivery_address,
                payment_method,
                payment_status,
                order_status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', NOW())
        ");
        
        if (!$stmt) {
            throw new Exception('Failed to prepare order insert: ' . $conn->error);
        }
        
        $stmt->bind_param(
            "siissssddddssss",
            $order_number,
            $user_id,
            $product_id,
            $quantity,
            $color,
            $engraved_name,
            $special_instructions,
            $unit_price,
            $customization_fee,
            $shipping_fee,
            $item_total,
            $data['recipient_name'],
            $data['phone_number'],
            $delivery_address,
            $data['payment_method']
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to create order: ' . $stmt->error);
        }
        
        if ($first_order_id === null) {
            $first_order_id = $stmt->insert_id;
        }
        
        $stmt->close();
    }
    
    // Clear cart
    $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
    if ($stmt) {
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $stmt->close();
    }
    
    // Commit transaction
    $conn->commit();
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Order placed successfully',
        'order_id' => $first_order_id,
        'order_number' => $order_number,
        'total' => $total
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    if (isset($conn)) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>