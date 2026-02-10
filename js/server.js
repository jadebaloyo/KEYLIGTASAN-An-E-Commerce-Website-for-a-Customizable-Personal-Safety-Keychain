// server.js - Backend API for KEYLIGTASAN Orders
// This file handles database operations for saving orders

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Configuration
// UPDATE THESE WITH YOUR DATABASE CREDENTIALS
const dbConfig = {
    host: 'localhost',
    user: 'your_database_user',      // Change this
    password: 'your_database_password', // Change this
    database: 'keyligtasan_db',      // Change this
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

// ==================== ROUTES ====================

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'KEYLIGTASAN API Server is running!' });
});

// Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const { userId, userName, userEmail, items, totalAmount, orderDate, status, paymentMethod, shippingAddress } = req.body;
        
        // Validate required fields
        if (!userId || !items || !totalAmount) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['userId', 'items', 'totalAmount']
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            // Start transaction
            await connection.beginTransaction();
            
            // Insert main order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (user_id, user_name, user_email, total_amount, order_date, status, payment_method, shipping_address, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [userId, userName, userEmail, totalAmount, orderDate, status || 'pending', paymentMethod || 'pending', shippingAddress]
            );
            
            const orderId = orderResult.insertId;
            
            // Insert order items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_name, color, color_code, engraving, quantity, base_price, engraving_price, item_price, total_price, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        orderId,
                        item.productName,
                        item.color,
                        item.colorCode,
                        item.engraving,
                        item.quantity,
                        item.basePrice,
                        item.engravingPrice,
                        item.itemPrice,
                        item.totalPrice
                    ]
                );
            }
            
            // Commit transaction
            await connection.commit();
            
            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                orderId: orderId,
                orderNumber: `ORD-${orderId.toString().padStart(6, '0')}`
            });
            
        } catch (error) {
            // Rollback on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            error: 'Failed to create order',
            message: error.message 
        });
    }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, 
                    COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             GROUP BY o.id
             ORDER BY o.created_at DESC`
        );
        
        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });
        
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch orders',
            message: error.message 
        });
    }
});

// Get single order by ID with items
app.get('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        // Get order details
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [orderId]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Get order items
        const [items] = await pool.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [orderId]
        );
        
        const order = orders[0];
        order.items = items;
        
        res.json({
            success: true,
            order: order
        });
        
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ 
            error: 'Failed to fetch order',
            message: error.message 
        });
    }
});

// Get orders by user ID
app.get('/api/orders/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const [orders] = await pool.execute(
            `SELECT o.*,
                    COUNT(oi.id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });
        
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ 
            error: 'Failed to fetch user orders',
            message: error.message 
        });
    }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }
        
        const [result] = await pool.execute(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, orderId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json({
            success: true,
            message: 'Order status updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ 
            error: 'Failed to update order status',
            message: error.message 
        });
    }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Delete order items first (foreign key constraint)
            await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
            
            // Delete order
            const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);
            
            if (result.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Order not found' });
            }
            
            await connection.commit();
            
            res.json({
                success: true,
                message: 'Order deleted successfully'
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ 
            error: 'Failed to delete order',
            message: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 API endpoint: http://localhost:${PORT}/api/orders`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Shutting down server...');
    await pool.end();
    process.exit(0);
});