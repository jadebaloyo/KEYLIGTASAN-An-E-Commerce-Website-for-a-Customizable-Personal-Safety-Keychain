<?php
/**
 * Password Hash Generator for KEYLIGTASAN
 * 
 * HOW TO USE:
 * 1. Save this file as: generate_password.php
 * 2. Place it in your XAMPP htdocs/keyligtasan folder
 * 3. Open in browser: http://localhost/keyligtasan/generate_password.php
 * 4. Copy the generated hash to your database
 */

// Set the password you want to hash
$password = 'admin123';  // Change this to your desired password

// Generate the hash
$hash = password_hash($password, PASSWORD_DEFAULT);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Hash Generator</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .result {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .hash-box {
            background: #fff;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            margin: 10px 0;
        }
        .sql-box {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            margin: 20px 0;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 5px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .note {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .success {
            color: #28a745;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Password Hash Generator</h1>
        
        <div class="result">
            <h3>Generated Password Hash:</h3>
            <p><strong>Original Password:</strong> <code><?php echo htmlspecialchars($password); ?></code></p>
            <p><strong>Hashed Password:</strong></p>
            <div class="hash-box" id="hashBox">
                <?php echo $hash; ?>
            </div>
            <button class="btn" onclick="copyHash()">📋 Copy Hash</button>
        </div>

        <div class="note">
            <strong>⚠️ Important:</strong> This hash is for the password "<code><?php echo htmlspecialchars($password); ?></code>". 
            To generate a hash for a different password, edit the <code>$password</code> variable in this PHP file.
        </div>

        <h3>SQL to Insert Admin User:</h3>
        <div class="sql-box" id="sqlBox">INSERT INTO users (email, username, password, full_name, role, status) VALUES 
('admin@keyligtasan.com', 'admin', '<?php echo $hash; ?>', 'System Administrator', 'admin', 'active');</div>
        <button class="btn" onclick="copySQL()">📋 Copy SQL</button>

        <h3>How to Use:</h3>
        <ol>
            <li>Copy the SQL command above</li>
            <li>Open phpMyAdmin</li>
            <li>Select your <code>keyligtasan_db</code> database</li>
            <li>Click the "SQL" tab</li>
            <li>Paste the SQL command</li>
            <li>Click "Go"</li>
        </ol>

        <div class="result">
            <h3>✅ Login Credentials:</h3>
            <p><strong>Email:</strong> admin@keyligtasan.com</p>
            <p><strong>Password:</strong> <?php echo htmlspecialchars($password); ?></p>
        </div>

        <h3>Test Your Login:</h3>
        <p>After inserting the user into the database, you can test login with:</p>
        <ul>
            <li><strong>Email:</strong> admin@keyligtasan.com</li>
            <li><strong>Password:</strong> <?php echo htmlspecialchars($password); ?></li>
        </ul>
    </div>

    <script>
        function copyHash() {
            const hashText = document.getElementById('hashBox').textContent;
            navigator.clipboard.writeText(hashText).then(() => {
                alert('✅ Hash copied to clipboard!');
            });
        }

        function copySQL() {
            const sqlText = document.getElementById('sqlBox').textContent;
            navigator.clipboard.writeText(sqlText).then(() => {
                alert('✅ SQL copied to clipboard!');
            });
        }
    </script>
</body>
</html>

<?php
/**
 * TO GENERATE DIFFERENT PASSWORD HASHES:
 * 
 * Change the $password variable at the top of this file, then refresh the page.
 * 
 * Examples:
 * $password = 'admin123';       // For admin
 * $password = 'reseller123';    // For reseller
 * $password = 'customer123';    // For customer
 * $password = 'MySecurePass123!'; // For production
 */
?>