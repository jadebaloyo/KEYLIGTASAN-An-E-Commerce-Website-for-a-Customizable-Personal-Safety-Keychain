<?php
/**
 * KEYLIGTASAN - Register PHP Endpoint
 * Handles JSON POST from register.js
 */

// Allow cross-origin if needed (remove in production)
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

// ─── Database Connection ────────────────────────────────────
$host     = 'localhost';
$dbname   = 'keyligtasan_db';
$dbUser   = 'root';
$dbPass   = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.'
    ]);
    exit;
}

// ─── Only accept POST ───────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.'
    ]);
    exit;
}

// ─── Read JSON body (this is why $_POST was empty) ──────────
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'success' => false,
        'message' => 'No data received. Could not parse JSON.'
    ]);
    exit;
}

// ─── Pull values from the decoded JSON ──────────────────────
$fullName = isset($input['full_name'])  ? trim($input['full_name'])  : '';
$email    = isset($input['email'])      ? trim($input['email'])      : '';
$phone    = isset($input['phone'])      ? trim($input['phone'])      : '';
$password = isset($input['password'])   ? $input['password']         : '';

// ─── Server-side validation ─────────────────────────────────
if (strlen($fullName) < 3) {
    echo json_encode([
        'success' => false,
        'message' => 'Full name must be at least 3 characters.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid email address.'
    ]);
    exit;
}

if ($phone !== '' && !preg_match('/^(\+63|0)?9\d{9}$/', preg_replace('/[\s\-]/', '', $phone))) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid Philippine phone number.'
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters.'
    ]);
    exit;
}

// ─── Check if email already exists ──────────────────────────
try {
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $checkStmt->execute([':email' => $email]);

    if ($checkStmt->rowCount() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'This email is already registered. Please log in or use a different email.'
        ]);
        exit;
    }
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error checking email.'
    ]);
    exit;
}

// ─── Prepare values for INSERT ──────────────────────────────
$username       = explode('@', $email)[0];                          // e.g. "kaijhin2005"
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);       // bcrypt hash

// ─── INSERT into users table ────────────────────────────────
// Columns match your phpMyAdmin structure exactly:
//   id (auto), username, email, phone, password, full_name,
//   role, status, email_verified, phone_verified,
//   verification_token, last_login, login_attempts,
//   locked_until, created_at, updated_at
try {
    $insertStmt = $pdo->prepare("
        INSERT INTO users (
            username,
            email,
            phone,
            password,
            full_name,
            role,
            status,
            email_verified,
            phone_verified,
            login_attempts,
            created_at
        ) VALUES (
            :username,
            :email,
            :phone,
            :password,
            :full_name,
            'customer',
            'active',
            0,
            0,
            0,
            NOW()
        )
    ");

    $insertStmt->execute([
        ':username' => $username,
        ':email'    => $email,
        ':phone'    => ($phone !== '' ? $phone : null),   // store NULL if empty
        ':password' => $hashedPassword,
        ':full_name'=> $fullName
    ]);

    $newUserId = $pdo->lastInsertId();

    // ─── Success response ────────────────────────────────
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully!',
        'user_id' => $newUserId
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed: ' . $e->getMessage()
    ]);
}
?>