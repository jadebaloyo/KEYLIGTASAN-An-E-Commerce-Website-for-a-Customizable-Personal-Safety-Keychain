<?php
// mark_customer_messages_read.php - Mark admin messages as read by customer
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    
    if ($userId <= 0) throw new Exception('Invalid user ID');
    
    $query = "UPDATE chat_messages SET is_read = 1 
              WHERE receiver_id = ? AND sender_type = 'admin' AND is_read = 0";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true, 'message' => 'Messages marked as read']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>