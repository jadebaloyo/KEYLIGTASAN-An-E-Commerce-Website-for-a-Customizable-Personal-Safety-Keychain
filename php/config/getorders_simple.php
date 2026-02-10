<?php
/**
 * GET ORDERS SIMPLE - Fetch user orders with items from order_items table
 * This file fetches orders and their items (including COLOR) for the logged-in user
 */

// Suppress errors in output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Clean output buffer
if (ob_get_level()) {
    ob_end_clean();
}
ob_start();

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$database = "keyligtasan_db";

try {
    $conn = new mysqli($servername, $username, $password, $database);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
    exit();
}

// Get user_id from session or query parameter
$user_id = null;

// Try to get from session first
if (isset($_SESSION['user_id'])) {
    $user_id = intval($_SESSION['user_id']);
}

// If not in session, try query parameter
if (!$user_id && isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
}

// If still no user_id, return error
if (!$user_id) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => 'No user_id provided. Session: ' . (isset($_SESSION['user_id']) ? 'yes' : 'no') . ', GET: ' . (isset($_GET['user_id']) ? 'yes' : 'no')
    ]);
    exit();
}

try {
    // ✅ FIXED QUERY: Fetch orders for this user
    $stmt = $conn->prepare("
        SELECT 
            o.id,
            o.user_id,
            o.shipping_address_id,
            o.subtotal,
            o.shipping_fee,
            o.total,
            o.status,
            o.payment_method,
            o.order_notes,
            o.created_at,
            o.updated_at
        FROM orders o
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    ");
    
    if (!$stmt) {
        throw new Exception("Failed to prepare statement: " . $conn->error);
    }
    
    $stmt->bind_param("i", $user_id);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to execute query: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $orders = [];
    
    while ($order = $result->fetch_assoc()) {
        $order_id = intval($order['id']);
        
        // ✅ CRITICAL FIX: Fetch items from order_items table (includes COLOR!)
        $items_stmt = $conn->prepare("
            SELECT 
                id,
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
            FROM order_items
            WHERE order_id = ?
            ORDER BY id ASC
        ");
        
        if (!$items_stmt) {
            throw new Exception("Failed to prepare items query: " . $conn->error);
        }
        
        $items_stmt->bind_param("i", $order_id);
        $items_stmt->execute();
        $items_result = $items_stmt->get_result();
        
        $items = [];
        while ($item = $items_result->fetch_assoc()) {
            $items[] = [
                'id' => intval($item['id']),
                'name' => $item['product_name'] ?: 'KEYLIGTASAN Safety Keychain',
                'color' => $item['color'] ?: 'Chocolate Brown', // ✅ COLOR FROM DATABASE
                'engraving' => $item['engraved_name'] ?: null,
                'quantity' => intval($item['quantity']),
                'price' => floatval($item['unit_price']),
                'customization_fee' => floatval($item['customization_fee']),
                'subtotal' => floatval($item['subtotal'])
            ];
        }
        
        $items_stmt->close();
        
        // Build order object
        $orderNumber = 'ORD-' . str_pad($order_id, 5, '0', STR_PAD_LEFT);
        
        $orders[] = [
            'id' => $order_id,
            'orderId' => '#' . $order_id,
            'orderNumber' => $orderNumber,
            'userId' => intval($order['user_id']),
            'orderDate' => $order['created_at'],
            'createdAt' => $order['created_at'],
            'updatedAt' => $order['updated_at'] ?: $order['created_at'],
            
            // Status
            'status' => $order['status'] ?: 'pending',
            'orderStatus' => $order['status'] ?: 'pending',
            'paymentStatus' => 'unpaid',
            
            // Payment
            'paymentMethod' => $order['payment_method'] ?: 'Cash on Delivery',
            
            // Pricing
            'subtotal' => floatval($order['subtotal']),
            'basePrice' => floatval($order['subtotal']),
            'shipping' => floatval($order['shipping_fee']),
            'shippingFee' => floatval($order['shipping_fee']),
            'total' => floatval($order['total']),
            'totalAmount' => floatval($order['total']),
            
            // Notes
            'orderNotes' => $order['order_notes'],
            'specialInstructions' => $order['order_notes'],
            
            // ✅ ITEMS WITH COLORS
            'items' => $items,
            'itemsCount' => count($items),
            
            // ✅ For backwards compatibility (single-item orders)
            'color' => !empty($items) ? $items[0]['color'] : 'Chocolate Brown',
            'engravingName' => !empty($items) && $items[0]['engraving'] ? $items[0]['engraving'] : null,
            'quantity' => !empty($items) ? $items[0]['quantity'] : 1,
            'customizationFee' => !empty($items) ? $items[0]['customization_fee'] : 0
        ];
    }
    
    $stmt->close();
    $conn->close();
    
    // Clear output buffer and send clean JSON
    ob_end_clean();
    
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'count' => count($orders),
        'user_id' => $user_id
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'user_id' => $user_id
    ]);
}

exit();
?>