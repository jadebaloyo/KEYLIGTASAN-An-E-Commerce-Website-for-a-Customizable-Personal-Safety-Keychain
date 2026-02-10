<?php
// =============================================
// CHECKOUT.PHP - DIAGNOSTIC VERSION
// =============================================

// Turn on error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

session_start();
header('Content-Type: application/json');

// Test 1: Check if session is working
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please login to continue',
        'debug' => 'No user_id in session'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Test 2: Check if we can receive JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request data',
        'debug' => [
            'received_input' => $input,
            'json_error' => json_last_error_msg()
        ]
    ]);
    exit;
}

// Test 3: Database connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'keyligtasan_db';  // Changed to match your existing database

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error',
        'debug' => $e->getMessage()
    ]);
    exit;
}

// Test 4: Validate required fields
$required = ['recipient_name', 'phone_number', 'address', 'city', 'province', 'payment_method'];
$missing = [];
foreach ($required as $field) {
    if (empty($data[$field])) {
        $missing[] = $field;
    }
}

if (!empty($missing)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields',
        'debug' => [
            'missing_fields' => $missing,
            'received_data' => array_keys($data)
        ]
    ]);
    exit;
}

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Get cart items
    $stmt = $conn->prepare("
        SELECT c.*, p.price, p.name as product_name 
        FROM cart c 
        LEFT JOIN products p ON c.product_id = p.id 
        WHERE c.user_id = ?
    ");
    
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $cartItems = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    if (empty($cartItems)) {
        throw new Exception('Your cart is empty');
    }
    
    // Calculate totals
    $subtotal = 0;
    foreach ($cartItems as $item) {
        $unit_price = floatval($item['unit_price']);
        $customization_fee = floatval($item['customization_fee']);
        $quantity = intval($item['quantity']);
        $subtotal += ($unit_price + $customization_fee) * $quantity;
    }
    
    // Calculate shipping
    $shipping_fee = $subtotal >= 5000 ? 0 : 150;
    $total = $subtotal + $shipping_fee;
    
    // Generate order number
    $order_number = 'ORD-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Check if orders table exists
    $table_check = $conn->query("SHOW TABLES LIKE 'orders'");
    if ($table_check->num_rows == 0) {
        throw new Exception('Orders table does not exist. Please run the database schema SQL.');
    }
    
    // Insert order
    $stmt = $conn->prepare("
        INSERT INTO orders (
            user_id, 
            order_number, 
            recipient_name, 
            phone_number, 
            address, 
            city, 
            province, 
            postal_code, 
            payment_method, 
            order_notes, 
            subtotal, 
            shipping_fee, 
            total, 
            status, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
    ");
    
    if (!$stmt) {
        throw new Exception('Prepare order insert failed: ' . $conn->error);
    }
    
    $postal_code = isset($data['postal_code']) ? $data['postal_code'] : '';
    $order_notes = isset($data['order_notes']) ? $data['order_notes'] : '';
    
    $stmt->bind_param(
        "isssssssssddd",
        $user_id,
        $order_number,
        $data['recipient_name'],
        $data['phone_number'],
        $data['address'],
        $data['city'],
        $data['province'],
        $postal_code,
        $data['payment_method'],
        $order_notes,
        $subtotal,
        $shipping_fee,
        $total
    );
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to create order: ' . $stmt->error);
    }
    
    $order_id = $stmt->insert_id;
    $stmt->close();
    
    // Check if order_items table exists
    $table_check = $conn->query("SHOW TABLES LIKE 'order_items'");
    if ($table_check->num_rows == 0) {
        throw new Exception('Order_items table does not exist. Please run the database schema SQL.');
    }
    
    // Insert order items
    $stmt = $conn->prepare("
        INSERT INTO order_items (
            order_id, 
            product_id, 
            color, 
            engraved_name, 
            quantity, 
            unit_price, 
            customization_fee, 
            subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    if (!$stmt) {
        throw new Exception('Prepare order items insert failed: ' . $conn->error);
    }
    
    foreach ($cartItems as $item) {
        $product_id = $item['product_id'];
        $color = $item['color'];
        $engraved_name = isset($item['engraved_name']) ? $item['engraved_name'] : '';
        $quantity = intval($item['quantity']);
        $unit_price = floatval($item['unit_price']);
        $customization_fee = floatval($item['customization_fee']);
        $item_subtotal = ($unit_price + $customization_fee) * $quantity;
        
        $stmt->bind_param(
            "iissiddd",
            $order_id,
            $product_id,
            $color,
            $engraved_name,
            $quantity,
            $unit_price,
            $customization_fee,
            $item_subtotal
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to add order items: ' . $stmt->error);
        }
    }
    $stmt->close();
    
    // Clear cart
    $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->close();
    
    // Commit transaction
    $conn->commit();
    
    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Order placed successfully',
        'order_id' => $order_id,
        'order_number' => $order_number,
        'total' => $total,
        'debug' => [
            'items_count' => count($cartItems),
            'subtotal' => $subtotal,
            'shipping' => $shipping_fee
        ]
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    if (isset($conn)) {
        $conn->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'file' => __FILE__,
            'line' => $e->getLine()
        ]
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>