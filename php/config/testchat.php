<?php
// test_chat.php - Diagnostic script to test chat functionality

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Chat Support Diagnostic Tool</h1>";
echo "<style>
body { font-family: Arial, sans-serif; padding: 20px; }
.success { color: green; }
.error { color: red; }
.info { color: blue; }
h2 { margin-top: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
</style>";

// Test 1: Database Connection
echo "<h2>1. Database Connection Test</h2>";
try {
    require_once 'db_connection.php';
    echo "<p class='success'>✅ Database connection successful!</p>";
    echo "<p class='info'>PDO Object: " . get_class($pdo) . "</p>";
} catch (Exception $e) {
    echo "<p class='error'>❌ Database connection failed: " . $e->getMessage() . "</p>";
    exit;
}

// Test 2: Check if chat_messages table exists
echo "<h2>2. Chat Messages Table Check</h2>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'chat_messages'");
    $tableExists = $stmt->fetch();
    
    if ($tableExists) {
        echo "<p class='success'>✅ chat_messages table exists</p>";
        
        // Get table structure
        $stmt = $pdo->query("DESCRIBE chat_messages");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<p class='info'>Table structure:</p>";
        echo "<pre>";
        foreach ($columns as $col) {
            echo $col['Field'] . " - " . $col['Type'] . "\n";
        }
        echo "</pre>";
        
        // Count messages
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM chat_messages");
        $count = $stmt->fetch();
        echo "<p class='info'>Total messages in database: " . $count['count'] . "</p>";
        
    } else {
        echo "<p class='error'>❌ chat_messages table does not exist!</p>";
        echo "<p>Run this SQL to create it:</p>";
        echo "<pre>
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL DEFAULT 0,
  `sender_type` enum('customer','admin') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `sender_type` (`sender_type`),
  KEY `is_read` (`is_read`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        </pre>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Error checking table: " . $e->getMessage() . "</p>";
}

// Test 3: Check if users table exists
echo "<h2>3. Users Table Check</h2>";
try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    $usersTableExists = $stmt->fetch();
    
    if ($usersTableExists) {
        echo "<p class='success'>✅ users table exists</p>";
        
        // Count users
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch();
        echo "<p class='info'>Total users: " . $count['count'] . "</p>";
        
        // Show some users
        $stmt = $pdo->query("SELECT id, name, email FROM users LIMIT 5");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($users) > 0) {
            echo "<p class='info'>Sample users:</p>";
            echo "<pre>";
            foreach ($users as $user) {
                echo "ID: {$user['id']} - {$user['name']} ({$user['email']})\n";
            }
            echo "</pre>";
        }
    } else {
        echo "<p class='error'>❌ users table does not exist!</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Error checking users table: " . $e->getMessage() . "</p>";
}

// Test 4: Test PHP Files
echo "<h2>4. PHP Files Check</h2>";
$files = [
    'get_chats.php',
    'get_messages.php',
    'send_message.php',
    'mark_messages_read.php',
    'mark_customer_messages_read.php',
    'get_customer_info.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "<p class='success'>✅ {$file} exists</p>";
    } else {
        echo "<p class='error'>❌ {$file} NOT FOUND</p>";
    }
}

// Test 5: Test API Endpoints
echo "<h2>5. API Endpoint Tests</h2>";

// Test get_chats.php
echo "<h3>Testing get_chats.php</h3>";
try {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/get_chats.php';
    echo "<p class='info'>Testing: <a href='{$url}' target='_blank'>{$url}</a></p>";
    
    $response = @file_get_contents($url);
    if ($response) {
        $data = json_decode($response, true);
        if ($data && isset($data['success'])) {
            echo "<p class='success'>✅ get_chats.php is working</p>";
            echo "<pre>" . json_encode($data, JSON_PRETTY_PRINT) . "</pre>";
        } else {
            echo "<p class='error'>❌ Invalid JSON response</p>";
            echo "<pre>" . htmlspecialchars(substr($response, 0, 500)) . "</pre>";
        }
    } else {
        echo "<p class='error'>❌ Could not fetch response (allow_url_fopen might be disabled)</p>";
    }
} catch (Exception $e) {
    echo "<p class='error'>❌ Error: " . $e->getMessage() . "</p>";
}

// Test 6: Insert Test Message
echo "<h2>6. Test Message Insert</h2>";
if ($tableExists) {
    try {
        // Insert a test message
        $stmt = $pdo->prepare("
            INSERT INTO chat_messages (sender_id, receiver_id, sender_type, message, created_at)
            VALUES (1, 0, 'customer', 'Test message from diagnostic tool', NOW())
        ");
        $stmt->execute();
        
        echo "<p class='success'>✅ Test message inserted successfully!</p>";
        echo "<p class='info'>Message ID: " . $pdo->lastInsertId() . "</p>";
        
        // Retrieve it
        $stmt = $pdo->query("SELECT * FROM chat_messages ORDER BY id DESC LIMIT 1");
        $message = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "<p>Latest message:</p>";
        echo "<pre>" . print_r($message, true) . "</pre>";
        
    } catch (Exception $e) {
        echo "<p class='error'>❌ Error inserting test message: " . $e->getMessage() . "</p>";
    }
}

echo "<h2>7. Recommendations</h2>";
echo "<ul>";

if (!$tableExists) {
    echo "<li class='error'>Create the chat_messages table using the SQL above</li>";
}

if (!$usersTableExists) {
    echo "<li class='error'>Users table is required for chat to work</li>";
}

echo "<li class='info'>Make sure sessionStorage.setItem('userId', YOUR_USER_ID) is set after login</li>";
echo "<li class='info'>Check browser console for JavaScript errors</li>";
echo "<li class='info'>Verify file paths in HTML match your directory structure</li>";
echo "</ul>";

echo "<h2>8. Next Steps</h2>";
echo "<ol>";
echo "<li>If chat_messages table doesn't exist, run the CREATE TABLE SQL</li>";
echo "<li>Make sure user is logged in and userId is stored in sessionStorage</li>";
echo "<li>Test the chat widget in your customer dashboard</li>";
echo "<li>Check admin dashboard Chat Support section</li>";
echo "</ol>";

echo "<hr>";
echo "<p><strong>Diagnostic Complete!</strong> Check the results above to identify any issues.</p>";
?>