/**
 * KEYLIGTASAN - Admin Dashboard (COMPLETE & FIXED)
 * All functions included - PHP/MySQL version
 * 
 * ✅ FIXED: Changed all instances of loadOrders() to loadAllOrders()
 */

// Global variables
let currentOrderId = null;
let allOrders = [];
let allProducts = [];
let refreshInterval;

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Loading...');
    checkAdminAuth();
    loadAdminData();
    initializeDashboard();
    setupEventListeners();
    
    // Start auto-refresh for orders (every 15 seconds for admin)
    startAutoRefresh();
});

function checkAdminAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Please login first');
        window.location.href = '../auth/auth_login.html';
        return false;
    }
    
    return true;
}

function loadAdminData() {
    const adminName = sessionStorage.getItem('userName') || 'Admin';
    const adminElement = document.getElementById('adminName');
    if (adminElement) {
        adminElement.textContent = adminName;
    }
}

// ==========================================
// Auto-Refresh for Real-time Updates
// ==========================================
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        const currentSection = document.querySelector('.content-section.active');
        if (currentSection && (currentSection.id === 'orders' || currentSection.id === 'dashboard')) {
            loadAllOrders(true);
        }
    }, 15000);
    
    console.log('✅ Admin auto-refresh enabled (15s interval)');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('⏹️ Admin auto-refresh stopped');
    }
}

// ==========================================
// Dashboard Initialization
// ==========================================
function initializeDashboard() {
    loadAllOrders();
    loadDashboardStats();
    loadRecentOrders();
}

// ==========================================
// Load All Orders
// ==========================================
function loadAllOrders(silent = false) {
    if (!silent) {
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading orders...</td></tr>';
        }
    }
    
    console.log('📡 Fetching orders from database...');
    
    const possiblePaths = [
        '../php/config/get_all_orders.php',
        'php/config/get_all_orders.php',
        './php/config/get_all_orders.php',
        '../../php/config/get_all_orders.php',
        '/keyligtasan/php/config/get_all_orders.php'
    ];
    
    tryFetchOrders(possiblePaths, 0, silent);
}

function tryFetchOrders(paths, index, silent) {
    if (index >= paths.length) {
        console.error('❌ All paths failed!');
        alert('❌ Cannot find get_all_orders.php file!');
        showNoOrders();
        return;
    }
    
    const path = paths[index];
    console.log(`📡 Trying path ${index + 1}/${paths.length}: ${path}`);
    
    const cacheBuster = '?_=' + new Date().getTime();
    
    fetch(path + cacheBuster, {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        console.log('📥 Response received, status:', response.status);
        
        if (!response.ok) {
            console.warn(`⚠️ Path ${path} failed with status ${response.status}`);
            tryFetchOrders(paths, index + 1, silent);
            return null;
        }
        
        return response.text();
    })
    .then(text => {
        if (!text) return;
        
        console.log('✅ Found working path:', path);
        
        try {
            const data = JSON.parse(text);
            if (data.success) {
                allOrders = data.orders;
                console.log('✅ Loaded', allOrders.length, 'orders');
                displayOrders(allOrders);
                updateDashboardStats(allOrders);
                sessionStorage.setItem('ordersApiPath', path);
            } else {
                console.error('❌ API Error:', data.message);
                if (!silent) {
                    alert('Error loading orders: ' + data.message);
                    showNoOrders();
                }
            }
        } catch (e) {
            console.error('❌ JSON Parse Error:', e);
            if (!silent) {
                alert('Error parsing server response.');
                showNoOrders();
            }
        }
    })
    .catch(error => {
        console.error('❌ Fetch Error for path:', path, error);
        tryFetchOrders(paths, index + 1, silent);
    });
}

// ==========================================
// Display Orders in Table
// ==========================================
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        const orderDate = new Date(order.orderDate || order.createdAt);
        const dateStr = orderDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const status = order.status || order.orderStatus || 'Pending';
        const statusClass = getStatusClass(status);
        const customerName = order.recipientName || order.userName || 'N/A';
        const itemsInfo = order.items && order.items.length > 0 
            ? `${order.items.length} item(s)` 
            : `${order.quantity || 1} item(s)`;
        
        row.innerHTML = `
            <td><strong>${order.orderNumber || order.orderId}</strong></td>
            <td>${customerName}</td>
            <td>${itemsInfo}</td>
            <td><strong>₱${parseFloat(order.total || order.totalAmount || 0).toLocaleString()}</strong></td>
            <td><span class="status-badge status-${statusClass}">${status}</span></td>
            <td>${dateStr}</td>
            <td>
                <button class="btn-icon" onclick="viewOrderDetails(${order.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="openUpdateStatusModal(${order.id})" title="Update Status">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showNoOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No orders found</td></tr>';
    }
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pending') || statusLower.includes('awaiting')) return 'pending';
    if (statusLower.includes('confirmed')) return 'processing';
    if (statusLower.includes('processing') || statusLower.includes('being prepared')) return 'processing';
    if (statusLower.includes('ready for pickup') || statusLower.includes('ready for delivery')) return 'processing';
    if (statusLower.includes('out for delivery') || statusLower.includes('shipped')) return 'shipping';
    if (statusLower.includes('delivered') && !statusLower.includes('out for')) return 'completed';
    if (statusLower.includes('completed') || statusLower.includes('fulfilled')) return 'completed';
    if (statusLower.includes('cancelled')) return 'cancelled';
    if (statusLower.includes('refunded')) return 'refunded';
    return 'pending';
}

// Helper function for simple status (used in HTML inline)
function getSimpleStatus(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('processing')) return 'processing';
    if (statusLower.includes('completed') || statusLower.includes('delivered')) return 'completed';
    if (statusLower.includes('cancelled')) return 'cancelled';
    return 'pending';
}

// ==========================================
// View Order Details
// ==========================================
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        alert('Order not found');
        return;
    }
    
    currentOrderId = orderId;
    
    const modal = document.getElementById('orderModal');
    const detailsDiv = document.getElementById('orderDetails');
    
    const orderDate = new Date(order.orderDate || order.createdAt);
    const dateStr = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let itemsHTML = '';
    if (order.items && order.items.length > 0) {
        itemsHTML = order.items.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 8px;">
                <div>
                    <strong>${item.name || 'KEYLIGTASAN Safety Keychain'}</strong><br>
                    <small>Color: ${item.color || 'N/A'} | Qty: ${item.quantity || 1}</small>
                    ${item.engraving ? `<br><small>Engraving: "${item.engraving}"</small>` : ''}
                </div>
                <strong>₱${((parseFloat(item.price) || 0) + (parseFloat(item.customization_fee) || 0)).toLocaleString()}</strong>
            </div>
        `).join('');
    } else {
        itemsHTML = `
            <div style="display: flex; justify-content: space-between; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div>
                    <strong>KEYLIGTASAN Safety Keychain</strong><br>
                    <small>Color: ${order.color || 'N/A'} | Qty: ${order.quantity || 1}</small>
                    ${order.engravingName ? `<br><small>Engraving: "${order.engravingName}"</small>` : ''}
                </div>
                <strong>₱${((parseFloat(order.basePrice) || 0) + (parseFloat(order.customizationFee) || 0)).toLocaleString()}</strong>
            </div>
        `;
    }
    
    detailsDiv.innerHTML = `
        <div class="order-detail-section">
            <h3><i class="fas fa-info-circle"></i> Order Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Order ID:</label>
                    <span>${order.orderNumber || order.orderId}</span>
                </div>
                <div class="detail-item">
                    <label>Order Date:</label>
                    <span>${dateStr}</span>
                </div>
                <div class="detail-item">
                    <label>Status:</label>
                    <span class="status-badge status-${getStatusClass(order.status)}">${order.status || 'Pending'}</span>
                </div>
                <div class="detail-item">
                    <label>Payment Method:</label>
                    <span>${order.paymentMethod || 'Cash on Delivery'}</span>
                </div>
                <div class="detail-item">
                    <label>Payment Status:</label>
                    <span style="color: ${order.paymentStatus === 'Paid' ? '#27ae60' : '#e67e22'};">${order.paymentStatus || 'Unpaid'}</span>
                </div>
            </div>
        </div>
        
        ${order.recipientName ? `
        <div class="order-detail-section">
            <h3><i class="fas fa-user"></i> Customer Information</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Name:</label>
                    <span>${order.recipientName}</span>
                </div>
                ${order.recipientPhone ? `
                <div class="detail-item">
                    <label>Phone:</label>
                    <span>${order.recipientPhone}</span>
                </div>
                ` : ''}
                ${order.deliveryAddress ? `
                <div class="detail-item full-width">
                    <label>Delivery Address:</label>
                    <span>${order.deliveryAddress}</span>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        ${order.specialInstructions ? `
        <div class="order-detail-section">
            <h3><i class="fas fa-sticky-note"></i> Special Instructions</h3>
            <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${order.specialInstructions}</p>
        </div>
        ` : ''}
        
        <div class="order-detail-section">
            <h3><i class="fas fa-shopping-bag"></i> Order Items</h3>
            ${itemsHTML}
        </div>
        
        <div class="order-detail-section">
            <h3><i class="fas fa-receipt"></i> Order Summary</h3>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Subtotal:</span>
                <span>₱${parseFloat(order.basePrice || order.subtotal || 0).toLocaleString()}</span>
            </div>
            ${(parseFloat(order.customizationFee) || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Customization Fee:</span>
                <span>₱${parseFloat(order.customizationFee).toLocaleString()}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Shipping:</span>
                <span>${parseFloat(order.shipping || order.shippingFee || 0) === 0 ? 'FREE' : '₱' + parseFloat(order.shipping || order.shippingFee).toLocaleString()}</span>
            </div>
            <hr>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 1.2rem; font-weight: bold;">
                <span>Total:</span>
                <span style="color: #e74c3c;">₱${parseFloat(order.total || order.totalAmount || 0).toLocaleString()}</span>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// ==========================================
// Update Order Status Modal
// ==========================================
function openUpdateStatusModal(orderId) {
    console.log('🔄 Opening update modal for order ID:', orderId);
    
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        alert('Order not found');
        return;
    }
    
    currentOrderId = orderId;
    const currentStatus = order.status || order.orderStatus || 'Pending';
    
    const existingModal = document.getElementById('statusUpdateModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'statusUpdateModal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-btn" onclick="closeStatusUpdateModal()">&times;</span>
            <h2>Update Order Status</h2>
            <p><strong>Order:</strong> ${order.orderNumber || order.orderId}</p>
            <p><strong>Customer:</strong> ${order.recipientName || 'N/A'}</p>
            
            <div class="form-group" style="margin: 20px 0;">
                <label for="newStatus"><strong>Select New Status:</strong></label>
                <select id="newStatus" class="filter-select" style="width: 100%; padding: 10px; margin-top: 10px; font-size: 16px;">
                    <option value="Pending - Awaiting Confirmation" ${currentStatus.includes('Pending') ? 'selected' : ''}>Pending - Awaiting Confirmation</option>
                    <option value="Confirmed - Order Accepted" ${currentStatus.includes('Confirmed') ? 'selected' : ''}>Confirmed - Order Accepted</option>
                    <option value="Processing - Being Prepared" ${currentStatus.includes('Processing') ? 'selected' : ''}>Processing - Being Prepared</option>
                    <option value="Ready for Pickup/Delivery" ${currentStatus.includes('Ready') ? 'selected' : ''}>Ready for Pickup/Delivery</option>
                    <option value="Out for Delivery" ${currentStatus.includes('Out for Delivery') ? 'selected' : ''}>Out for Delivery</option>
                    <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Completed - Order Fulfilled" ${currentStatus.includes('Completed') ? 'selected' : ''}>Completed - Order Fulfilled</option>
                    <option value="Cancelled" ${currentStatus.includes('Cancelled') ? 'selected' : ''}>Cancelled</option>
                    <option value="Refunded" ${currentStatus.includes('Refunded') ? 'selected' : ''}>Refunded</option>
                </select>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeStatusUpdateModal()">Cancel</button>
                <button class="btn-primary" id="confirmUpdateBtn" onclick="confirmUpdateStatus()">
                    <i class="fas fa-check"></i> Update Status
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeStatusUpdateModal() {
    const modal = document.getElementById('statusUpdateModal');
    if (modal) {
        modal.remove();
    }
}

function confirmUpdateStatus() {
    const selectElement = document.getElementById('newStatus');
    if (!selectElement) {
        alert('Error: Status dropdown not found');
        return;
    }
    
    const newStatus = selectElement.value;
    
    if (!currentOrderId) {
        alert('No order selected');
        return;
    }
    
    const button = document.getElementById('confirmUpdateBtn');
    if (!button) {
        alert('Error: Update button not found');
        return;
    }
    
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    const requestData = {
        order_id: currentOrderId,
        status: newStatus
    };
    
    const apiPath = '/keyligtasan/php/config/update_order_status.php';
    
    fetch(apiPath, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            
            if (data.success) {
                alert('✅ Order status updated successfully!\n\nOrder: ' + data.order_number + '\nNew Status: ' + data.new_status);
                closeStatusUpdateModal();
                loadAllOrders(); // ✅ FIXED: Was loadOrders() - now correctly loadAllOrders()
            } else {
                alert('❌ Failed to update status: ' + data.message);
            }
        } catch (e) {
            console.error('❌ JSON Parse Error:', e);
            alert('❌ Server returned invalid response.');
        }
    })
    .catch(error => {
        console.error('❌ Fetch Error:', error);
        alert('❌ Error updating order status: ' + error.message);
    })
    .finally(() => {
        button.disabled = false;
        button.innerHTML = originalHTML;
    });
}

// ==========================================
// Dashboard Stats
// ==========================================
function updateDashboardStats(orders) {
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) {
        totalOrdersEl.textContent = orders.length;
    }
    
    const pendingOrders = orders.filter(o => {
        const status = (o.status || '').toLowerCase();
        return status.includes('pending') || status.includes('awaiting');
    });
    const pendingOrdersEl = document.getElementById('pendingOrders');
    if (pendingOrdersEl) {
        pendingOrdersEl.textContent = pendingOrders.length;
    }
    
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total || o.totalAmount || 0)), 0);
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = '₱' + totalRevenue.toLocaleString();
    }
    
    const activeResellersEl = document.getElementById('activeResellers');
    if (activeResellersEl) {
        activeResellersEl.textContent = '0';
    }
}

function loadDashboardStats() {
    // Called after orders are loaded
}

function loadRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrdersList');
    if (!recentOrdersList) return;
    
    const recentOrders = allOrders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = '<p style="text-align: center; color: #999;">No recent orders</p>';
        return;
    }
    
    recentOrdersList.innerHTML = recentOrders.map(order => {
        const status = order.status || order.orderStatus || 'Pending';
        const statusClass = getStatusClass(status);
        const date = new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="recent-order-item">
                <div>
                    <strong>${order.orderNumber || order.orderId}</strong>
                    <p>${order.recipientName || 'N/A'}</p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge status-${statusClass}">${status}</span>
                    <p style="font-size: 0.85rem; color: #999;">${date}</p>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            if (sectionId === 'orders') {
                loadAllOrders(); // ✅ FIXED: Correct function name
            } else if (sectionId === 'products') {
                loadProducts();
            }
        });
    });
    
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        });
    }
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parent = this.parentElement;
            const targetTab = this.getAttribute('data-tab');
            
            parent.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
            this.classList.add('active');
            
            const tabContents = parent.parentElement.querySelectorAll('.tab-content');
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            const targetTabContent = document.getElementById(targetTab);
            if (targetTabContent) {
                targetTabContent.classList.add('active');
            }
        });
    });
    
    const statusFilter = document.getElementById('orderStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }
    
    const dateFilter = document.getElementById('orderDateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterOrders);
    }
}

function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter');
    const dateFilter = document.getElementById('orderDateFilter');
    
    const statusValue = statusFilter ? statusFilter.value.toLowerCase() : '';
    const dateValue = dateFilter ? dateFilter.value : '';
    
    let filtered = [...allOrders];
    
    if (statusValue) {
        filtered = filtered.filter(order => {
            const status = (order.status || order.orderStatus || '').toLowerCase();
            return status.includes(statusValue);
        });
    }
    
    if (dateValue) {
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate || order.createdAt).toISOString().split('T')[0];
            return orderDate === dateValue;
        });
    }
    
    displayOrders(filtered);
}

// ==========================================
// Modal Functions
// ==========================================
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// ==========================================
// Logout
// ==========================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        stopAutoRefresh();
        sessionStorage.clear();
        window.location.href = '../html/homepage_index.html';
    }
}

window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// ==========================================
// Products Management (PHP/MySQL)
// ==========================================
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }
    
    productsGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>Loading products...</p>
        </div>
    `;
    
    console.log('📦 Fetching products from database...');
    
    fetch('../php/config/get-products.php', {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            allProducts = data.products || [];
            console.log('✅ Loaded', allProducts.length, 'products');
            displayProducts(allProducts);
        } else {
            showNoProducts(data.message);
        }
    })
    .catch(error => {
        console.error('❌ Fetch Error:', error);
        showProductsError(error.message);
    });
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-box-open fa-3x" style="color: #ccc;"></i>
                <p style="margin-top: 20px; color: #666;">No products found</p>
                <button class="btn-primary" onclick="openAddProductModal()" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Add Your First Product
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const imageUrl = product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image';
        const price = parseFloat(product.price || 0);
        const stock = parseInt(product.stock || 0);
        const status = product.status || 'active';
        
        let stockStatus = '';
        let stockClass = '';
        if (stock === 0) {
            stockStatus = 'Out of Stock';
            stockClass = 'out-of-stock';
        } else if (stock < 10) {
            stockStatus = 'Low Stock';
            stockClass = 'low-stock';
        } else {
            stockStatus = 'In Stock';
            stockClass = 'in-stock';
        }
        
        html += `
            <div class="product-card">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name || 'Product'}" 
                         onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <span class="product-status ${status}">${status}</span>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name || 'Unnamed Product'}</h3>
                    <p class="product-description">${product.description || 'No description available'}</p>
                    
                    <div class="product-details">
                        <div class="product-price">
                            <span class="price-label">Price:</span>
                            <span class="price-value">₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="product-stock ${stockClass}">
                            <i class="fas fa-box"></i>
                            <span>${stock} units</span>
                            <span class="stock-status">${stockStatus}</span>
                        </div>
                    </div>
                    
                    ${product.category ? `<div class="product-category"><i class="fas fa-tag"></i> ${product.category}</div>` : ''}
                    
                    <div class="product-actions">
                        <button class="btn-icon" onclick="viewProduct(${product.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editProduct(${product.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="updateProductStock(${product.id})" title="Update Stock">
                            <i class="fas fa-warehouse"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteProduct(${product.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsGrid.innerHTML = html;
}

function showNoProducts(message = 'No products found') {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-box-open fa-3x" style="color: #ccc;"></i>
                <p style="margin-top: 20px; color: #666;">${message}</p>
                <button class="btn-primary" onclick="openAddProductModal()" style="margin-top: 20px;">
                    <i class="fas fa-plus"></i> Add Your First Product
                </button>
            </div>
        `;
    }
}

function showProductsError(errorMessage) {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff6b6b;"></i>
                <p style="margin-top: 20px; color: #666;">Error loading products</p>
                <p style="color: #999; font-size: 0.9rem;">${errorMessage}</p>
                <button class="btn-primary" onclick="loadProducts()" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const modal = document.getElementById('productModal');
    const productDetails = document.getElementById('productDetails');
    
    if (!modal || !productDetails) {
        console.error('Product modal elements not found');
        return;
    }
    
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
    const price = parseFloat(product.price || 0);
    
    productDetails.innerHTML = `
        <div class="product-details-view">
            <div class="product-image-large">
                <img src="${imageUrl}" alt="${product.name}" 
                     onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
            </div>
            <div class="product-info-large">
                <h3>${product.name || 'Unnamed Product'}</h3>
                <p class="product-desc">${product.description || 'No description available'}</p>
                
                <div class="info-row">
                    <span class="info-label">Price:</span>
                    <span class="info-value">₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Stock:</span>
                    <span class="info-value">${product.stock || 0} units</span>
                </div>
                
                ${product.category ? `
                <div class="info-row">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${product.category}</span>
                </div>
                ` : ''}
                
                ${product.sku ? `
                <div class="info-row">
                    <span class="info-label">SKU:</span>
                    <span class="info-value">${product.sku}</span>
                </div>
                ` : ''}
                
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value status-${product.status || 'active'}">${product.status || 'active'}</span>
                </div>
                
                ${product.createdAt ? `
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${new Date(product.createdAt).toLocaleDateString()}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    alert('Edit functionality - Coming soon!\n\nProduct: ' + product.name);
}

function updateProductStock(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const newStock = prompt(`Update stock for "${product.name}"\n\nCurrent stock: ${product.stock || 0}\n\nEnter new stock quantity:`, product.stock || 0);
    
    if (newStock === null) return;
    
    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
        alert('Please enter a valid stock quantity');
        return;
    }
    
    fetch('../php/config/update-product-stock.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId,
            stock: stockValue
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ Stock updated successfully!');
            loadProducts();
        } else {
            alert('❌ Failed to update stock: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error updating stock:', error);
        alert('❌ Error updating stock. Please try again.');
    });
}

function deleteProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;
    
    fetch('../php/config/delete-product.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product_id: productId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('✅ Product deleted successfully!');
            loadProducts();
        } else {
            alert('❌ Failed to delete product: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        alert('❌ Error deleting product. Please try again.');
    });
}

// ==========================================
// Placeholder Functions
// ==========================================
function openAddProductModal() {
    alert('Add Product feature - Coming soon');
}

function openAddResellerModal() {
    alert('Add Reseller feature - Coming soon');
}

function exportReport(format) {
    alert('Export to ' + format.toUpperCase() + ' - Coming soon');
}

console.log('✅ Admin Dashboard Script COMPLETE - All Functions Loaded - ERROR FIXED ✅');