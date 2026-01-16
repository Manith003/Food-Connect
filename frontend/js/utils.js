// Utility functions for Food Connect

class FoodConnectUtils {
  // API base URL
  static get API_BASE_URL() {
    return '/api';
  }

  // Get query parameters
  static getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    if (!queryString) return params;

    const pairs = queryString.split('&');

    for (const pair of pairs) {
      if (!pair) continue;
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    }

    return params;
  }

  // Get a specific query parameter
  static getQueryParam(name) {
    return this.getQueryParams()[name];
  }

  // Format date
  static formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Format time
  static formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Format date and time
  static formatDateTime(dateString) {
    if (!dateString) return '';
    return `${this.formatDate(dateString)} • ${this.formatTime(dateString)}`;
  }

  // Generate rating stars HTML
  static generateRatingStars(rating, max = 5) {
    // Guard against undefined/null/NaN
    let safeRating = Number(rating);
    if (Number.isNaN(safeRating) || safeRating < 0) safeRating = 0;
    if (safeRating > max) safeRating = max;

    let stars = '';
    for (let i = 1; i <= max; i++) {
      if (i <= Math.floor(safeRating)) {
        stars += '<i class="star filled">★</i>';
      } else if (i === Math.ceil(safeRating) && safeRating % 1 !== 0) {
        stars += '<i class="star half-filled">★</i>';
      } else {
        stars += '<i class="star">★</i>';
      }
    }
    return `<div class="rating">${stars} <span class="rating-number">(${safeRating.toFixed(
      1
    )})</span></div>`;
  }

  // Show toast notification
  static showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach((toast) => toast.remove());

    // Inject styles only once
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          background-color: white;    
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          z-index: 9999;
          animation: slideInRight 0.3s ease, fadeOut 0.3s ease var(--toast-duration, 3000ms) forwards;
          max-width: 400px;
          border-left: 4px solid;
        }
        .toast-info {
          border-left-color: #0dcaf0;
          // background: rgba(13, 202, 240, 0.1);
        }
        .toast-success {
          border-left-color: #198754;
          // background: rgba(25, 135, 84, 0.1);
        }
        .toast-warning {
          border-left-color: #ffc107;
          // background: rgba(255, 193, 7, 0.1);
        }
        .toast-error {
          border-left-color: #dc3545;
          // background: rgba(220, 53, 69, 0.1);
        }
        .toast-content {
          flex: 1;
        }
        .toast-message {
          color: var(--burnt-coffee);
        }
        .toast-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--burnt-coffee);
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.setProperty('--toast-duration', `${duration}ms`);
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close">&times;</button>
    `;

    document.body.appendChild(toast);

    // Add close functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'fadeOut 0.3s ease forwards';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }

    return toast;
  }

  // Show confirmation dialog
  static async showConfirmation(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary cancel-btn">Cancel</button>
            <button class="btn btn-danger confirm-btn">Confirm</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      document.body.style.overflow = 'hidden';

      const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.remove();
          document.body.style.overflow = '';
        }, 300);
      };

      // Event listeners
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.cancel-btn');
      const confirmBtn = modal.querySelector('.confirm-btn');

      const handleCancel = () => {
        closeModal();
        resolve(false);
      };

      const handleConfirm = () => {
        closeModal();
        resolve(true);
      };

      closeBtn.addEventListener('click', handleCancel);
      cancelBtn.addEventListener('click', handleCancel);
      confirmBtn.addEventListener('click', handleConfirm);

      // Close on ESC
      const handleEsc = (e) => {
        if (e.key === 'Escape') handleCancel();
      };
      document.addEventListener('keydown', handleEsc);

      // Ensure we clean up the keydown listener when modal is removed
      const observer = new MutationObserver(() => {
        if (!document.body.contains(modal)) {
          document.removeEventListener('keydown', handleEsc);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true });
    });
  }

  // Create skeleton loader
  static createSkeleton(type, count = 1) {
    const skeletons = [];
    for (let i = 0; i < count; i++) {
      let skeleton;

      switch (type) {
        case 'card':
          skeleton = `
            <div class="card skeleton">
              <div class="skeleton-image"></div>
              <div class="card-content">
                <div class="skeleton-title skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton"></div>
                <div class="skeleton-text skeleton"></div>
              </div>
            </div>
          `;
          break;

        case 'text':
          skeleton = `
            <div class="skeleton-text skeleton"></div>
          `;
          break;

        case 'title':
          skeleton = `
            <div class="skeleton-title skeleton"></div>
          `;
          break;

        default:
          skeleton = `<div class="skeleton"></div>`;
      }

      skeletons.push(skeleton);
    }

    return skeletons.join('');
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Validate email
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate password
  static validatePassword(password) {
    return typeof password === 'string' && password.length >= 6;
  }

  // Calculate distance between coordinates (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(value) {
    return (value * Math.PI) / 180;
  }

  // Format distance
  static formatDistance(km) {
    if (typeof km !== 'number' || Number.isNaN(km)) return '';
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  // Get user location
  static getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  // Copy to clipboard
  static copyToClipboard(text) {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(resolve).catch(reject);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          resolve();
        } catch (err) {
          reject(err);
        }
        textArea.remove();
      }
    });
  }

  // Generate price range symbols
  static generatePriceRange(range) {
    switch (range) {
      case '₹':
        return '₹ (Budget)';
      case '₹₹':
        return '₹₹ (Affordable)';
      case '₹₹₹':
        return '₹₹₹ (Moderate)';
      case '₹₹₹₹':
        return '₹₹₹₹ (Premium)';
      default:
        return range || '';
    }
  }

  // Truncate text
  static truncateText(text, maxLength) {
    if (typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  // Parse comma-separated tags
  static parseTags(tagString) {
    if (!tagString || typeof tagString !== 'string') return [];
    return tagString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  // Format tags array to string
  static formatTags(tags) {
    if (!tags) return '';
    return Array.isArray(tags) ? tags.join(', ') : String(tags);
  }

  // Create URL for place
  static getPlaceUrl(placeId) {
    return `place.html?id=${placeId}`;
  }

  // Create Google Maps direction URL
  static getGoogleMapsUrl(lat, lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
}

// Export for use in other modules
window.FoodConnectUtils = FoodConnectUtils;
