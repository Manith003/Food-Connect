// Food Spots Listing Page JavaScript

// const { console } = require("inspector");

let currentPage = 1;
let totalPages = 1;
let currentFilters = {
    veg: '',
    cuisine: '',
    priceRange: '',
    rating: '',
    search: '',
    sort: 'averageRating'
};

// DOM Elements
let placesContainer, paginationContainer;

// Initialize page
async function initSpotsPage() {
    placesContainer = document.getElementById('placesContainer');
    paginationContainer = document.getElementById('pagination');
    
    // Initialize event listeners
    initEventListeners();
    
    // Load places
    await loadPlaces();
}

// Initialize event listeners
function initEventListeners() {
    // Filter change listeners
    const filters = ['vegFilter', 'cuisineFilter', 'priceFilter', 'ratingFilter', 'sortFilter', 'searchInput'];
    
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', handleFilterChange);
        }
    });
    
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', FoodConnectUtils.debounce(handleFilterChange, 300));
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

// Handle filter changes
function handleFilterChange() {
    currentPage = 1;
    
    // Update current filters
    currentFilters = {
        veg: document.getElementById('vegFilter').checked ? 'true' : '',
        cuisine: document.getElementById('cuisineFilter').value,
        priceRange: document.getElementById('priceFilter').value,
        rating: document.getElementById('ratingFilter').value,
        search: document.getElementById('searchInput').value.trim(),
        sort: document.getElementById('sortFilter').value
    };
    
    // Load places with new filters
    loadPlaces();
}

// Clear all filters
function clearFilters() {
    document.getElementById('vegFilter').checked = false;
    document.getElementById('cuisineFilter').value = '';
    document.getElementById('priceFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('sortFilter').value = 'averageRating';
    
    currentFilters = {
        veg: '',
        cuisine: '',
        priceRange: '',
        rating: '',
        search: '',
        sort: 'averageRating'
    };
    
    currentPage = 1;
    loadPlaces();
}

// Load places from API
async function loadPlaces() {
    try {
        // Show loading state
        placesContainer.innerHTML = `
            <div class="places-grid">
                ${FoodConnectUtils.createSkeleton('card', 6)}
            </div>
        `;
        
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 12,
            sort: currentFilters.sort
        });
        
        // Add filters to params
        if (currentFilters.veg) params.append('veg', currentFilters.veg);
        if (currentFilters.cuisine) params.append('cuisine', currentFilters.cuisine);
        if (currentFilters.priceRange) params.append('priceRange', currentFilters.priceRange);
        if (currentFilters.rating) params.append('rating', currentFilters.rating);
        if (currentFilters.search) params.append('search', currentFilters.search);
        
        // Make API request
        const response = await fetch(`/api/places?${params.toString()}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load places');
        
        const data = await response.json();
        
        // Update pagination info
        totalPages = data.pagination?.pages || 1;
        currentPage = data.pagination?.page || 1;
        
        // Render places
        renderPlaces(data.data || []);
        
        // Render pagination if needed
        renderPagination();
        
    } catch (error) {
        console.error('Error loading places:', error);
        placesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Failed to Load Places</h3>
                <p>There was an error loading food spots. Please try again.</p>
                <button onclick="loadPlaces()" class="btn btn-primary mt-2">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Render places to the grid
function renderPlaces(places) {
    if (places.length === 0) {
        placesContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No Places Found</h3>
                <p>Try adjusting your filters to find more food spots.</p>
                <button onclick="clearFilters()" class="btn btn-primary mt-2">
                    Clear All Filters
                </button>
            </div>
        `;
        paginationContainer.classList.add('hidden');
        return;
    }
    
    const placesGrid = document.createElement('div');
    placesGrid.className = 'places-grid';
    
    places.forEach((place, index) => {
        const placeCard = createPlaceCard(place);
        placeCard.style.animationDelay = `${index * 0.05}s`;
        placesGrid.appendChild(placeCard);
    });
    
    placesContainer.innerHTML = '';
    placesContainer.appendChild(placesGrid);
    paginationContainer.classList.remove('hidden');
}

// Create a place card element
function createPlaceCard(place) {
    const card = document.createElement('div');
    card.className = 'card hover-lift slide-up';
    card.style.opacity = '0';
    // Determine if place is vegetarian
    const vegBadge = place.vegFlag ? 
        `<span class="badge badge-success"><i class="fas fa-leaf"></i> Veg</span>` : 
        `<span class="badge badge-danger"><i class="fas fa-drumstick-bite"></i> Non-Veg</span>`;
    
    // Generate rating stars
    const ratingStars = FoodConnectUtils.generateRatingStars(place.averageRating);
    
    // Create like button if user is logged in
    let likeButton = '';
    if (window.currentUser) {
        const isSaved = place.isSaved || false;
        likeButton = `
            <button class="btn btn-sm like-btn" data-place-id="${place._id}" data-saved="${isSaved}" 
                    style="background: none; border: none; color: ${isSaved ? '#dc3545' : '#6c757d'};">
                <i class="fas fa-heart${isSaved ? '' : '-o'}"></i>
            </button>
        `;
    }
    
    // Create card content
    card.innerHTML = `
        <div class="card-img">
        <img src="${place.images[0]}" />
            
            ${likeButton}
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
            <p class="card-description">${FoodConnectUtils.truncateText(place.description, 120)}</p>
            <div style="margin-top: auto;">
                ${ratingStars}
                <p style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
                    <i class="fas fa-map-marker-alt"></i> ${place.landmark}
                </p>
                <p style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                    <i class="fas fa-clock"></i> ${place.openingHours?.open || 'N/A'} - ${place.openingHours?.close || 'N/A'}
                </p>
            </div>
            <div class="card-footer">
                <span style="font-size: 0.875rem; color: #666;">
                    <i class="fas fa-users"></i> ${place.likeCount || 0} likes
                </span>
                <a href="place.html?id=${place._id}" class="btn btn-outline btn-sm">
                    View Details
                </a>
            </div>
        </div>
    `;
    
    // Add like button functionality
    const likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLikeClick);
    }
    
    return card;
}

// Handle like button click
async function handleLikeClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!window.currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const button = event.currentTarget;
    const placeId = button.getAttribute('data-place-id');
    const isSaved = button.getAttribute('data-saved') === 'true';
    
    try {
        if (isSaved) {
            // Unlike - we need to find the saved record ID first
            const response = await FoodConnect.authFetch('/api/saved', {
                method: 'GET',
                credentials: 'include'
            });
            
            const savedData = await response.json();
            const savedPlace = savedData.data?.find(sp => sp._id === placeId || sp.placeId?._id === placeId);
            
            if (savedPlace) {
                await FoodConnect.authFetch(`/api/saved/${savedPlace._id}`, {
                    method: 'DELETE'
                });
                
                button.innerHTML = '<i class="fas fa-heart-o"></i>';
                button.style.color = '#6c757d';
                button.setAttribute('data-saved', 'false');
                
                // Update like count in card
                const likeCountEl = button.closest('.card').querySelector('.card-footer span');
                if (likeCountEl) {
                    const currentCount = parseInt(likeCountEl.textContent.match(/\d+/)[0]) || 0;
                    likeCountEl.innerHTML = `<i class="fas fa-users"></i> ${Math.max(0, currentCount - 1)} likes`;
                }
            }
        } else {
            // Like
            await FoodConnect.authFetch('/api/saved', {
                method: 'POST',
                body: JSON.stringify({ placeId }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.style.color = '#dc3545';
            button.setAttribute('data-saved', 'true');
            
            // Update like count in card
            const likeCountEl = button.closest('.card').querySelector('.card-footer span');
            if (likeCountEl) {
                const currentCount = parseInt(likeCountEl.textContent.match(/\d+/)[0]) || 0;
                likeCountEl.innerHTML = `<i class="fas fa-users"></i> ${currentCount + 1} likes`;
            }
        }
        
        FoodConnectUtils.showToast(isSaved ? 'Removed from saved' : 'Added to saved', 'success');
        
    } catch (error) {
        console.error('Error toggling like:', error);
        FoodConnectUtils.showToast('Failed to update saved status', 'error');
    }
}

// Render pagination controls
function renderPagination() {
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        paginationContainer.classList.add('hidden');
        return;
    }
    
    let paginationHTML = '<ul class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="changePage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <li class="page-item">
                    <button class="page-link ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                        ${i}
                    </button>
                </li>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += '<li class="page-item"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="changePage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </li>
        `;
    }
    
    paginationHTML += '</ul>';
    paginationContainer.innerHTML = paginationHTML;
    paginationContainer.classList.remove('hidden');
}

// Change page
function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    loadPlaces();
    
    // Scroll to top of places
    placesContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpotsPage);
} else {
    initSpotsPage();
}

// Export functions for global use
window.changePage = changePage;