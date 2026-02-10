<?php
// db_connection.php - Database connection file

// Database configuration
$host = 'localhost';        // Database host (usually 'localhost')
$dbname = 'keyligtasan_db';    // Your database name
$username = 'root';         // Your database username
$password = '';             // Your database password

// Character set
$charset = 'utf8mb4';

// Data Source Name (DSN)
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

// PDO options for better error handling and security
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Create PDO instance
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // Optional: Set timezone (adjust to your timezone)
    $pdo->exec("SET time_zone = '+00:00'");
    
} catch (PDOException $e) {
    // Log error to file instead of displaying to user
    error_log('Database Connection Error: ' . $e->getMessage());
    
    // Return JSON error instead of plain text
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Please contact the administrator.'
    ]);
    exit;
}
?>