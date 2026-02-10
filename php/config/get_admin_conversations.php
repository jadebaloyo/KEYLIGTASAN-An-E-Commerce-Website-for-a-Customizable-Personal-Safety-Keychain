<?php
// ========================================
// GET ADMIN CONVERSATIONS - PDO Version
// ========================================

header('Content-Type: application/json');
require_once 'db_connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // This endpoint gets all unique customers who have chatted
    // along with their latest message
    
    $sql = "SELECT 
                u.id as customer_id,
                u.full_name,
                u.username,
                u.email,
                (SELECT COUNT(*) 
                 FROM chat_messages cm2 
                 WHERE cm2.sender_id = u.id 
                 AND cm2.receiver_id IN (SELECT id FROM users WHERE role = 'admin')
                 AND cm2.is_read = 0) as unread_count,
                (SELECT message 
                 FROM chat_messages cm3 
                 WHERE cm3.sender_id = u.id OR cm3.receiver_id = u.id
                 ORDER BY cm3.created_at DESC 
                 LIMIT 1) as last_message,
                (SELECT created_at 
                 FROM chat_messages cm4 
                 WHERE cm4.sender_id = u.id OR cm4.receiver_id = u.id
                 ORDER BY cm4.created_at DESC 
                 LIMIT 1) as last_message_time
            FROM users u
            WHERE u.role = 'customer'
            AND EXISTS (
                SELECT 1 FROM chat_messages cm 
                WHERE cm.sender_id = u.id OR cm.receiver_id = u.id
            )
            ORDER BY last_message_time DESC";
    
    $stmt = $pdo->query($sql);
    
    $conversations = [];
    
    while ($row = $stmt->fetch()) {
        $conversations[] = [
            'customer_id' => $row['customer_id'],
            'full_name' => $row['full_name'],
            'username' => $row['username'],
            'email' => $row['email'],
            'unread_count' => intval($row['unread_count']),
            'last_message' => $row['last_message'],
            'last_message_time' => $row['last_message_time']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'conversation_count' => count($conversations),
        'conversations' => $conversations
    ]);
    
} catch (PDOException $e) {
    error_log('Database Error: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'conversations' => []
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'conversations' => []
    ]);
}
?>