// Polls Page JavaScript

let userCommunities = [];

// Initialize page
async function initPollsPage() {
    // Check if user is logged in
    if (!window.currentUser) {
        document.getElementById('notLoggedInMessage').classList.remove('hidden');
        return;
    }
    
    document.getElementById('loggedInContent').classList.remove('hidden');
    
    // Load user's communities
    await loadUserCommunities();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load polls
    await loadAllPolls();
}

// Load user's communities
async function loadUserCommunities() {
    try {
        const response = await FoodConnect.authFetch('/api/communities/my');
        const data = await response.json();
        
        userCommunities = data.data || [];
        
        // Populate community filters
        populateCommunityFilters();
        
    } catch (error) {
        console.error('Error loading communities:', error);
        FoodConnectUtils.showToast('Failed to load communities', 'error');
    }
}

// Populate community filters
function populateCommunityFilters() {
    const communityFilter = document.getElementById('communityFilter');
    const pollCommunitySelect = document.getElementById('pollCommunity');
    
    if (!communityFilter || !pollCommunitySelect) return;
    
    // Clear existing options (keep "All Communities")
    while (communityFilter.options.length > 1) communityFilter.remove(1);
    while (pollCommunitySelect.options.length > 0) pollCommunitySelect.remove(0);
    
    if (userCommunities.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No communities available';
        pollCommunitySelect.appendChild(option);
        return;
    }
    
    userCommunities.forEach(community => {
        // Add to main filter
        const filterOption = document.createElement('option');
        filterOption.value = community._id;
        filterOption.textContent = community.name;
        communityFilter.appendChild(filterOption);
        
        // Add to poll creation select
        const pollOption = document.createElement('option');
        pollOption.value = community._id;
        pollOption.textContent = community.name;
        pollCommunitySelect.appendChild(pollOption);
    });
}

// Initialize event listeners
function initEventListeners() {
    // Community filter
    const communityFilter = document.getElementById('communityFilter');
    if (communityFilter) {
        communityFilter.addEventListener('change', loadAllPolls);
    }
    
    // Create poll button
    const createPollBtn = document.getElementById('createPollBtn');
    if (createPollBtn) {
        createPollBtn.addEventListener('click', () => {
            document.getElementById('createPollModal').classList.add('active');
        });
    }
    
    // Create poll form
    const createPollForm = document.getElementById('createPollForm');
    if (createPollForm) {
        createPollForm.addEventListener('submit', handleCreatePoll);
        
        // Add poll option button
        document.getElementById('addPollOptionBtn').addEventListener('click', addPollOption);
        
        // Initialize poll options
        document.querySelectorAll('.remove-option-btn').forEach(btn => {
            btn.addEventListener('click', removePollOption);
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Close modal on outside click
    const modal = document.getElementById('createPollModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Load all polls
async function loadAllPolls() {
    const communityFilter = document.getElementById('communityFilter');
    const selectedCommunityId = communityFilter ? communityFilter.value : 'all';
    
    try {
        // Show loading state
        document.getElementById('pollsContainer').innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
        
        let allPolls = [];
        
        if (selectedCommunityId === 'all') {
            // Load polls from all communities
            const pollPromises = userCommunities.map(community => 
                loadCommunityPolls(community._id).catch(() => [])
            );
            
            const results = await Promise.all(pollPromises);
            allPolls = results.flat();
            
        } else {
            // Load polls from specific community
            allPolls = await loadCommunityPolls(selectedCommunityId);
        }
        
        // Sort by created date (newest first)
        allPolls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        renderPolls(allPolls);
        
    } catch (error) {
        console.error('Error loading polls:', error);
        document.getElementById('pollsContainer').innerHTML = `
            <div class="empty-state">
                <p>Failed to load polls. Please try again.</p>
                <button onclick="loadAllPolls()" class="btn btn-primary mt-2">
                    Retry
                </button>
            </div>
        `;
    }
}

// Load polls for a specific community
async function loadCommunityPolls(communityId) {
    try {
        const response = await FoodConnect.authFetch(`/api/communities/${communityId}/polls`);
        const data = await response.json();
        
        if (data.success) {
            return data.data || [];
        }
        return [];
        
    } catch (error) {
        console.error(`Error loading polls for community ${communityId}:`, error);
        return [];
    }
}

// Render polls
function renderPolls(polls) {
    const container = document.getElementById('pollsContainer');
    
    if (polls.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-poll" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <h3>No Polls Found</h3>
                <p>There are no polls available in the selected communities.</p>
                <button onclick="document.getElementById('createPollModal').classList.add('active')" 
                        class="btn btn-primary mt-2">
                    Create First Poll
                </button>
            </div>
        `;
        return;
    }
    
    let html = '<div class="polls-grid">';
    
    polls.forEach(poll => {
        const community = userCommunities.find(c => c._id === poll.communityId);
        const communityName = community?.name || 'Unknown Community';
        const isClosed = !poll.isActive || (poll.closesAt && new Date(poll.closesAt) < new Date());
        const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votesCount || 0), 0) || 0;
        const userHasVoted = poll.hasVoted || false;
        const userChoiceId = poll.userVoteId;
        
        html += `
            <div class="poll-card slide-up">
                <div class="poll-header">
                    <h3 style="margin: 0; flex: 1;">${poll.question}</h3>
                    <span class="badge ${isClosed ? 'badge-secondary' : 'badge-primary'}">
                        ${isClosed ? 'Closed' : 'Active'}
                    </span>
                </div>
                
                <div class="poll-meta">
                    <span><i class="fas fa-users"></i> ${communityName}</span>
                    <span><i class="fas fa-user"></i> ${poll.createdBy?.name || 'Unknown'}</span>
                    ${poll.closesAt ? `
                        <span><i class="fas fa-clock"></i> ${FoodConnectUtils.formatDate(poll.closesAt)}</span>
                    ` : ''}
                </div>
                
                <div class="poll-options">
        `;
        
        poll.options.forEach(option => {
            const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
            const isUserChoice = userHasVoted && userChoiceId === option._id;
            const isDisabled = isClosed || userHasVoted;
            
            html += `
                <div class="poll-option ${isUserChoice ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                      data-poll-id="${poll._id}" 
                      data-option-id="${option._id}"
                      ${!isDisabled ? 'onclick="voteInPoll(event)"' : ''}>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>
                            ${option.text}
                            ${isUserChoice ? '<i class="fas fa-check" style="color: #198754; margin-left: 0.5rem;"></i>' : ''}
                        </span>
                        ${isDisabled ? `<span style="font-weight: 600;">${percentage}%</span>` : ''}
                    </div>
                    
                    ${isDisabled ? `
                        <div class="option-result">
                            <div class="result-bar">
                                <div class="result-fill" style="width: ${percentage}%;"></div>
                            </div>
                            <div class="result-percentage">${percentage}%</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
                
                <div class="poll-footer">
                    <div class="vote-count">
                        <i class="fas fa-vote-yea"></i> ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}
                    </div>
                    
                    ${!isClosed && !userHasVoted ? `
                        <div style="font-size: 0.875rem; color: #666;">
                            Click an option to vote
                        </div>
                    ` : isClosed ? `
                        <div style="font-size: 0.875rem; color: #666;">
                            Poll closed
                        </div>
                    ` : `
                        <div style="font-size: 0.875rem; color: #666;">
                            <i class="fas fa-check" style="color: #198754;"></i> You voted
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Vote in poll
async function voteInPoll(event) {
    const optionElement = event.currentTarget;
    const pollId = optionElement.getAttribute('data-poll-id');
    const optionId = optionElement.getAttribute('data-option-id');
    
    try {
        const response = await FoodConnect.authFetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionId })
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast('Vote recorded!', 'success');
            
            // Reload polls
            await loadAllPolls();
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || 'Failed to vote', 'error');
        }
        
    } catch (error) {
        console.error('Error voting:', error);
        FoodConnectUtils.showToast('Failed to vote', 'error');
    }
}

// Handle create poll
async function handleCreatePoll(event) {
    event.preventDefault();
    
    const communityId = document.getElementById('pollCommunity').value;
    const question = document.getElementById('pollQuestion').value.trim();
    const closesAt = document.getElementById('pollClosesAt').value;
    
    const optionInputs = document.querySelectorAll('#pollOptionsContainer input[type="text"]');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(option => option.length > 0);
    
    if (!communityId) {
        FoodConnectUtils.showToast('Please select a community', 'warning');
        return;
    }
    
    if (!question) {
        FoodConnectUtils.showToast('Poll question is required', 'warning');
        return;
    }
    
    if (options.length < 2) {
        FoodConnectUtils.showToast('At least 2 options are required', 'warning');
        return;
    }
    
    const pollData = {
        question,
        options
    };
    
    if (closesAt) {
        pollData.closesAt = new Date(closesAt).toISOString();
    }
    
    try {
        const response = await FoodConnect.authFetch(`/api/communities/${communityId}/polls`, {
            method: 'POST',
            body: JSON.stringify(pollData)
        });
        
        if (response.ok) {
            FoodConnectUtils.showToast('Poll created successfully!', 'success');
            
            // Close modal and reset form
            closeModal();
            document.getElementById('createPollForm').reset();
            
            // Reset poll options to default
            const optionsContainer = document.getElementById('pollOptionsContainer');
            optionsContainer.innerHTML = `
                <div class="poll-option-input" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <input type="text" class="form-control" placeholder="Option 1" required>
                    <button type="button" class="btn btn-sm btn-danger remove-option-btn" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="poll-option-input" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <input type="text" class="form-control" placeholder="Option 2" required>
                    <button type="button" class="btn btn-sm btn-danger remove-option-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            // Reinitialize event listeners
            document.querySelectorAll('.remove-option-btn').forEach(btn => {
                btn.addEventListener('click', removePollOption);
            });
            
            // Reload polls
            await loadAllPolls();
            
        } else {
            const data = await response.json();
            FoodConnectUtils.showToast(data.message || 'Failed to create poll', 'error');
        }
        
    } catch (error) {
        console.error('Error creating poll:', error);
        FoodConnectUtils.showToast('Failed to create poll', 'error');
    }
}

// Add poll option
function addPollOption() {
    const optionsContainer = document.getElementById('pollOptionsContainer');
    const optionCount = optionsContainer.querySelectorAll('.poll-option-input').length + 1;
    
    if (optionCount > 6) {
        FoodConnectUtils.showToast('Maximum 6 options allowed', 'warning');
        return;
    }
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option-input';
    optionDiv.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';
    
    optionDiv.innerHTML = `
        <input type="text" class="form-control" placeholder="Option ${optionCount}" required>
        <button type="button" class="btn btn-sm btn-danger remove-option-btn">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    optionsContainer.appendChild(optionDiv);
    
    // Add event listener to remove button
    optionDiv.querySelector('.remove-option-btn').addEventListener('click', removePollOption);
}

// Remove poll option
function removePollOption(event) {
    const optionDiv = event.currentTarget.closest('.poll-option-input');
    const remainingOptions = document.querySelectorAll('.poll-option-input');
    
    if (remainingOptions.length <= 2) {
        FoodConnectUtils.showToast('At least 2 options are required', 'warning');
        return;
    }
    
    optionDiv.remove();
}

// Close modal
function closeModal() {
    document.getElementById('createPollModal').classList.remove('active');
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPollsPage);
} else {
    initPollsPage();
}