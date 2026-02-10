/**
 * KEYLIGTASAN - Register JavaScript
 * Complete registration with database save and redirect to login
 */

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    // Toggle password visibility
    setupPasswordToggle();
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
    
    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});

// Handle registration
function handleRegistration(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Get form data
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate
    if (!validateForm(fullName, email, phone, password, confirmPassword)) {
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    // Prepare data
    const registerData = {
        full_name: fullName,
        email: email,
        phone: phone,
        password: password
    };
    
    console.log('Sending registration data:', registerData);
    
    // Send to server
    fetch('../php/config/register.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Registration response:', data);
        
        if (data.success) {
            // SUCCESS! Show message and redirect
            showSuccess('✅ Registration successful! Redirecting to login...');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } else {
            // FAILED! Show error
            showError(data.message || 'Registration failed. Please try again.');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showError('Connection error. Please check your internet and try again.');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// Validate form
function validateForm(fullName, email, phone, password, confirmPassword) {
    let isValid = true;
    
    if (!fullName || fullName.length < 3) {
        showFieldError('fullName', 'Name must be at least 3 characters');
        isValid = false;
    }
    
    if (!email || !isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (phone && !isValidPhone(phone)) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

// Email validation
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Phone validation
function isValidPhone(phone) {
    return /^(\+63|0)?9\d{9}$/.test(phone.replace(/\s|-/g, ''));
}

// Password strength
function checkPasswordStrength(password) {
    // FIX: changed from 'passwordStrength' to 'passwordStrengthFill' to match your HTML
    const strengthBar = document.getElementById('passwordStrengthFill');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (!strengthBar && !strengthText) return;
    
    if (!password) {
        if (strengthBar) {
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-fill';
        }
        if (strengthText) strengthText.textContent = '';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) {
        if (strengthBar) {
            strengthBar.style.width = '33%';
            strengthBar.className = 'strength-fill strength-weak';
        }
        if (strengthText) {
            strengthText.textContent = 'Weak';
            strengthText.className = 'strength-weak';
        }
    } else if (strength <= 4) {
        if (strengthBar) {
            strengthBar.style.width = '66%';
            strengthBar.className = 'strength-fill strength-medium';
        }
        if (strengthText) {
            strengthText.textContent = 'Medium';
            strengthText.className = 'strength-medium';
        }
    } else {
        if (strengthBar) {
            strengthBar.style.width = '100%';
            strengthBar.className = 'strength-fill strength-strong';
        }
        if (strengthText) {
            strengthText.textContent = 'Strong';
            strengthText.className = 'strength-strong';
        }
    }
}

// Validate password match
function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (!confirmPassword) {
        confirmInput.classList.remove('success', 'error');
        return;
    }
    
    if (password === confirmPassword) {
        confirmInput.classList.remove('error');
        confirmInput.classList.add('success');
    } else {
        confirmInput.classList.remove('success');
        confirmInput.classList.add('error');
    }
}

// Setup password toggle
function setupPasswordToggle() {
    // FIX: changed from '.toggle-password-btn' to '.toggle-password' to match your HTML
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (!input) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Show field error
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    
    input.classList.add('error');
    
    let errorDiv = input.parentElement.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.fontSize = '0.875rem';
        errorDiv.style.marginTop = '0.25rem';
        input.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Clear errors
function clearErrors() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const alertBox = document.querySelector('.alert');
    if (alertBox) alertBox.style.display = 'none';
}

// Show success
function showSuccess(message) {
    let alertBox = document.querySelector('.alert');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.className = 'alert';
        document.querySelector('form').insertAdjacentElement('beforebegin', alertBox);
    }
    
    alertBox.className = 'alert alert-success';
    alertBox.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    alertBox.style.display = 'flex';
    alertBox.style.alignItems = 'center';
    alertBox.style.gap = '0.5rem';
    alertBox.style.padding = '1rem';
    alertBox.style.background = '#d4edda';
    alertBox.style.color = '#155724';
    alertBox.style.borderRadius = '8px';
    alertBox.style.marginBottom = '1rem';
}

// Show error
function showError(message) {
    let alertBox = document.querySelector('.alert');
    if (!alertBox) {
        alertBox = document.createElement('div');
        alertBox.className = 'alert';
        document.querySelector('form').insertAdjacentElement('beforebegin', alertBox);
    }
    
    alertBox.className = 'alert alert-error';
    alertBox.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    alertBox.style.display = 'flex';
    alertBox.style.alignItems = 'center';
    alertBox.style.gap = '0.5rem';
    alertBox.style.padding = '1rem';
    alertBox.style.background = '#f8d7da';
    alertBox.style.color = '#721c24';
    alertBox.style.borderRadius = '8px';
    alertBox.style.marginBottom = '1rem';
}