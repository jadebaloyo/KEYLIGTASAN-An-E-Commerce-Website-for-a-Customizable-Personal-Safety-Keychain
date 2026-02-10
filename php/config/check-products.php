<?php
/**
 * Check Products in Database
 */

header('Content-Type: application/json');

require_once 'database.php';

if (!isset($conn) || $conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'DB connection failed']));
}

$sql = "SELECT * FROM products ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];
while ($row = $result->fetch_assoc()) {
    $products[] = $row;
}

echo json_encode([
    'success' => true,
    'count' => count($products),
    'products' => $products
], JSON_PRETTY_PRINT);

$conn->close();
?>