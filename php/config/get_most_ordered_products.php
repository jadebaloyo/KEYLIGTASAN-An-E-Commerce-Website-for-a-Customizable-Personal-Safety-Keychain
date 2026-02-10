<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db_connection.php';

try {
    // Query to get most ordered products with current stock
    $query = "
        SELECT 
            p.id,
            p.name as productName,
            p.price,
            p.stock,
            p.image,
            p.category,
            p.status,
            COALESCE(SUM(oi.quantity), 0) as totalOrdered,
            COUNT(DISTINCT o.id) as orderCount
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.status = 'active'
        GROUP BY p.id, p.name, p.price, p.stock, p.image, p.category, p.status
        HAVING totalOrdered > 0
        ORDER BY totalOrdered DESC
        LIMIT 5
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the response
    $formattedProducts = array_map(function($product) {
        return [
            'id' => $product['id'],
            'name' => $product['productName'],
            'price' => floatval($product['price']),
            'stock' => intval($product['stock']),
            'image' => $product['image'],
            'category' => $product['category'],
            'status' => $product['status'],
            'totalOrdered' => intval($product['totalOrdered']),
            'orderCount' => intval($product['orderCount']),
            'stockStatus' => intval($product['stock']) > 10 ? 'In Stock' : (intval($product['stock']) > 0 ? 'Low Stock' : 'Out of Stock')
        ];
    }, $products);
    
    echo json_encode([
        'success' => true,
        'products' => $formattedProducts,
        'count' => count($formattedProducts)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
