<?php
/**
 * KEYLIGTASAN - Place Order (COMPLETE INTEGRATION)
 * Creates orders that appear in "My Orders" page
 */

session_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database Connection
$host   = 'localhost';
$dbname = 'keyligtasan_db';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Check POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit;
}

// Check authentication
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in. Please login again.']);
    exit;
}

$userId = (int)$_SESSION['user_id'];

// Extract data from request
$items            = isset($input['items'])            ? $input['items']                   : [];
$recipientName    = isset($input['recipient_name'])   ? trim($input['recipient_name'])   : '';
$recipientPhone   = isset($input['recipient_phone'])  ? trim($input['recipient_phone'])  : '';
$deliveryAddress  = isset($input['delivery_address']) ? trim($input['delivery_address']) : '';
$paymentMethod    = isset($input['payment_method'])   ? trim($input['payment_method'])   : 'Cash on Delivery';
$shippingFee      = isset($input['shipping_fee'])     ? (float)$input['shipping_fee']    : 150.00;
$orderNotes       = isset($input['order_notes'])      ? trim($input['order_notes'])      : '';

// Validate required fields
if (empty($items)) {
    echo json_encode(['success' => false, 'message' => 'Cart is empty.']);
    exit;
}

if (empty($recipientName)) {
    echo json_encode(['success' => false, 'message' => 'Full name is required.']);
    exit;
}

if (empty($recipientPhone)) {
    echo json_encode(['success' => false, 'message' => 'Contact number is required.']);
    exit;
}

if (empty($deliveryAddress)) {
    echo json_encode(['success' => false, 'message' => 'Delivery address is required.']);
    exit;
}

// Generate order number (matches your format: ORD1770131370003)
$orderNumber = 'ORD' . time() . mt_rand(100, 999);

// Calculate totals
$basePrice        = 0.00;
$totalCustomFee   = 0.00;
$totalQuantity    = 0;

foreach ($items as $item) {
    $unitPrice    = isset($item['unit_price'])        ? (float)$item['unit_price']        : 0.00;
    $quantity     = isset($item['quantity'])          ? (int)$item['quantity']            : 1;
    $custFee      = isset($item['customization_fee']) ? (float)$item['customization_fee'] : 0.00;

    $basePrice       += ($unitPrice * $quantity);
    $totalCustomFee  += ($custFee * $quantity);
    $totalQuantity   += $quantity;
}

$totalAmount = $basePrice + $totalCustomFee + $shippingFee;

// Begin Transaction
try {
    $pdo->beginTransaction();

    // 1. Create shipping address record
    $stmtAddr = $pdo->prepare("
        INSERT INTO shipping_addresses (
            user_id,
            recipient_name,
            phone_number,
            address,
            is_default,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, 0, NOW(), NOW())
    ");

    $stmtAddr->execute([
        $userId,
        $recipientName,
        $recipientPhone,
        $deliveryAddress
    ]);

    $shippingAddressId = $pdo->lastInsertId();

    // 2. Get first item details for main order record
    $firstItem = $items[0];
    
    // 3. INSERT MAIN ORDER (this appears in "My Orders")
    $stmtOrder = $pdo->prepare("
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
            shipping_address_id,
            delivery_address,
            payment_method,
            payment_status,
            order_status,
            created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', NOW()
        )
    ");

    $stmtOrder->execute([
        $orderNumber,
        $userId,
        isset($firstItem['product_id'])    ? (int)$firstItem['product_id']    : 1,
        $totalQuantity,
        isset($firstItem['color'])         ? $firstItem['color']              : null,
        isset($firstItem['engraved_name']) ? $firstItem['engraved_name']     : null,
        $orderNotes,
        $basePrice,
        $totalCustomFee,
        $shippingFee,
        $totalAmount,
        $recipientName,
        $recipientPhone,
        $shippingAddressId,
        $deliveryAddress,
        $paymentMethod
    ]);

    $orderId = $pdo->lastInsertId();

    // 4. INSERT ORDER ITEMS (for detailed breakdown)
    $stmtItem = $pdo->prepare("
        INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            color,
            engraved_name,
            quantity,
            unit_price,
            customization_fee,
            subtotal,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    foreach ($items as $item) {
        $itemQty      = isset($item['quantity'])          ? (int)$item['quantity']            : 1;
        $itemPrice    = isset($item['unit_price'])        ? (float)$item['unit_price']        : 0.00;
        $itemCustFee  = isset($item['customization_fee']) ? (float)$item['customization_fee'] : 0.00;
        $itemSubtotal = ($itemPrice * $itemQty) + ($itemCustFee * $itemQty);

        $stmtItem->execute([
            $orderId,
            isset($item['product_id'])    ? (int)$item['product_id']    : 1,
            isset($item['product_name'])  ? $item['product_name']       : 'KEYLIGTASAN Safety Keychain',
            isset($item['color'])         ? $item['color']              : null,
            isset($item['engraved_name']) ? $item['engraved_name']     : null,
            $itemQty,
            $itemPrice,
            $itemCustFee,
            $itemSubtotal
        ]);
    }

    // 5. DELETE THE CART ORDER (cleanup)
    $stmtDeleteCart = $pdo->prepare("
        DELETE FROM orders 
        WHERE user_id = ? AND order_status = 'cart'
    ");
    $stmtDeleteCart->execute([$userId]);

    // 6. COMMIT TRANSACTION
    $pdo->commit();

    // Success response
    echo json_encode([
        'success'         => true,
        'message'         => 'Order placed successfully!',
        'order_id'        => $orderId,
        'order_number'    => $orderNumber,
        'total'           => number_format($totalAmount, 2),
        'total_amount'    => $totalAmount,
        'status'          => 'pending',
        'payment_status'  => 'unpaid',
        'shipping_address_id' => $shippingAddressId
    ]);

} catch (PDOException $e) {
    // Rollback on error
    $pdo->rollBack();
    error_log("Order placement error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Order failed. Please try again.'
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Order placement error: " . $e->getMessage());

    echo json_encode([
        'success' => false,
        'message' => 'Order failed: ' . $e->getMessage()
    ]);
}
?>