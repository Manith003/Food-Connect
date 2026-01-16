// Home page specific JavaScript

async function loadStatistics() {
  try {
    // Load places count
    const placesResponse = await fetch('/api/places?limit=1');
    if (placesResponse.ok) {
      const placesData = await placesResponse.json();
      document.getElementById('placesCount').textContent = placesData.total || 0;
    }
    
    // Load users count (this would need a separate endpoint)
    // For demo, we'll use a static number
    document.getElementById('usersCount').textContent = '150';
    
    // Load reviews count (this would need a separate endpoint)
    // For demo, we'll use a static number
    document.getElementById('reviewsCount').textContent = '850';
    
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

async function loadFeaturedPlaces() {
  const featuredPlacesContainer = document.getElementById('featuredPlaces');
  if (!featuredPlacesContainer) return;
  
  // Show loading skeleton
  featuredPlacesContainer.innerHTML = FoodConnectUtils.createSkeleton('card', 3);
  
  try {
    // Fetch featured places (places with averageRating >= 4)
    const response = await fetch('/api/places?rating=4&limit=3&sort=averageRating&page=1');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        featuredPlacesContainer.innerHTML = '';
        
        data.data.forEach(place => {
          const placeCard = createPlaceCard(place);
          featuredPlacesContainer.appendChild(placeCard);
          
          // Add entrance animation
          setTimeout(() => {
            placeCard.classList.add('slide-up');
          }, 100);
        });
      } else {
        featuredPlacesContainer.innerHTML = `
          <div class="col-span-3 text-center py-8">
            <p>No featured places found. Check back soon!</p>
          </div>
        `;
      }
    } else {
      throw new Error('Failed to load featured places');
    }
  } catch (error) {
    console.error('Error loading featured places:', error);
    featuredPlacesContainer.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="error-message">Failed to load featured places. Please try again later.</p>
      </div>
    `;
  }
}

function createPlaceCard(place) {
  const card = document.createElement('div');
  card.className = 'card hover-lift';
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  // Determine if place is vegetarian
  const vegBadge = place.vegFlag ? 
    '<span class="badge badge-success"><i class="fas fa-leaf"></i> Veg</span>' : 
    '<span class="badge badge-danger"><i class="fas fa-drumstick-bite"></i> Non-Veg</span>';
  
  // Generate rating stars
  const ratingStars = FoodConnectUtils.generateRatingStars(place.averageRating);
  
  // Create card content
  card.innerHTML = `
    <div class="card-img">
    <img src="${place.images[0]}" />
    </div>
    <div class="card-content">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
        <h3 class="card-title">${place.name}</h3>
        ${vegBadge}
      </div>
      <div class="card-meta" style="margin-bottom: 0.75rem;">
        <span class="badge badge-primary">${place.cuisine}</span>
        <span class="badge badge-warning">${FoodConnectUtils.generatePriceRange(place.priceRange)}</span>
      </div>
      <p class="card-description">${FoodConnectUtils.truncateText(place.description, 100)}</p>
      <div style="margin-top: auto;">
        ${ratingStars}
        <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
          <i class="fas fa-map-marker-alt"></i> ${place.landmark}
        </p>
      </div>
      <div class="card-footer">
        <span style="font-size: 0.875rem; color: #666;">
          <i class="fas fa-clock"></i> ${place.openingHours?.open || 'N/A'} - ${place.openingHours?.close || 'N/A'}
        </span>
        <a href="place.html?id=${place._id}" class="btn btn-outline btn-sm">
          View Details
        </a>
      </div>
    </div>
  `;
  
  return card;
}

// Initialize home page
async function initHomePage() {
  await loadStatistics();
  await loadFeaturedPlaces();
  
  // Add entrance animations to hero elements after a delay
  setTimeout(() => {
    document.querySelectorAll('.hero-content > *').forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;
      
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100);
    });
  }, 500);
}

// Initialize page when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomePage);
} else {
  initHomePage();
}