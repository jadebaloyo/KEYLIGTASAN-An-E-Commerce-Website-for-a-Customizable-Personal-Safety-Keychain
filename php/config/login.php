<?php
/**
 * KEYLIGTASAN - User Login API (FIXED)
 */

session_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
// IMPORTANT: do NOT use * if you want sessions
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
$db_host = 'localhost';
$db_name = 'keyligtasan_db';
$db_user = 'root';
$db_pass = '';

try {
    $pdo = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Email and password are required']);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
    $stmt->execute([$email, $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        exit;
    }

    if ($user['status'] !== 'active') {
        echo json_encode(['success' => false, 'message' => 'Account inactive']);
        exit;
    }

    // Update last login
    $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")
        ->execute([$user['id']]);

    // ✅ SET SESSION (THIS IS WHAT CART NEEDS)
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['is_logged_in'] = true;

    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'full_name' => $user['full_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Login failed']);
}
