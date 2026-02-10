<?php
// get_chats.php - Get all chat conversations for admin

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once 'db_connection.php';

try {
    // Get all chat conversations with latest message and unread count
    $query = "
        SELECT 
            u.id as user_id,
            u.full_name as customer_name,
            u.email as customer_email,
            (
                SELECT message 
                FROM chat_messages 
                WHERE (sender_id = u.id AND sender_type = 'customer') 
                   OR (receiver_id = u.id AND sender_type = 'admin')
                ORDER BY created_at DESC 
                LIMIT 1
            ) as last_message,
            (
                SELECT created_at 
                FROM chat_messages 
                WHERE (sender_id = u.id AND sender_type = 'customer') 
                   OR (receiver_id = u.id AND sender_type = 'admin')
                ORDER BY created_at DESC 
                LIMIT 1
            ) as last_message_time,
            (
                SELECT COUNT(*) 
                FROM chat_messages 
                WHERE receiver_id = 0 
                  AND sender_id = u.id 
                  AND sender_type = 'customer' 
                  AND is_read = 0
            ) as unread_count
        FROM users u
        WHERE EXISTS (
            SELECT 1 
            FROM chat_messages cm 
            WHERE cm.sender_id = u.id OR cm.receiver_id = u.id
        )
        ORDER BY last_message_time DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'chats' => $chats
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>