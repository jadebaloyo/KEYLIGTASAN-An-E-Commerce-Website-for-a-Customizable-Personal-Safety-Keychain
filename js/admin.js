/**
 * KEYLIGTASAN - Admin Dashboard JavaScript (CORRECTED VERSION)
 * Fixed API URL based on console error analysis
 */

// ⚠️ CORRECTED API URL - This was the problem!
const API_URL = 'php/order_api_existing_db.php';

let currentOrder = null;

// =====================================================
// INITIALIZATION
// =====================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin Dashboard JavaScript loaded');
    console.log('📍 API URL set to:', API_URL);
    
    checkAdminAuth();
    setupEventListeners();
    
    // Load data after DOM is ready
    setTimeout(() => {
        loadDashboardData();
        loadOrders();
    }, 100);
});

function checkAdminAuth() {
    const adminRole = sessionStorage.getItem('userRole');
    const adminId = sessionStorage.getItem('userId');
    
    console.log('🔐 Checking auth - Role:', adminRole, 'ID:', adminId);
    
    if (adminRole !== 'admin' || !adminId) {
        console.error('❌ Not authorized');
        alert('Access denied. Admin only.');
        window.location.href = 'html/login.html';
        return false;
    }
    
    const adminName = sessionStorage.getItem('userName');
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = adminName || 'Admin';
    }
    
    console.log('✅ Authenticated as:', adminName);
    return true;
}

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                showSection(section);
            }
        });
    });
    
    // Status filter
    const orderFilter = document.getElementById('orderStatusFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', () => {
            console.log('🔍 Filter changed to:', orderFilter.value);
            loadOrders();
        });
    }
    
    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('active');
        });
    }
}

// =====================================================
// NAVIGATION
// =====================================================
function showSection(sectionName) {
    console.log('📂 Switching to section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active from menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
    }
    
    // Mark menu item as active
    const menuItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (menuItem) {
        menuItem.classList.add('active');
    }
    
    // Load section data
    if (sectionName === 'dashboard') loadDashboardData();
    else if (sectionName === 'orders') loadOrders();
}

// =====================================================
// DASHBOARD
// =====================================================
function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    const url = `${API_URL}?action=get_all_orders`;
    console.log('🌐 Fetching from:', url);
    
    fetch(url)
        .then(response => {
            console.log('📥 Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('📦 Data received:', data);
            
            if (data.success && data.orders) {
                console.log('✅ Orders found:', data.orders.length);
                updateDashboardStats(data.orders);
                displayRecentOrders(data.orders.slice(0, 5));
            } else {
                console.warn('⚠️ No orders:', data.message);
                updateDashboardStats([]);
                displayRecentOrders([]);
            }
        })
        .catch(error => {
            console.error('❌ Dashboard error:', error);
            updateDashboardStats([]);
            displayRecentOrders([]);
        });
}

function updateDashboardStats(orders) {
    const stats = {
        total: orders.length,
        pending: orders.filter(o => (o.status || '').toLowerCase() === 'pending').length,
        revenue: orders
            .filter(o => ['delivered', 'completed'].includes((o.status || '').toLowerCase()))
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    };
    
    console.log('📈 Stats:', stats);
    
    const totalEl = document.getElementById('totalOrders');
    const pendingEl = document.getElementById('pendingOrders');
    const revenueEl = document.getElementById('totalRevenue');
    
    if (totalEl) totalEl.textContent = stats.total;
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (revenueEl) revenueEl.textContent = '₱' + stats.revenue.toLocaleString('en-PH', {minimumFractionDigits: 2});
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#999;">No recent orders</p>';
        return;
    }
    
    console.log('📝 Displaying', orders.length, 'recent orders');
    
    orders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <div class="order-item-header">
                <span class="order-item-id">#${order.order_number || 'ORD-' + order.id}</span>
                <span class="order-item-status ${(order.status || 'pending').toLowerCase()}">
                    ${(order.status || 'pending').toUpperCase()}
                </span>
            </div>
            <div class="order-item-customer">
                ${order.engraved_name || 'Customer'} - ₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}
            </div>
            <div class="order-item-actions">
                <button class="btn-sm btn-view" onclick="viewOrderDetails(${order.id})">View</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// =====================================================
// ORDERS MANAGEMENT
// =====================================================
function loadOrders() {
    console.log('📋 Loading orders...');
    
    const filterEl = document.getElementById('orderStatusFilter');
    const filter = filterEl ? filterEl.value : '';
    
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">Loading...</td></tr>';
    }
    
    const url = `${API_URL}?action=get_all_orders`;
    console.log('🌐 Fetching orders from:', url);
    
    fetch(url)
        .then(response => {
            console.log('📥 Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('📦 Orders data:', data);
            
            if (data.success && data.orders) {
                console.log('✅ Total orders:', data.orders.length);
                displayOrders(data.orders, filter);
            } else {
                console.warn('⚠️ No orders:', data.message);
                displayOrders([], filter);
            }
        })
        .catch(error => {
            console.error('❌ Load orders error:', error);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#e74c3c;">
                    <strong>Error loading orders</strong><br><br>
                    ${error.message}<br><br>
                    <small>Check console for details (F12)</small>
                </td></tr>`;
            }
        });
}

function displayOrders(orders, filter) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.error('❌ Table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px;">No orders in database</td></tr>';
        return;
    }
    
    // Apply filter
    let filtered = orders;
    if (filter) {
        filtered = orders.filter(o => (o.status || 'pending').toLowerCase() === filter.toLowerCase());
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">No orders with status "${filter}"</td></tr>`;
        return;
    }
    
    console.log('📝 Displaying', filtered.length, 'orders');
    
    filtered.forEach(order => {
        const tr = document.createElement('tr');
        const status = (order.status || 'pending').toLowerCase();
        
        tr.innerHTML = `
            <td><strong>#${order.order_number || 'ORD-' + order.id}</strong></td>
            <td>${order.engraved_name || 'Customer'}</td>
            <td>${order.quantity || 1} item(s)</td>
            <td>₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</td>
            <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
            <td>${new Date(order.created_at || new Date()).toLocaleDateString('en-PH')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-view" onclick="viewOrderDetails(${order.id})">View</button>
                    ${getStatusButton(order.id, status)}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusButton(orderId, currentStatus) {
    if (currentStatus === 'pending') {
        return `<button class="btn-sm btn-success" onclick="quickUpdateStatus(${orderId}, 'processing')">Process</button>`;
    } else if (currentStatus === 'processing') {
        return `<button class="btn-sm btn-primary" onclick="quickUpdateStatus(${orderId}, 'delivering')">Deliver</button>`;
    } else if (currentStatus === 'delivering') {
        return `<button class="btn-sm btn-success" onclick="quickUpdateStatus(${orderId}, 'completed')">Complete</button>`;
    }
    return '';
}

// =====================================================
// ORDER DETAILS & STATUS UPDATE
// =====================================================
function viewOrderDetails(orderId) {
    console.log('👁️ Viewing order:', orderId);
    
    const url = `${API_URL}?action=get_order&order_id=${orderId}`;
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            if (data.success && data.order) {
                currentOrder = data.order;
                displayOrderModal(data.order);
                openModal('orderModal');
            } else {
                alert('Error: ' + (data.message || 'Could not load order'));
            }
        })
        .catch(err => {
            console.error('❌ Error:', err);
            alert('Error loading order: ' + err.message);
        });
}

function displayOrderModal(order) {
    const details = document.getElementById('orderDetails');
    if (!details) return;
    
    const status = order.status || 'pending';
    
    details.innerHTML = `
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Order ID</span>
                <span class="detail-value">#${order.order_number || 'ORD-' + order.id}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value"><span class="status-badge ${status.toLowerCase()}">${status.toUpperCase()}</span></span>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Customer</span>
                <span class="detail-value">${order.engraved_name || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Date</span>
                <span class="detail-value">${new Date(order.created_at || new Date()).toLocaleString('en-PH')}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Color</span>
                <span class="detail-value">${order.color || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Quantity</span>
                <span class="detail-value">${order.quantity || 1}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Special Instructions</span>
                <span class="detail-value">${order.special_instructions || 'None'}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Base Price</span>
                <span class="detail-value">₱${parseFloat(order.base_price || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Customization</span>
                <span class="detail-value">₱${parseFloat(order.customization_fee || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Shipping</span>
                <span class="detail-value">₱${parseFloat(order.shipping_fee || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Total</span>
                <span class="detail-value" style="font-size:1.3rem; color:#667eea;">₱${parseFloat(order.total_amount || 0).toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
            </div>
        </div>
        
        <div class="detail-row" style="margin-top:20px;">
            <div class="detail-item">
                <span class="detail-label">Update Status</span>
                <select id="newOrderStatus" style="padding:10px; border:1px solid #ddd; border-radius:6px; width:100%;">
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="delivering">Delivering</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>
        
        <div class="detail-row">
            <div class="detail-item">
                <span class="detail-label">Notes</span>
                <textarea id="orderChangeNotes" placeholder="Add notes..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; min-height:80px;"></textarea>
            </div>
        </div>
    `;
    
    document.getElementById('newOrderStatus').value = status.toLowerCase();
}

function quickUpdateStatus(orderId, newStatus) {
    if (!confirm(`Update order to ${newStatus.toUpperCase()}?`)) return;
    
    updateOrderStatusAPI(orderId, newStatus, `Quick update to ${newStatus}`, false);
}

function updateOrderStatus() {
    if (!currentOrder) {
        alert('No order selected');
        return;
    }
    
    const newStatus = document.getElementById('newOrderStatus').value;
    const notes = document.getElementById('orderChangeNotes').value || 'Updated by admin';
    
    if (newStatus === (currentOrder.status || 'pending').toLowerCase()) {
        alert('Please select a different status');
        return;
    }
    
    updateOrderStatusAPI(currentOrder.id, newStatus, notes, true);
}

function updateOrderStatusAPI(orderId, newStatus, notes, closeModal) {
    console.log('📤 Updating order', orderId, 'to', newStatus);
    
    const formData = new FormData();
    formData.append('action', 'update_order_status');
    formData.append('order_id', orderId);
    formData.append('new_status', newStatus);
    formData.append('changed_by', sessionStorage.getItem('userName') || 'Admin');
    formData.append('change_notes', notes);
    
    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            alert(`✅ Order updated to ${newStatus.toUpperCase()}`);
            if (closeModal) closeModal('orderModal');
            loadOrders();
            loadDashboardData();
        } else {
            alert('❌ Error: ' + (data.message || 'Update failed'));
        }
    })
    .catch(err => {
        console.error('❌ Update error:', err);
        alert('Error updating order: ' + err.message);
    });
}

// =====================================================
// MODAL
// =====================================================
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// =====================================================
// UTILITIES
// =====================================================
function logout() {
    if (confirm('Logout?')) {
        sessionStorage.clear();
        window.location.href = 'html/login.html';
    }
}

// Auto-load on page ready
window.addEventListener('load', () => {
    setTimeout(() => {
        loadDashboardData();
        loadOrders();
    }, 500);
});

console.log('✅ Admin Dashboard ready');