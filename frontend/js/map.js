// Map Page JavaScript

let map = null;
let markers = [];
let userMarker = null;
let currentPlaces = [];
const loyolaCollegeCoords = [13.0650, 80.2533];

// Initialize page
async function initMapPage() {
    // Initialize map
    initMap();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load places
    await loadPlaces();
}

// Initialize map
function initMap() {
    // Create map instance
    map = L.map('map').setView(loyolaCollegeCoords, 15);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add Loyola College marker
    const loyolaMarker = L.marker(loyolaCollegeCoords)
        .addTo(map)
        .bindPopup('<b>Loyola College</b><br>Chennai, Tamil Nadu')
        .openPopup();
    
    // Add custom icon for Loyola College
    L.marker(loyolaCollegeCoords, {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background-color: var(--honey-garlic); color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fas fa-university"></i></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        })
    }).addTo(map);
}

// Initialize event listeners
function initEventListeners() {
    // My location button
    const myLocationBtn = document.getElementById('myLocationBtn');
    if (myLocationBtn) {
        myLocationBtn.addEventListener('click', getUserLocation);
    }
    
    // Reset view button
    const resetViewBtn = document.getElementById('resetViewBtn');
    if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
            map.setView(loyolaCollegeCoords, 15);
        });
    }
    
    // Search input
    const searchInput = document.getElementById('searchPlaces');
    if (searchInput) {
        searchInput.addEventListener('input', FoodConnectUtils.debounce(searchPlaces, 300));
    }
}

// Get user location
async function getUserLocation() {
    try {
        const location = await FoodConnectUtils.getUserLocation();
        
        // Center map on user location
        map.setView([location.latitude, location.longitude], 16);
        
        // Remove existing user marker
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        
        // Add user marker
        userMarker = L.marker([location.latitude, location.longitude], {
            icon: L.divIcon({
                className: 'custom-div-icon',
                html: '<div style="background-color: #4285F4; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fas fa-user"></i></div>',
                iconSize: [30, 30],
                iconAnchor: [15, 30]
            })
        })
        .addTo(map)
        .bindPopup('<b>Your Location</b>')
        .openPopup();
        
        // Load nearby places
        await loadNearbyPlaces(location.latitude, location.longitude);
        
        FoodConnectUtils.showToast('Location found! Showing nearby food spots.', 'success');
        
    } catch (error) {
        console.error('Error getting location:', error);
        FoodConnectUtils.showToast('Could not get your location. Please enable location services.', 'error');
    }
}

// Load all places
async function loadPlaces() {
    try {
        const response = await fetch('/api/places?limit=50', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load places');
        
        const data = await response.json();
        currentPlaces = data.data || [];
        
        // Render places in sidebar
        renderPlacesList(currentPlaces);
        
        // Add markers to map
        addMarkersToMap(currentPlaces);
        
    } catch (error) {
        console.error('Error loading places:', error);
        showError('Failed to load food spots');
    }
}

// Load nearby places
async function loadNearbyPlaces(lat, lng) {
    try {
        const response = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=3`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load nearby places');
        
        const data = await response.json();
        const nearbyPlaces = data.data || [];
        
        // Clear existing markers
        clearMarkers();
        
        // Update current places
        currentPlaces = nearbyPlaces;
        
        // Render places in sidebar
        renderPlacesList(nearbyPlaces);
        
        // Add markers to map
        addMarkersToMap(nearbyPlaces);
        
    } catch (error) {
        console.error('Error loading nearby places:', error);
    }
}

// Add markers to map
function addMarkersToMap(places) {
    clearMarkers();
    
    places.forEach(place => {
        if (!place.latitude || !place.longitude) return;
        
        // Create custom icon based on rating
        const iconColor = place.averageRating >= 4 ? '#FFD700' : 
                         place.averageRating >= 3 ? '#FFA500' : '#DC3545';
        
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${iconColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><i class="fas fa-utensils"></i></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        const marker = L.marker([place.latitude, place.longitude], { icon })
            .addTo(map)
            .bindPopup(createMarkerPopup(place));
        
        markers.push(marker);
    });
}

// Clear all markers
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// Create marker popup content
function createMarkerPopup(place) {
    const vegIcon = place.vegFlag ? 
        '<i class="fas fa-leaf" style="color: #198754;"></i>' : 
        '<i class="fas fa-drumstick-bite" style="color: #dc3545;"></i>';
    
    return `
        <div style="min-width: 200px;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: var(--honey-garlic);">${place.name}</h4>
                ${vegIcon}
            </div>
            <div style="margin-bottom: 0.5rem;">
                ${FoodConnectUtils.generateRatingStars(place.averageRating)}
            </div>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #666;">
                <i class="fas fa-map-marker-alt"></i> ${place.landmark}
            </p>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #666;">
                <i class="fas fa-tag"></i> ${place.cuisine}
            </p>
            <div style="display: flex; gap: 0.5rem;">
                <a href="place.html?id=${place._id}" 
                   style="background: var(--honey-garlic); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; text-decoration: none; font-size: 0.875rem;">
                    View Details
                </a>
                <a href="${FoodConnectUtils.getGoogleMapsUrl(place.latitude, place.longitude)}" 
                   target="_blank"
                   style="background: var(--champagne); color: var(--burnt-coffee); padding: 0.25rem 0.75rem; border-radius: 4px; text-decoration: none; font-size: 0.875rem;">
                    Directions
                </a>
            </div>
        </div>
    `;
}

// Render places list in sidebar
function renderPlacesList(places) {
    const placesList = document.getElementById('placesList');
    
    if (places.length === 0) {
        placesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-map-marker-alt" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <p>No food spots found in this area</p>
            </div>
        `;
        return;
    }
    
    // Calculate distances if we have user location
    let placesWithDistance = places;
    if (userMarker) {
        const userLat = userMarker.getLatLng().lat;
        const userLng = userMarker.getLatLng().lng;
        
        placesWithDistance = places.map(place => {
            const distance = FoodConnectUtils.calculateDistance(
                userLat, userLng,
                place.latitude, place.longitude
            );
            return { ...place, distance };
        }).sort((a, b) => a.distance - b.distance);
    }
    
    let placesHTML = '';
    
    placesWithDistance.forEach((place, index) => {
        const vegIcon = place.vegFlag ? 
            '<i class="fas fa-leaf" style="color: #198754; margin-right: 0.25rem;"></i>' : 
            '<i class="fas fa-drumstick-bite" style="color: #dc3545; margin-right: 0.25rem;"></i>';
        
        placesHTML += `
            <div class="place-item" data-place-id="${place._id}" data-index="${index}">
                <div class="place-meta">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${vegIcon}
                        <strong>${place.name}</strong>
                    </div>
                    <div class="rating">
                        ${FoodConnectUtils.generateRatingStars(place.averageRating, 3)}
                    </div>
                </div>
                <p style="font-size: 0.875rem; color: #666; margin-bottom: 0.5rem;">
                    ${place.cuisine} • ${FoodConnectUtils.generatePriceRange(place.priceRange)}
                </p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.875rem; color: #666;">
                        <i class="fas fa-map-marker-alt"></i> ${place.landmark}
                    </span>
                    ${place.distance ? `
                        <span class="place-distance">
                            ${FoodConnectUtils.formatDistance(place.distance)}
                        </span>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    placesList.innerHTML = placesHTML;
    
    // Add click event listeners to place items
    document.querySelectorAll('.place-item').forEach(item => {
        item.addEventListener('click', () => {
            const placeId = item.getAttribute('data-place-id');
            const index = parseInt(item.getAttribute('data-index'));
            
            // Highlight active item
            document.querySelectorAll('.place-item').forEach(i => {
                i.classList.remove('active');
            });
            item.classList.add('active');
            
            // Get the corresponding marker
            const marker = markers[index];
            if (marker) {
                // Center map on marker
                map.setView(marker.getLatLng(), 16);
                
                // Open popup
                marker.openPopup();
            }
        });
    });
}

// Search places
function searchPlaces() {
    const searchInput = document.getElementById('searchPlaces');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderPlacesList(currentPlaces);
        return;
    }
    
    const filteredPlaces = currentPlaces.filter(place => {
        return place.name.toLowerCase().includes(searchTerm) ||
               place.cuisine.toLowerCase().includes(searchTerm) ||
               place.description.toLowerCase().includes(searchTerm) ||
               place.landmark.toLowerCase().includes(searchTerm);
    });
    
    renderPlacesList(filteredPlaces);
}

// Show error message
function showError(message) {
    const placesList = document.getElementById('placesList');
    if (placesList) {
        placesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <p>${message}</p>
                <button onclick="loadPlaces()" class="btn btn-primary mt-2">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapPage);
} else {
    initMapPage();
}