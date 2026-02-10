/**
 * KEYLIGTASAN - Login JavaScript (FIXED PATHS)
 * Modern dark design with dashboard redirect
 */

console.log('✅ Login script loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        console.log('✅ Login form found');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('❌ Login form NOT found! Check if id="loginForm" exists');
    }
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    console.log('🔄 Form submitted!');
    
    // Clear previous errors
    clearErrors();
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('📧 Email:', email);
    console.log('🔒 Password length:', password.length);
    
    // Basic validation
    if (!email) {
        console.error('❌ Email is empty');
        showError('Please enter your email or username');
        return;
    }
    
    if (!password) {
        console.error('❌ Password is empty');
        showError('Please enter your password');
        return;
    }
    
    // Show loading state
    const loginBtn = document.querySelector('.btn-login');
    const originalText = loginBtn.textContent;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;
    
    // Prepare data
    const loginData = {
        email: email,
        password: password
    };
    
    console.log('📤 Sending login request...');
    
    // FIXED PATH: login.php is in js/ folder, login.html is in html/ folder
    // From html/ folder, we go up one level then into js/ folder
    fetch('../js/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => {
        console.log('📥 Response received!');
        console.log('Status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('✅ Login response:', data);
        
        if (data.success) {
            console.log('🎉 Login successful!');
            
            // SUCCESS! Save user data
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userId', data.user.id);
            sessionStorage.setItem('userEmail', data.user.email);
            sessionStorage.setItem('userName', data.user.full_name);
            sessionStorage.setItem('userRole', data.user.role);
            
            console.log('💾 User data saved to sessionStorage');
            console.log('👤 User:', data.user.full_name);
            console.log('🎭 Role:', data.user.role);
            
            // Show success message
            showSuccess('✅ Login successful! Redirecting to dashboard...');
            
            // FIXED PATHS: Determine redirect URL based on role
            let redirectUrl;
            if (data.user.role === 'admin') {
                // admin_dashboard.html is in root, login.html its in html folder
                redirectUrl = '../admin/admin_dashboard.html';
                console.log('🔀 Redirecting to: ADMIN dashboard');
            } else {
                // customer dashboard is in customer folder
                redirectUrl = '../customer/dashboard.html';
                console.log('🔀 Redirecting to: CUSTOMER dashboard');
            }
            
            // Redirect after 1.5 seconds
            setTimeout(() => {
                console.log('🚀 Redirecting now to:', redirectUrl);
                window.location.href = redirectUrl;
            }, 1500);
            
        } else {
            console.error('❌ Login failed:', data.message);
            
            // Login failed
            showError(data.message || 'Invalid email or password. Please try again.');
            
            // Reset button
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('💥 Login error:', error);
        console.error('Error details:', error.message);
        
        // Show detailed error
        let errorMessage = 'Connection error: ' + error.message;
        
        if (error.message.includes('404')) {
            errorMessage = '❌ Error 404: login.php file not found! Check if file exists in js/ folder';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '❌ Cannot reach server! Check if Apache is running in XAMPP.';
        }
        
        showError(errorMessage);
        
        // Reset button
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    });
}

// Clear errors
function clearErrors() {
    const alertBox = document.querySelector('.alert');
    if (alertBox) {
        alertBox.style.display = 'none';
    }
}

// Show success message
function showSuccess(message) {
    console.log('✅ Showing success:', message);
    
    let alertBox = document.querySelector('.alert');
    
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.className = 'alert';
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.insertAdjacentElement('afterend', alertBox);
        }
    }
    
    alertBox.className = 'alert alert-success';
    alertBox.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    alertBox.style.display = 'flex';
    
    // Scroll to alert
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show error message
function showError(message) {
    console.error('❌ Showing error:', message);
    
    let alertBox = document.querySelector('.alert');
    
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.className = 'alert';
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.insertAdjacentElement('afterend', alertBox);
        }
    }
    
    alertBox.className = 'alert alert-error';
    alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${message}</span>`;
    alertBox.style.display = 'flex';
    
    // Scroll to alert
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Test function - run this in console to test connection
window.testLogin = function() {
    console.log('🧪 Testing login connection...');
    
    fetch('../js/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'admin@keyligtasan.com',
            password: 'admin123'
        })
    })
    .then(r => r.json())
    .then(d => console.log('Test result:', d))
    .catch(e => console.error('Test error:', e));
};

console.log('💡 To test connection, run: testLogin()');