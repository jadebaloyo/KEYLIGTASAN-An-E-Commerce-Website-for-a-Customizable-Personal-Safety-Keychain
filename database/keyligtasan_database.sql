-- =====================================================
-- KEYLIGTASAN E-COMMERCE DATABASE
-- Complete Database Structure with Sample Data
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS keyligtasan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE keyligtasan_db;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('customer', 'reseller', 'admin') DEFAULT 'customer',
    status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- ADDRESSES TABLE
-- =====================================================
CREATE TABLE addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type ENUM('home', 'work', 'other') DEFAULT 'home',
    full_address TEXT NOT NULL,
    barangay VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    landmark TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- PASSWORD RESETS TABLE
-- =====================================================
CREATE TABLE password_resets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_token (token)
) ENGINE=InnoDB;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    features TEXT,
    specifications TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    reseller_price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    image_main VARCHAR(255),
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- CUSTOMIZATION OPTIONS TABLE
-- =====================================================
CREATE TABLE customization_options (
    id INT PRIMARY KEY AUTO_INCREMENT,
    option_type ENUM('color', 'led_color', 'engraving') NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    color_hex VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_option_type (option_type)
) ENGINE=InnoDB;

-- =====================================================
-- ALARM SOUNDS TABLE
-- =====================================================
CREATE TABLE alarm_sounds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sound_name VARCHAR(100) NOT NULL,
    sound_description TEXT,
    audio_file VARCHAR(255) NOT NULL,
    sound_duration INT COMMENT 'Duration in seconds',
    additional_price DECIMAL(10,2) DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_default (is_default)
) ENGINE=InnoDB;

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    color VARCHAR(50),
    engraved_name VARCHAR(50),
    led_color VARCHAR(50),
    alarm_sound_id INT,
    custom_alarm_file VARCHAR(255),
    special_instructions TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    customization_fee DECIMAL(10,2) DEFAULT 0.00,
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address_id INT,
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    payment_method ENUM('card', 'cod', 'gcash', 'paymaya', 'bank_transfer') NOT NULL,
    payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'unpaid',
    payment_proof VARCHAR(255),
    order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled') DEFAULT 'pending',
    rating INT CHECK(rating >= 1 AND rating <= 5),
    review TEXT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_number (order_number),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- CONTACT MESSAGES TABLE
-- =====================================================
CREATE TABLE contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('order', 'payment', 'account', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB;

-- =====================================================
-- USER SETTINGS TABLE
-- =====================================================
CREATE TABLE user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Admin Account (password: Admin@123)
INSERT INTO users (username, email, password, full_name, role, status, email_verified) VALUES 
('admin', 'admin@keyligtasan.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin', 'active', TRUE);

-- Sample Product
INSERT INTO products (name, slug, description, base_price, reseller_price, stock_quantity, status) VALUES 
(
    'KEYLIGTASAN IoT Safety Keychain', 
    'keyligtasan-iot-safety-keychain',
    'Stay safe with KEYLIGTASAN - an IoT-enabled personal safety keychain with mobile app support. Features motion detection, SOS alerts, GPS tracking, and real-time notifications.',
    2999.00,
    2499.00,
    50,
    'active'
);

-- Customization Options - Colors
INSERT INTO customization_options (option_type, option_name, option_value, color_hex, display_order) VALUES 
('color', 'Red', 'red', '#E74C3C', 1),
('color', 'Blue', 'blue', '#3498DB', 2),
('color', 'Black', 'black', '#2C3E50', 3),
('color', 'Pink', 'pink', '#FF69B4', 4),
('color', 'White', 'white', '#ECF0F1', 5);

-- Customization Options - LED Colors
INSERT INTO customization_options (option_type, option_name, option_value, color_hex, display_order) VALUES 
('led_color', 'Red LED', 'red', '#FF0000', 1),
('led_color', 'Blue LED', 'blue', '#0000FF', 2),
('led_color', 'Green LED', 'green', '#00FF00', 3);

-- Alarm Sounds
INSERT INTO alarm_sounds (sound_name, sound_description, audio_file, sound_duration, is_default, status) VALUES 
('Standard Alarm', 'Classic beeping sound', 'assets/sounds/standard_alarm.mp3', 5, TRUE, 'active'),
('Loud Siren', 'High-pitched emergency siren', 'assets/sounds/loud_siren.mp3', 5, FALSE, 'active'),
('Police Siren', 'Police-style alert', 'assets/sounds/police_siren.mp3', 5, FALSE, 'active'),
('Whistle Sound', 'Sharp whistle alert', 'assets/sounds/whistle.mp3', 3, FALSE, 'active');

-- =====================================================
-- END OF SQL
-- =====================================================
