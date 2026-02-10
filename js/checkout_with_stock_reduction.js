/**
 * USER CHECKOUT FUNCTION WITH AUTOMATIC STOCK REDUCTION
 * Place this in your checkout page JavaScript
 */

async function placeOrder() {
    try {
        // Get form data
        const recipientName = document.getElementById('recipientName').value.trim();
        const recipientPhone = document.getElementById('recipientPhone').value.trim();
        const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
        const paymentMethod = document.getElementById('paymentMethod').value;
        const specialInstructions = document.getElementById('specialInstructions')?.value.trim() || '';
        
        // Validate required fields
        if (!recipientName || !recipientPhone || !deliveryAddress) {
            alert('❌ Please fill in all required fields');
            return;
        }
        
        // Get cart items
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            alert('❌ Your cart is empty');
            return;
        }
        
        // Prepare order data
        const orderData = {
            user_id: sessionStorage.getItem('userId') || null,
            user_name: sessionStorage.getItem('userName') || 'Guest',
            user_email: sessionStorage.getItem('userEmail') || '',
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            delivery_address: deliveryAddress,
            payment_method: paymentMethod,
            special_instructions: specialInstructions,
            items: cart.map(item => ({
                product_id: item.id || item.product_id,
                quantity: item.quantity || 1
            }))
        };
        
        console.log('📦 Placing order...', orderData);
        
        // Show loading
        const submitBtn = document.getElementById('placeOrderBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Send order to server
        const response = await fetch('../php/config/place_order_with_stock_reduction.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // ✅ Order placed successfully!
            console.log('✅ Order placed successfully!', result);
            
            // Clear cart
            localStorage.removeItem('cart');
            
            // Show success message
            alert(`✅ Order Placed Successfully!\n\nOrder Number: ${result.order_number}\nTotal Amount: ₱${result.total_amount.toLocaleString()}\n\n✅ Stock has been automatically updated!`);
            
            // Redirect to success page or orders page
            window.location.href = 'order_success.html?order=' + result.order_number;
            
        } else {
            // ❌ Order failed
            console.error('❌ Order failed:', result);
            
            if (result.errors && result.errors.length > 0) {
                // Stock availability issues
                let errorMsg = '❌ Stock Availability Issues:\n\n';
                errorMsg += result.errors.join('\n');
                errorMsg += '\n\nPlease update your cart and try again.';
                alert(errorMsg);
            } else {
                alert('❌ Failed to place order: ' + result.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Error placing order:', error);
        alert('❌ An error occurred while placing your order. Please try again.');
        
    } finally {
        // Restore button
        const submitBtn = document.getElementById('placeOrderBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText || 'Place Order';
        }
    }
}

/**
 * VALIDATE CART STOCK BEFORE CHECKOUT
 * Call this before showing checkout form
 */
async function validateCartStock() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            return { valid: true, errors: [] };
        }
        
        console.log('🔍 Validating cart stock...');
        
        const errors = [];
        
        for (const item of cart) {
            const productId = item.id || item.product_id;
            const quantity = item.quantity || 1;
            
            // Fetch current stock
            const response = await fetch(`../php/config/get_product_stock.php?id=${productId}`);
            const data = await response.json();
            
            if (data.success && data.product) {
                const currentStock = data.product.stock;
                
                if (currentStock < quantity) {
                    errors.push({
                        product: item.name || 'Unknown Product',
                        requested: quantity,
                        available: currentStock
                    });
                }
            }
        }
        
        if (errors.length > 0) {
            let errorMsg = '❌ Stock Update Required:\n\n';
            errors.forEach(err => {
                errorMsg += `${err.product}: You requested ${err.requested} but only ${err.available} available\n`;
            });
            alert(errorMsg);
            return { valid: false, errors };
        }
        
        console.log('✅ All items in stock');
        return { valid: true, errors: [] };
        
    } catch (error) {
        console.error('❌ Error validating stock:', error);
        return { valid: false, errors: ['Failed to validate stock'] };
    }
}

/**
 * EXAMPLE USAGE IN CHECKOUT PAGE
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Validate stock when checkout page loads
    const stockCheck = await validateCartStock();
    
    if (!stockCheck.valid) {
        // Redirect back to cart
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 3000);
        return;
    }
    
    // Setup form submit
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }
});
