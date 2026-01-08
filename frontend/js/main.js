// Main JavaScript for Food Connect

// Global state
window.currentUser = null;
window.appState = {
  isInitialized: false,
  isAuthenticated: false,
  isLoading: false
};

// DOM Elements
let cursorDot, cursorOutline;

// Initialize custom cursor
function initCustomCursor() {
  cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);

  cursorOutline = document.createElement('div');
  cursorOutline.className = 'cursor-dot-outline';
  document.body.appendChild(cursorOutline);

  // Update cursor position
  document.addEventListener('mousemove', (e) => {
    cursorDot.style.left = `${e.clientX}px`;
    cursorDot.style.top = `${e.clientY}px`;
    
    cursorOutline.animate({
      left: `${e.clientX}px`,
      top: `${e.clientY}px`
    }, { duration: 500, fill: 'forwards' });
  });

  // Cursor hover effects
  const hoverElements = document.querySelectorAll('a, button, .card, .nav-link, .btn, input[type="submit"], [data-hover="true"]');
  
  hoverElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
      cursorOutline.style.borderColor = '#EACEAA';
    });
    
    element.addEventListener('mouseleave', () => {
      cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
      cursorOutline.style.borderColor = '#EACEAA';
    });
  });
}

// Fetch current user from API
async function fetchCurrentUser() {
  try {
    window.appState.isLoading = true;
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      window.currentUser = data.user;
      window.appState.isAuthenticated = true;
      window.appState.isLoading = false;
      return data.user;
    } else {
      window.currentUser = null;
      window.appState.isAuthenticated = false;
      window.appState.isLoading = false;
      return null;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    window.currentUser = null;
    window.appState.isAuthenticated = false;
    window.appState.isLoading = false;
    return null;
  }
}

// Logout function
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      credentials: 'include'
    });
    
    window.currentUser = null;
    window.appState.isAuthenticated = false;
    
    // Redirect to login page
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Logout error:', error);
    FoodConnectUtils.showToast('Error logging out', 'error');
  }
}

// Update navbar based on auth state
function updateNavbar() {
  const authSection = document.getElementById('authSection');
  const userSection = document.getElementById('userSection');
  const adminSection = document.getElementById('adminSection');
  const userNameSpan = document.getElementById('userName');
  const mobileAuthSection = document.getElementById('mobileAuthSection');
  const mobileUserSection = document.getElementById('mobileUserSection');
  const mobileAdminSection = document.getElementById('mobileAdminSection');
  const mobileUserNameSpan = document.getElementById('mobileUserName');

  if (!authSection) return;

  if (window.currentUser) {
    // User is logged in
    authSection.classList.add('hidden');
    userSection.classList.remove('hidden');
    
    if (mobileAuthSection) mobileAuthSection.classList.add('hidden');
    if (mobileUserSection) mobileUserSection.classList.remove('hidden');
    
    if (userNameSpan) userNameSpan.textContent = window.currentUser.name;
    if (mobileUserNameSpan) mobileUserNameSpan.textContent = window.currentUser.name;
    
    // Show admin links if user is admin
    if (window.currentUser.role === 'admin') {
      if (adminSection) adminSection.classList.remove('hidden');
      if (mobileAdminSection) mobileAdminSection.classList.remove('hidden');
    } else {
      if (adminSection) adminSection.classList.add('hidden');
      if (mobileAdminSection) mobileAdminSection.classList.add('hidden');
    }
  } else {
    // User is not logged in
    authSection.classList.remove('hidden');
    userSection.classList.add('hidden');
    
    if (mobileAuthSection) mobileAuthSection.classList.remove('hidden');
    if (mobileUserSection) mobileUserSection.classList.add('hidden');
    if (adminSection) adminSection.classList.add('hidden');
    if (mobileAdminSection) mobileAdminSection.classList.add('hidden');
  }
}

// Initialize Intersection Observer for animations
function initIntersectionObserver() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, observerOptions);

  // Observe elements with animation classes
  document.querySelectorAll('.fade-in, .slide-up, .slide-right, .slide-left, .scale-in').forEach(el => {
    observer.observe(el);
  });
}

// Initialize mobile menu
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ? '✕' : '☰';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
        mobileMenuBtn.innerHTML = '☰';
      }
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.innerHTML = '☰';
      });
    });
  }
}

// Initialize sticky navbar
function initStickyNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScrollTop = 0;
  
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove scrolled class
    if (scrollTop > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    // Hide/show navbar on scroll
    if (scrollTop > lastScrollTop && scrollTop > 100) {
      // Scrolling down
      navbar.style.transform = 'translateY(-100%)';
    } else {
      // Scrolling up
      navbar.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
  });
}

// Initialize ripple effects
function initRippleEffects() {
  document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check if target is a button with ripple class
    if (target.classList.contains('btn') || target.closest('.btn')) {
      const btn = target.classList.contains('btn') ? target : target.closest('.btn');
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
      `;
      
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  });
}

// Initialize tooltips
function initTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(element => {
    const tooltipText = element.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    
    // Add styles for tooltip
    if (!document.querySelector('#tooltip-styles')) {
      const style = document.createElement('style');
      style.id = 'tooltip-styles';
      style.textContent = `
        .tooltip {
          position: absolute;
          background: var(--balsamico);
          color: var(--white);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          white-space: nowrap;
          z-index: 10000;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
          box-shadow: var(--shadow-md);
        }
        .tooltip::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 5px solid var(--balsamico);
        }
        [data-tooltip]:hover .tooltip {
          opacity: 1;
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
    
    // Position tooltip
    element.addEventListener('mouseenter', () => {
      const rect = element.getBoundingClientRect();
      tooltip.style.top = `${-tooltip.offsetHeight - 10}px`;
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
    });
  });
}

// Initialize page
async function initPage() {
  if (window.appState.isInitialized) return;
  
  try {
    // Initialize components
    initCustomCursor();
    initIntersectionObserver();
    initMobileMenu();
    initStickyNavbar();
    initRippleEffects();
    initTooltips();
    
    // Fetch current user
    await fetchCurrentUser();
    updateNavbar();
    
    // Set active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Add logout event listeners
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    });
    
    // Initialize any page-specific functionality
    if (typeof initPageSpecific === 'function') {
      initPageSpecific();
    }
    
    window.appState.isInitialized = true;
    
    // Show welcome message for new users
    if (window.currentUser && sessionStorage.getItem('welcomeShown') !== 'true') {
      setTimeout(() => {
        FoodConnectUtils.showToast(`Welcome back, ${window.currentUser.name}!`, 'success');
        sessionStorage.setItem('welcomeShown', 'true');
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error initializing page:', error);
    FoodConnectUtils.showToast('Error initializing application', 'error');
  }
}

// Error handling for fetch requests
function handleApiError(error, defaultMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  let message = defaultMessage;
  if (error.response) {
    // Server responded with error status
    try {
      const data = error.response.json();
      message = data.message || data.error || defaultMessage;
    } catch {
      message = `Server error: ${error.response.status}`;
    }
  } else if (error.message) {
    message = error.message;
  }
  
  FoodConnectUtils.showToast(message, 'error');
  throw error;
}

// Make authenticated fetch requests
async function authFetch(url, options = {}) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (response.status === 401) {
      // Unauthorized - user needs to login
      window.currentUser = null;
      window.appState.isAuthenticated = false;
      updateNavbar();
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
      }
      
      throw new Error('Authentication required');
    }
    
    if (response.status === 403) {
      // Forbidden - user doesn't have permission
      FoodConnectUtils.showToast('You do not have permission to perform this action', 'error');
      throw new Error('Forbidden');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        response: {
          status: response.status,
          json: async () => errorData
        },
        message: errorData.message || `HTTP ${response.status}`
      };
    }
    
    return response;
  } catch (error) {
    handleApiError(error);
  }
}

// Make authenticated JSON requests
async function authFetchJSON(url, options = {}) {
  const response = await authFetch(url, options);
  return await response.json();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);

// Export functions for use in other modules
window.FoodConnect = {
  fetchCurrentUser,
  logout,
  updateNavbar,
  authFetch,
  authFetchJSON,
  handleApiError,
  utils: FoodConnectUtils
};
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/assets/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}