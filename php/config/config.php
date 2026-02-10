<?php
// Database Configuration
define('DB_HOST', '127.0.0.1');  // or 'localhost'
define('DB_USER', 'root');       // default XAMPP username
define('DB_PASS', '');           // default XAMPP password (empty)
define('DB_NAME', 'keyligtasan_db');  // your database name

// Optional: Set error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Optional: Set timezone
date_default_timezone_set('Asia/Manila');

// Create PDO Connection (needed for chat system)
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    error_log("Database Connection Error: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please try again later.'
    ]));
}

// Create MySQLi connection for backward compatibility (if needed)
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception($conn->connect_error);
    }
    
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    error_log("MySQLi Connection Error: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please try again later.'
    ]));
}
?>