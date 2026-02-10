// ============================================
// PRODUCTS MANAGEMENT - PHP/MySQL Version
// CORRECTED: Using /config/ paths (NOT /con_/)
// ============================================

// NOTE: allProducts is already declared in admin_dashboard.js
// No need to redeclare it here to avoid "Identifier 'allProducts' has already been declared" error

// Function to load products from MySQL database via PHP
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
        console.error('Products grid element not found');
        return;
    }
    
    // Show loading state
    productsGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>Loading products...</p>
        </div>
    `;
    
    console.log('📦 Fetching products from database...');
    
    // CORRECTED: Changed from ../php/con_/ to ../php/config/
    fetch('../php/config/get-products.php', {
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(response => {
        console.log('📥 Response received, status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('✅ Products data received:', data);
        
        if (data.success) {
            allProducts = data.products || [];
            console.log('✅ Loaded', allProducts.length, 'products');
            displayProducts(allProducts);
        } else {
            console.error('❌ API Error:', data.message);
            showNoProducts(data.message);
        }
    })
    .catch(error => {
        console.error('❌ Fetch Error:', error);
        showProductsError(error.message);
    });
}

// Function to display products in grid
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
        // FIX: Use ../ to go up from admin folder to access assets/images/
        const imageUrl = product.imageUrl 
            ? `../${product.imageUrl}` 
            : 'https://via.placeholder.com/300x300?text=No+Image';
        
        const price = parseFloat(product.price || 0);
        const stock = parseInt(product.stock || 0);
        const status = product.status || 'active';
        
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

// Function to show no products message
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

// Function to show products error
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

// Function to view product details
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
    
    // FIX: Use ../ to go up from admin folder to access assets/images/
    const imageUrl = product.imageUrl 
        ? `../${product.imageUrl}` 
        : 'https://via.placeholder.com/400x400?text=No+Image';
    
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

// Function to edit product
function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // TODO: Implement edit modal
    alert('Edit functionality - Coming soon!\n\nProduct: ' + product.name);
}

// Function to update product stock
function updateProductStock(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const newStock = prompt(`Update stock for "${product.name}"\n\nCurrent stock: ${product.stock || 0}\n\nEnter new stock quantity:`, product.stock || 0);
    
    if (newStock === null) return; // User cancelled
    
    const stockValue = parseInt(newStock);
    if (isNaN(stockValue) || stockValue < 0) {
        alert('Please enter a valid stock quantity');
        return;
    }
    
    // CORRECTED: Changed from ../php/con_/ to ../php/config/
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
            loadProducts(); // Reload products
        } else {
            alert('❌ Failed to update stock: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error updating stock:', error);
        alert('❌ Error updating stock. Please try again.');
    });
}

// Function to delete product
function deleteProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;
    
    // CORRECTED: Changed from ../php/con_/ to ../php/config/
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
            loadProducts(); // Reload products
        } else {
            alert('❌ Failed to delete product: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        alert('❌ Error deleting product. Please try again.');
    });
}

// Initialize products when Products section is opened
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Products menu item
    const productsMenuItem = document.querySelector('[data-section="products"]');
    if (productsMenuItem) {
        productsMenuItem.addEventListener('click', function() {
            loadProducts();
        });
    }
    
    // Load products initially if on products page
    if (document.getElementById('productsGrid')) {
        loadProducts();
    }
});

console.log('✅ Products Management (PHP/MySQL) Script Loaded - Paths CORRECTED to /config/');