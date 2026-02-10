<?php
// =============================================
// CART_API.PHP - Handle all cart operations
// =============================================

session_start();
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in JSON response

// Database connection
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'keyligtasan_db';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed');
    }
    
    $conn->set_charset('utf8mb4');
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error'
    ]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Please login to continue'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['action'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request'
    ]);
    exit;
}

$action = $data['action'];

try {
    switch ($action) {
        
        // =====================
        // GET CART ITEMS
        // =====================
        case 'get':
            // Simple query - just get cart items for this user
            $stmt = $conn->prepare("
                SELECT 
                    id,
                    product_id,
                    color,
                    engraved_name,
                    quantity,
                    unit_price,
                    customization_fee,
                    subtotal
                FROM cart 
                WHERE user_id = ?
                ORDER BY created_at DESC
            ");
            
            if (!$stmt) {
                throw new Exception('Failed to prepare query: ' . $conn->error);
            }
            
            $stmt->bind_param("i", $user_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to execute query: ' . $stmt->error);
            }
            
            $result = $stmt->get_result();
            $items = $result->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            
            // Add product_name to each item
            foreach ($items as &$item) {
                $item['product_name'] = 'KEYLIGTASAN Safety Keychain';
                
                // Ensure subtotal is calculated correctly
                $unit_price = floatval($item['unit_price']);
                $customization_fee = floatval($item['customization_fee']);
                $quantity = intval($item['quantity']);
                $item['subtotal'] = ($unit_price + $customization_fee) * $quantity;
            }
            
            // Calculate totals
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += floatval($item['subtotal']);
            }
            
            $shipping = $subtotal >= 5000 ? 0 : 150;
            $total = $subtotal + $shipping;
            
            echo json_encode([
                'success' => true,
                'items' => $items,
                'subtotal' => $subtotal,
                'shipping' => $shipping,
                'total' => $total,
                'count' => count($items)
            ]);
            break;
        
        // =====================
        // UPDATE QUANTITY
        // =====================
        case 'update':
            if (!isset($data['item_id']) || !isset($data['quantity'])) {
                throw new Exception('Missing item_id or quantity');
            }
            
            $item_id = intval($data['item_id']);
            $quantity = intval($data['quantity']);
            
            if ($quantity < 1) {
                throw new Exception('Quantity must be at least 1');
            }
            
            if ($quantity > 99) {
                throw new Exception('Maximum quantity is 99');
            }
            
            // Get cart item to recalculate subtotal
            $stmt = $conn->prepare("SELECT unit_price, customization_fee FROM cart WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $item_id, $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $item = $result->fetch_assoc();
            $stmt->close();
            
            if (!$item) {
                throw new Exception('Cart item not found');
            }
            
            $unit_price = floatval($item['unit_price']);
            $customization_fee = floatval($item['customization_fee']);
            $new_subtotal = ($unit_price + $customization_fee) * $quantity;
            
            // Update cart item
            $stmt = $conn->prepare("UPDATE cart SET quantity = ?, subtotal = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
            $stmt->bind_param("idii", $quantity, $new_subtotal, $item_id, $user_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to update cart item');
            }
            
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Quantity updated successfully'
            ]);
            break;
        
        // =====================
        // REMOVE ITEM
        // =====================
        case 'remove':
            if (!isset($data['item_id'])) {
                throw new Exception('Missing item_id');
            }
            
            $item_id = intval($data['item_id']);
            
            $stmt = $conn->prepare("DELETE FROM cart WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $item_id, $user_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to remove item');
            }
            
            $affected = $stmt->affected_rows;
            $stmt->close();
            
            if ($affected === 0) {
                throw new Exception('Item not found in cart');
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Item removed successfully'
            ]);
            break;
        
        // =====================
        // CLEAR CART
        // =====================
        case 'clear':
            $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
            $stmt->bind_param("i", $user_id);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to clear cart');
            }
            
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Cart cleared successfully'
            ]);
            break;
        
        // =====================
        // ADD TO CART
        // =====================
        case 'add':
            if (!isset($data['product_id'])) {
                throw new Exception('Missing product_id');
            }
            
            $product_id = intval($data['product_id']);
            $color = isset($data['color']) ? trim($data['color']) : '';
            $engraved_name = isset($data['engraved_name']) ? trim($data['engraved_name']) : '';
            $quantity = isset($data['quantity']) ? intval($data['quantity']) : 1;
            $unit_price = isset($data['unit_price']) ? floatval($data['unit_price']) : 0;
            $customization_fee = !empty($engraved_name) ? 200 : 0;
            $subtotal = ($unit_price + $customization_fee) * $quantity;
            
            // Check if same item already exists in cart
            $stmt = $conn->prepare("
                SELECT id, quantity FROM cart 
                WHERE user_id = ? AND product_id = ? AND color = ? AND engraved_name = ?
            ");
            $stmt->bind_param("iiss", $user_id, $product_id, $color, $engraved_name);
            $stmt->execute();
            $result = $stmt->get_result();
            $existing = $result->fetch_assoc();
            $stmt->close();
            
            if ($existing) {
                // Update existing cart item
                $new_quantity = $existing['quantity'] + $quantity;
                $new_subtotal = ($unit_price + $customization_fee) * $new_quantity;
                
                $stmt = $conn->prepare("
                    UPDATE cart 
                    SET quantity = ?, subtotal = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                $stmt->bind_param("idi", $new_quantity, $new_subtotal, $existing['id']);
                $stmt->execute();
                $stmt->close();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cart updated successfully'
                ]);
            } else {
                // Insert new cart item
                $stmt = $conn->prepare("
                    INSERT INTO cart 
                    (user_id, product_id, color, engraved_name, quantity, unit_price, customization_fee, subtotal, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->bind_param("iissiddd", $user_id, $product_id, $color, $engraved_name, $quantity, $unit_price, $customization_fee, $subtotal);
                
                if (!$stmt->execute()) {
                    throw new Exception('Failed to add item to cart');
                }
                
                $stmt->close();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Item added to cart successfully'
                ]);
            }
            break;
        
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>