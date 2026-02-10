<?php
/**
 * UPDATE PRODUCT STOCK API
 * Compatible with your existing database structure
 * Works with BOTH 'stock' and 'stock_quantity' column names
 */

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error logging (disable display for production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 for production
ini_set('log_errors', 1);

// Include database configuration
require_once 'database.php';

// Check database connection
if (!isset($conn) || $conn->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'error' => isset($conn) ? $conn->connect_error : 'No connection'
    ]);
    exit;
}

try {
    // Get JSON input
    $rawInput = file_get_contents('php://input');
    error_log("📥 Stock Update Request - Raw Input: " . $rawInput);

    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }

    // Validate input
    if (!isset($input['product_id']) || !isset($input['stock'])) {
        throw new Exception('Product ID and stock are required');
    }

    $productId = intval($input['product_id']);
    $stock = intval($input['stock']);

    if ($stock < 0) {
        throw new Exception('Stock cannot be negative');
    }

    error_log("📦 Updating Product ID: $productId to Stock: $stock");

    // ✅ SMART DETECTION: Check which column name exists in your database
    $columnCheckSql = "SHOW COLUMNS FROM products LIKE 'stock%'";
    $columnResult = $conn->query($columnCheckSql);
    
    $stockColumnName = 'stock'; // Default
    $nameColumnName = 'product_name'; // Default
    
    if ($columnResult && $columnResult->num_rows > 0) {
        while ($col = $columnResult->fetch_assoc()) {
            $colName = $col['Field'];
            if ($colName === 'stock_quantity' || $colName === 'stock') {
                $stockColumnName = $colName;
                error_log("✅ Detected stock column: $stockColumnName");
            }
        }
    }
    
    // Check if name column is 'product_name' or just 'name'
    $nameCheckSql = "SHOW COLUMNS FROM products WHERE Field IN ('name', 'product_name')";
    $nameResult = $conn->query($nameCheckSql);
    if ($nameResult && $nameResult->num_rows > 0) {
        $nameCol = $nameResult->fetch_assoc();
        $nameColumnName = $nameCol['Field'];
        error_log("✅ Detected name column: $nameColumnName");
    }

    // First check if product exists
    $checkSql = "SELECT id, $nameColumnName as product_name, $stockColumnName as stock_quantity FROM products WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    
    if (!$checkStmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    $checkStmt->bind_param("i", $productId);
    
    if (!$checkStmt->execute()) {
        throw new Exception("Execute failed: " . $checkStmt->error);
    }
    
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Product not found with ID: ' . $productId
        ]);
        $checkStmt->close();
        exit;
    }
    
    $product = $result->fetch_assoc();
    $oldStock = intval($product['stock_quantity']);
    $checkStmt->close();
    
    error_log("📊 Current Stock for Product ID $productId: $oldStock");

    // Update stock using detected column name
    $updateSql = "UPDATE products SET $stockColumnName = ?, updated_at = NOW() WHERE id = ?";
    $updateStmt = $conn->prepare($updateSql);
    
    if (!$updateStmt) {
        throw new Exception("Update prepare failed: " . $conn->error);
    }
    
    $updateStmt->bind_param("ii", $stock, $productId);
    
    if (!$updateStmt->execute()) {
        throw new Exception("Update execute failed: " . $updateStmt->error);
    }
    
    $affectedRows = $updateStmt->affected_rows;
    $updateStmt->close();
    
    error_log("✅ Stock Updated Successfully - Product ID: $productId, Old: $oldStock, New: $stock");

    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Stock updated successfully',
        'product_id' => $productId,
        'product_name' => $product['product_name'],
        'old_stock' => $oldStock,
        'new_stock' => $stock,
        'change' => $stock - $oldStock,
        'affected_rows' => $affectedRows,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("❌ Stock Update Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>