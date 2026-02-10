<?php
/**
 * Order API - Existing Database Integration
 * Handles all order-related operations for the admin dashboard
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Error reporting - log errors but don't display them in JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Database connection settings
$host = '127.0.0.1';
$dbname = 'keyligtasan_db';
$username = 'root';
$password = '';

// Create connection
try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Get action from request
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// Route to appropriate function
try {
    switch($action) {
        case 'get_all_orders':
            getAllOrders($conn);
            break;
        
        case 'get_order':
            getOrder($conn);
            break;
        
        case 'update_order_status':
            updateOrderStatus($conn);
            break;
        
        case 'delete_order':
            deleteOrder($conn);
            break;
        
        case 'get_dashboard_stats':
            getDashboardStats($conn);
            break;
        
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Invalid action or no action specified',
                'action_received' => $action
            ]);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred',
        'error' => $e->getMessage()
    ]);
}

/**
 * Get all orders from database
 */
function getAllOrders($conn) {
    try {
        $sql = "SELECT 
                    id,
                    order_number,
                    user_id,
                    product_id,
                    quantity,
                    color,
                    engraved_name,
                    special_instructions,
                    base_price,
                    customization_fee,
                    shipping_fee,
                    total_amount,
                    recipient_name,
                    recipient_phone,
                    shipping_address_id,
                    delivery_address,
                    payment_method,
                    payment_status,
                    order_status as status,
                    tracking_number,
                    created_at,
                    updated_at
                FROM orders 
                ORDER BY created_at DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $orders = $stmt->fetchAll();
        
        // Convert numeric strings to proper numbers
        foreach ($orders as &$order) {
            $order['id'] = (int)$order['id'];
            $order['quantity'] = (int)$order['quantity'];
            $order['base_price'] = (float)$order['base_price'];
            $order['customization_fee'] = (float)$order['customization_fee'];
            $order['shipping_fee'] = (float)$order['shipping_fee'];
            $order['total_amount'] = (float)$order['total_amount'];
        }
        
        echo json_encode([
            'success' => true,
            'orders' => $orders,
            'count' => count($orders)
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching orders',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Get single order by ID
 */
function getOrder($conn) {
    try {
        $orderId = $_GET['order_id'] ?? null;
        
        if (!$orderId) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Order ID is required'
            ]);
            return;
        }
        
        $sql = "SELECT 
                    id,
                    order_number,
                    user_id,
                    product_id,
                    quantity,
                    color,
                    engraved_name,
                    special_instructions,
                    base_price,
                    customization_fee,
                    shipping_fee,
                    total_amount,
                    recipient_name,
                    recipient_phone,
                    shipping_address_id,
                    delivery_address,
                    payment_method,
                    payment_status,
                    order_status as status,
                    tracking_number,
                    created_at,
                    updated_at
                FROM orders 
                WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if ($order) {
            // Convert numeric strings to proper numbers
            $order['id'] = (int)$order['id'];
            $order['quantity'] = (int)$order['quantity'];
            $order['base_price'] = (float)$order['base_price'];
            $order['customization_fee'] = (float)$order['customization_fee'];
            $order['shipping_fee'] = (float)$order['shipping_fee'];
            $order['total_amount'] = (float)$order['total_amount'];
            
            echo json_encode([
                'success' => true,
                'order' => $order
            ]);
        } else {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Order not found'
            ]);
        }
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching order',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Update order status
 */
function updateOrderStatus($conn) {
    try {
        $orderId = $_POST['order_id'] ?? null;
        $newStatus = $_POST['new_status'] ?? null;
        $changedBy = $_POST['changed_by'] ?? 'Admin';
        $notes = $_POST['change_notes'] ?? '';
        
        if (!$orderId || !$newStatus) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Order ID and new status are required'
            ]);
            return;
        }
        
        // Validate status
        $validStatuses = [
            'pending',
            'confirmed', 
            'processing', 
            'ready_for_pickup',
            'out_for_delivery',
            'delivered',
            'completed', 
            'cancelled',
            'refunded'
        ];
        if (!in_array(strtolower($newStatus), $validStatuses)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses)
            ]);
            return;
        }
        
        // Get current status for logging
        $stmt = $conn->prepare("SELECT order_status FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $currentOrder = $stmt->fetch();
        
        if (!$currentOrder) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Order not found'
            ]);
            return;
        }
        
        $oldStatus = $currentOrder['order_status'];
        
        // Update order status
        $updateSql = "UPDATE orders 
                      SET order_status = ?, 
                          updated_at = NOW() 
                      WHERE id = ?";
        $updateStmt = $conn->prepare($updateSql);
        $updateStmt->execute([$newStatus, $orderId]);
        
        // Optional: Log status change to a history table
        // Uncomment if you have a status history table
        /*
        $logSql = "INSERT INTO order_status_history 
                   (order_id, old_status, new_status, changed_by, notes, changed_at) 
                   VALUES (?, ?, ?, ?, ?, NOW())";
        $logStmt = $conn->prepare($logSql);
        $logStmt->execute([$orderId, $oldStatus, $newStatus, $changedBy, $notes]);
        */
        
        echo json_encode([
            'success' => true,
            'message' => 'Order status updated successfully',
            'old_status' => $oldStatus,
            'new_status' => $newStatus
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error updating order status',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Delete order (soft delete recommended)
 */
function deleteOrder($conn) {
    try {
        $orderId = $_POST['order_id'] ?? null;
        
        if (!$orderId) {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'message' => 'Order ID is required'
            ]);
            return;
        }
        
        // Check if order exists
        $checkStmt = $conn->prepare("SELECT id FROM orders WHERE id = ?");
        $checkStmt->execute([$orderId]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Order not found'
            ]);
            return;
        }
        
        // Soft delete - update status to cancelled
        // If you want hard delete, use: DELETE FROM orders WHERE id = ?
        $deleteSql = "UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE id = ?";
        $deleteStmt = $conn->prepare($deleteSql);
        $deleteStmt->execute([$orderId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Order deleted successfully'
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error deleting order',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Get dashboard statistics
 */
function getDashboardStats($conn) {
    try {
        $stats = [];
        
        // Total orders
        $stmt = $conn->query("SELECT COUNT(*) as total FROM orders");
        $stats['total_orders'] = (int)$stmt->fetch()['total'];
        
        // Pending orders
        $stmt = $conn->query("SELECT COUNT(*) as pending FROM orders WHERE order_status = 'pending'");
        $stats['pending_orders'] = (int)$stmt->fetch()['pending'];
        
        // Processing orders
        $stmt = $conn->query("SELECT COUNT(*) as processing FROM orders WHERE order_status = 'processing'");
        $stats['processing_orders'] = (int)$stmt->fetch()['processing'];
        
        // Completed orders
        $stmt = $conn->query("SELECT COUNT(*) as completed FROM orders WHERE order_status IN ('completed', 'delivered')");
        $stats['completed_orders'] = (int)$stmt->fetch()['completed'];
        
        // Total revenue (completed orders only)
        $stmt = $conn->query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE order_status IN ('completed', 'delivered')");
        $stats['total_revenue'] = (float)$stmt->fetch()['revenue'];
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching dashboard stats',
            'error' => $e->getMessage()
        ]);
    }
}

// Close connection
$conn = null;
?>