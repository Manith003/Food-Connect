// Admin Panel JavaScript

// Initialize page
async function initAdminPage() {
    // Check if user is admin
    if (!window.currentUser || window.currentUser.role !== 'admin') {
        document.getElementById('accessDeniedMessage').classList.remove('hidden');
        return;
    }
    
    document.getElementById('adminContent').classList.remove('hidden');
    
    // Initialize event listeners
    initEventListeners();
    
    // Load dashboard data
    await loadDashboardData();
    
    // Load users
    await loadUsers();
    
    // Load communities
    await loadCommunities();
}

// Initialize event listeners
function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Search users
    const searchUsersInput = document.getElementById('searchUsers');
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', FoodConnectUtils.debounce(searchUsers, 300));
    }
}

// Switch tabs
function switchTab(tabId) {
    // Update active tab
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });
    
    // Show active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    // Load data for the tab if needed
    if (tabId === 'reports') {
        loadReports();
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await FoodConnect.authFetch('/api/admin/reports');
        const data = await response.json();
        
        if (data.success) {
            renderDashboardStats(data.data);
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('dashboardStats').innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <p>Failed to load dashboard data. Please try again.</p>
            </div>
        `;
    }
}

// Render dashboard stats
function renderDashboardStats(data) {
    const userStats = data.userStats || {};
    const placeStats = data.placeStats || {};
    
    const statsHTML = `
        <div class="stat-card">
            <div class="stat-value">${userStats.totalUsers || 0}</div>
            <div class="stat-label">Total Users</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${userStats.activeUsers || 0}</div>
            <div class="stat-label">Active Users</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${userStats.adminUsers || 0}</div>
            <div class="stat-label">Admins</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${placeStats.totalPlaces || 0}</div>
            <div class="stat-label">Food Spots</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${placeStats.totalReviews || 0}</div>
            <div class="stat-label">Total Reviews</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${placeStats.avgRating ? placeStats.avgRating.toFixed(1) : '0.0'}</div>
            <div class="stat-label">Avg Rating</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${placeStats.totalLikes || 0}</div>
            <div class="stat-label">Total Likes</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-value">${data.mostActiveCommunities?.length || 0}</div>
            <div class="stat-label">Active Groups</div>
        </div>
    `;
    
    document.getElementById('dashboardStats').innerHTML = statsHTML;
}

// Load users
async function loadUsers() {
    try {
        const response = await FoodConnect.authFetch('/api/admin/users');
        const data = await response.json();
        
        if (data.success) {
            renderUsers(data.data || []);
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p>Failed to load users. Please try again.</p>
                    <button onclick="loadUsers()" class="btn btn-primary mt-2">
                        Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// Render users table
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p>No users found.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    users.forEach(user => {
        const joinedDate = FoodConnectUtils.formatDate(user.createdAt);
        const isActive = user.isActive !== false;
        const isAdmin = user.role === 'admin';
        
        html += `
            <tr data-user-id="${user._id}">
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; background: var(--champagne); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: var(--burnt-coffee);">
                            ${user.name?.charAt(0) || 'U'}
                        </div>
                        <span>${user.name}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${isAdmin ? 'status-admin' : 'status-user'}">
                        ${isAdmin ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${joinedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline toggle-role-btn" 
                                data-user-id="${user._id}" 
                                data-current-role="${user.role}">
                            ${isAdmin ? 'Make User' : 'Make Admin'}
                        </button>
                        <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-success'} toggle-status-btn"
                                data-user-id="${user._id}"
                                data-current-status="${isActive}">
                            ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.toggle-role-btn').forEach(btn => {
        btn.addEventListener('click', toggleUserRole);
    });
    
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', toggleUserStatus);
    });
}

// Search users
async function searchUsers() {
    const searchTerm = document.getElementById('searchUsers').value.trim().toLowerCase();
    
    try {
        const response = await FoodConnect.authFetch('/api/admin/users');
        const data = await response.json();
        
        if (!data.success) return;
        
        const users = data.data || [];
        
        if (searchTerm) {
            const filteredUsers = users.filter(user => 
                user.name?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm)
            );
            renderUsers(filteredUsers);
        } else {
            renderUsers(users);
        }
        
    } catch (error) {
        console.error('Error searching users:', error);
    }
}

// Toggle user role
async function toggleUserRole(event) {
    const button = event.currentTarget;
    const userId = button.getAttribute('data-user-id');
    const currentRole = button.getAttribute('data-current-role');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    const confirmed = await FoodConnectUtils.showConfirmation(
        `Are you sure you want to make this user ${newRole === 'admin' ? 'an administrator' : 'a regular user'}?`,
        'Change User Role'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await FoodConnect.authFetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role: newRole })
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast(`User role updated to ${newRole}`, 'success');
            
            // Update button
            button.setAttribute('data-current-role', newRole);
            button.textContent = newRole === 'admin' ? 'Make User' : 'Make Admin';
            
            // Update status badge
            const row = button.closest('tr');
            const roleBadge = row.querySelector('.status-badge');
            roleBadge.className = `status-badge ${newRole === 'admin' ? 'status-admin' : 'status-user'}`;
            roleBadge.textContent = newRole === 'admin' ? 'Admin' : 'User';
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || 'Failed to update user role', 'error');
        }
        
    } catch (error) {
        console.error('Error updating user role:', error);
        FoodConnectUtils.showToast('Failed to update user role', 'error');
    }
}

// Toggle user status
async function toggleUserStatus(event) {
    const button = event.currentTarget;
    const userId = button.getAttribute('data-user-id');
    const currentStatus = button.getAttribute('data-current-status') === 'true';
    const newStatus = !currentStatus;
    
    const action = newStatus ? 'activate' : 'deactivate';
    const confirmed = await FoodConnectUtils.showConfirmation(
        `Are you sure you want to ${action} this user?`,
        `${action.charAt(0).toUpperCase() + action.slice(1)} User`
    );
    
    if (!confirmed) return;
    
    try {
        const response = await FoodConnect.authFetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ isActive: newStatus })
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast(`User ${action}d successfully`, 'success');
            
            // Update button
            button.setAttribute('data-current-status', newStatus);
            button.textContent = newStatus ? 'Deactivate' : 'Activate';
            button.className = `btn btn-sm ${newStatus ? 'btn-danger' : 'btn-success'} toggle-status-btn`;
            
            // Update status badge
            const row = button.closest('tr');
            const statusBadge = row.querySelectorAll('.status-badge')[1];
            statusBadge.className = `status-badge ${newStatus ? 'status-active' : 'status-inactive'}`;
            statusBadge.textContent = newStatus ? 'Active' : 'Inactive';
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || `Failed to ${action} user`, 'error');
        }
        
    } catch (error) {
        console.error('Error updating user status:', error);
        FoodConnectUtils.showToast(`Failed to ${action} user`, 'error');
    }
}

// Load communities
async function loadCommunities() {
    try {
        const response = await FoodConnect.authFetch('/api/admin/communities');
        const data = await response.json();
        
        if (data.success) {
            renderCommunities(data.data || []);
        }
        
    } catch (error) {
        console.error('Error loading communities:', error);
        document.getElementById('communitiesTableBody').innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p>Failed to load communities. Please try again.</p>
                    <button onclick="loadCommunities()" class="btn btn-primary mt-2">
                        Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// Render communities table
function renderCommunities(communities) {
    const tbody = document.getElementById('communitiesTableBody');
    
    if (communities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <p>No communities found.</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    communities.forEach(community => {
        const createdDate = FoodConnectUtils.formatDate(community.createdAt);
        const memberCount = community.members?.length || 0;
        const isPrivate = community.isPrivate;
        
        html += `
            <tr data-community-id="${community._id}">
                <td>
                    <strong>${community.name}</strong>
                    <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                        ${community.description}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${isPrivate ? 'status-inactive' : 'status-active'}">
                        ${isPrivate ? 'Private' : 'Public'}
                    </span>
                </td>
                <td>${memberCount} members</td>
                <td>${community.createdBy?.name || 'Unknown'}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-danger delete-community-btn"
                                data-community-id="${community._id}"
                                data-community-name="${community.name}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.delete-community-btn').forEach(btn => {
        btn.addEventListener('click', deleteCommunity);
    });
}

// Delete community
async function deleteCommunity(event) {
    const button = event.currentTarget;
    const communityId = button.getAttribute('data-community-id');
    const communityName = button.getAttribute('data-community-name');
    
    const confirmed = await FoodConnectUtils.showConfirmation(
        `Are you sure you want to delete the community "${communityName}"? This action cannot be undone.`,
        'Delete Community'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await FoodConnect.authFetch(`/api/admin/communities/${communityId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast('Community deleted successfully', 'success');
            
            // Remove row from table
            const row = button.closest('tr');
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            row.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                row.remove();
                
                // Show empty state if no communities left
                const remainingRows = document.querySelectorAll('#communitiesTableBody tr');
                if (remainingRows.length === 0) {
                    document.getElementById('communitiesTableBody').innerHTML = `
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 2rem;">
                                <p>No communities found.</p>
                            </td>
                        </tr>
                    `;
                }
            }, 300);
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || 'Failed to delete community', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting community:', error);
        FoodConnectUtils.showToast('Failed to delete community', 'error');
    }
}

// Load reports
async function loadReports() {
    try {
        const response = await FoodConnect.authFetch('/api/admin/reports');
        const data = await response.json();
        
        if (data.success) {
            renderReports(data.data);
        }
        
    } catch (error) {
        console.error('Error loading reports:', error);
        document.getElementById('reportsContainer').innerHTML = `
            <div class="empty-state">
                <p>Failed to load reports. Please try again.</p>
                <button onclick="loadReports()" class="btn btn-primary mt-2">
                    Retry
                </button>
            </div>
        `;
    }
}

// Render reports
function renderReports(data) {
    const container = document.getElementById('reportsContainer');
    
    let html = `
        <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card">
                <div class="stat-value">${data.userStats?.totalUsers || 0}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.userStats?.activeUsers || 0}</div>
                <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.placeStats?.totalPlaces || 0}</div>
                <div class="stat-label">Food Spots</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.placeStats?.totalReviews || 0}</div>
                <div class="stat-label">Total Reviews</div>
            </div>
        </div>
    `;
    
    // Most Liked Places
    if (data.mostLikedPlaces?.length > 0) {
        html += `
            <div class="chart-card">
                <h3 class="chart-title">Most Liked Food Spots</h3>
                <div class="bar-chart">
        `;
        
        data.mostLikedPlaces.slice(0, 5).forEach(place => {
            const maxLikes = data.mostLikedPlaces[0]?.likeCount || 1;
            const percentage = (place.likeCount / maxLikes) * 100;
            
            html += `
                <div class="bar-item">
                    <div class="bar-label">${FoodConnectUtils.truncateText(place.name, 20)}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="bar-value">${place.likeCount}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Most Reviewed Places
    if (data.mostReviewedPlaces?.length > 0) {
        html += `
            <div class="chart-card">
                <h3 class="chart-title">Most Reviewed Food Spots</h3>
                <div class="bar-chart">
        `;
        
        data.mostReviewedPlaces.slice(0, 5).forEach(place => {
            const maxReviews = data.mostReviewedPlaces[0]?.reviewCount || 1;
            const percentage = (place.reviewCount / maxReviews) * 100;
            
            html += `
                <div class="bar-item">
                    <div class="bar-label">${FoodConnectUtils.truncateText(place.name, 20)}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="bar-value">${place.reviewCount}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Most Active Communities
    if (data.mostActiveCommunities?.length > 0) {
        html += `
            <div class="chart-card">
                <h3 class="chart-title">Most Active Communities</h3>
                <div class="bar-chart">
        `;
        
        data.mostActiveCommunities.slice(0, 5).forEach(community => {
            const maxMessages = data.mostActiveCommunities[0]?.messageCount || 1;
            const percentage = (community.messageCount / maxMessages) * 100;
            
            html += `
                <div class="bar-item">
                    <div class="bar-label">${FoodConnectUtils.truncateText(community.name, 20)}</div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <div class="bar-value">${community.messageCount}</div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Additional stats
    html += `
        <div class="chart-card" style="grid-column: 1 / -1;">
            <h3 class="chart-title">Platform Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <h4 style="color: var(--burnt-coffee); margin-bottom: 0.5rem;">User Distribution</h4>
                    <div class="bar-chart">
                        <div class="bar-item">
                            <div class="bar-label">Admins</div>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${(data.userStats?.adminUsers / data.userStats?.totalUsers) * 100 || 0}%;"></div>
                            </div>
                            <div class="bar-value">${data.userStats?.adminUsers || 0}</div>
                        </div>
                        <div class="bar-item">
                            <div class="bar-label">Users</div>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${((data.userStats?.totalUsers - data.userStats?.adminUsers) / data.userStats?.totalUsers) * 100 || 0}%;"></div>
                            </div>
                            <div class="bar-value">${(data.userStats?.totalUsers || 0) - (data.userStats?.adminUsers || 0)}</div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--burnt-coffee); margin-bottom: 0.5rem;">Engagement</h4>
                    <div class="bar-chart">
                        <div class="bar-item">
                            <div class="bar-label">Avg Rating</div>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${(data.placeStats?.avgRating || 0) * 20}%;"></div>
                            </div>
                            <div class="bar-value">${data.placeStats?.avgRating?.toFixed(1) || '0.0'}</div>
                        </div>
                        <div class="bar-item">
                            <div class="bar-label">Likes/Place</div>
                            <div class="bar-track">
                                <div class="bar-fill" style="width: ${Math.min(((data.placeStats?.totalLikes || 0) / (data.placeStats?.totalPlaces || 1)) * 5, 100)}%;"></div>
                            </div>
                            <div class="bar-value">${Math.round((data.placeStats?.totalLikes || 0) / (data.placeStats?.totalPlaces || 1))}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    initAdminPage();
}

// Export for global use
window.switchTab = switchTab;