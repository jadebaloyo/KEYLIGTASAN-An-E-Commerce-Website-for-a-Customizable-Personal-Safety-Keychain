<?php
/**
 * Get Dashboard Statistics
 * Provides comprehensive dashboard data including:
 * - Order statistics (total, pending, revenue)
 * - Product statistics (total products, total stock)
 * - Most ordered products
 * - Recent orders
 * - Low stock alerts
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
    // ==========================================
    // 1. GET ORDER STATISTICS
    // ==========================================
    $orderStatsQuery = "
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status LIKE '%pending%' OR status LIKE '%awaiting%' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status LIKE '%confirmed%' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status LIKE '%processing%' OR status LIKE '%ready%' THEN 1 ELSE 0 END) as processing,
            SUM(CASE WHEN status LIKE '%delivered%' OR status LIKE '%completed%' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status LIKE '%cancelled%' THEN 1 ELSE 0 END) as cancelled,
            COALESCE(SUM(total), 0) as total_revenue
        FROM orders
    ";
    
    $result = $conn->query($orderStatsQuery);
    $orderStats = $result->fetch_assoc();
    
    // ==========================================
    // 2. GET PRODUCT STATISTICS
    // ==========================================
    $productStatsQuery = "
        SELECT 
            COUNT(*) as total_products,
            COALESCE(SUM(stock), 0) as total_stock,
            COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock,
            COUNT(CASE WHEN stock > 0 AND stock < 10 THEN 1 END) as low_stock
        FROM products
    ";
    
    $result = $conn->query($productStatsQuery);
    $productStats = $result->fetch_assoc();
    
    // ==========================================
    // 3. GET MOST ORDERED PRODUCTS
    // ==========================================
    $mostOrderedQuery = "
        SELECT 
            oi.product_id,
            oi.product_name as name,
            SUM(oi.quantity) as total_ordered,
            p.stock,
            p.price,
            p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY oi.product_id, oi.product_name, p.stock, p.price, p.image_url
        ORDER BY total_ordered DESC
        LIMIT 5
    ";
    
    $result = $conn->query($mostOrderedQuery);
    $mostOrderedProducts = [];
    
    while ($row = $result->fetch_assoc()) {
        $mostOrderedProducts[] = [
            'id' => intval($row['product_id']),
            'name' => $row['name'] ?: 'Unknown Product',
            'total_ordered' => intval($row['total_ordered']),
            'stock' => intval($row['stock'] ?? 0),
            'price' => floatval($row['price'] ?? 0),
            'image_url' => $row['image_url']
        ];
    }
    
    // ==========================================
    // 4. GET RECENT ORDERS (Last 10)
    // ==========================================
    $recentOrdersQuery = "
        SELECT 
            o.id,
            o.user_id,
            o.total,
            o.status,
            o.payment_method,
            o.created_at,
            u.full_name,
            u.username,
            u.email,
            u.phone,
            COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 10
    ";
    
    $result = $conn->query($recentOrdersQuery);
    $recentOrders = [];
    
    while ($row = $result->fetch_assoc()) {
        $orderNumber = 'ORD-' . str_pad($row['id'], 5, '0', STR_PAD_LEFT);
        $customerName = !empty($row['full_name']) ? $row['full_name'] : ($row['username'] ?? 'Unknown User');
        
        $recentOrders[] = [
            'id' => intval($row['id']),
            'orderNumber' => $orderNumber,
            'recipientName' => $customerName,
            'userEmail' => $row['email'] ?? '',
            'userPhone' => $row['phone'] ?? '',
            'totalAmount' => floatval($row['total']),
            'orderStatus' => $row['status'],
            'paymentMethod' => $row['payment_method'],
            'orderDate' => $row['created_at'],
            'itemCount' => intval($row['item_count'])
        ];
    }
    
    // ==========================================
    // 5. GET LOW STOCK ALERTS
    // ==========================================
    $lowStockQuery = "
        SELECT 
            id,
            name,
            stock,
            price,
            image_url,
            CASE 
                WHEN stock = 0 THEN 'critical'
                WHEN stock < 5 THEN 'critical'
                WHEN stock < 10 THEN 'warning'
                ELSE 'low'
            END as alert_level
        FROM products
        WHERE stock < 10
        ORDER BY stock ASC, name ASC
        LIMIT 10
    ";
    
    $result = $conn->query($lowStockQuery);
    $lowStockAlerts = [];
    
    while ($row = $result->fetch_assoc()) {
        $lowStockAlerts[] = [
            'id' => intval($row['id']),
            'name' => $row['name'],
            'stock' => intval($row['stock']),
            'price' => floatval($row['price']),
            'image_url' => $row['image_url'],
            'alert_level' => $row['alert_level']
        ];
    }
    
    // ==========================================
    // 6. BUILD FINAL RESPONSE
    // ==========================================
    $response = [
        'success' => true,
        'stats' => [
            'orders' => [
                'total' => intval($orderStats['total']),
                'pending' => intval($orderStats['pending']),
                'confirmed' => intval($orderStats['confirmed']),
                'processing' => intval($orderStats['processing']),
                'delivered' => intval($orderStats['delivered']),
                'cancelled' => intval($orderStats['cancelled']),
                'total_revenue' => floatval($orderStats['total_revenue'])
            ],
            'products' => [
                'total_products' => intval($productStats['total_products']),
                'total_stock' => intval($productStats['total_stock']),
                'out_of_stock' => intval($productStats['out_of_stock']),
                'low_stock' => intval($productStats['low_stock'])
            ]
        ],
        'most_ordered_products' => $mostOrderedProducts,
        'recent_orders' => $recentOrders,
        'low_stock_alerts' => $lowStockAlerts,
        'timestamp' => time()
    ];
    
    $conn->close();
    
    // Clear output buffer and return clean JSON
    ob_end_clean();
    echo json_encode($response, JSON_PRETTY_PRINT);
    
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