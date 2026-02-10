-- =====================================================
-- KEYLIGTASAN DATABASE - INTEGRATION & ENHANCEMENTS
-- For existing keylightasan_db
-- =====================================================

-- This script adds missing status tracking tables to your existing schema
-- Your orders table already has order_status - we'll add product-level tracking

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING ORDERS TABLE (if needed)
-- =====================================================

-- Check if these columns exist before adding:
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- =====================================================
-- 2. CREATE PRODUCT_STATUS_HISTORY TABLE
-- =====================================================
-- Track individual product/item status changes within orders
CREATE TABLE IF NOT EXISTS product_status_history (
    product_status_history_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    order_item_id INT,
    product_id INT NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    status_notes TEXT,
    changed_by VARCHAR(100) DEFAULT 'System',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    INDEX idx_changed_at (changed_at),
    INDEX idx_new_status (new_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ENHANCE order_status_history TABLE
-- =====================================================
-- If your order_status_history table doesn't have these columns, add them:
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS changed_by VARCHAR(100) DEFAULT 'System';
ALTER TABLE order_status_history ADD COLUMN IF NOT EXISTS change_notes TEXT;

-- =====================================================
-- 4. CREATE PAYMENT_TRACKING TABLE
-- =====================================================
-- For detailed payment status and transaction tracking
CREATE TABLE IF NOT EXISTS payment_tracking (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    amount_paid DECIMAL(10, 2) NOT NULL,
    transaction_reference VARCHAR(255),
    transaction_date TIMESTAMP NULL,
    verified_by VARCHAR(100),
    payment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_transaction_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CREATE SHIPMENT_TRACKING TABLE
-- =====================================================
-- For detailed shipment and tracking information
CREATE TABLE IF NOT EXISTS shipment_tracking (
    shipment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    tracking_number VARCHAR(100) UNIQUE,
    courier_name VARCHAR(100),
    courier_contact VARCHAR(20),
    estimated_delivery DATE,
    actual_delivery_date DATE,
    shipment_status VARCHAR(50),
    current_location TEXT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_shipment_status (shipment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. CREATE ORDER_LOGS TABLE
-- =====================================================
-- Comprehensive audit log for all order activities
CREATE TABLE IF NOT EXISTS order_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    user_id INT,
    action_type VARCHAR(100),
    action_description TEXT,
    old_value TEXT,
    new_value TEXT,
    performed_by VARCHAR(100),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. USEFUL VIEWS FOR REPORTING
-- =====================================================

-- View: Complete Order Information with Status
CREATE OR REPLACE VIEW order_complete_info_view AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.user_id,
    u.full_name,
    u.email,
    u.phone,
    o.recipient_name,
    o.recipient_phone,
    o.quantity,
    o.base_price,
    o.customization_fee,
    o.shipping_fee,
    o.total_amount,
    o.payment_method,
    o.payment_status,
    o.order_status,
    o.created_at,
    DATE_ADD(o.created_at, INTERVAL 7 DAY) as estimated_delivery,
    pt.payment_status as detailed_payment_status,
    st.tracking_number,
    st.courier_name,
    st.shipment_status
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN payment_tracking pt ON o.id = pt.order_id
LEFT JOIN shipment_tracking st ON o.id = st.order_id;

-- View: Orders Awaiting Action
CREATE OR REPLACE VIEW orders_pending_action_view AS
SELECT 
    o.id as order_id,
    o.order_number,
    u.full_name,
    o.order_status,
    o.payment_status,
    o.created_at,
    DATEDIFF(NOW(), o.created_at) as days_old,
    CASE 
        WHEN o.payment_status = 'unpaid' THEN 'Payment Verification'
        WHEN o.order_status = 'pending' THEN 'Processing'
        WHEN o.order_status = 'confirmed' AND o.payment_status = 'paid' THEN 'Ready to Ship'
        WHEN o.order_status = 'processing' THEN 'Picking & Packing'
        ELSE 'Review Required'
    END as action_needed
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.order_status NOT IN ('shipped', 'delivered', 'cancelled')
ORDER BY o.created_at ASC;

-- View: Daily Order Statistics
CREATE OR REPLACE VIEW daily_order_stats_view AS
SELECT 
    DATE(o.created_at) as order_date,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'paid' THEN o.id END) as paid_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(o.total_amount) as avg_order_value,
    COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) as delivered_orders
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;

-- View: Product Performance in Orders
CREATE OR REPLACE VIEW product_order_performance_view AS
SELECT 
    p.id,
    p.name,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.total_amount) as total_revenue,
    AVG(p.base_price) as avg_price,
    COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.id END) as successful_deliveries
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
GROUP BY p.id
ORDER BY total_revenue DESC;

-- =====================================================
-- 8. ORDER STATUS VALUES (Reference)
-- =====================================================
-- Your current status values appear to be:
-- pending, confirmed, processing, shipped, delivered, cancelled
-- Add custom statuses as needed

-- =====================================================
-- 9. SAMPLE UPDATE QUERIES
-- =====================================================

-- Update order status and log it
INSERT INTO order_logs (order_id, action_type, action_description, old_value, new_value, performed_by)
SELECT 
    o.id,
    'status_change',
    CONCAT('Order status changed from pending to confirmed'),
    'pending',
    'confirmed',
    'Admin'
FROM orders o
WHERE o.id = 1;

-- Create shipment tracking record
INSERT INTO shipment_tracking (order_id, tracking_number, courier_name, courier_contact, estimated_delivery, shipment_status)
VALUES (1, 'JT-2024-123456', 'J&T Express', '1-800-123-4567', DATE_ADD(NOW(), INTERVAL 3 DAY), 'In Transit');

-- Create payment tracking record
INSERT INTO payment_tracking (order_id, payment_method, payment_status, amount_paid, transaction_reference, verified_by)
VALUES (1, 'gcashi', 'paid', 5950.00, 'GC-2024-789456', 'Admin');

-- =====================================================
-- 10. HELPER STORED PROCEDURES
-- =====================================================

-- Procedure: Update order status with audit trail
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS update_order_status_with_log(
    IN p_order_id INT,
    IN p_new_status VARCHAR(50),
    IN p_changed_by VARCHAR(100),
    IN p_notes TEXT
)
BEGIN
    DECLARE p_old_status VARCHAR(50);
    
    -- Get current status
    SELECT order_status INTO p_old_status FROM orders WHERE id = p_order_id;
    
    -- Update order status
    UPDATE orders 
    SET order_status = p_new_status,
        last_status_update = NOW()
    WHERE id = p_order_id;
    
    -- Log the change
    INSERT INTO order_status_history (order_id, previous_status, new_status, changed_by, change_notes)
    VALUES (p_order_id, p_old_status, p_new_status, p_changed_by, p_notes);
    
    -- Log in activity logs
    INSERT INTO order_logs (order_id, action_type, action_description, old_value, new_value, performed_by)
    VALUES (p_order_id, 'status_change', CONCAT('Status changed to ', p_new_status), p_old_status, p_new_status, p_changed_by);
    
END//

DELIMITER ;

-- Procedure: Get complete order status
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS get_order_complete_status(
    IN p_order_id INT
)
BEGIN
    SELECT 
        o.id,
        o.order_number,
        o.order_status,
        o.payment_status,
        st.shipment_status,
        st.tracking_number,
        st.current_location,
        pt.payment_method,
        pt.amount_paid,
        pt.transaction_reference,
        o.estimated_delivery_date,
        st.estimated_delivery
    FROM orders o
    LEFT JOIN shipment_tracking st ON o.id = st.order_id
    LEFT JOIN payment_tracking pt ON o.id = pt.order_id
    WHERE o.id = p_order_id;
END//

DELIMITER ;

-- Procedure: Get all pending actions for admin
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS get_admin_pending_actions()
BEGIN
    SELECT * FROM orders_pending_action_view
    LIMIT 50;
END//

DELIMITER ;

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================

-- Add indexes if not exist
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_user_id (user_id);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_order_status (order_status);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_payment_status (payment_status);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_created_at (created_at);
ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_order_number (order_number);

ALTER TABLE users ADD INDEX IF NOT EXISTS idx_email (email);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_status (status);

ALTER TABLE product_status_history ADD INDEX IF NOT EXISTS idx_status (new_status);
ALTER TABLE payment_tracking ADD INDEX IF NOT EXISTS idx_status (payment_status);
ALTER TABLE shipment_tracking ADD INDEX IF NOT EXISTS idx_status (shipment_status);

-- =====================================================
-- 12. INTEGRATION NOTES
-- =====================================================
/*
Your existing database has:
✓ orders table with order_status (pending, confirmed, processing, shipped, delivered, cancelled)
✓ order_status_history for order-level tracking
✓ payment_status field with values: unpaid, pending, paid, failed, refund
✓ order_items for product quantity tracking
✓ users table with comprehensive user data

This script adds:
✓ product_status_history - Track individual product status changes
✓ payment_tracking - Detailed payment transaction tracking
✓ shipment_tracking - Courier and delivery tracking
✓ order_logs - Comprehensive audit trail
✓ Useful views for admin dashboard
✓ Stored procedures for common operations
✓ Performance indexes

Your field names to use in API:
- Order ID: id (not order_id)
- Order Status: order_status
- Payment Status: payment_status
- User: user_id
- Total Amount: total_amount
- Created Date: created_at
*/
