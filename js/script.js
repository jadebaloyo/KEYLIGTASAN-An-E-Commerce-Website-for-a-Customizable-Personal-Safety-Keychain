/**
 * KEYLIGTASAN - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scroll navigation
    setupSmoothScroll();
    
    // Mobile menu toggle
    setupMobileMenu();
    
    // User session check
    checkUserSession();
    
    // Load products
    loadProducts();
    
    // Back to top button
    setupBackToTop();
    
    // Contact form
    setupContactForm();
    
    // Support modal
    setupSupportModal();
    
});

// Smooth Scroll Navigation
function setupSmoothScroll() {
    const smoothScrollLinks = document.querySelectorAll('.smooth-scroll');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Close mobile menu if open
                    const mobileSidebar = document.getElementById('mobileSidebar');
                    const overlay = document.getElementById('overlay');
                    if (mobileSidebar) mobileSidebar.classList.remove('show');
                    if (overlay) overlay.classList.remove('show');
                }
            }
        });
    });
}

// Mobile Menu Toggle
function setupMobileMenu() {
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileSidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('overlay');
    const closeSidebar = document.getElementById('closeSidebar');
    
    if (burgerBtn && mobileSidebar && overlay) {
        burgerBtn.addEventListener('click', function() {
            mobileSidebar.classList.toggle('show');
            overlay.classList.toggle('show');
        });
        
        overlay.addEventListener('click', function() {
            mobileSidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', function() {
                mobileSidebar.classList.remove('show');
                overlay.classList.remove('show');
            });
        }
    }
}

// Check User Session
function checkUserSession() {
    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userEmail = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userName');
    
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    
    if (isLoggedIn === 'true' && userEmail) {
        // User is logged in - show user menu
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            
            // Update user info
            const userNameSpan = document.getElementById('userName');
            const userFullName = document.getElementById('userFullName');
            const userEmailSpan = document.getElementById('userEmail');
            
            if (userNameSpan) userNameSpan.textContent = userName || 'User';
            if (userFullName) userFullName.textContent = userName || 'User';
            if (userEmailSpan) userEmailSpan.textContent = userEmail;
        }
        
        // Setup user dropdown
        setupUserDropdown();
        
        // Setup logout
        setupLogout();
    } else {
        // User not logged in - show auth buttons
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// Setup User Dropdown
function setupUserDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            if (userDropdown) userDropdown.classList.remove('show');
        });
    }
}

// Setup Logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    [logoutBtn, mobileLogoutBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Clear session
                sessionStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('userEmail');
                sessionStorage.removeItem('userName');
                
                // Redirect to homepage
                window.location.href = '../html/homepage_index.html';
            });
        }
    });
}

// Load Products from API
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;
    
    // Show loading state
    productsGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading products...</p>
        </div>
    `;
    
    // Fetch products from API
    fetch('../php/api/get-products.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.products) {
                displayProducts(data.products);
            } else {
                productsGrid.innerHTML = '<p>No products available at the moment.</p>';
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            productsGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        });
}

// Display Products
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) return;
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p>No products available.</p>';
        return;
    }
    
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Product image or placeholder
    const imageUrl = product.image_url || null;
    const imageHTML = imageUrl 
        ? `<img src="${imageUrl}" alt="${product.name}" class="product-image">`
        : `<div class="product-image" style="background: linear-gradient(135deg, #E74C3C, #C0392B); display: flex; align-items: center; justify-content: center;">
               <i class="fas fa-key" style="font-size: 4rem; color: white; opacity: 0.8;"></i>
           </div>`;
    
    card.innerHTML = `
        ${imageHTML}
        <div class="product-body">
            <h3>${product.name}</h3>
            <p>${product.description || 'Premium IoT safety keychain'}</p>
            <div class="product-price">₱${parseFloat(product.price).toLocaleString()}</div>
            <button class="btn btn-primary btn-block" onclick="viewProduct(${product.product_id})">
                <i class="fas fa-info-circle"></i> View Details
            </button>
        </div>
    `;
    
    return card;
}

// View Product Details
function viewProduct(productId) {
    // Redirect to product details page
    window.location.href = `../html/product-details.html?id=${productId}`;
}

// Back to Top Button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (!backToTopBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Setup Contact Form (in footer)
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            
            // Submit to API
            fetch('../php/api/submit-contact.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Message sent successfully!');
                    contactForm.reset();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            });
        });
    }
}

// Update Active Navigation Link on Scroll
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu li a');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ========================================
// SUPPORT MODAL FUNCTIONALITY
// ========================================

function setupSupportModal() {
    const supportModal = document.getElementById('supportModal');
    const openSupportBtn = document.getElementById('openSupportBtn');
    const closeModal = document.getElementById('closeModal');
    const supportForm = document.getElementById('supportModalForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('modalAttachment');
    const fileInfo = document.getElementById('fileInfo');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const successAlert = document.getElementById('modalSuccessAlert');
    const errorAlert = document.getElementById('modalErrorAlert');
    
    console.log('Support modal initializing...');
    console.log('Button found:', openSupportBtn ? 'YES' : 'NO');
    console.log('Modal found:', supportModal ? 'YES' : 'NO');
    
    let selectedFiles = [];
    
    // Open modal function
    function openModal() {
        console.log('Opening modal...');
        if (supportModal) {
            supportModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close modal function
    function closeModalFunc() {
        console.log('Closing modal...');
        if (supportModal) {
            supportModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Event listener for opening modal
    if (openSupportBtn) {
        openSupportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Get Support button clicked!');
            openModal();
        });
    } else {
        console.error('Get Support button not found!');
    }
    
    // Event listener for closing modal
    if (closeModal) {
        closeModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModalFunc();
        });
    }
    
    // Close modal when clicking outside
    if (supportModal) {
        supportModal.addEventListener('click', function(e) {
            if (e.target === supportModal) {
                closeModalFunc();
            }
        });
    }
    
    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && supportModal && supportModal.style.display === 'flex') {
            closeModalFunc();
        }
    });
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            if (fileInput) fileInput.click();
        });
    }
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            selectedFiles = files;
            
            if (files.length > 0) {
                if (fileInfo) fileInfo.textContent = `${files.length} file(s) selected`;
                displayImagePreviews(files);
            } else {
                if (fileInfo) fileInfo.textContent = 'No files selected';
                if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
            }
        });
    }
    
    // Display image previews
    function displayImagePreviews(files) {
        if (!imagePreviewContainer) return;
        
        imagePreviewContainer.innerHTML = '';
        
        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="preview-remove" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    imagePreviewContainer.appendChild(previewItem);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Remove image preview
    if (imagePreviewContainer) {
        imagePreviewContainer.addEventListener('click', function(e) {
            if (e.target.closest('.preview-remove')) {
                const index = parseInt(e.target.closest('.preview-remove').dataset.index);
                selectedFiles.splice(index, 1);
                
                if (selectedFiles.length > 0) {
                    if (fileInfo) fileInfo.textContent = `${selectedFiles.length} file(s) selected`;
                    displayImagePreviews(selectedFiles);
                } else {
                    if (fileInfo) fileInfo.textContent = 'No files selected';
                    if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
                    if (fileInput) fileInput.value = '';
                }
            }
        });
    }
    
    // Form submission
    if (supportForm) {
        supportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('modalFullName').value.trim();
            const email = document.getElementById('modalEmail').value.trim();
            const issueDescription = document.getElementById('modalIssueDescription').value.trim();
            
            // Hide previous alerts
            if (successAlert) successAlert.style.display = 'none';
            if (errorAlert) errorAlert.style.display = 'none';
            
            // Validation
            if (!fullName || !email || !issueDescription) {
                if (errorAlert) {
                    const errorMessage = document.getElementById('modalErrorMessage');
                    if (errorMessage) errorMessage.textContent = 'Please fill in all required fields.';
                    errorAlert.style.display = 'flex';
                }
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (errorAlert) {
                    const errorMessage = document.getElementById('modalErrorMessage');
                    if (errorMessage) errorMessage.textContent = 'Please enter a valid email address.';
                    errorAlert.style.display = 'flex';
                }
                return;
            }
            
            // Create FormData
            const formData = new FormData();
            formData.append('full_name', fullName);
            formData.append('email', email);
            formData.append('issue_description', issueDescription);
            
            // Append files
            selectedFiles.forEach((file, index) => {
                formData.append(`attachment_${index}`, file);
            });
            
            console.log('Support Ticket Submitted:', {
                fullName,
                email,
                issueDescription,
                filesCount: selectedFiles.length
            });
            
            // TODO: Submit to your API
            // fetch('../php/api/submit-support.php', {
            //     method: 'POST',
            //     body: formData
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         // Show success
            //     }
            // });
            
            // Show success message
            if (successAlert) successAlert.style.display = 'flex';
            
            // Reset form
            supportForm.reset();
            selectedFiles = [];
            if (fileInfo) fileInfo.textContent = 'No files selected';
            if (imagePreviewContainer) imagePreviewContainer.innerHTML = '';
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeModalFunc();
                if (successAlert) successAlert.style.display = 'none';
            }, 2000);
        });
    }
    
    console.log('Support modal initialized successfully!');
}