/**
 * KEYLIGTASAN - Dashboard.js
 * Customer Dashboard with Real Order Data
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded');
    
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Load dashboard statistics
    loadDashboardStats();
    
    // Load recent orders
    loadRecentOrders();
    
    // Setup dropdown
    setupDropdown();
});

// ==========================================
// Authentication Check
// ==========================================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        console.log('Not logged in, redirecting...');
        alert('Please login first');
        window.location.href = '../auth/auth_login.html';
        return false;
    }
    return true;
}

// ==========================================
// Load User Data
// ==========================================
function loadUserData() {
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (userName) {
        // Update all username displays
        const userNameElements = document.querySelectorAll('#userName, #userNameWelcome, #dropdownUserName');
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = userName;
            }
        });
    }
    
    if (userEmail) {
        const emailElement = document.querySelector('.dropdown-header p');
        if (emailElement) {
            emailElement.textContent = userEmail;
        }
    }
}

// ==========================================
// Load Dashboard Statistics
// ==========================================
function loadDashboardStats() {
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
        console.error('No userId found');
        return;
    }
    
    // Fetch orders to calculate stats
    fetch(`../php/config/getorders_simple.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.orders) {
                const orders = data.orders;
                
                // Calculate statistics
                const totalOrders = orders.length;
                const completedOrders = orders.filter(order => 
                    (order.status || '').toLowerCase().includes('delivered') ||
                    (order.status || '').toLowerCase().includes('completed')
                ).length;
                const pendingOrders = orders.filter(order => 
                    (order.status || '').toLowerCase().includes('pending') ||
                    (order.status || '').toLowerCase().includes('processing') ||
                    (order.status || '').toLowerCase().includes('confirmed')
                ).length;
                
                // Update stat cards
                updateStatCard(0, totalOrders);
                updateStatCard(1, completedOrders);
                updateStatCard(2, pendingOrders);
                // Wishlist stays at 8 for now (or you can fetch from database)
            }
        })
        .catch(error => {
            console.error('Error loading stats:', error);
        });
}

function updateStatCard(index, value) {
    const statCards = document.querySelectorAll('.stat-card h2');
    if (statCards[index]) {
        statCards[index].textContent = value;
    }
}

// ==========================================
// Load Recent Orders (Last 5)
// ==========================================
function loadRecentOrders() {
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
        console.error('No userId found');
        showEmptyOrders();
        return;
    }
    
    const tbody = document.querySelector('.orders-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>';
    
    fetch(`../php/config/getorders_simple.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.orders && data.orders.length > 0) {
                // Sort by date (newest first) and take only the first 5
                const recentOrders = data.orders
                    .sort((a, b) => new Date(b.created_at || b.orderDate) - new Date(a.created_at || a.orderDate))
                    .slice(0, 5);
                
                displayRecentOrders(recentOrders);
            } else {
                showEmptyOrders();
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #e74c3c;">Error loading orders. Please try again.</td></tr>';
        });
}

// ==========================================
// Display Recent Orders
// ==========================================
function displayRecentOrders(orders) {
    const tbody = document.querySelector('.orders-table tbody');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = createOrderRow(order);
        tbody.innerHTML += row;
    });
}

// ==========================================
// Create Order Row HTML
// ==========================================
function createOrderRow(order) {
    // Format order ID
    const orderId = order.id ? `#${String(order.id).padStart(3, '0')}` : '#000';
    
    // Get product name
    let productName = 'KEYLIGTASAN Safety Keychain';
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        productName = order.items[0].name || productName;
        if (order.items.length > 1) {
            productName += ` (+${order.items.length - 1} more)`;
        }
    }
    
    // Format date
    const orderDate = order.created_at || order.orderDate;
    const date = orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : 'N/A';
    
    // Get status and determine badge class
    const status = order.status || 'Pending';
    const statusLower = status.toLowerCase();
    
    let badgeClass = 'pending';
    let displayStatus = status;
    
    if (statusLower.includes('delivered') || statusLower.includes('completed')) {
        badgeClass = 'delivered';
        displayStatus = 'Delivered';
    } else if (statusLower.includes('processing') || statusLower.includes('confirmed') || statusLower.includes('ready')) {
        badgeClass = 'processing';
        displayStatus = 'Processing';
    } else if (statusLower.includes('shipped')) {
        badgeClass = 'processing';
        displayStatus = 'Shipped';
    } else if (statusLower.includes('cancelled')) {
        badgeClass = 'cancelled';
        displayStatus = 'Cancelled';
    } else {
        badgeClass = 'pending';
        displayStatus = 'Pending';
    }
    
    // Format total
    const total = parseFloat(order.total || 0);
    const formattedTotal = total > 0 ? `₱${total.toLocaleString()}` : '₱0';
    
    return `
        <tr>
            <td>${orderId}</td>
            <td>${productName}</td>
            <td>${date}</td>
            <td><span class="badge ${badgeClass}">${displayStatus}</span></td>
            <td>${formattedTotal}</td>
            <td><button class="btn-view" onclick="viewOrder(${order.id})">View</button></td>
        </tr>
    `;
}

// ==========================================
// Show Empty State
// ==========================================
function showEmptyOrders() {
    const tbody = document.querySelector('.orders-table tbody');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 40px;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #ccc; margin-bottom: 10px;"></i>
                <p style="color: #6c757d; margin-top: 10px;">No orders yet</p>
                <a href="../customer/shop.html" style="color: #e74c3c; text-decoration: none; margin-top: 10px; display: inline-block;">
                    Start Shopping <i class="fas fa-arrow-right"></i>
                </a>
            </td>
        </tr>
    `;
}

// ==========================================
// View Order Details
// ==========================================
function viewOrder(orderId) {
    // Redirect to orders page with specific order highlighted
    window.location.href = `orders.html?order=${orderId}`;
}

// ==========================================
// Setup Dropdown Menu
// ==========================================
function setupDropdown() {
    const profileBtn = document.getElementById('userProfileBtn');
    const dropdown = document.getElementById('userDropdown');
    
    if (profileBtn && dropdown) {
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
}

// ==========================================
// Logout Function
// ==========================================
function logout(event) {
    if (event) {
        event.preventDefault();
    }
    
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../auth/auth_login.html';
    }
}