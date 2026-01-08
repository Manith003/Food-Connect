// Profile Page JavaScript

// Initialize page (will be called from main.js via initPageSpecific)
async function initProfilePage() {
  const notLoggedInEl = document.getElementById('notLoggedInMessage');
  const loggedInEl = document.getElementById('loggedInContent');

  // Check if user is logged in (after main.js has already called fetchCurrentUser)
  if (!window.currentUser) {
    if (notLoggedInEl) notLoggedInEl.classList.remove('hidden');
    if (loggedInEl) loggedInEl.classList.add('hidden');
    return;
  }

  if (notLoggedInEl) notLoggedInEl.classList.add('hidden');
  if (loggedInEl) loggedInEl.classList.remove('hidden');

  // Load user data (from API / currentUser)
  await loadUserData();

  // Load saved places
  await loadSavedPlaces();

  // Initialize event listeners
  initEventListeners();
}

// Expose hook for main.js
function initPageSpecific() {
  // main.js will call this AFTER fetchCurrentUser() finishes
  initProfilePage();
}

// Load user data
async function loadUserData() {
  try {
    let user = window.currentUser;

    // Fallback: if somehow not set, fetch again
    if (!user) {
      const response = await FoodConnect.authFetch('/api/auth/me');
      const data = await response.json();
      if (data.success && data.user) {
        user = data.user;
      }
    }

    if (user) {
      renderUserData(user);
    } else {
      FoodConnectUtils.showToast('Failed to load profile data', 'error');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    FoodConnectUtils.showToast('Failed to load profile data', 'error');
  }
}

// Render user data
function renderUserData(user) {
  // Profile sidebar
  const initials = user.name?.charAt(0) || 'U';
  document.getElementById('profileAvatar').textContent = initials;
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;

  // Member since
  const memberSince = FoodConnectUtils.formatDate(user.createdAt);
  document.getElementById('memberSince').textContent = `Member since ${memberSince}`;

  // Personal information
  document.getElementById('infoName').textContent = user.name;
  document.getElementById('infoEmail').textContent = user.email;
  document.getElementById('infoRole').textContent = user.role === 'admin' ? 'Admin' : 'User';
  document.getElementById('infoMemberSince').textContent = memberSince;

  // Preferences
  const preferences = user.preferences || {};
  document.getElementById('vegPreference').checked = preferences.vegFlag || false;

  // Budget range
  const budgetRange = preferences.budgetRange || { min: 0, max: 1000 };
  document.getElementById('budgetMin').value = budgetRange.min;
  document.getElementById('budgetMax').value = budgetRange.max;

  // Cuisine tags
  renderCuisineTags(preferences.cuisines || []);

  // Update avatar in navbar
  const userAvatar = document.getElementById('userAvatar');
  if (userAvatar) userAvatar.textContent = initials;

  const userName = document.getElementById('userName');
  if (userName) userName.textContent = user.name;
}

// Render cuisine tags
function renderCuisineTags(selectedCuisines = []) {
  const cuisineTagsContainer = document.getElementById('cuisineTags');
  const allCuisines = [
    'South Indian',
    'North Indian',
    'Chinese',
    'Italian',
    'Arabic',
    'Barbecue',
    'Street Food',
    'Desserts',
    'Fast Food',
    'Seafood',
    'Continental',
    'Japanese',
  ];

  let html = '';
  allCuisines.forEach((cuisine) => {
    const isSelected = selectedCuisines.includes(cuisine);
    html += `
      <span class="cuisine-tag ${isSelected ? 'selected' : ''}" 
            data-cuisine="${cuisine}">
        ${cuisine}
      </span>
    `;
  });

  cuisineTagsContainer.innerHTML = html;

  // Add event listeners
  document.querySelectorAll('.cuisine-tag').forEach((tag) => {
    tag.addEventListener('click', toggleCuisineTag);
  });

  // Update hidden input
  updateSelectedCuisines();
}

// Toggle cuisine tag selection
function toggleCuisineTag(event) {
  const tag = event.currentTarget;
  tag.classList.toggle('selected');

  // Show save button
  document.getElementById('savePreferencesBtn').style.display = 'block';

  // Update hidden input
  updateSelectedCuisines();
}

// Update selected cuisines in hidden input
function updateSelectedCuisines() {
  const selectedTags = document.querySelectorAll('.cuisine-tag.selected');
  const selectedCuisines = Array.from(selectedTags).map((tag) =>
    tag.getAttribute('data-cuisine')
  );
  document.getElementById('selectedCuisines').value =
    JSON.stringify(selectedCuisines);
}

// Load saved places
async function loadSavedPlaces() {
  try {
    const response = await FoodConnect.authFetch('/api/saved');
    const data = await response.json();

    renderSavedPlaces(data.data || []);

    // Update saved count
    document.getElementById('savedCount').textContent = data.count || 0;
  } catch (error) {
    console.error('Error loading saved places:', error);
    document.getElementById('savedPlacesContainer').innerHTML = `
      <div class="empty-state">
        <p>Failed to load saved places. Please try again.</p>
        <button onclick="loadSavedPlaces()" class="btn btn-primary mt-2">
          Retry
        </button>
      </div>
    `;
  }
}

// Render saved places
function renderSavedPlaces(places) {
  const container = document.getElementById('savedPlacesContainer');

  if (places.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bookmark" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
        <h3>No Saved Places Yet</h3>
        <p>Start exploring food spots and save your favorites!</p>
        <a href="spots.html" class="btn btn-primary mt-2">
          Explore Food Spots
        </a>
      </div>
    `;
    return;
  }

  let html = '<div class="saved-places-grid">';

  places.forEach((place) => {
    const vegBadge = place.vegFlag
      ? '<span class="badge badge-success"><i class="fas fa-leaf"></i> Veg</span>'
      : '<span class="badge badge-danger"><i class="fas fa-drumstick-bite"></i> Non-Veg</span>';

    html += `
      <div class="card hover-lift">
        <div class="card-img" style="
          background: linear-gradient(135deg, var(--champagne) 0%, var(--honey-garlic) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-size: 2rem;
          position: relative;
        ">
          <i class="fas fa-utensils"></i>
          <button class="btn btn-sm btn-danger remove-saved-btn" 
                  data-place-id="${place._id}"
                  style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(220, 53, 69, 0.9); border: none;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="card-content">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <h3 class="card-title">${place.name}</h3>
            ${vegBadge}
          </div>
          <div class="card-meta" style="margin-bottom: 0.75rem;">
            <span class="badge badge-primary">${place.cuisine}</span>
            <span class="badge badge-warning">${FoodConnectUtils.generatePriceRange(
              place.priceRange
            )}</span>
          </div>
          <p class="card-description">${FoodConnectUtils.truncateText(
            place.description,
            100
          )}</p>
          <div style="margin-top: auto;">
            ${FoodConnectUtils.generateRatingStars(place.averageRating)}
            <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
              <i class="fas fa-map-marker-alt"></i> ${place.landmark}
            </p>
          </div>
          <div class="card-footer">
            <span style="font-size: 0.875rem; color: #666;">
              Saved ${FoodConnectUtils.formatDate(place.savedAt)}
            </span>
            <a href="place.html?id=${place._id}" class="btn btn-outline btn-sm">
              View Details
            </a>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-saved-btn').forEach((btn) => {
    btn.addEventListener('click', removeSavedPlace);
  });
}

// Initialize event listeners
function initEventListeners() {
  // Save preferences button
  const savePreferencesBtn = document.getElementById('savePreferencesBtn');
  if (savePreferencesBtn) {
    savePreferencesBtn.addEventListener('click', savePreferences);
  }

  // Preference form inputs
  const preferenceInputs = ['vegPreference', 'budgetMin', 'budgetMax'];
  preferenceInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', () => {
        document.getElementById('savePreferencesBtn').style.display = 'block';
      });
    }
  });
}

// Save preferences
async function savePreferences() {
  const vegFlag = document.getElementById('vegPreference').checked;
  const budgetMin = parseInt(document.getElementById('budgetMin').value) || 0;
  const budgetMax = parseInt(document.getElementById('budgetMax').value) || 1000;

  // Get selected cuisines
  const selectedTags = document.querySelectorAll('.cuisine-tag.selected');
  const cuisines = Array.from(selectedTags).map((tag) =>
    tag.getAttribute('data-cuisine')
  );

  // Validate budget range
  if (budgetMin > budgetMax) {
    FoodConnectUtils.showToast(
      'Minimum budget cannot be greater than maximum',
      'warning'
    );
    return;
  }

  const preferences = {
    vegFlag,
    cuisines,
    budgetRange: {
      min: budgetMin,
      max: budgetMax,
    },
  };

  try {
    const response = await FoodConnect.authFetch('/api/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });

    if (response.ok) {
      FoodConnectUtils.showToast('Preferences saved successfully!', 'success');
      document.getElementById('savePreferencesBtn').style.display = 'none';

      // Update current user data
      await FoodConnect.fetchCurrentUser();
    } else {
      const data = await response.json();
      FoodConnectUtils.showToast(
        data.message || 'Failed to save preferences',
        'error'
      );
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    FoodConnectUtils.showToast('Failed to save preferences', 'error');
  }
}

// Remove saved place
async function removeSavedPlace(event) {
  const button = event.currentTarget;
  const placeId = button.getAttribute('data-place-id');

  try {
    const response = await FoodConnect.authFetch('/api/saved');
    const data = await response.json();

    const savedPlace = data.data?.find((place) => place._id === placeId);

    if (!savedPlace) {
      FoodConnectUtils.showToast('Place not found in saved list', 'error');
      return;
    }

    const confirmed = await FoodConnectUtils.showConfirmation(
      'Remove this place from your saved list?',
      'Remove Saved Place'
    );

    if (!confirmed) return;

    const deleteResponse = await FoodConnect.authFetch(
      `/api/saved/${savedPlace._id}`,
      {
        method: 'DELETE',
      }
    );

    if (deleteResponse.ok) {
      FoodConnectUtils.showToast('Removed from saved places', 'success');

      // Remove card from UI
      const card = button.closest('.card');
      card.style.opacity = '0';
      card.style.transform = 'scale(0.8)';
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      setTimeout(() => {
        card.remove();

        // Reload saved places if empty
        const remainingCards = document.querySelectorAll('.card');
        if (remainingCards.length === 0) {
          loadSavedPlaces();
        }

        // Update saved count
        const savedCountEl = document.getElementById('savedCount');
        const currentCount = parseInt(savedCountEl.textContent) || 0;
        savedCountEl.textContent = Math.max(0, currentCount - 1);
      }, 300);
    } else {
      FoodConnectUtils.showToast('Failed to remove saved place', 'error');
    }
  } catch (error) {
    console.error('Error removing saved place:', error);
    FoodConnectUtils.showToast('Failed to remove saved place', 'error');
  }
} 
 