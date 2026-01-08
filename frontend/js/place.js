// Place Details Page JavaScript

let currentPlace = null;
let map = null;
let marker = null;

// Initialize page
async function initPlacePage() {
    // Get place ID from URL
    const placeId = FoodConnectUtils.getQueryParam('id');
    
    if (!placeId) {
        showError('No place specified');
        return;
    }
    
    // Load place data
    await loadPlaceData(placeId);
    
    // Initialize event listeners
    initEventListeners();
}

// Load place data from API
async function loadPlaceData(placeId) {
    try {
        // Show loading state
        document.getElementById('placeName').textContent = 'Loading...';
        
        // Fetch place data
        const response = await fetch(`/api/places/${placeId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Place not found');
        }
        
        const data = await response.json();
        currentPlace = data.data;
        
        // Render place data
        renderPlaceData();
        
        // Load reviews
        await loadReviews(placeId);
        
        // Initialize map if coordinates exist
        if (currentPlace.latitude && currentPlace.longitude) {
            initMap();
        }
        
    } catch (error) {
        console.error('Error loading place:', error);
        showError('Failed to load place details');
    }
}

// Render place data to the page
function renderPlaceData() {
    if (!currentPlace) return;
    
    // Basic info
    document.getElementById('placeName').textContent = currentPlace.name;
    document.getElementById('placeDescription').textContent = currentPlace.description;
    
    // Rating
    document.getElementById('placeRating').innerHTML = FoodConnectUtils.generateRatingStars(currentPlace.averageRating);
    
    // Cuisine
    document.getElementById('placeCuisine').innerHTML = `
        <span class="badge badge-primary">${currentPlace.cuisine}</span>
    `;
    
    // Veg badge
    const vegBadge = currentPlace.vegFlag ? 
        '<span class="badge badge-success"><i class="fas fa-leaf"></i> Vegetarian</span>' :
        '<span class="badge badge-danger"><i class="fas fa-drumstick-bite"></i> Non-Vegetarian</span>';
    document.getElementById('placeVegBadge').innerHTML = vegBadge;
    
    // Price range
    document.getElementById('placePrice').innerHTML = `
        <span class="badge badge-warning">${FoodConnectUtils.generatePriceRange(currentPlace.priceRange)}</span>
    `;
    
    // Like button
    const likeButtonContainer = document.getElementById('likeButtonContainer');
    if (window.currentUser) {
        const isSaved = currentPlace.isSaved || false;
        likeButtonContainer.innerHTML = `
            <button class="btn ${isSaved ? 'btn-danger' : 'btn-outline'} like-btn" 
                    style="border-color: ${isSaved ? '#dc3545' : 'var(--white)'}; color: ${isSaved ? '#dc3545' : 'var(--white)'};">
                <i class="fas fa-heart${isSaved ? '' : '-o'}"></i>
                ${isSaved ? 'Saved' : 'Save'}
            </button>
        `;
        
        // Add event listener
        const likeBtn = likeButtonContainer.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', handleLikeClick);
        }
    } else {
        likeButtonContainer.innerHTML = `
            <button class="btn btn-outline" onclick="window.location.href='login.html'"
                    style="border-color: var(--white); color: var(--white);">
                <i class="fas fa-heart"></i> Login to Save
            </button>
        `;
    }
    
    // Overview section
    document.getElementById('placeHours').textContent = 
        `${currentPlace.openingHours?.open || 'N/A'} - ${currentPlace.openingHours?.close || 'N/A'}`;
    
    document.getElementById('placeAddress').textContent = currentPlace.landmark || 'N/A';
    
    document.getElementById('placeContact').textContent = 
        currentPlace.contact?.phone || 'Contact not available';
    
    document.getElementById('placePopularity').innerHTML = `
        ${currentPlace.likeCount || 0} likes • ${currentPlace.reviewCount || 0} reviews
    `;
    
    // Location section
    document.getElementById('placeFullAddress').textContent = currentPlace.address;
    document.getElementById('placeLandmark').innerHTML = `
        <i class="fas fa-map-marker-alt"></i> ${currentPlace.landmark}
    `;
    
    // Directions button
    const directionsBtn = document.getElementById('directionsBtn');
    if (currentPlace.googleMapsUrl) {
        directionsBtn.href = currentPlace.googleMapsUrl;
    } else if (currentPlace.latitude && currentPlace.longitude) {
        directionsBtn.href = FoodConnectUtils.getGoogleMapsUrl(
            currentPlace.latitude, 
            currentPlace.longitude
        );
    }
    
    // Menu section
    renderMenu();
}

// Render menu items
function renderMenu() {
    const menuContainer = document.getElementById('menuContainer');
    
    if (!currentPlace.menu || currentPlace.menu.length === 0) {
        menuContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <p>Menu information not available</p>
            </div>
        `;
        return;
    }
    
    let menuHTML = '';
    
    currentPlace.menu.forEach(category => {
        menuHTML += `
            <div class="menu-category">
                <h3 style="margin-bottom: 1rem; color: var(--honey-garlic);">${category.category}</h3>
                <div class="menu-items">
        `;
        
        category.items.forEach(item => {
            const vegIcon = item.veg ? 
                '<i class="fas fa-leaf" style="color: #198754;"></i>' : 
                '<i class="fas fa-drumstick-bite" style="color: #dc3545;"></i>';
            
            menuHTML += `
                <div class="menu-item">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <strong>${item.name}</strong>
                            ${vegIcon}
                        </div>
                        ${item.description ? `<small style="color: #666;">${item.description}</small>` : ''}
                    </div>
                    <div style="font-weight: 600; color: var(--honey-garlic);">
                        ₹${item.price}
                    </div>
                </div>
            `;
        });
        
        menuHTML += `
                </div>
            </div>
        `;
    });
    
    menuContainer.innerHTML = menuHTML;
}

// Initialize map
function initMap() {
    const mapContainer = document.getElementById('mapContainer');
    
    if (!currentPlace.latitude || !currentPlace.longitude) {
        mapContainer.innerHTML = '<p>Location not available</p>';
        return;
    }
    
    // Initialize map
    map = L.map('mapContainer').setView([currentPlace.latitude, currentPlace.longitude], 15);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker
    marker = L.marker([currentPlace.latitude, currentPlace.longitude])
        .addTo(map)
        .bindPopup(`<b>${currentPlace.name}</b><br>${currentPlace.landmark}`)
        .openPopup();
}

// Load reviews
async function loadReviews(placeId) {
    try {
        const response = await fetch(`/api/reviews/place/${placeId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load reviews');
        
        const data = await response.json();
        renderReviews(data.data || []);
        
        // Show add review button if user is logged in
        const addReviewBtn = document.getElementById('addReviewBtn');
        if (window.currentUser) {
            addReviewBtn.style.display = 'block';
            
            // Check if user has already reviewed this place
            const userReview = data.data?.find(review => 
                review.userId?._id === window.currentUser._id
            );
            
            if (userReview) {
                addReviewBtn.disabled = true;
                addReviewBtn.innerHTML = '<i class="fas fa-check"></i> You Already Reviewed';
            }
        }
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        renderReviews([]);
    }
}

// Render reviews
function renderReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    if (reviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <p>No reviews yet. Be the first to review!</p>
            </div>
        `;
        return;
    }
    
    let reviewsHTML = '<div class="reviews-container">';
    
    reviews.forEach(review => {
        const userInitial = review.userId?.name?.charAt(0) || 'U';
        const userName = review.userId?.name || 'Anonymous';
        
        reviewsHTML += `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-user">
                        <div class="review-avatar">${userInitial}</div>
                        <div>
                            <strong>${userName}</strong>
                            <div style="font-size: 0.875rem; color: #666;">
                                ${FoodConnectUtils.formatDateTime(review.createdAt)}
                            </div>
                        </div>
                    </div>
                    <div>
                        ${FoodConnectUtils.generateRatingStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    <p>${review.text}</p>
                </div>
            </div>
        `;
    });
    
    reviewsHTML += '</div>';
    reviewsContainer.innerHTML = reviewsHTML;
}

// Initialize event listeners
function initEventListeners() {
    // Add review button
    const addReviewBtn = document.getElementById('addReviewBtn');
    const reviewFormContainer = document.getElementById('reviewFormContainer');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const reviewForm = document.getElementById('reviewForm');
    
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', () => {
            reviewFormContainer.classList.remove('hidden');
            addReviewBtn.style.display = 'none';
        });
    }
    
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', () => {
            reviewFormContainer.classList.add('hidden');
            if (window.currentUser) {
                addReviewBtn.style.display = 'block';
            }
            reviewForm.reset();
        });
    }
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    
    // Star rating
    const stars = document.querySelectorAll('.rating-input i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            setRating(rating);
        });
    });
}

// Set star rating
function setRating(rating) {
    const stars = document.querySelectorAll('.rating-input i');
    const ratingInput = document.getElementById('reviewRating');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('filled');
            star.classList.add('far');
            star.classList.remove('fas');
        }
    });
    
    ratingInput.value = rating;
}

// Handle review submission
async function handleReviewSubmit(event) {
    event.preventDefault();
    
    if (!window.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const rating = document.getElementById('reviewRating').value;
    const text = document.getElementById('reviewText').value.trim();
    
    if (!text) {
        FoodConnectUtils.showToast('Please write your review', 'warning');
        return;
    }
    
    try {
        const response = await FoodConnect.authFetch('/api/reviews', {
            method: 'POST',
            body: JSON.stringify({
                placeId: currentPlace._id,
                rating: parseInt(rating),
                text
            })
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast('Review submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('reviewForm').reset();
            setRating(5);
            
            // Hide form
            document.getElementById('reviewFormContainer').classList.add('hidden');
            document.getElementById('addReviewBtn').style.display = 'block';
            
            // Reload reviews
            await loadReviews(currentPlace._id);
            
            // Update place data
            await loadPlaceData(currentPlace._id);
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || 'Failed to submit review', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting review:', error);
        FoodConnectUtils.showToast('Failed to submit review', 'error');
    }
}

// Handle like button click
async function handleLikeClick(event) {
    if (!window.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const button = event.currentTarget;
    const isSaved = button.classList.contains('btn-danger');
    
    try {
        if (isSaved) {
            // Unlike - we need to find the saved record ID first
            const response = await FoodConnect.authFetch('/api/saved', {
                method: 'GET'
            });
            
            const savedData = await response.json();
            const savedPlace = savedData.data?.find(sp => sp._id === currentPlace._id || sp.placeId?._id === currentPlace._id);
            
            if (savedPlace) {
                await FoodConnect.authFetch(`/api/saved/${savedPlace._id}`, {
                    method: 'DELETE'
                });
                
                button.classList.remove('btn-danger');
                button.classList.add('btn-outline');
                button.innerHTML = '<i class="fas fa-heart-o"></i> Save';
                
                // Update like count
                currentPlace.likeCount = Math.max(0, currentPlace.likeCount - 1);
                updateLikeCount();
            }
        } else {
            // Like
            await FoodConnect.authFetch('/api/saved', {
                method: 'POST',
                body: JSON.stringify({ placeId: currentPlace._id })
            });
            
            button.classList.remove('btn-outline');
            button.classList.add('btn-danger');
            button.innerHTML = '<i class="fas fa-heart"></i> Saved';
            
            // Update like count
            currentPlace.likeCount = (currentPlace.likeCount || 0) + 1;
            updateLikeCount();
        }
        
        FoodConnectUtils.showToast(isSaved ? 'Removed from saved' : 'Added to saved', 'success');
        
    } catch (error) {
        console.error('Error toggling like:', error);
        FoodConnectUtils.showToast('Failed to update saved status', 'error');
    }
}

// Update like count display
function updateLikeCount() {
    const popularityElement = document.getElementById('placePopularity');
    if (popularityElement) {
        popularityElement.innerHTML = `
            ${currentPlace.likeCount || 0} likes • ${currentPlace.reviewCount || 0} reviews
        `;
    }
}

// Show error message
function showError(message) {
    const heroContent = document.querySelector('.place-hero-content');
    if (heroContent) {
        heroContent.innerHTML = `
            <div class="empty-state" style="color: var(--white);">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2>${message}</h2>
                <a href="spots.html" class="btn btn-secondary mt-2">
                    <i class="fas fa-arrow-left"></i> Back to Food Spots
                </a>
            </div>
        `;
    }
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlacePage);
} else {
    initPlacePage();
}