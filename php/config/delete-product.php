<?php
/**
 * Delete Product
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE');

// Include database configuration
require_once 'database.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['product_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Product ID is required'
    ]);
    exit;
}

$productId = intval($input['product_id']);

try {
    // Delete product
    $sql = "DELETE FROM products WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $productId);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Product deleted successfully',
            'product_id' => $productId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete product'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
