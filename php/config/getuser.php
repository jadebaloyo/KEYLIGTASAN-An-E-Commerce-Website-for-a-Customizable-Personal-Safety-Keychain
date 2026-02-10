<?php
/**
 * KEYLIGTASAN - Get User Info API
 * Returns current user's information
 */

session_start();
header('Content-Type: application/json');

// Database connection
$host   = 'localhost';
$dbname = 'keyligtasan_db';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

// Check authentication
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'User not authenticated'
    ]);
    exit;
}

$userId = (int)$_SESSION['user_id'];

try {
    // Get user info
    $stmt = $pdo->prepare("
        SELECT 
            id,
            full_name,
            email,
            phone,
            created_at
        FROM users 
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    echo json_encode([
        'success' => true,
        'user' => $user
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>