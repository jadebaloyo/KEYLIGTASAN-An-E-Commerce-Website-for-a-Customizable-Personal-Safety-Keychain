<?php
/**
 * Database Structure Checker
 * This will show you the exact columns in your orders table
 */

header('Content-Type: application/json');

// Database config
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'keyligtasan_db');

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Get orders table structure
    $result = $conn->query("DESCRIBE orders");
    
    $columns = [];
    while ($row = $result->fetch_assoc()) {
        $columns[] = $row;
    }
    
    // Get a sample order to see actual data
    $sampleResult = $conn->query("SELECT * FROM orders LIMIT 1");
    $sampleOrder = $sampleResult->fetch_assoc();
    
    // Get order_items structure
    $orderItemsResult = $conn->query("DESCRIBE order_items");
    $orderItemsColumns = [];
    while ($row = $orderItemsResult->fetch_assoc()) {
        $orderItemsColumns[] = $row;
    }
    
    // Get shipping_addresses structure
    $shippingResult = $conn->query("DESCRIBE shipping_addresses");
    $shippingColumns = [];
    while ($row = $shippingResult->fetch_assoc()) {
        $shippingColumns[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'orders_table' => [
            'columns' => $columns,
            'sample_data' => $sampleOrder
        ],
        'order_items_table' => [
            'columns' => $orderItemsColumns
        ],
        'shipping_addresses_table' => [
            'columns' => $shippingColumns
        ]
    ], JSON_PRETTY_PRINT);
    
    $conn->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>