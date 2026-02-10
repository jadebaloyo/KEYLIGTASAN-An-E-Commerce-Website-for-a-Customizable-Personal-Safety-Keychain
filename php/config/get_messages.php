<?php
// ========================================
// GET MESSAGES - PDO Version with receiver_id
// ========================================

header('Content-Type: application/json');
require_once 'db_connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Get user_id from query parameter
    if (!isset($_GET['user_id'])) {
        throw new Exception('user_id parameter is required');
    }
    
    $user_id = intval($_GET['user_id']);
    
    if ($user_id <= 0) {
        throw new Exception('Invalid user_id');
    }
    
    // Verify user exists
    $verify_stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ? LIMIT 1");
    $verify_stmt->execute([$user_id]);
    $user = $verify_stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    $user_role = $user['role'];
    
    // Get messages where user is either sender or receiver
    $sql = "SELECT 
                cm.id,
                cm.sender_id,
                cm.receiver_id,
                cm.sender_type,
                cm.message,
                cm.is_read,
                cm.created_at,
                sender.full_name as sender_name,
                receiver.full_name as receiver_name
            FROM chat_messages cm
            LEFT JOIN users sender ON cm.sender_id = sender.id
            LEFT JOIN users receiver ON cm.receiver_id = receiver.id
            WHERE cm.sender_id = ? OR cm.receiver_id = ?
            ORDER BY cm.created_at ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id, $user_id]);
    
    $messages = [];
    
    while ($row = $stmt->fetch()) {
        $messages[] = [
            'id' => $row['id'],
            'sender_id' => $row['sender_id'],
            'receiver_id' => $row['receiver_id'],
            'sender_type' => $row['sender_type'],
            'message' => $row['message'],
            'is_read' => $row['is_read'],
            'created_at' => $row['created_at'],
            'sender_name' => $row['sender_name'],
            'receiver_name' => $row['receiver_name']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'user_id' => $user_id,
        'user_role' => $user_role,
        'message_count' => count($messages),
        'messages' => $messages
    ]);
    
} catch (PDOException $e) {
    error_log('Database Error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'messages' => []
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'messages' => []
    ]);
}
?>