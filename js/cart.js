// =============================================
// CART.JS - Complete Cart & Checkout System (UPDATED)
// =============================================

// Global variables
let savedAddresses = [];

// =====================
// INITIALIZE ON PAGE LOAD
// =====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart page loaded');
    
    // Check if user is logged in
    checkAuth();
    
    // Load user info
    loadUserInfo();
    
    // Load cart items
    loadCartItems();
    
    // Update cart count
    updateCartCount();
    
    // Load saved addresses
    loadSavedAddresses();
});

// =====================
// CHECK AUTHENTICATION
// =====================
function checkAuth() {
    fetch('../php/config/auth_check.php', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {
        if (!data.authenticated) {
            window.location.href = '../index.html';
        }
    })
    .catch(err => {
        console.error('Auth check failed:', err);
        window.location.href = '../index.html';
    });
}

// =====================
// LOAD USER INFO
// =====================
function loadUserInfo() {
    fetch('../php/config/get_user.php', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.user) {
            document.getElementById('userName').textContent = data.user.full_name || 'User';
        }
    })
    .catch(err => console.error('Failed to load user info:', err));
}

// =====================
// LOAD CART ITEMS
// =====================
function loadCartItems() {
    console.log('Loading cart items...');
    
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const summarySection = document.getElementById('cartSummarySection');
    
    // Show loading state
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #e74c3c;"></i>
            <p style="margin-top: 20px; color: #6c757d; font-size: 1.1rem;">Loading your cart...</p>
        </div>
    `;
    
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => {
        console.log('Cart API response status:', res.status);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Cart data received:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Failed to load cart');
        }
        
        const items = data.items || [];
        console.log('Number of cart items:', items.length);
        
        // Clear container
        container.innerHTML = '';
        
        if (items.length === 0) {
            // Show empty cart
            emptyCart.style.display = 'flex';
            summarySection.style.display = 'none';
            updateCartCount(0);
            return;
        }
        
        // Hide empty cart, show summary
        emptyCart.style.display = 'none';
        summarySection.style.display = 'block';
        
        // Color to image mapping
        const colorImageMap = {
            'Chocolate Brown': 'chocolatebrown',
            'Emerald Green': 'emeraldgreen',
            'Golden Orange': 'goldenorange',
            'Midnight Black': 'midnightblack',
            'Ocean Blue': 'oceanblue',
            'Rose Pink': 'rosepink',
            'Royal Purple': 'royalpurple',
            'Ruby Red': 'rubyred'
        };
        
        let subtotal = 0;
        let totalQuantity = 0;
        
        // Render each cart item
        items.forEach(item => {
            const unitPrice = parseFloat(item.unit_price) || 0;
            const customFee = parseFloat(item.customization_fee) || 0;
            const quantity = parseInt(item.quantity) || 1;
            const itemTotal = parseFloat(item.subtotal) || ((unitPrice + customFee) * quantity);
            
            subtotal += itemTotal;
            totalQuantity += quantity;
            
            const imgName = colorImageMap[item.color] || 'chocolatebrown';
            const imgPath = `../assets/images/${imgName}.png`;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imgPath}" 
                         alt="${item.color || 'Keychain'}"
                         onerror="this.src='../assets/images/chocolatebrown.png'">
                </div>
                
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${item.product_name || 'KEYLIGTASAN Safety Keychain'}</h3>
                    <div class="cart-item-specs">
                        <span class="spec-item">
                            <i class="fas fa-palette"></i>
                            ${item.color || 'No color selected'}
                        </span>
                        ${item.engraved_name ? `
                            <span class="spec-item">
                                <i class="fas fa-pencil-alt"></i>
                                Engraved: "${item.engraved_name}"
                            </span>
                        ` : ''}
                    </div>
                    ${customFee > 0 ? `
                        <div class="customization-fee">
                            <i class="fas fa-plus-circle"></i>
                            Engraving Fee: ₱${formatPrice(customFee)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="cart-item-quantity">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${quantity - 1})" ${quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" value="${quantity}" min="1" max="99" 
                           onchange="updateQuantity(${item.id}, this.value)" 
                           class="qty-input">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${quantity + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="cart-item-price">
                    <div class="price-label">Price</div>
                    <div class="price-value">₱${formatPrice(itemTotal)}</div>
                    ${quantity > 1 ? `
                        <div class="price-unit">₱${formatPrice((unitPrice + customFee))} each</div>
                    ` : ''}
                </div>
                
                <button class="cart-item-remove" onclick="removeItem(${item.id})" title="Remove item">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            container.appendChild(itemDiv);
        });
        
        // Calculate shipping
        const shipping = subtotal >= 5000 ? 0 : 150;
        const total = subtotal + shipping;
        
        // Update summary
        document.getElementById('subtotalAmount').textContent = '₱' + formatPrice(subtotal);
        document.getElementById('shippingAmount').textContent = shipping === 0 ? 'FREE' : '₱' + formatPrice(shipping);
        document.getElementById('totalAmount').textContent = '₱' + formatPrice(total);
        
        // Update cart count badge
        updateCartCount(totalQuantity);
        
        console.log('Cart loaded successfully:', { items: items.length, subtotal, shipping, total });
    })
    .catch(err => {
        console.error('Failed to load cart:', err);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                <h3 style="margin-top: 20px; color: #2c3e50;">Failed to Load Cart</h3>
                <p style="color: #6c757d; margin-top: 10px;">${err.message}</p>
                <button onclick="loadCartItems()" class="btn-shop" style="margin-top: 20px;">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
        emptyCart.style.display = 'none';
        summarySection.style.display = 'none';
        showToast('Failed to load cart: ' + err.message, 'error');
    });
}

// =====================
// UPDATE QUANTITY
// =====================
function updateQuantity(itemId, newQuantity) {
    const qty = parseInt(newQuantity);
    
    if (isNaN(qty) || qty < 1) {
        showToast('Invalid quantity', 'error');
        loadCartItems(); // Reload to reset
        return;
    }
    
    if (qty > 99) {
        showToast('Maximum quantity is 99', 'error');
        loadCartItems();
        return;
    }
    
    console.log('Updating quantity:', itemId, qty);
    
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            action: 'update',
            item_id: itemId,
            quantity: qty
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Quantity updated', 'success');
            loadCartItems();
        } else {
            throw new Error(data.message || 'Failed to update quantity');
        }
    })
    .catch(err => {
        console.error('Update failed:', err);
        showToast('Failed to update: ' + err.message, 'error');
        loadCartItems();
    });
}

// =====================
// REMOVE ITEM
// =====================
function removeItem(itemId) {
    if (!confirm('Remove this item from your cart?')) return;
    
    console.log('Removing item:', itemId);
    
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
            action: 'remove',
            item_id: itemId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Item removed from cart', 'success');
            loadCartItems();
        } else {
            throw new Error(data.message || 'Failed to remove item');
        }
    })
    .catch(err => {
        console.error('Remove failed:', err);
        showToast('Failed to remove item: ' + err.message, 'error');
    });
}

// =====================
// CLEAR CART
// =====================
function clearCart() {
    if (!confirm('Clear all items from your cart?')) return;
    
    console.log('Clearing cart...');
    
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'clear' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('Cart cleared', 'success');
            loadCartItems();
        } else {
            throw new Error(data.message || 'Failed to clear cart');
        }
    })
    .catch(err => {
        console.error('Clear failed:', err);
        showToast('Failed to clear cart: ' + err.message, 'error');
    });
}

// =====================
// LOAD SAVED ADDRESSES
// =====================
function loadSavedAddresses() {
    fetch('../php/config/shipping_addresses_api.php', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.addresses) {
            savedAddresses = data.addresses;
            console.log('Loaded saved addresses:', savedAddresses.length);
        }
    })
    .catch(err => console.error('Failed to load addresses:', err));
}

// =====================
// PROCEED TO CHECKOUT - UPDATED TO REDIRECT TO CHECKOUT.HTML
// =====================
function proceedToCheckout() {
    console.log('Proceed to checkout clicked');
    
    // Fetch cart from database to check if it has items
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(data => {
        const items = data.items || [];
        
        // Check if cart is empty
        if (items.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }
        
        console.log('Redirecting to checkout with', items.length, 'items');
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    })
    .catch(err => {
        console.error('Failed to check cart:', err);
        // If there's an error checking, still try to redirect
        showToast('Proceeding to checkout...', 'info');
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 500);
    });
}

// =====================
// FILL SAVED ADDRESS
// =====================
function fillSavedAddress() {
    const selectedId = parseInt(document.getElementById('savedAddressSelect').value);
    
    if (!selectedId) {
        // Clear form
        document.getElementById('deliveryName').value = '';
        document.getElementById('deliveryPhone').value = '';
        document.getElementById('deliveryAddress').value = '';
        document.getElementById('deliveryCity').value = '';
        document.getElementById('deliveryProvince').value = '';
        document.getElementById('deliveryPostalCode').value = '';
        return;
    }
    
    const address = savedAddresses.find(addr => addr.id === selectedId);
    
    if (address) {
        document.getElementById('deliveryName').value = address.recipient_name || '';
        document.getElementById('deliveryPhone').value = address.phone_number || '';
        document.getElementById('deliveryAddress').value = address.address || '';
        document.getElementById('deliveryCity').value = address.city || '';
        document.getElementById('deliveryProvince').value = address.province || '';
        document.getElementById('deliveryPostalCode').value = address.postal_code || '';
    }
}

// =====================
// LOAD USER DELIVERY INFO
// =====================
function loadUserDeliveryInfo() {
    fetch('../php/config/get_user.php', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.user) {
            // Only fill if no saved address is selected
            const savedAddressSelect = document.getElementById('savedAddressSelect');
            if (!savedAddressSelect || !savedAddressSelect.value) {
                document.getElementById('deliveryName').value = data.user.full_name || '';
                document.getElementById('deliveryPhone').value = data.user.phone || '';
            }
        }
    })
    .catch(err => console.error('Failed to load user delivery info:', err));
}

// =====================
// CLOSE CHECKOUT MODAL
// =====================
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'none';
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// =====================
// PLACE ORDER - FIXED VERSION
// =====================
function placeOrder() {
    console.log('Placing order...');
    
    // Get form values
    const savedAddressId = document.getElementById('savedAddressSelect')?.value;
    const useExistingAddress = savedAddressId ? true : false;
    
    const deliveryName = document.getElementById('deliveryName').value.trim();
    const deliveryPhone = document.getElementById('deliveryPhone').value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const deliveryCity = document.getElementById('deliveryCity')?.value.trim() || '';
    const deliveryProvince = document.getElementById('deliveryProvince')?.value.trim() || '';
    const deliveryPostalCode = document.getElementById('deliveryPostalCode')?.value.trim() || '';
    const paymentMethod = document.getElementById('paymentMethod').value;
    const orderNotes = document.getElementById('orderNotes').value.trim();
    
    // Validate
    if (!deliveryName) {
        showToast('Please enter recipient name', 'error');
        document.getElementById('deliveryName').focus();
        return;
    }
    
    if (!deliveryPhone) {
        showToast('Please enter contact number', 'error');
        document.getElementById('deliveryPhone').focus();
        return;
    }
    
    if (!deliveryAddress) {
        showToast('Please enter delivery address', 'error');
        document.getElementById('deliveryAddress').focus();
        return;
    }
    
    if (!paymentMethod) {
        showToast('Please select a payment method', 'error');
        document.getElementById('paymentMethod').focus();
        return;
    }
    
    // Disable place order button
    const placeOrderBtn = document.querySelector('.btn-place-order');
    const originalBtnContent = placeOrderBtn.innerHTML;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // ✅ FIRST, FETCH THE CART ITEMS FROM THE DATABASE
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(cartData => {
        if (!cartData.success || !cartData.items || cartData.items.length === 0) {
            throw new Error('Your cart is empty');
        }
        
        // ✅ MAP CART ITEMS TO THE CORRECT FORMAT
        const cartItems = cartData.items.map(item => ({
        id: item.product_id,  // ✅ USE product_id from database
        name: item.product_name || 'KEYLIGTASAN Safety Keychain',
        variant: item.color || '',
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.unit_price) + parseFloat(item.customization_fee || 0)
        }));
        
        // ✅ CALCULATE TOTALS
        let subtotal = 0;
        cartItems.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        const shipping = subtotal >= 5000 ? 0 : 150;
        const total = subtotal + shipping;
        
        console.log('Submitting order with cart items:', cartItems);
        
        // ✅ NOW SUBMIT THE ORDER WITH CART ITEMS
        return fetch('../php/config/processcheckout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                shipping_address: {
                    recipient_name: deliveryName,
                    phone_number: deliveryPhone,
                    address: deliveryAddress,
                    city: deliveryCity,
                    province: deliveryProvince,
                    postal_code: deliveryPostalCode,
                    is_default: 0
                },
                cart_items: cartItems,  // ✅ INCLUDE CART ITEMS
                subtotal: subtotal,
                shipping: shipping,
                total: total,
                payment_method: paymentMethod,
                order_notes: orderNotes
            })
        });
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Close checkout modal if it exists
            const checkoutModal = document.getElementById('checkoutModal');
            if (checkoutModal) {
                checkoutModal.style.display = 'none';
                checkoutModal.classList.remove('active');
            }
            
            // Show success
            showToast('Order placed successfully!', 'success');
            
            // Show success modal if it exists
            const successModal = document.getElementById('successModal');
            if (successModal) {
                document.getElementById('orderIdDisplay').textContent = data.order_id || '#0001';
                document.getElementById('orderTotalDisplay').textContent = '₱' + formatPrice(total || 0);
                successModal.style.display = 'flex';
                successModal.classList.add('active');
            }
            
            // Clear cart and redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 2000);
        } else {
            throw new Error(data.message || 'Failed to place order');
        }
    })
    .catch(err => {
        console.error('Order failed:', err);
        showToast('Failed to place order: ' + err.message, 'error');
    })
    .finally(() => {
        // Re-enable button
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalBtnContent;
    });
}

// =====================
// VIEW ORDERS
// =====================
function viewOrders() {
    window.location.href = 'orders.html';
}

// =====================
// CONTINUE SHOPPING
// =====================
function continueShopping() {
    window.location.href = 'shop.html';
}

// =====================
// UPDATE CART COUNT
// =====================
function updateCartCount(count) {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    
    // If count is provided, use it
    if (typeof count !== 'undefined') {
        badge.textContent = count || '0';
        badge.setAttribute('data-count', count);
        return;
    }
    
    // Otherwise fetch current count
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.items) {
            let totalQty = 0;
            data.items.forEach(item => totalQty += parseInt(item.quantity) || 0);
            badge.textContent = totalQty || '0';
            badge.setAttribute('data-count', totalQty);
        }
    })
    .catch(err => console.error('Failed to update cart count:', err));
}

// =====================
// LOGOUT
// =====================
function logout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    fetch('../php/config/logout.php', {
        method: 'POST',
        credentials: 'same-origin'
    })
    .then(() => {
        window.location.href = '../index.html';
    })
    .catch(err => {
        console.error('Logout failed:', err);
        window.location.href = '../index.html';
    });
}

// =====================
// TOAST NOTIFICATION
// =====================
function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================
// FORMAT PRICE HELPER
// =====================
function formatPrice(num) {
    return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// =====================
// ESC KEY TO CLOSE MODALS
// =====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCheckoutModal();
    }
});