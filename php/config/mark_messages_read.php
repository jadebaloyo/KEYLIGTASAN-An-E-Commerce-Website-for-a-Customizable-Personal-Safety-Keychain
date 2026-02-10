<?php
// ========================================
// MARK MESSAGES AS READ - PDO Version with receiver_id
// ========================================

header('Content-Type: application/json');
require_once 'db_connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['user_id'])) {
        throw new Exception('user_id is required');
    }
    
    $user_id = intval($data['user_id']);
    
    if ($user_id <= 0) {
        throw new Exception('Invalid user_id');
    }
    
    // Mark all messages sent TO this user as read
    // This means messages where receiver_id = user_id
    $sql = "UPDATE chat_messages 
            SET is_read = 1 
            WHERE receiver_id = ? 
            AND is_read = 0";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    
    $affected_rows = $stmt->rowCount();
    
    echo json_encode([
        'success' => true,
        'marked_count' => $affected_rows,
        'user_id' => $user_id
    ]);
    
} catch (PDOException $e) {
    error_log('Database Error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>