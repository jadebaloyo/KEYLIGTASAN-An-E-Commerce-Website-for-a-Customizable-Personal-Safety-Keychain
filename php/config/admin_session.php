<?php
// ========================================
// ADMIN SESSION HANDLER
// ========================================

session_start();

// Check if user is logged in and is admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: ../index.php');
    exit();
}

// Store admin info in variables
$adminUserId = $_SESSION['user_id'];
$adminName = $_SESSION['name'] ?? 'System Administrator';
$adminEmail = $_SESSION['email'] ?? '';
$adminRole = $_SESSION['role'] ?? 'admin';

// Optional: Log admin activity
error_log("Admin logged in: ID={$adminUserId}, Name={$adminName}");
?>