/**
 * KEYLIGTASAN - Orders.js (UPDATED WITH COLOR MAPPING FIX)
 * Fixed version with proper color-to-image mapping
 */

// Auto-refresh interval variable
let refreshInterval;

// ✅ ADDED: Color to image mapping (used throughout the file)
const COLOR_IMAGE_MAP = {
    'Chocolate Brown': 'chocolatebrown',
    'chocolatebrown': 'chocolatebrown',
    'chocolate brown': 'chocolatebrown',
    'Emerald Green': 'emeraldgreen',
    'emeraldgreen': 'emeraldgreen',
    'emerald green': 'emeraldgreen',
    'Golden Orange': 'goldenorange',
    'goldenorange': 'goldenorange',
    'golden orange': 'goldenorange',
    'Midnight Black': 'midnightblack',
    'midnightblack': 'midnightblack',
    'midnight black': 'midnightblack',
    'Ocean Blue': 'oceanblue',
    'oceanblue': 'oceanblue',
    'ocean blue': 'oceanblue',
    'Rose Pink': 'rosepink',
    'rosepink': 'rosepink',
    'rose pink': 'rosepink',
    'Royal Purple': 'royalpurple',
    'royalpurple': 'royalpurple',
    'royal purple': 'royalpurple',
    'Ruby Red': 'rubyred',
    'rubyred': 'rubyred',
    'ruby red': 'rubyred'
};

// Helper function to get color slug
function getColorSlug(color) {
    if (!color) return 'chocolatebrown';
    
    // Try exact match first
    if (COLOR_IMAGE_MAP[color]) {
        return COLOR_IMAGE_MAP[color];
    }
    
    // Try lowercase match
    const lowerColor = color.toLowerCase();
    if (COLOR_IMAGE_MAP[lowerColor]) {
        return COLOR_IMAGE_MAP[lowerColor];
    }
    
    // Try removing spaces
    const noSpaces = color.replace(/\s+/g, '').toLowerCase();
    if (COLOR_IMAGE_MAP[noSpaces]) {
        return COLOR_IMAGE_MAP[noSpaces];
    }
    
    console.warn('⚠️ Unknown color:', color, '- defaulting to chocolatebrown');
    return 'chocolatebrown';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('='.repeat(50));
    console.log('🚀 ORDERS PAGE LOADED - DIAGNOSTIC MODE');
    console.log('='.repeat(50));
    
    // Debug sessionStorage
    console.log('📋 SessionStorage Debug:');
    console.log('  - isLoggedIn:', sessionStorage.getItem('isLoggedIn'));
    console.log('  - userId:', sessionStorage.getItem('userId'));
    console.log('  - userName:', sessionStorage.getItem('userName'));
    console.log('  - All keys:', Object.keys(sessionStorage));
    
    checkAuth();
    loadUserData();
    loadOrdersFromDatabase();
    
    // Start auto-refresh every 10 seconds
    startAutoRefresh();
});

// ==========================================
// Auto-Refresh Functionality
// ==========================================
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        loadOrdersFromDatabase(true);
    }, 10000);
    
    console.log('✅ Auto-refresh enabled: Orders will update every 10 seconds');
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
        console.log('⏹️ Auto-refresh stopped');
    }
}

window.addEventListener('beforeunload', function() {
    stopAutoRefresh();
});

// ==========================================
// Authentication Check
// ==========================================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    console.log('🔐 Auth check - isLoggedIn:', isLoggedIn);
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        console.error('❌ Not logged in, redirecting...');
        alert('Please login first');
        window.location.href = '../auth/auth_login.html';
        return false;
    }
    console.log('✅ Authentication passed');
    return true;
}

// ==========================================
// Load User Data
// ==========================================
function loadUserData() {
    const userName = sessionStorage.getItem('userName');
    console.log('👤 Loading user data:', userName);
    
    if (userName) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

// ==========================================
// Load Orders from Database
// ==========================================
function loadOrdersFromDatabase(silent = false) {
    let userId = sessionStorage.getItem('userId');
    
    console.log('📊 loadOrdersFromDatabase called');
    console.log('  - userId from session:', userId);
    console.log('  - silent mode:', silent);
    
    // FALLBACK: If no userId in session, try to get it from login
    if (!userId || userId === 'null' || userId === 'undefined') {
        console.warn('⚠️ No valid userId in sessionStorage!');
        
        // Try alternative session keys
        userId = sessionStorage.getItem('user_id') || 
                 sessionStorage.getItem('id') || 
                 sessionStorage.getItem('customerId');
        
        console.log('  - Trying alternative keys, found:', userId);
        
        // If still no userId, check if we can get it from the database
        if (!userId) {
            console.error('❌ No userId found anywhere in sessionStorage');
            if (!silent) {
                showEmptyOrders();
                alert('Session expired. Please login again.');
            }
            return;
        } else {
            // Save it to the standard key for next time
            sessionStorage.setItem('userId', userId);
            console.log('✅ Found userId in alternative key, saved to userId:', userId);
        }
    }
    
    const ordersContainer = document.getElementById('ordersContainer');
    
    if (!silent) {
        ordersContainer.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #e74c3c;"></i>
                <p style="margin-top: 20px; color: #6c757d;">Loading your orders...</p>
                <p style="font-size: 0.85rem; color: #999;">User ID: ${userId}</p>
            </div>
        `;
    }
    
    // Build API URL - USING SIMPLE VERSION
    const apiUrl = `../php/config/getorders_simple.php?user_id=${userId}`;
    console.log('🌐 Fetching from:', apiUrl);
    console.log('📍 Full URL:', window.location.origin + '/' + apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log('📡 Response received');
            console.log('  - Status:', response.status);
            console.log('  - OK:', response.ok);
            console.log('  - Content-Type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('📥 Raw response length:', text.length);
            console.log('📄 First 200 chars:', text.substring(0, 200));
            
            // Check if HTML
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                console.error('❌ Response is HTML, not JSON!');
                throw new Error('Server returned HTML instead of JSON. Check PHP file for errors.');
            }
            
            // Parse JSON
            let data;
            try {
                data = JSON.parse(text);
                console.log('✅ JSON parsed successfully');
                console.log('📊 Parsed data:', data);
            } catch (e) {
                console.error('❌ JSON Parse Error:', e.message);
                console.error('Raw response:', text);
                throw new Error('Invalid JSON: ' + e.message);
            }
            
            // Handle response
            if (data.success) {
                if (data.orders && data.orders.length > 0) {
                    console.log(`✅ Success! Loaded ${data.orders.length} orders`);
                    console.log('Orders:', data.orders);
                    displayOrders(data.orders);
                } else {
                    console.log('ℹ️ No orders found for user', userId);
                    showEmptyOrders();
                }
            } else {
                console.error('❌ API Error:', data.message);
                if (!silent) {
                    alert('Error loading orders: ' + data.message);
                    showEmptyOrders();
                }
            }
        })
        .catch(error => {
            console.error('💥 Fetch Error:', error);
            console.error('Full error:', error);
            
            if (!silent) {
                showEmptyOrders();
                ordersContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px; background: #fff3cd; border-radius: 10px; margin: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #856404;"></i>
                        <h3 style="color: #856404; margin-top: 20px;">Unable to Load Orders</h3>
                        <p style="color: #856404; margin-top: 10px;">${error.message}</p>
                        <p style="color: #6c757d; margin-top: 10px; font-size: 0.9rem;">
                            Check browser console (F12) for detailed error information.
                        </p>
                        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #856404; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                `;
            }
        });
}

// ==========================================
// Manual Refresh Function
// ==========================================
function refreshOrders() {
    console.log('🔄 Manual refresh triggered');
    loadOrdersFromDatabase();
}

// ==========================================
// Display Orders
// ==========================================
function displayOrders(orders) {
    console.log('🎨 Displaying', orders.length, 'orders');
    
    // DEBUG: Log order colors
    orders.forEach((order, i) => {
        console.log(`Order ${i + 1} color data:`, {
            color: order.color,
            items: order.items ? order.items.map(item => ({ 
                name: item.name, 
                color: item.color 
            })) : 'no items array'
        });
    });
    
    const ordersContainer = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');
    
    ordersContainer.style.display = 'flex';
    emptyOrders.style.display = 'none';
    
    // Sort by date (newest first)
    orders.sort((a, b) => {
        const dateA = new Date(b.orderDate || b.createdAt || 0);
        const dateB = new Date(a.orderDate || a.createdAt || 0);
        return dateA - dateB;
    });
    
    // Clear and render orders
    ordersContainer.innerHTML = '';
    orders.forEach((order, index) => {
        ordersContainer.innerHTML += createOrderCard(order, index);
    });
    
    console.log('✅ Orders displayed successfully');
}

// ==========================================
// Show Empty State
// ==========================================
function showEmptyOrders() {
    console.log('📭 Showing empty orders state');
    
    const ordersContainer = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');
    
    if (ordersContainer) ordersContainer.style.display = 'none';
    if (emptyOrders) emptyOrders.style.display = 'flex';
}

// ==========================================
// Create Order Card HTML
// ==========================================
function createOrderCard(order, index) {
    const orderDate = order.orderDate || order.createdAt;
    const date = orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Date not available';
    
    let itemsHTML = '';
    
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        itemsHTML = order.items.map(item => {
            const itemPrice = (parseFloat(item.price) || 0) + (parseFloat(item.customization_fee) || 0);
            const itemTotal = itemPrice * (parseInt(item.quantity) || 1);
            
            // ✅ FIX: Use color mapping with helper function
            const color = item.color || 'Chocolate Brown';
            const colorSlug = getColorSlug(color);
            
            console.log(`🎨 Order item color mapping: "${color}" → "${colorSlug}"`);
            
            return `
                <div class="order-item">
                    <div class="order-item-image">
                        <img src="../assets/images/${colorSlug}.png" 
                             alt="${color}"
                             onerror="this.src='../assets/images/chocolatebrown.png'">
                    </div>
                    <div class="order-item-info">
                        <div class="order-item-name">${item.name || 'KEYLIGTASAN Safety Keychain'}</div>
                        <div class="order-item-details">
                            Color: ${color}
                            ${item.engraving ? ` | Engraving: "${item.engraving}"` : ''}
                            | Qty: ${item.quantity || 1}
                        </div>
                    </div>
                    <div class="order-item-price">₱${itemTotal.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    } else {
        // ✅ FIX: Use color mapping for single item orders
        const color = order.color || 'Chocolate Brown';
        const colorSlug = getColorSlug(color);
        const engraving = order.engravingName || order.engraved_name || '';
        const qty = order.quantity || 1;
        const itemPrice = (parseFloat(order.basePrice) || 0) + (parseFloat(order.customizationFee) || 0);
        
        console.log(`🎨 Single order color mapping: "${color}" → "${colorSlug}"`);
        
        itemsHTML = `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="../assets/images/${colorSlug}.png" 
                         alt="${color}"
                         onerror="this.src='../assets/images/chocolatebrown.png'">
                </div>
                <div class="order-item-info">
                    <div class="order-item-name">KEYLIGTASAN Safety Keychain</div>
                    <div class="order-item-details">
                        Color: ${color}
                        ${engraving ? ` | Engraving: "${engraving}"` : ''}
                        | Qty: ${qty}
                    </div>
                </div>
                <div class="order-item-price">₱${itemPrice.toLocaleString()}</div>
            </div>
        `;
    }
    
    const status = order.status || order.orderStatus || 'Pending';
    const statusLower = status.toLowerCase();
    
    let statusClass = 'pending';
    if (statusLower.includes('confirmed')) statusClass = 'processing';
    else if (statusLower.includes('processing')) statusClass = 'processing';
    else if (statusLower.includes('ready')) statusClass = 'processing';
    else if (statusLower.includes('out for delivery')) statusClass = 'processing';
    else if (statusLower.includes('delivered')) statusClass = 'completed';
    else if (statusLower.includes('completed')) statusClass = 'completed';
    else if (statusLower.includes('cancelled')) statusClass = 'cancelled';
    else if (statusLower.includes('refunded')) statusClass = 'refunded';
    
    const orderId = order.orderId || order.orderNumber || `#${order.id}`;
    let total = parseFloat(order.total || order.totalAmount || 0);
    
    if (total <= 0) {
        const basePrice = parseFloat(order.basePrice || order.subtotal || 0);
        const customizationFee = parseFloat(order.customizationFee || 0);
        const shippingFee = parseFloat(order.shipping || order.shippingFee || 0);
        total = basePrice + customizationFee + shippingFee;
    }
    
    const orderDataStr = encodeURIComponent(JSON.stringify(order));
    
    return `
        <div class="order-card" data-order-index="${index}">
            <div class="order-header">
                <div>
                    <div class="order-id">Order ${orderId}</div>
                    <div class="order-date">${date}</div>
                </div>
                <div class="order-status ${statusClass}">${status}</div>
            </div>
            
            <div class="order-items">
                ${itemsHTML}
            </div>
            
            <div class="order-footer">
                <div class="order-total">Total: ₱${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                <div class="order-actions">
                    <button class="btn-view-order" onclick="viewOrderDetails('${orderDataStr}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// View Order Details Modal
// ==========================================
function viewOrderDetails(encodedOrder) {
    const order = JSON.parse(decodeURIComponent(encodedOrder));
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderDetailsContent');
    
    const orderDate = order.orderDate || order.createdAt;
    const date = orderDate ? new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Date not available';
    
    let itemsHTML = '';
    
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        itemsHTML = order.items.map(item => {
            const itemPrice = (parseFloat(item.price) || 0) + (parseFloat(item.customization_fee) || 0);
            const itemTotal = itemPrice * (parseInt(item.quantity) || 1);
            
            // ✅ FIX: Use color mapping with helper
            const color = item.color || 'Chocolate Brown';
            const colorSlug = getColorSlug(color);
            
            return `
                <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                        <img src="../assets/images/${colorSlug}.png" 
                             alt="${color}"
                             style="width: 100%; height: 100%; object-fit: contain;"
                             onerror="this.src='../assets/images/chocolatebrown.png'">
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">${item.name || 'KEYLIGTASAN Safety Keychain'}</div>
                        <div style="font-size: 0.85rem; color: #6c757d;">
                            Color: ${color}<br>
                            ${item.engraving ? `Engraving: "${item.engraving}"<br>` : ''}
                            Quantity: ${item.quantity || 1}
                        </div>
                    </div>
                    <div style="font-weight: 600; color: #e74c3c;">₱${itemTotal.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    } else {
        // ✅ FIX: Use color mapping for single item
        const color = order.color || 'Chocolate Brown';
        const colorSlug = getColorSlug(color);
        const itemPrice = (parseFloat(order.basePrice) || 0) + (parseFloat(order.customizationFee) || 0);
        
        itemsHTML = `
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: #f8f9fa; border-radius: 10px; margin-bottom: 10px;">
                <div style="width: 60px; height: 60px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="../assets/images/${colorSlug}.png" 
                         alt="${color}"
                         style="width: 100%; height: 100%; object-fit: contain;"
                         onerror="this.src='../assets/images/chocolatebrown.png'">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px;">KEYLIGTASAN Safety Keychain</div>
                    <div style="font-size: 0.85rem; color: #6c757d;">
                        Color: ${color}<br>
                        ${order.engravingName ? `Engraving: "${order.engravingName}"<br>` : ''}
                        Quantity: ${order.quantity || 1}
                    </div>
                </div>
                <div style="font-weight: 600; color: #e74c3c;">₱${itemPrice.toLocaleString()}</div>
            </div>
        `;
    }
    
    const orderId = order.orderId || order.orderNumber || `#${order.id}`;
    const status = order.status || order.orderStatus || 'Pending';
    const statusLower = status.toLowerCase();
    
    let statusClass = 'pending';
    if (statusLower.includes('confirmed')) statusClass = 'processing';
    else if (statusLower.includes('processing')) statusClass = 'processing';
    else if (statusLower.includes('delivered')) statusClass = 'completed';
    else if (statusLower.includes('completed')) statusClass = 'completed';
    else if (statusLower.includes('cancelled')) statusClass = 'cancelled';
    else if (statusLower.includes('refunded')) statusClass = 'refunded';
    
    const payment = order.paymentMethod || 'Cash on Delivery';
    const paymentStatus = order.paymentStatus || 'Unpaid';
    
    const subtotal = parseFloat(order.subtotal || order.basePrice || 0);
    const customization = parseFloat(order.customizationFee || 0);
    const shipping = parseFloat(order.shipping || order.shippingFee || 0);
    let total = parseFloat(order.total || order.totalAmount || 0);
    
    if (total <= 0) {
        total = subtotal + customization + shipping;
    }
    
    content.innerHTML = `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-info-circle" style="color: #e74c3c; margin-right: 8px;"></i>
                Order Information
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; font-size: 0.95rem;">
                <div style="color: #6c757d;">Order ID:</div>
                <div style="font-weight: 600;">${orderId}</div>
                
                <div style="color: #6c757d;">Order Date:</div>
                <div>${date}</div>
                
                <div style="color: #6c757d;">Status:</div>
                <div><span class="order-status ${statusClass}">${status}</span></div>
                
                <div style="color: #6c757d;">Payment:</div>
                <div>${payment}</div>
                
                <div style="color: #6c757d;">Payment Status:</div>
                <div style="color: ${paymentStatus === 'Paid' ? '#27ae60' : '#e67e22'}; font-weight: 500;">${paymentStatus}</div>
            </div>
        </div>
        
        ${order.recipientName ? `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-truck" style="color: #e74c3c; margin-right: 8px;"></i>
                Shipping Information
            </h3>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; font-size: 0.95rem;">
                <div style="color: #6c757d;">Recipient:</div>
                <div style="font-weight: 500;">${order.recipientName}</div>
                ${order.recipientPhone ? `
                <div style="color: #6c757d;">Phone:</div>
                <div>${order.recipientPhone}</div>
                ` : ''}
                ${order.deliveryAddress ? `
                <div style="color: #6c757d;">Address:</div>
                <div>${order.deliveryAddress}</div>
                ` : ''}
            </div>
        </div>
        ` : ''}
        
        ${order.specialInstructions ? `
        <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-sticky-note" style="color: #e74c3c; margin-right: 8px;"></i>
                Special Instructions
            </h3>
            <p style="padding: 15px; background: #f8f9fa; border-radius: 10px; color: #6c757d; font-style: italic;">${order.specialInstructions}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-shopping-bag" style="color: #e74c3c; margin-right: 8px;"></i>
                Order Items
            </h3>
            ${itemsHTML}
        </div>
        
        <div style="padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 1.1rem;">
                <i class="fas fa-receipt" style="color: #e74c3c; margin-right: 8px;"></i>
                Order Summary
            </h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #6c757d;">
                <span>Subtotal:</span>
                <span>₱${subtotal.toLocaleString()}</span>
            </div>
            ${customization > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #6c757d;">
                <span>Customization Fee:</span>
                <span>₱${customization.toLocaleString()}</span>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #6c757d;">
                <span>Shipping:</span>
                <span>${shipping === 0 ? 'FREE' : '₱' + shipping.toLocaleString()}</span>
            </div>
            <div style="height: 2px; background: #dee2e6; margin: 15px 0;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 1.3rem; font-weight: 700; color: #e74c3c;">
                <span>Total:</span>
                <span>₱${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ==========================================
// Close Order Details Modal
// ==========================================
function closeOrderDetails() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeOrderDetails();
    }
});

// ==========================================
// Logout Function
// ==========================================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        stopAutoRefresh();
        sessionStorage.clear();
        window.location.href = '../auth/auth_login.html';
    }
}