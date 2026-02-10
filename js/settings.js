/**
 * KEYLIGTASAN - Settings JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Setup form handlers
    setupFormHandlers();
});

// Check if user is logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        alert('Please login first');
        window.location.href = '../auth/auth_login.html';
        return false;
    }
    
    return true;
}

// Load user data
function loadUserData() {
    const userEmail = sessionStorage.getItem('userEmail');
    
    if (userEmail) {
        document.getElementById('email').placeholder = userEmail;
    }
}

// Setup form handlers
function setupFormHandlers() {
    // Settings form
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSave);
    }
    
    // Address form
    const addressForm = document.querySelector('.address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressSubmit);
    }
}

// Handle settings save
function handleSettingsSave(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email && !password) {
        alert('Please enter email or password to update');
        return;
    }
    
    if (confirm('Save changes?')) {
        alert('Settings updated successfully!');
        
        // Update session if email changed
        if (email) {
            sessionStorage.setItem('userEmail', email);
        }
        
        // Clear password field
        document.getElementById('password').value = '';
    }
}

// Handle address submit
function handleAddressSubmit(e) {
    e.preventDefault();
    
    alert('Address added successfully!');
    
    // Clear form
    e.target.reset();
}

// Handle edit profile
function handleEditProfile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const profileCircle = document.querySelector('.profile-circle');
                profileCircle.style.backgroundImage = `url(${event.target.result})`;
                profileCircle.style.backgroundSize = 'cover';
                profileCircle.style.backgroundPosition = 'center';
                profileCircle.innerHTML = '';
                
                alert('Photo updated!');
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Handle add address
function handleAddAddress() {
    alert('Add address form is ready. Fill in the details in the right panel.');
}

// Handle cancel
function handleCancel() {
    if (confirm('Cancel changes?')) {
        document.querySelector('.address-form').reset();
    }
}