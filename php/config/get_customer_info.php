<?php
// get_customer_info.php - Get customer information and order history

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once 'db_connection.php';

try {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    
    if ($userId <= 0) {
        throw new Exception('Invalid user ID');
    }
    
    // Get customer details
    $query = "SELECT id, name, email, phone FROM users WHERE id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $customer = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$customer) {
        throw new Exception('Customer not found');
    }
    
    // Get customer orders
    $ordersQuery = "
        SELECT 
            order_number,
            total_amount,
            status,
            created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
    ";
    
    $stmt = $pdo->prepare($ordersQuery);
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'customer' => $customer,
        'orders' => $orders
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
