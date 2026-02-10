<?php
// ========================================
// SEND MESSAGE - PDO Version with receiver_id
// ========================================

header('Content-Type: application/json');
require_once 'db_connection.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Validate input
    if (!isset($data['user_id']) || !isset($data['message']) || !isset($data['sender_type'])) {
        throw new Exception('Missing required fields');
    }
    
    $user_id = intval($data['user_id']);
    $message = trim($data['message']);
    $sender_type = $data['sender_type'];
    
    // Validate sender_type
    if (!in_array($sender_type, ['customer', 'admin'])) {
        throw new Exception('Invalid sender type');
    }
    
    // Validate message is not empty
    if (empty($message)) {
        throw new Exception('Message cannot be empty');
    }
    
    // Determine sender_id and receiver_id based on sender_type
    if ($sender_type === 'customer') {
        $sender_id = $user_id;
        
        // Get the first admin user as receiver
        $admin_query = "SELECT id FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1";
        $admin_stmt = $pdo->query($admin_query);
        $admin = $admin_stmt->fetch();
        
        if ($admin) {
            $receiver_id = $admin['id'];
        } else {
            // Fallback to a default admin ID if no admin found
            $receiver_id = 11; // Your admin user ID from the database
        }
    } else {
        // Admin is sending
        $sender_id = $user_id;
        
        // Get receiver_id from the request (should be the customer they're replying to)
        if (!isset($data['receiver_id'])) {
            throw new Exception('receiver_id is required for admin messages');
        }
        $receiver_id = intval($data['receiver_id']);
    }
    
    // Verify sender exists
    $verify_stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $verify_stmt->execute([$sender_id]);
    
    if (!$verify_stmt->fetch()) {
        throw new Exception('Invalid sender user');
    }
    
    // Verify receiver exists
    $verify_stmt = $pdo->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
    $verify_stmt->execute([$receiver_id]);
    
    if (!$verify_stmt->fetch()) {
        throw new Exception('Invalid receiver user');
    }
    
    // Insert message with proper sender_id and receiver_id
    $sql = "INSERT INTO chat_messages (sender_id, receiver_id, sender_type, message, is_read, created_at) 
            VALUES (?, ?, ?, ?, 0, NOW())";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$sender_id, $receiver_id, $sender_type, $message]);
    
    $message_id = $pdo->lastInsertId();
    
    // Return success with message details
    echo json_encode([
        'success' => true,
        'message_id' => $message_id,
        'sender_id' => $sender_id,
        'receiver_id' => $receiver_id,
        'timestamp' => date('Y-m-d H:i:s')
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