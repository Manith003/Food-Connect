// Authentication-specific JavaScript

// Login form handler
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorContainer = document.getElementById('errorContainer');
  
  if (!loginForm) return;
  
  // Check for redirect parameter
  const params = FoodConnectUtils.getQueryParams();
  const redirectUrl = params.redirect || 'index.html';
  
  // Show message if redirected from protected page
  if (params.redirect) {
    const message = document.createElement('div');
    message.className = 'alert alert-warning';
    message.textContent = 'Please login to continue';
    errorContainer.prepend(message);
  }
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    errorContainer.innerHTML = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    
    // Get form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Client-side validation
    let isValid = true;
    
    if (!FoodConnectUtils.validateEmail(email)) {
      showFieldError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }
    
    if (!password) {
      showFieldError(passwordInput, 'Password is required');
      isValid = false;
    } else if (!FoodConnectUtils.validatePassword(password)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters long');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
      // Make login request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Login successful
        FoodConnectUtils.showToast('Login successful!', 'success');
        
        // Update global state
        window.currentUser = data.user;
        window.appState.isAuthenticated = true;
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        // Login failed
        showFormError(data.message || 'Invalid email or password');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Login error:', error);
      showFormError('Network error. Please try again.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
  
  // Real-time validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !FoodConnectUtils.validateEmail(email)) {
      showFieldError(emailInput, 'Please enter a valid email address');
    } else {
      clearFieldError(emailInput);
    }
  });
  
  passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    if (password && !FoodConnectUtils.validatePassword(password)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters long');
    } else {
      clearFieldError(passwordInput);
    }
  });
  
  // Clear errors on input
  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      clearFieldError(input);
    });
  });
}

// Signup form handler
function initSignupForm() {
  const signupForm = document.getElementById('signupForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const errorContainer = document.getElementById('errorContainer');
  
  if (!signupForm) return;
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    errorContainer.innerHTML = '';
    [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
      input.classList.remove('error');
    });
    
    // Get form values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Client-side validation
    let isValid = true;
    
    if (!name || name.length < 2) {
      showFieldError(nameInput, 'Name must be at least 2 characters long');
      isValid = false;
    }
    
    if (!FoodConnectUtils.validateEmail(email)) {
      showFieldError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }
    
    if (!FoodConnectUtils.validatePassword(password)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters long');
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      showFieldError(confirmPasswordInput, 'Passwords do not match');
      isValid = false;
    }
    
    if (!isValid) return;
    
    // Show loading state
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
      // Make signup request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Signup successful
        FoodConnectUtils.showToast('Account created successfully!', 'success');
        
        // Update global state
        window.currentUser = data.user;
        window.appState.isAuthenticated = true;
        
        // Redirect to profile after short delay
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1000);
      } else {
        // Signup failed
        if (data.errors) {
          data.errors.forEach(error => {
            if (error.path === 'email') {
              showFieldError(emailInput, error.msg);
            } else if (error.path === 'password') {
              showFieldError(passwordInput, error.msg);
            } else {
              showFormError(error.msg);
            }
          });
        } else {
          showFormError(data.message || 'Registration failed');
        }
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    } catch (error) {
      console.error('Signup error:', error);
      showFormError('Network error. Please try again.');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
  
  // Real-time validation
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !FoodConnectUtils.validateEmail(email)) {
      showFieldError(emailInput, 'Please enter a valid email address');
    } else {
      clearFieldError(emailInput);
    }
  });
  
  passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    if (password && !FoodConnectUtils.validatePassword(password)) {
      showFieldError(passwordInput, 'Password must be at least 6 characters long');
    } else {
      clearFieldError(passwordInput);
    }
  });
  
  confirmPasswordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword && password !== confirmPassword) {
      showFieldError(confirmPasswordInput, 'Passwords do not match');
    } else {
      clearFieldError(confirmPasswordInput);
    }
  });
  
  // Clear errors on input
  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('input', () => {
      clearFieldError(input);
    });
  });
}

// Helper functions
function showFieldError(input, message) {
  input.classList.add('error');
  
  // Remove existing error message
  const existingError = input.parentNode.querySelector('.form-error');
  if (existingError) existingError.remove();
  
  // Add new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  input.parentNode.appendChild(errorDiv);
}

function clearFieldError(input) {
  input.classList.remove('error');
  
  const errorDiv = input.parentNode.querySelector('.form-error');
  if (errorDiv) errorDiv.remove();
}

function showFormError(message) {
  const errorContainer = document.getElementById('errorContainer');
  if (!errorContainer) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'alert alert-danger';
  errorDiv.textContent = message;
  errorContainer.appendChild(errorDiv);
}

// Initialize auth forms on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('loginForm')) {
    initLoginForm();
  }
  
  if (document.getElementById('signupForm')) {
    initSignupForm();
  }
  
  // Add animation to form
  const form = document.querySelector('.auth-form');
  if (form) {
    form.classList.add('slide-up');
  }
});