<?php
/**
 * GET PRODUCTS API - Fixed for keyligtasan_db
 * Matches actual database columns from test results
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once 'database.php';

try {
    // Check database connection
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Database connection failed');
    }

    // Query to get all products - using actual column names from your database
    $query = "
        SELECT 
            id,
            product_name,
            description,
            base_price,
            category,
            stock_quantity,
            is_active,
            image_path,
            created_at,
            updated_at,
            CASE 
                WHEN stock_quantity = 0 THEN 'out_of_stock'
                WHEN stock_quantity < 10 THEN 'low_stock'
                ELSE 'in_stock'
            END AS stock_status
        FROM products
        WHERE is_active = 1
        ORDER BY product_name ASC
    ";
    
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception('Query failed: ' . $conn->error);
    }
    
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        // Format the product data with proper aliases for frontend compatibility
        $product = [
            'id' => (int)$row['id'],
            'name' => $row['product_name'],
            'product_name' => $row['product_name'],
            'description' => $row['description'] ?? '',
            'price' => (float)$row['base_price'],
            'base_price' => (float)$row['base_price'],
            'category' => $row['category'] ?? '',
            'stock' => (int)$row['stock_quantity'],
            'stock_quantity' => (int)$row['stock_quantity'],
            'stock_status' => $row['stock_status'],
            'is_active' => (int)$row['is_active'],
            'status' => $row['is_active'] == 1 ? 'active' : 'inactive',
            // FIXED: Use image_path (the actual column name)
            'image_path' => $row['image_path'] ?? '',
            'imageUrl' => $row['image_path'] ?? '',
            'image_url' => $row['image_path'] ?? '',
            'image' => $row['image_path'] ?? '',
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
        
        $products[] = $product;
    }
    
    // Calculate statistics
    $totalStock = array_sum(array_column($products, 'stock_quantity'));
    $lowStockCount = count(array_filter($products, function($p) {
        return $p['stock_status'] === 'low_stock';
    }));
    $outOfStockCount = count(array_filter($products, function($p) {
        return $p['stock_status'] === 'out_of_stock';
    }));
    
    // Return success response
    echo json_encode([
        'success' => true,
        'count' => count($products),
        'total_stock' => $totalStock,
        'low_stock_count' => $lowStockCount,
        'out_of_stock_count' => $outOfStockCount,
        'products' => $products,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Log error
    error_log('❌ Get Products Error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve products',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}

if (isset($conn)) {
    $conn->close();
}
?>