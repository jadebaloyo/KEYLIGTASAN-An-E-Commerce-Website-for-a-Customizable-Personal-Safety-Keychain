<?php
/**
 * Batch Add Safety Keychain Products - Using assets/images/
 */

header('Content-Type: application/json');

require_once 'database.php';

if (!isset($conn) || $conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

// Product data
$products = [
    [
        'name' => 'Safety Keychain - Chocolate Brown',
        'description' => 'Stylish chocolate brown safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/chocolatebrown.png'
    ],
    [
        'name' => 'Safety Keychain - Emerald Green',
        'description' => 'Beautiful emerald green safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/emeraldgreen.png'
    ],
    [
        'name' => 'Safety Keychain - Golden Orange',
        'description' => 'Vibrant golden orange safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/goldenorange.png'
    ],
    [
        'name' => 'Safety Keychain - Midnight Black',
        'description' => 'Sleek midnight black safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/midnightblack.png'
    ],
    [
        'name' => 'Safety Keychain - Ocean Blue',
        'description' => 'Cool ocean blue safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/oceanblue.png'
    ],
    [
        'name' => 'Safety Keychain - Rose Pink',
        'description' => 'Lovely rose pink safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/rosepink.png'
    ],
    [
        'name' => 'Safety Keychain - Royal Purple',
        'description' => 'Elegant royal purple safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/royalpurple.png'
    ],
    [
        'name' => 'Safety Keychain - Ruby Red',
        'description' => 'Bold ruby red safety keychain with heart clip. Compact personal safety alarm device. Features a loud 130dB alarm to deter attackers and alert others in emergency situations.',
        'price' => 299.00,
        'stock' => 50,
        'category' => 'Safety Keychain',
        'image' => 'assets/images/rubyred.png'
    ]
];

$inserted = 0;
$errors = [];

try {
    $sql = "INSERT INTO products (product_name, description, base_price, category, stock_quantity, image_path, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())";
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    
    foreach ($products as $product) {
        $stmt->bind_param(
            "ssdsis",
            $product['name'],
            $product['description'],
            $product['price'],
            $product['category'],
            $product['stock'],
            $product['image']
        );
        
        if ($stmt->execute()) {
            $inserted++;
        } else {
            $errors[] = "Failed: " . $product['name'] . " - " . $stmt->error;
        }
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => "Successfully added $inserted of " . count($products) . " products",
        'inserted' => $inserted,
        'total' => count($products),
        'errors' => $errors
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'inserted' => $inserted,
        'errors' => $errors
    ], JSON_PRETTY_PRINT);
}

$conn->close();
?>