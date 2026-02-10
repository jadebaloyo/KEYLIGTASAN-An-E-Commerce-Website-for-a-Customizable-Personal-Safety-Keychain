/**
 * KEYLIGTASAN - Shop JavaScript (FIXED COLOR BUG)
 * Prevents ordering when stock is 0 and fixes color selection issue
 */

// =====================
// STATE
// =====================
let basePrice = 299;
let engravingPrice = 50;
let hasEngraving = false;
let currentQuantity = 1;
let selectedImage = 'chocolatebrown';
let selectedColorName = 'Chocolate Brown';
let availableStock = 50;
let productsData = {};

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadAllProducts();
    updatePrice();
    updateCartCount();
});

// =====================
// LOAD ALL PRODUCTS AND MAP BY COLOR
// =====================
function loadAllProducts() {
    fetch('../php/config/get-products.php')
        .then(res => res.json())
        .then(data => {
            if (data.success && data.products && data.products.length > 0) {
                data.products.forEach(product => {
                    const colorName = extractColorFromName(product.name);
                    if (colorName) {
                        productsData[colorName] = {
                            id: product.id,
                            name: product.name,
                            stock: product.stock || 0,
                            price: product.price || basePrice
                        };
                    } else {
                        console.warn('Could not extract color from product:', product.name);
                    }
                });
                
                console.log('✅ Products loaded successfully:');
                console.table(productsData);
                updateStockForColor(selectedColorName);
            } else {
                console.error('❌ No products received from API');
            }
        })
        .catch(err => {
            console.error('❌ Failed to load products:', err);
            availableStock = 999;
            updateStockDisplay(999);
        });
} 

// =====================
// EXTRACT COLOR NAME FROM PRODUCT NAME
// =====================
function extractColorFromName(productName) {
    // First try to match "- Color Name" pattern
    const colorMatch = productName.match(/- (.+)$/);
    if (colorMatch) {
        return colorMatch[1].trim();
    }
    
    // Define known colors in exact order as in HTML
    const knownColors = [
        'Chocolate Brown',
        'Emerald Green', 
        'Golden Orange',
        'Midnight Black',
        'Ocean Blue',
        'Rose Pink',
        'Royal Purple',
        'Ruby Red'
    ];
    
    // Try exact match first
    for (const color of knownColors) {
        if (productName.includes(color)) {
            return color;
        }
    }
    
    // Try case-insensitive match
    const lowerName = productName.toLowerCase();
    for (const color of knownColors) {
        if (lowerName.includes(color.toLowerCase())) {
            return color;
        }
    }
    
    return null;
}

// =====================
// UPDATE STOCK FOR SELECTED COLOR
// =====================
function updateStockForColor(colorName) {
    console.log('🔍 Checking stock for color:', colorName);
    
    if (productsData[colorName]) {
        availableStock = productsData[colorName].stock;
        console.log('✅ Stock found:', availableStock);
    } else {
        console.warn('⚠️ Color not found in products data:', colorName);
        console.log('Available colors:', Object.keys(productsData));
        availableStock = 50;
    }
    
    updateStockDisplay(availableStock);
    updateMaxQuantity();
    handleOutOfStock();
}

// =====================
// HANDLE OUT OF STOCK STATE
// =====================
function handleOutOfStock() {
    const addButton = document.querySelector('.btn-add-to-cart');
    const quantityControls = document.querySelector('.quantity-selector');
    
    if (availableStock === 0) {
        // Disable add to cart button
        if (addButton) {
            addButton.disabled = true;
            addButton.classList.add('disabled-button');
            addButton.innerHTML = '<i class="fas fa-ban"></i> Out of Stock';
            addButton.style.cursor = 'not-allowed';
            addButton.style.opacity = '0.5';
        }
        
        // Disable quantity controls
        if (quantityControls) {
            const buttons = quantityControls.querySelectorAll('button');
            const input = quantityControls.querySelector('input');
            buttons.forEach(btn => btn.disabled = true);
            if (input) input.disabled = true;
        }
        
        // Disable engraving
        const engravingToggle = document.getElementById('engravingToggle');
        if (engravingToggle) {
            engravingToggle.disabled = true;
        }
        
    } else {
        // Re-enable everything if stock is available
        if (addButton) {
            addButton.disabled = false;
            addButton.classList.remove('disabled-button');
            addButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
            addButton.style.cursor = 'pointer';
            addButton.style.opacity = '1';
        }
        
        // Re-enable quantity controls
        if (quantityControls) {
            const buttons = quantityControls.querySelectorAll('button');
            const input = quantityControls.querySelector('input');
            buttons.forEach(btn => btn.disabled = false);
            if (input) input.disabled = false;
        }
        
        // Re-enable engraving
        const engravingToggle = document.getElementById('engravingToggle');
        if (engravingToggle) {
            engravingToggle.disabled = false;
        }
    }
}

// =====================
// UPDATE STOCK DISPLAY
// =====================
function updateStockDisplay(stock) {
    let stockContainer = document.getElementById('stockIndicator');
    
    if (!stockContainer) {
        const priceSection = document.querySelector('.total-price');
        if (priceSection) {
            stockContainer = document.createElement('div');
            stockContainer.id = 'stockIndicator';
            stockContainer.style.marginTop = '15px';
            priceSection.parentNode.insertBefore(stockContainer, priceSection);
        }
    }
    
    if (!stockContainer) return;
    
    let html = '';
    
    if (stock === 0) {
        html = `
            <div class="stock-indicator out-of-stock">
                <i class="fas fa-times-circle"></i>
                <span><strong>OUT OF STOCK</strong> - This color is currently unavailable</span>
            </div>
        `;
    } else if (stock <= 10) {
        html = `
            <div class="stock-indicator low-stock">
                <i class="fas fa-exclamation-triangle"></i>
                <span>⚠️ Only <strong>${stock}</strong> left in stock - Order soon!</span>
            </div>
        `;
    } else {
        html = `
            <div class="stock-indicator in-stock">
                <i class="fas fa-check-circle"></i>
                <span>✓ <strong>${stock}</strong> units available - In Stock</span>
            </div>
        `;
    }
    
    stockContainer.innerHTML = html;
}

// =====================
// UPDATE MAX QUANTITY BASED ON STOCK
// =====================
function updateMaxQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        if (availableStock === 0) {
            quantityInput.max = 0;
            quantityInput.value = 0;
            currentQuantity = 0;
        } else {
            quantityInput.max = Math.min(availableStock, 10);
            
            if (currentQuantity > availableStock) {
                currentQuantity = availableStock;
                quantityInput.value = currentQuantity;
            } else if (currentQuantity === 0 && availableStock > 0) {
                currentQuantity = 1;
                quantityInput.value = 1;
            }
        }
        updatePrice();
    }
}

// =====================
// AUTH
// =====================
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Please login first');
        window.location.href = '../auth/auth_login.html';
        return false;
    }
    return true;
}

function loadUserData() {
    const userName = sessionStorage.getItem('userName');
    if (userName && document.getElementById('userName')) {
        document.getElementById('userName').textContent = userName;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../html/login.html';
    }
}

// =====================
// PRODUCT OPTIONS
// =====================
function selectColor(element) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');

    selectedImage = element.dataset.image;
    selectedColorName = element.dataset.name;

    console.log('🎨 Color selected:', selectedColorName);

    document.getElementById('selectedColorName').textContent = selectedColorName;

    const img = document.getElementById('keychainImage');
    img.style.opacity = '0.3';
    setTimeout(() => {
        img.src = `../assets/images/${selectedImage}.png`;
        img.style.opacity = '1';
    }, 200);
    
    updateStockForColor(selectedColorName);
}

function toggleEngraving() {
    const toggle = document.getElementById('engravingToggle');
    const input = document.getElementById('engravingInput');

    hasEngraving = toggle.checked;
    input.style.display = hasEngraving ? 'block' : 'none';

    if (!hasEngraving) {
        document.getElementById('engravingText').value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('engravingPreview').classList.remove('show');
    }

    updatePrice();
}

function updateEngraving() {
    const text = document.getElementById('engravingText').value;
    document.getElementById('charCount').textContent = text.length;

    const preview = document.getElementById('engravingPreview');
    if (text.trim()) {
        preview.textContent = text;
        preview.classList.add('show');
    } else {
        preview.classList.remove('show');
    }
}

// =====================
// QUANTITY & PRICE
// =====================
function increaseQuantity() {
    if (availableStock === 0) {
        showNotification(`${selectedColorName} is out of stock`, 'error');
        return;
    }
    
    const maxQty = Math.min(availableStock, 10);
    
    if (currentQuantity < maxQty) {
        currentQuantity++;
        document.getElementById('quantity').value = currentQuantity;
        updatePrice();
    } else {
        showNotification(`Maximum ${maxQty} units available for ${selectedColorName}`, 'error');
    }
}

function decreaseQuantity() {
    if (currentQuantity > 1) {
        currentQuantity--;
        document.getElementById('quantity').value = currentQuantity;
        updatePrice();
    } else if (availableStock === 0) {
        showNotification(`${selectedColorName} is out of stock`, 'error');
    }
}

function updatePrice() {
    let price = basePrice;
    if (hasEngraving) price += engravingPrice;

    const total = price * currentQuantity;
    document.getElementById('totalPrice').textContent = '₱' + total.toLocaleString();
}

// =====================
// UPDATE CART COUNT
// =====================
function updateCartCount(count) {
    const badge = document.getElementById('cartCount');
    if (!badge) return;
    
    if (typeof count !== 'undefined') {
        const oldCount = parseInt(badge.textContent) || 0;
        badge.textContent = count || '0';
        
        if (count > oldCount && count > 0) {
            badge.classList.add('has-items');
            setTimeout(() => badge.classList.remove('has-items'), 500);
        }
        
        badge.setAttribute('data-count', count);
        
        if (count > oldCount && 'vibrate' in navigator) {
            navigator.vibrate(50);
        }
        return;
    }
    
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
            data.items.forEach(item => totalQty += item.quantity);
            badge.textContent = totalQty || '0';
            badge.setAttribute('data-count', totalQty);
        }
    })
    .catch(err => console.error('Failed to update cart count:', err));
}

// =====================
// ADD TO CART - FIXED VERSION
// =====================
function addToCart() {
    console.log('🛒 ADD TO CART CLICKED');
    console.log('🔍 Selected Color:', selectedColorName);
    console.log('🔍 Available Products:', Object.keys(productsData));
    console.log('🔍 Full Products Data:', productsData);
    
    // CRITICAL: Multiple layers of stock validation
    
    // Layer 1: Check if stock is exactly 0
    if (availableStock === 0) {
        showNotification(`❌ Sorry, ${selectedColorName} is currently out of stock. Please select a different color.`, 'error');
        return false;
    }
    
    // Layer 2: Check if quantity is valid
    if (currentQuantity <= 0) {
        showNotification('Please select a valid quantity', 'error');
        return false;
    }
    
    // Layer 3: Check if quantity exceeds available stock
    if (currentQuantity > availableStock) {
        showNotification(`Only ${availableStock} units available for ${selectedColorName}`, 'error');
        return false;
    }
    
    // Layer 4: Check engraving text if enabled
    const engravingText = hasEngraving
        ? document.getElementById('engravingText').value.trim()
        : null;

    if (hasEngraving && !engravingText) {
        showNotification('Please enter engraving text', 'error');
        document.getElementById('engravingText').focus();
        return false;
    }

    // ✅ FIX: Get product ID with proper validation
    const productId = productsData[selectedColorName] ? productsData[selectedColorName].id : null;
    
    console.log('🆔 Product ID for', selectedColorName, ':', productId);
    
    // ✅ CRITICAL: Don't allow adding to cart if product ID is missing
    if (!productId) {
        console.error('❌ Product not found for color:', selectedColorName);
        console.error('❌ Available products:', productsData);
        showNotification('Error: Product not found. Please refresh the page and try again.', 'error');
        return false;
    }

    const addButton = document.querySelector('.btn-add-to-cart');
    const originalText = addButton.innerHTML;
    addButton.disabled = true;
    addButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    // ✅ CRITICAL FIX: Send the correct data
    const cartData = {
        action: 'add',
        product_id: productId,
        product_name: `KEYLIGTASAN Safety Keychain - ${selectedColorName}`,
        color: selectedColorName, // ✅ THIS IS THE KEY - make sure color is sent
        engraved_name: engravingText,
        quantity: currentQuantity,
        unit_price: basePrice,
        customization_fee: hasEngraving ? engravingPrice : 0
    };

    console.log('📦 Sending to cart API:', cartData);

    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(cartData)
    })
    .then(res => res.json())
    .then(data => {
        console.log('✅ Cart API Response:', data);
        
        if (!data.success) throw new Error(data.message || 'Failed to add item to cart');
        
        showSuccessNotification();
        updateCartCount();
        loadAllProducts(); // Refresh stock
    })
    .catch(err => {
        console.error('❌ Error:', err);
        showNotification('Failed to add item to cart: ' + err.message, 'error');
    })
    .finally(() => {
        addButton.disabled = false;
        addButton.innerHTML = originalText;
    });
}

// =====================
// NOTIFICATION SYSTEM
// =====================
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showSuccessNotification() {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'custom-notification success enhanced';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <div class="notification-text">
                <strong>Added to Cart!</strong>
                <p>${selectedColorName} KEYLIGTASAN ${hasEngraving ? '(Engraved)' : ''}</p>
            </div>
        </div>
        <div class="notification-actions">
            <button onclick="closeNotification()" class="btn-continue-shopping">
                <i class="fas fa-shopping-bag"></i> Continue Shopping
            </button>
            <button onclick="viewCartFromNotification()" class="btn-view-cart">
                <i class="fas fa-shopping-cart"></i> View Cart
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 8000);
}

function closeNotification() {
    const notification = document.querySelector('.custom-notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }
}

function viewCartFromNotification() {
    closeNotification();
    viewCart();
}

function formatPrice(n) {
    return Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// =====================
// CART POPUP
// =====================
function viewCart() {
    const popup = document.getElementById('cartPopup');
    popup.style.display = 'flex';
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadCartPopup();
}

function closeCart() {
    const popup = document.getElementById('cartPopup');
    popup.style.display = 'none';
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

function loadCartPopup() {
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(data => {
        console.log('🛒 Cart data loaded:', data);
        
        const cartBody = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        const items = data.items || [];

        cartBody.innerHTML = '';

        if (items.length === 0) {
            cartBody.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <button class="btn-continue" onclick="closeCart()">Continue Shopping</button>
                </div>
            `;
            cartFooter.style.display = 'none';
            document.getElementById('cartCount').textContent = '0';
            return;
        }

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
        let totalQty = 0;

        items.forEach(item => {
            console.log('📦 Cart item:', item);
            
            const price = parseFloat(item.unit_price) + parseFloat(item.customization_fee);
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            totalQty += item.quantity;

            const imgName = colorImageMap[item.color] || 'chocolatebrown';

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="../assets/images/${imgName}.png" alt="${item.color || 'Keychain'}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.product_name}</div>
                    <div class="cart-item-detail">${item.color || ''}${item.engraved_name ? ' · Engraved: "' + item.engraved_name + '"' : ''}</div>
                    <div class="cart-item-detail">Qty: ${item.quantity}</div>
                </div>
                <div class="cart-item-price">₱${formatPrice(itemTotal)}</div>
                <button class="cart-item-remove" onclick="removeCartItem(${item.id})" title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartBody.appendChild(div);
        });

        const shipping = subtotal >= 5000 ? 0 : 150;
        cartFooter.style.display = 'block';
        document.getElementById('cartSubtotal').textContent = '₱' + formatPrice(subtotal);
        document.getElementById('cartShipping').textContent = shipping === 0 ? 'FREE' : '₱' + formatPrice(shipping);
        document.getElementById('cartTotal').textContent = '₱' + formatPrice(subtotal + shipping);
        document.getElementById('cartCount').textContent = totalQty;
    })
    .catch(err => {
        console.error('Failed to load cart:', err);
        showNotification('Failed to load cart', 'error');
    });
}

function removeCartItem(itemId) {
    if (!confirm('Remove this item from cart?')) return;

    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'remove', item_id: itemId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification('Item removed from cart', 'success');
            loadCartPopup();
            updateCartCount();
            loadAllProducts();
        } else {
            showNotification('Failed to remove item', 'error');
        }
    })
    .catch(err => {
        console.error('Remove failed:', err);
        showNotification('Failed to remove item', 'error');
    });
}

function proceedToCheckout() {
    console.log('Proceed to checkout clicked');
    
    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(data => {
        const items = data.items || [];
        
        if (items.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        closeCart();
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 300);
    })
    .catch(err => {
        console.error('Failed to check cart:', err);
        closeCart();
        window.location.href = 'checkout.html';
    });
}

// =====================
// CHECKOUT & ORDERS
// =====================
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function closeCheckout() {
    const popup = document.getElementById('checkoutPopup');
    if (!popup.classList.contains('active')) return;
    
    popup.style.display = 'none';
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

function placeOrder() {
    const name = document.getElementById('deliveryName').value.trim();
    const phone = document.getElementById('deliveryPhone').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name) { showNotification('Please enter your full name.', 'error'); return; }
    if (!phone) { showNotification('Please enter your contact number.', 'error'); return; }
    if (!address) { showNotification('Please enter your delivery address.', 'error'); return; }
    if (!payment) { showNotification('Please select a payment method.', 'error'); return; }

    const btn = document.querySelector('.btn-place-order');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    fetch('../php/config/cart_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'get' })
    })
    .then(res => res.json())
    .then(cartData => {
        if (!cartData.success || !cartData.items || cartData.items.length === 0) {
            throw new Error('Your cart is empty.');
        }

        let subtotal = 0;
        cartData.items.forEach(item => {
            subtotal += (parseFloat(item.unit_price) + parseFloat(item.customization_fee)) * item.quantity;
        });
        const shippingFee = subtotal >= 5000 ? 0 : 150;

        const payload = {
            recipient_name: name,
            phone_number: phone,
            address: address,
            city: '',
            province: '',
            postal_code: '',
            payment_method: payment,
            order_notes: notes
        };

        return fetch('../php/config/checkout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) throw new Error(data.message || 'Order failed.');

        fetch('../php/config/cart_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ action: 'clear' })
        });

        closeCheckout();
        showOrderSuccess(data.order_number || data.order_id, data.total_amount || data.total);
        updateCartCount(0);
        loadAllProducts();
    })
    .catch(err => {
        console.error('Place order error:', err);
        showNotification(err.message, 'error');
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order';
    });
}

function showOrderSuccess(orderId, total) {
    document.getElementById('orderIdDisplay').textContent = '#' + orderId;
    document.getElementById('orderTotalDisplay').textContent = '₱' + formatPrice(total);

    const popup = document.getElementById('orderSuccessPopup');
    popup.style.display = 'flex';
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('cartCount').textContent = '0';
}

function closeOrderSuccess() {
    const popup = document.getElementById('orderSuccessPopup');
    popup.style.display = 'none';
    popup.classList.remove('active');
    document.body.style.overflow = '';
}

function viewOrders() {
    window.location.href = 'orders.html';
}

// =====================
// KEYBOARD SHORTCUTS
// =====================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeCart();
        closeCheckout();
        closeOrderSuccess();
        closeNotification();
    }
});