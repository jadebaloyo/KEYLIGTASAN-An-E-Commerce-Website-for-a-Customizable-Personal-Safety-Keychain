<?php
/**
 * Get All Orders (Admin) - WITH CUSTOMER FULL NAMES
 * Fetches all orders from all users for admin dashboard
 */

// Suppress errors
error_reporting(0);
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
header('Pragma: no-cache');
header('Expires: 0');

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
        'message' => $e->getMessage(),
        'timestamp' => time()
    ]);
    exit();
}

try {
    // Query all orders - UPDATED TO INCLUDE FULL_NAME
    $query = "SELECT 
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
                o.updated_at,
                u.username,
                u.full_name,
                u.email,
                u.phone
              FROM orders o
              LEFT JOIN users u ON o.user_id = u.id
              ORDER BY o.created_at DESC";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception("Failed to execute query: " . $conn->error);
    }
    
    $orders = [];
    
    // Fetch all orders
    while ($row = $result->fetch_assoc()) {
        // Generate order number from ID (e.g., ORD-00002)
        $orderNumber = 'ORD-' . str_pad($row['id'], 5, '0', STR_PAD_LEFT);
        
        // UPDATED: Use full_name if available, otherwise use username
        $customerName = !empty($row['full_name']) ? $row['full_name'] : ($row['username'] ?? 'Unknown User');
        
        // Map database fields to expected format
        $order = [
            'id' => intval($row['id']),
            'userId' => intval($row['user_id']),
            'userName' => $customerName,  // ✅ NOW SHOWS FULL NAME
            'userEmail' => $row['email'] ?? '',
            'userPhone' => $row['phone'] ?? '',
            'orderId' => $orderNumber,
            'orderNumber' => $orderNumber,
            'orderDate' => $row['created_at'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'] ?? $row['created_at'],
            'status' => $row['status'],
            'orderStatus' => $row['status'],
            'paymentStatus' => $row['status'],
            'paymentMethod' => $row['payment_method'],
            
            // Pricing
            'subtotal' => floatval($row['subtotal']),
            'shipping' => floatval($row['shipping_fee']),
            'shippingFee' => floatval($row['shipping_fee']),
            'total' => floatval($row['total']),
            'totalAmount' => floatval($row['total']),
            
            // Additional info
            'shippingAddressId' => $row['shipping_address_id'],
            'orderNotes' => $row['order_notes'],
            'specialInstructions' => $row['order_notes'],
            
            // Items count
            'itemsCount' => 1
        ];
        
        $orders[] = $order;
    }
    
    $conn->close();
    
    // Clear output buffer and return clean JSON
    ob_end_clean();
    
    // Calculate statistics
    $stats = [
        'total' => count($orders),
        'pending' => 0,
        'confirmed' => 0,
        'processing' => 0,
        'delivered' => 0,
        'cancelled' => 0,
        'totalRevenue' => 0
    ];
    
    foreach ($orders as $order) {
        $statusLower = strtolower($order['status']);
        
        if (strpos($statusLower, 'pending') !== false || strpos($statusLower, 'awaiting') !== false) {
            $stats['pending']++;
        } elseif (strpos($statusLower, 'confirmed') !== false) {
            $stats['confirmed']++;
        } elseif (strpos($statusLower, 'processing') !== false || strpos($statusLower, 'ready') !== false) {
            $stats['processing']++;
        } elseif (strpos($statusLower, 'delivered') !== false || strpos($statusLower, 'completed') !== false) {
            $stats['delivered']++;
        } elseif (strpos($statusLower, 'cancelled') !== false || strpos($statusLower, 'refunded') !== false) {
            $stats['cancelled']++;
        }
        
        $stats['totalRevenue'] += $order['total'];
    }
    
    // Return response
    echo json_encode([
        'success' => true,
        'orders' => $orders,
        'count' => count($orders),
        'stats' => $stats,
        'timestamp' => time()
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => time()
    ]);
}

exit();
?>