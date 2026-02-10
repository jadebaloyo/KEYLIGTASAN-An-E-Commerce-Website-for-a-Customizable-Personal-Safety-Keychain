// ============================================
// PRODUCTS MANAGEMENT - USING EXISTING PHP FILES
// Add this to the bottom of your admin_dashboard.js
// ============================================

// Global variable to store products
let allProducts = [];

// Local placeholder image (SVG data URI - works offline)
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" font-family="Arial,sans-serif" font-size="20" x="50%25" y="45%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3Ctext fill="%23bbb" font-family="Arial,sans-serif" font-size="14" x="50%25" y="55%25" text-anchor="middle" dominant-baseline="middle"%3EAvailable%3C/text%3E%3C/svg%3E';

// Load products when the Products section is opened
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Products Management Initialized');
    
    // Add event listener for Products menu item
    const productsMenuItem = document.querySelector('[data-section="products"]');
    if (productsMenuItem) {
        productsMenuItem.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('📦 Products section clicked');
            loadProducts();
        });
    }
    
    // If products section is already active, load products
    const productsSection = document.getElementById('products');
    if (productsSection && productsSection.classList.contains('active')) {
        loadProducts();
    }
});

// Function to load products from PHP API
async function loadProducts() {
    console.log('📥 Loading products from API...');
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
        console.error('❌ Products grid element not found!');
        return;
    }
    
    // Show loading state
    productsGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <i class="fas fa-spinner fa-spin fa-3x" style="color: #4a90e2;"></i>
            <p style="margin-top: 20px; color: #666;">Loading products...</p>
        </div>
    `;
    
    try {
        // Use your existing get-products.php file
        const response = await fetch('../php/config/get-products.php', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response received, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Raw response:', data);
        
        // Handle different possible response formats
        let products = [];
        
        if (data.success && data.products) {
            products = data.products;
        } else if (data.products) {
            products = data.products;
        } else if (Array.isArray(data)) {
            products = data;
        } else if (data.success === false) {
            throw new Error(data.message || 'Failed to load products');
        }
        
        if (products && products.length > 0) {
            allProducts = products;
            console.log('✅ Products loaded:', allProducts.length, 'products');
            displayProducts(allProducts);
        } else {
            console.log('ℹ️ No products found');
            // No products found
            productsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                    <i class="fas fa-box-open fa-3x" style="color: #ccc;"></i>
                    <p style="margin-top: 20px; color: #666;">No products found</p>
                    <button class="btn-primary" onclick="openAddProductModal()" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add Your First Product
                    </button>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        productsGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
                <i class="fas fa-exclamation-triangle fa-3x" style="color: #ff6b6b;"></i>
                <p style="margin-top: 20px; color: #666;">Error loading products</p>
                <p style="color: #999; font-size: 14px; margin-top: 10px;">${error.message}</p>
                <button class="btn-primary" onclick="loadProducts()" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Function to display products in grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
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
    
    console.log('🎨 Displaying', products.length, 'products');
    
    let html = '';
    
    products.forEach(product => {
        // Handle different possible field names from your database
        const imageUrl = product.imageUrl || product.image_url || product.image || product.images?.[0] || PLACEHOLDER_IMAGE;
        const price = parseFloat(product.price || product.product_price || 0);
        const stock = parseInt(product.stock || product.quantity || product.product_stock || 0);
        const status = product.status || product.product_status || 'active';
        const productId = product.id || product.product_id || product.productId;
        const productName = product.name || product.product_name || product.productName || 'Unnamed Product';
        const productDesc = product.description || product.product_description || 'No description available';
        const productCategory = product.category || product.category_name || product.categoryName || '';
        
        // Determine stock status
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
                    <img src="${imageUrl}" alt="${productName}" 
                         onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <span class="product-status ${status}">${status}</span>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${productName}</h3>
                    <p class="product-description">${productDesc}</p>
                    
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
                    
                    ${productCategory ? `<div class="product-category"><i class="fas fa-tag"></i> ${productCategory}</div>` : ''}
                    
                    <div class="product-actions">
                        <button class="btn-icon" onclick="viewProduct('${productId}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editProduct('${productId}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" onclick="updateProductStock('${productId}')" title="Update Stock">
                            <i class="fas fa-warehouse"></i>
                        </button>
                        <button class="btn-icon btn-danger" onclick="deleteProduct('${productId}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    productsGrid.innerHTML = html;
    console.log('✅ Products displayed successfully');
}

// Function to view product details
function viewProduct(productId) {
    const product = allProducts.find(p => 
        (p.id || p.product_id || p.productId) == productId
    );
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const modal = document.getElementById('productModal');
    const productDetails = document.getElementById('productDetails');
    
    const imageUrl = product.imageUrl || product.image_url || product.image || PLACEHOLDER_IMAGE;
    const price = parseFloat(product.price || product.product_price || 0);
    const productName = product.name || product.product_name || product.productName || 'Unnamed Product';
    const productDesc = product.description || product.product_description || 'No description available';
    const stock = product.stock || product.quantity || product.product_stock || 0;
    const category = product.category || product.category_name || product.categoryName || '';
    const sku = product.sku || product.product_sku || '';
    const status = product.status || product.product_status || 'active';
    const createdAt = product.created_at || product.createdAt || product.date_created || '';
    
    productDetails.innerHTML = `
        <div class="product-details-view">
            <div class="product-image-large">
                <img src="${imageUrl}" alt="${productName}" 
                     onerror="this.src='${PLACEHOLDER_IMAGE}'">
            </div>
            <div class="product-info-large">
                <h3>${productName}</h3>
                <p class="product-desc">${productDesc}</p>
                
                <div class="info-row">
                    <span class="info-label">Price:</span>
                    <span class="info-value">₱${price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Stock:</span>
                    <span class="info-value">${stock} units</span>
                </div>
                
                ${category ? `
                <div class="info-row">
                    <span class="info-label">Category:</span>
                    <span class="info-value">${category}</span>
                </div>
                ` : ''}
                
                ${sku ? `
                <div class="info-row">
                    <span class="info-label">SKU:</span>
                    <span class="info-value">${sku}</span>
                </div>
                ` : ''}
                
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value status-${status}">${status}</span>
                </div>
                
                ${createdAt ? `
                <div class="info-row">
                    <span class="info-label">Created:</span>
                    <span class="info-value">${new Date(createdAt).toLocaleDateString()}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Function to edit product
function editProduct(productId) {
    const product = allProducts.find(p => 
        (p.id || p.product_id || p.productId) == productId
    );
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const productName = product.name || product.product_name || product.productName || 'Unnamed Product';
    alert('Edit functionality - Coming soon!\n\nProduct: ' + productName);
    
    // TODO: Implement edit modal
}

// Function to update product stock
async function updateProductStock(productId) {
    const product = allProducts.find(p => 
        (p.id || p.product_id || p.productId) == productId
    );
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const productName = product.name || product.product_name || product.productName || 'Unnamed Product';
    const currentStock = product.stock || product.quantity || product.product_stock || 0;
    
    const newStock = prompt(`Update stock for "${productName}"\n\nCurrent stock: ${currentStock}\n\nEnter new stock quantity:`, currentStock);
    
    if (newStock === null) return; // User cancelled
    
    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
        alert('Please enter a valid stock quantity');
        return;
    }
    
    try {
        // Check if you have an update stock API endpoint
        const response = await fetch('../php/config/update_product_stock.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                stock: stockValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Stock updated successfully!');
            loadProducts(); // Reload products
        } else {
            throw new Error(data.message || 'Failed to update stock');
        }
    } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock: ' + error.message + '\n\nNote: You may need to create update_product_stock.php');
    }
}

// Function to delete product
async function deleteProduct(productId) {
    const product = allProducts.find(p => 
        (p.id || p.product_id || p.productId) == productId
    );
    
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const productName = product.name || product.product_name || product.productName || 'Unnamed Product';
    const confirmed = confirm(`Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
        // Check if you have a delete product API endpoint
        const response = await fetch('../php/config/delete_product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Product deleted successfully!');
            loadProducts(); // Reload products
        } else {
            throw new Error(data.message || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message + '\n\nNote: You may need to create delete_product.php');
    }
}

// Function to open Add Product Modal
function openAddProductModal() {
    alert('Add Product Modal\n\nThis feature will be implemented to add new products to your store.');
    
    // TODO: Implement add product modal
}

// Make sure closeModal function exists
if (typeof closeModal === 'undefined') {
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    };
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

console.log('✅ Products Management Module Loaded');