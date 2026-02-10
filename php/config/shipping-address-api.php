<?php
/**
 * KEYLIGTASAN - Shipping Addresses API
 * Fetch user's saved shipping addresses
 */

session_start();
header('Content-Type: application/json');

// ═══════════════════════════════════════════════════════════
// DATABASE CONNECTION
// ═══════════════════════════════════════════════════════════
$host   = 'localhost';
$dbname = 'keyligtasan_db';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════
// CHECK AUTHENTICATION
// ═══════════════════════════════════════════════════════════
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated'
    ]);
    exit;
}

$userId = (int)$_SESSION['user_id'];

try {
    // ═══════════════════════════════════════════════════════════
    // FETCH ALL SHIPPING ADDRESSES FOR USER
    // ═══════════════════════════════════════════════════════════
    $stmt = $pdo->prepare("
        SELECT 
            id,
            recipient_name,
            phone_number,
            address,
            city,
            province,
            postal_code,
            is_default
        FROM shipping_addresses 
        WHERE user_id = ?
        ORDER BY is_default DESC, created_at DESC
    ");
    
    $stmt->execute([$userId]);
    $addresses = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'addresses' => $addresses,
        'count' => count($addresses)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch addresses: ' . $e->getMessage()
    ]);
}
?>