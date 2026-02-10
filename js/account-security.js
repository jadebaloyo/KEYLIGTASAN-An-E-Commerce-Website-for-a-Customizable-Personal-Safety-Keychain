/**
 * KEYLIGTASAN - Account & Security JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Setup form handlers
    setupFormHandlers();
});

// Check authentication
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Please login first');
        window.location.href = '../html/login.html';
        return false;
    }
    
    return true;
}

// Load user data from session storage
function loadUserData() {
    const userName = sessionStorage.getItem('userName');
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (userName) {
        document.getElementById('userName').value = userName;
    }
    
    if (userEmail) {
        document.getElementById('email').placeholder = userEmail;
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Account form
    const accountForm = document.querySelector('.account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }
    
    // Address form
    const addressForm = document.querySelector('.address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSubmit);
    }
    
    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleCancel);
    }
    
    // Edit photo button
    const editPhotoBtn = document.querySelector('.btn-edit-photo');
    if (editPhotoBtn) {
        editPhotoBtn.addEventListener('click', handleEditPhoto);
    }
}

// Handle account update
function handleAccountUpdate(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email && !password) {
        alert('Please enter email or password to update');
        return;
    }
    
    // Here you would send to API
    // For now, just show success message
    
    if (confirm('Are you sure you want to update your account information?')) {
        // Simulate API call
        setTimeout(() => {
            alert('Account updated successfully!');
            
            // Clear password field
            document.getElementById('password').value = '';
            
            // If email was updated, update session storage
            if (email) {
                sessionStorage.setItem('userEmail', email);
            }
        }, 500);
    }
}

// Handle address submit
function handleAddressSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Get form values
    const fullName = formData.get('full_name');
    const contact = formData.get('contact');
    const street = formData.get('street');
    
    // Validate
    if (!fullName || !contact || !street) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Here you would send to API
    // For now, just show success message
    
    alert('Address added successfully!');
    
    // Clear form
    e.target.reset();
    
    // Reload addresses (in real app, fetch from API)
    location.reload();
}

// Handle cancel
function handleCancel() {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
        document.querySelector('.address-form').reset();
    }
}

// Handle edit photo
function handleEditPhoto() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Read and display image
            const reader = new FileReader();
            reader.onload = function(event) {
                const photoCircle = document.querySelector('.photo-circle');
                photoCircle.style.backgroundImage = `url(${event.target.result})`;
                photoCircle.style.backgroundSize = 'cover';
                photoCircle.style.backgroundPosition = 'center';
                photoCircle.innerHTML = ''; // Remove icon
                
                alert('Photo updated! Click "Save Changes" to save.');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = '../html/login.html';
    }
}

// Format phone number
document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('63')) {
            value = '+' + value;
        } else if (value.startsWith('0')) {
            value = '+63' + value.substring(1);
        } else if (value.startsWith('9')) {
            value = '+63' + value;
        }
        
        e.target.value = value;
    });
});