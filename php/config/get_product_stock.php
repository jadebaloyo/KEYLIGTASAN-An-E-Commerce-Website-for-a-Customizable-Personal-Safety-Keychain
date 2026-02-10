<?php
/**
 * GET PRODUCT STOCK
 * Returns current stock level for a product
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db_connection.php';

try {
    $productId = $_GET['id'] ?? null;
    
    if (!$productId) {
        throw new Exception('Product ID is required');
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            id,
            name,
            price,
            stock,
            status
        FROM products 
        WHERE id = ?
    ");
    
    $stmt->execute([$productId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        throw new Exception('Product not found');
    }
    
    echo json_encode([
        'success' => true,
        'product' => [
            'id' => $product['id'],
            'name' => $product['name'],
            'price' => floatval($product['price']),
            'stock' => intval($product['stock']),
            'status' => $product['status'],
            'available' => $product['status'] === 'active' && $product['stock'] > 0
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
