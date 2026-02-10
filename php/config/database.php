<?php
/**
 * KEYLIGTASAN - Database Configuration
 * 
 * This file contains database connection settings
 */

// Database credentials
define('DB_HOST', 'localhost');      // Database host
define('DB_NAME', 'keyligtasan_db'); // Database name
define('DB_USER', 'root');           // Database username (default for XAMPP)
define('DB_PASS', '');               // Database password (empty for XAMPP)
define('DB_CHARSET', 'utf8mb4');     // Character set

// Create PDO connection
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    // Log error and show user-friendly message
    error_log("Database Connection Error: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please try again later.'
    ]));
}

// Create MySQLi connection for backward compatibility
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception($conn->connect_error);
    }
    
    $conn->set_charset(DB_CHARSET);
} catch (Exception $e) {
    error_log("MySQLi Connection Error: " . $e->getMessage());
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please try again later.'
    ]));
}

// Function to test connection
function testDatabaseConnection() {
    global $pdo;
    try {
        $pdo->query("SELECT 1");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}
?>