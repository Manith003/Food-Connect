// Enhanced Communities Page JavaScript with Real-time Chat

let currentChatCommunity = null;
let chatPollingInterval = null;
let currentPollsCommunity = null;
let typingTimeout = null;
let lastMessageId = null;
let onlineMembers = new Set();
let typingUsers = new Set();
let attachedPlaceId = null;
let loadedMessageIds = new Set(); // Track loaded messages to prevent duplicates

// Initialize page
async function initPageSpecific() {
    const notLoggedInEl = document.getElementById('notLoggedInMessage');
    const loggedInEl = document.getElementById('loggedInContent');

    // If no user → show "Login" message, hide communities UI
    if (!window.currentUser) {
        if (notLoggedInEl) notLoggedInEl.classList.remove('hidden');
        if (loggedInEl) loggedInEl.classList.add('hidden');
        return;
    }

    // User is logged in → show communities UI, hide login prompt
    if (notLoggedInEl) notLoggedInEl.classList.add('hidden');
    if (loggedInEl) loggedInEl.classList.remove('hidden');

    // Set up listeners once
    initEventListeners();

    // Load initial data
    await loadMyCommunities();
    await loadPublicCommunities();
}

// Initialize event listeners
function initEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Create community button
    const createCommunityBtn = document.getElementById('createCommunityBtn');
    if (createCommunityBtn) {
        createCommunityBtn.addEventListener('click', () => {
            const modal = document.getElementById('createCommunityModal');
            if (modal) modal.classList.add('active');
        });
    }

    // Create poll button
    const createPollBtn = document.getElementById('createPollBtn');
    if (createPollBtn) {
        createPollBtn.addEventListener('click', () => {
            const modal = document.getElementById('createPollModal');
            if (modal) modal.classList.add('active');
        });
    }

    // Join by invite button
    const joinByInviteBtn = document.getElementById('joinByInviteBtn');
    if (joinByInviteBtn) {
        joinByInviteBtn.addEventListener('click', joinByInvite);
    }

    // Close chat button
    const closeChatBtn = document.getElementById('closeChatBtn');
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', () => {
            stopChatPolling();
            closeChat();
            switchTab('my-communities');
        });
    }

    // Send message button
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }

    // Message input events
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        // Enter key to send (Shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Typing indicator
        messageInput.addEventListener('input', handleTyping);
    }

    // Attach place button
    const attachPlaceBtn = document.getElementById('attachPlaceBtn');
    if (attachPlaceBtn) {
        attachPlaceBtn.addEventListener('click', () => {
            const modal = document.getElementById('attachPlaceModal');
            if (modal) modal.classList.add('active');
            loadPlacesForAttachment();
        });
    }

    // Attach poll button
    const attachPollBtn = document.getElementById('attachPollBtn');
    if (attachPollBtn) {
        attachPollBtn.addEventListener('click', () => {
            const modal = document.getElementById('createPollModal');
            if (modal) modal.classList.add('active');
        });
    }

    // Toggle members sidebar
    const toggleMembersBtn = document.getElementById('toggleMembersBtn');
    if (toggleMembersBtn) {
        toggleMembersBtn.addEventListener('click', toggleMembersSidebar);
    }

    // Create community form
    const createCommunityForm = document.getElementById('createCommunityForm');
    if (createCommunityForm) {
        createCommunityForm.addEventListener('submit', handleCreateCommunity);
    }

    // Private community checkbox
    const isPrivateCheckbox = document.getElementById('isPrivateCommunity');
    if (isPrivateCheckbox) {
        isPrivateCheckbox.addEventListener('change', (e) => {
            const passwordContainer = document.getElementById('passwordFieldContainer');
            const passwordInput = document.getElementById('communityPassword');
            if (!passwordContainer || !passwordInput) return;

            if (e.target.checked) {
                passwordContainer.classList.remove('hidden');
                passwordInput.required = true;
            } else {
                passwordContainer.classList.add('hidden');
                passwordInput.required = false;
            }
        });
    }

    // Create poll form
    const createPollForm = document.getElementById('createPollForm');
    if (createPollForm) {
        createPollForm.addEventListener('submit', handleCreatePoll);

        // Add poll option button
        const addPollOptionBtn = document.getElementById('addPollOptionBtn');
        if (addPollOptionBtn) {
            addPollOptionBtn.addEventListener('click', addPollOption);
        }

        // Initialize poll options remove buttons
        document.querySelectorAll('.remove-option-btn').forEach((btn) => {
            btn.addEventListener('click', removePollOption);
        });
    }

    // Search communities
    const searchInput = document.getElementById('searchCommunities');
    if (searchInput) {
        searchInput.addEventListener(
            'input',
            FoodConnectUtils.debounce(searchPublicCommunities, 300)
        );
    }

    // Search places for attachment
    const searchPlaceInput = document.getElementById('searchPlaceInput');
    if (searchPlaceInput) {
        searchPlaceInput.addEventListener(
            'input',
            FoodConnectUtils.debounce(searchPlacesForAttachment, 300)
        );
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close, .cancel-btn').forEach((btn) => {
        btn.addEventListener('click', closeAllModals);
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // Initialize message input auto-resize
    initMessageInputAutoResize();
}

// Initialize message input auto-resize
function initMessageInputAutoResize() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Switch tabs
function switchTab(tabId) {
    // Update active tab
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabId);
    });

    // Show active tab content
    document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.toggle('active', content.id === tabId);
    });

    // If switching to chat and a community is selected, load data
    if (tabId === 'chat' && currentChatCommunity) {
        loadChatMessages(currentChatCommunity._id);
        loadCommunityMembers(currentChatCommunity._id);
        loadActivePolls(currentChatCommunity._id);
    } else if (tabId === 'polls' && currentPollsCommunity) {
        loadPolls(currentPollsCommunity._id);
    }
}

// Toggle members sidebar
function toggleMembersSidebar() {
    const sidebar = document.getElementById('chatSidebar');
    if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
    }
}

// Load user's communities
async function loadMyCommunities() {
    const container = document.getElementById('myCommunitiesContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    try {
        const response = await FoodConnect.authFetch('/api/communities/my');
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderMyCommunities(data.data || []);
    } catch (error) {
        console.error('Error loading communities:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load your communities. Please try again.</p>
                    <button onclick="loadMyCommunities()" class="btn btn-primary mt-2">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// Render user's communities
function renderMyCommunities(communities) {
    const container = document.getElementById('myCommunitiesContainer');
    if (!container) return;

    if (!communities.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <h3>No Communities Yet</h3>
                <p>Create your first food group or join a public community to get started!</p>
            </div>
        `;
        return;
    }

    let html = '<div class="communities-grid">';

    communities.forEach((community) => {
        const isPrivate = community.isPrivate;
        const memberCount = community.members?.length || 0;

        html += `
            <div class="community-card" data-community-id="${community._id}">
                <div class="community-header">
                    <h3>${community.name}</h3>
                    <span class="community-type ${isPrivate ? 'private' : 'public'}">
                        ${isPrivate ? 'Private' : 'Public'}
                    </span>
                </div>

                <p style="margin-bottom: 1rem; color: #666;">${community.description || ''}</p>

                ${community.tags?.length ? `
                    <div class="community-tags">
                        ${community.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="community-meta">
                    <span><i class="fas fa-users"></i> ${memberCount} members</span>
                    <span><i class="fas fa-user"></i> ${community.createdBy?.name || 'Unknown'}</span>
                </div>

                <div class="community-actions">
                    <button class="btn btn-primary btn-sm open-chat-btn" data-community-id="${community._id}">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    <button class="btn btn-outline btn-sm open-polls-btn" data-community-id="${community._id}">
                        <i class="fas fa-poll"></i> Polls
                    </button>
                    ${community.inviteCode ? `
                        <button class="btn btn-secondary btn-sm copy-invite-btn" data-invite-code="${community.inviteCode}">
                            <i class="fas fa-copy"></i> Invite
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('.open-chat-btn').forEach((btn) => {
        btn.addEventListener('click', openCommunityChat);
    });

    document.querySelectorAll('.open-polls-btn').forEach((btn) => {
        btn.addEventListener('click', openCommunityPolls);
    });

    document.querySelectorAll('.copy-invite-btn').forEach((btn) => {
        btn.addEventListener('click', copyInviteCode);
    });
}

// Open community chat
async function openCommunityChat(event) {
    const communityId = event.currentTarget.getAttribute('data-community-id');

    // Find community data
    const communities = await getMyCommunities();
    currentChatCommunity = communities.find((c) => c._id === communityId);

    if (!currentChatCommunity) {
        FoodConnectUtils.showToast('Community not found', 'error');
        return;
    }

    // Reset loaded message IDs when switching communities
    loadedMessageIds.clear();

    // Update chat UI
    updateChatUI(currentChatCommunity);

    // Switch to chat tab
    switchTab('chat');

    // Load initial data
    await loadChatMessages(communityId);
    await loadCommunityMembers(communityId);
    await loadActivePolls(communityId);

    // Start polling for new messages
    startChatPolling(communityId);

    // Join online members (simulated for demo)
    joinOnline(communityId);
}

// Update chat UI with community info
function updateChatUI(community) {
    const chatNameEl = document.getElementById('chatCommunityName');
    const chatTypeEl = document.getElementById('chatCommunityType');
    const chatMemberCountEl = document.getElementById('chatMemberCount');
    const chatActiveMembersEl = document.getElementById('chatActiveMembers');
    const chatContainer = document.getElementById('chatContainer');
    const noChatSelected = document.getElementById('noChatSelected');

    if (chatNameEl) chatNameEl.textContent = community.name;
    if (chatTypeEl) chatTypeEl.textContent = community.isPrivate ? 'Private' : 'Public';
    if (chatMemberCountEl) chatMemberCountEl.textContent = `${community.members?.length || 0} members`;
    if (chatActiveMembersEl) chatActiveMembersEl.textContent = '0 online';

    if (chatContainer) chatContainer.classList.remove('hidden');
    if (noChatSelected) noChatSelected.classList.add('hidden');
}

// Load community members
async function loadCommunityMembers(communityId) {
    try {
        const response = await FoodConnect.authFetch(`/api/communities/${communityId}`);
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderCommunityMembers(data.data?.members || []);
    } catch (error) {
        console.error('Error loading community members:', error);
    }
}

// Render community members
function renderCommunityMembers(members) {
    const container = document.getElementById('membersList');
    if (!container) return;

    if (!members.length) {
        container.innerHTML = '<p style="color: #666; font-size: 0.875rem;">No members found</p>';
        return;
    }

    let html = '';

    members.forEach((member) => {
        const isOnline = onlineMembers.has(member._id);
        const isCurrentUser = member._id === window.currentUser?._id;
        
        html += `
            <div class="member-item">
                <div class="member-avatar">${member.name?.charAt(0) || 'U'}</div>
                <div class="member-info">
                    <div class="member-name">
                        ${member.name || 'Unknown'}
                        ${isCurrentUser ? ' (You)' : ''}
                    </div>
                    <div class="member-role">
                        ${isOnline ? '<span class="online-indicator"></span> Online' : 'Offline'}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Load active polls for chat sidebar
async function loadActivePolls(communityId) {
    try {
        const response = await FoodConnect.authFetch(`/api/communities/${communityId}/polls`);
        if (!response) return;
        const data = await response.json();

        renderActivePolls(data.data?.filter(poll => poll.isActive && 
            (!poll.closesAt || new Date(poll.closesAt) > new Date())) || []);
    } catch (error) {
        console.error('Error loading active polls:', error);
    }
}

// Render active polls in sidebar
function renderActivePolls(polls) {
    const container = document.getElementById('activePollsList');
    if (!container) return;

    if (!polls.length) {
        container.innerHTML = '<p style="color: #666; font-size: 0.875rem;">No active polls</p>';
        return;
    }

    let html = '';

    polls.forEach((poll) => {
        const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votesCount || 0), 0) || 0;
        
        html += `
            <div class="poll-preview" data-poll-id="${poll._id}" onclick="openPollModal('${poll._id}')">
                <div class="poll-question">${poll.question}</div>
                <div class="poll-stats">
                    <span>${totalVotes} votes</span>
                    <span>${poll.hasVoted ? '✓ Voted' : '✗ Not voted'}</span>
                </div>
                ${window.currentUser?._id === poll.createdBy?._id || window.currentUser?.role === 'admin' ? `
                    <div class="poll-actions" style="margin-top: 0.5rem;">
                        <button class="btn btn-sm btn-danger delete-poll-btn" data-poll-id="${poll._id}" onclick="deletePoll(event, '${poll._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Delete poll
async function deletePoll(event, pollId) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await FoodConnect.authFetch(`/api/polls/${pollId}`, {
            method: 'DELETE'
        });

        if (response && response.ok) {
            FoodConnectUtils.showToast('Poll deleted successfully', 'success');
            
            // Refresh polls
            if (currentPollsCommunity) {
                await loadPolls(currentPollsCommunity._id);
            }
            
            // Refresh active polls in chat sidebar
            if (currentChatCommunity) {
                await loadActivePolls(currentChatCommunity._id);
            }
        } else {
            FoodConnectUtils.showToast('Failed to delete poll', 'error');
        }
    } catch (error) {
        console.error('Error deleting poll:', error);
        FoodConnectUtils.showToast('Failed to delete poll', 'error');
    }
}

// Open poll modal
async function openPollModal(pollId) {
    try {
        const response = await FoodConnect.authFetch(`/api/polls/${pollId}/results`);
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderPollModal(data.data);
    } catch (error) {
        console.error('Error loading poll details:', error);
        FoodConnectUtils.showToast('Failed to load poll', 'error');
    }
}

// Render poll modal
function renderPollModal(pollData) {
    const poll = pollData.poll;
    const results = pollData.results;
    const totalVotes = pollData.totalVotes || 0;
    const isClosed = !poll.isActive || (poll.closesAt && new Date(poll.closesAt) < new Date());

    const modalTitle = document.getElementById('pollModalTitle');
    const pollQuestion = document.getElementById('pollModalQuestion');
    const pollOptions = document.getElementById('pollModalOptions');
    const pollResults = document.getElementById('pollModalResults');

    if (modalTitle) modalTitle.textContent = 'Poll';
    if (pollQuestion) pollQuestion.textContent = poll.question;

    if (pollOptions) {
        let optionsHTML = '';

        if (isClosed) {
            // Show results
            pollResults.classList.remove('hidden');
            let resultsHTML = '<h4>Results:</h4>';

            results.forEach((option, index) => {
                const percentage = totalVotes > 0 ? Math.round((option.votesCount / totalVotes) * 100) : 0;
                
                resultsHTML += `
                    <div class="poll-option-result">
                        <div class="poll-option-header">
                            <span>${option.text}</span>
                            <span>${percentage}% (${option.votesCount})</span>
                        </div>
                        <div class="poll-bar">
                            <div class="poll-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            });

            resultsHTML += `<p style="margin-top: 1rem; color: #666;">Total votes: ${totalVotes}</p>`;
            pollResults.innerHTML = resultsHTML;
            pollOptions.innerHTML = '';
        } else {
            // Show voting options
            pollResults.classList.add('hidden');
            optionsHTML = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

            results.forEach((option) => {
                optionsHTML += `
                    <button class="btn btn-outline vote-modal-btn" 
                            data-poll-id="${poll._id}" 
                            data-option-id="${option._id}"
                            style="text-align: left; justify-content: flex-start;">
                        ${option.text}
                    </button>
                `;
            });

            optionsHTML += '</div>';
            pollOptions.innerHTML = optionsHTML;

            // Add event listeners to vote buttons
            document.querySelectorAll('.vote-modal-btn').forEach(btn => {
                btn.addEventListener('click', voteInPollFromModal);
            });
        }
    }

    // Show modal
    const modal = document.getElementById('viewPollModal');
    if (modal) modal.classList.add('active');
}

// Vote in poll from modal
async function voteInPollFromModal(event) {
    const pollId = event.currentTarget.getAttribute('data-poll-id');
    const optionId = event.currentTarget.getAttribute('data-option-id');

    try {
        const response = await FoodConnect.authFetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionId }),
        });

        if (response && response.ok) {
            FoodConnectUtils.showToast('Vote recorded!', 'success');
            closeAllModals();
            
            // Refresh polls if in polls tab
            if (currentPollsCommunity) {
                await loadPolls(currentPollsCommunity._id);
            }
            
            // Refresh active polls in chat sidebar
            if (currentChatCommunity) {
                await loadActivePolls(currentChatCommunity._id);
            }
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(data.message || 'Failed to vote', 'error');
        }
    } catch (error) {
        console.error('Error voting:', error);
        FoodConnectUtils.showToast('Failed to vote', 'error');
    }
}

// Load chat messages
async function loadChatMessages(communityId) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${communityId}/messages?limit=50`
        );
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderChatMessages(data.data || []);

        // Scroll to bottom
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);

        // Update last message ID for polling
        if (data.data && data.data.length > 0) {
            lastMessageId = data.data[data.data.length - 1]._id;
            
            // Clear and add loaded message IDs
            loadedMessageIds.clear();
            data.data.forEach(msg => loadedMessageIds.add(msg._id));
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = `
            <div class="empty-state">
                <p>Failed to load messages. Please try again.</p>
            </div>
        `;
    }
}

// Render chat messages
function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    if (!messages || !messages.length) {
        container.innerHTML = `
            <div class="empty-state" style="height: 100%; display: flex; align-items: center; justify-content: center;">
                <div>
                    <i class="fas fa-comments" style="font-size: 2rem; color: var(--champagne); margin-bottom: 0.5rem;"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            </div>
        `;
        return;
    }

    let html = '';

    messages.forEach((message) => {
        const isSent = message.userId?._id === window.currentUser?._id;
        const senderName = isSent ? 'You' : message.userId?.name || 'Unknown';
        const timestamp = FoodConnectUtils.formatTime(message.createdAt);
        const canDelete = isSent || window.currentUser?.role === 'admin';

        html += `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message._id}">
                <div class="message-header">
                    <span class="message-sender">
                        <div class="user-avatar" style="width: 24px; height: 24px; font-size: 0.75rem;">
                            ${message.userId?.name?.charAt(0) || 'U'}
                        </div>
                        ${senderName}
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="message-time">${timestamp}</span>
                        ${canDelete ? `
                            <button class="btn btn-sm btn-danger delete-message-btn" 
                                    style="padding: 0.125rem 0.25rem; font-size: 0.75rem;"
                                    onclick="deleteMessage('${message._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="message-content">
                    <p>${message.text}</p>
                    ${message.attachedPlaceId ? `
                        <div class="attached-place">
                            <a href="place.html?id=${message.attachedPlaceId._id}">
                                <i class="fas fa-map-marker-alt"></i>
                                ${message.attachedPlaceId.name}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Delete message
async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }

    try {
        const response = await FoodConnect.authFetch(`/api/communities/messages/${messageId}`, {
            method: 'DELETE'
        });

        if (response && response.ok) {
            // Remove message from DOM
            const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageEl) {
                messageEl.remove();
            }
            
            FoodConnectUtils.showToast('Message deleted successfully', 'success');
        } else {
            FoodConnectUtils.showToast('Failed to delete message', 'error');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
        FoodConnectUtils.showToast('Failed to delete message', 'error');
    }
}

// Handle typing indicator
function handleTyping() {
    if (!currentChatCommunity) return;

    // Send typing indicator
    sendTypingIndicator();

    // Clear previous timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing indicator after 3 seconds
    typingTimeout = setTimeout(() => {
        stopTypingIndicator();
    }, 3000);
}

// Send typing indicator
function sendTypingIndicator() {
    // In a real app, you would send this to the server via WebSocket
    // For now, we'll simulate it locally
    if (currentChatCommunity && window.currentUser) {
        typingUsers.add(window.currentUser._id);
        updateTypingIndicator();
    }
}

// Stop typing indicator
function stopTypingIndicator() {
    if (currentChatCommunity && window.currentUser) {
        typingUsers.delete(window.currentUser._id);
        updateTypingIndicator();
    }
}

// Update typing indicator UI
function updateTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    const typingUsersEl = document.getElementById('typingUsers');

    if (typingUsers.size > 0) {
        const userNames = Array.from(typingUsers).map(userId => {
            // In a real app, you would get user names from your data
            return userId === window.currentUser?._id ? 'You' : 'Someone';
        }).join(', ');

        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            if (typingUsersEl) {
                typingUsersEl.textContent = userNames;
            }
        }
    } else {
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }
}

// Send message
async function sendMessage() {
    if (!currentChatCommunity) {
        FoodConnectUtils.showToast('No community selected', 'warning');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;

    const text = messageInput.value.trim();
    if (!text) {
        FoodConnectUtils.showToast('Message cannot be empty', 'warning');
        return;
    }

    const messageData = { text };

    if (attachedPlaceId) {
        messageData.attachedPlaceId = attachedPlaceId;
    }

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${currentChatCommunity._id}/messages`,
            {
                method: 'POST',
                body: JSON.stringify(messageData),
            }
        );

        if (response && response.ok) {
            const data = await response.json();
            
            // Clear input and reset
            messageInput.value = '';
            messageInput.style.height = 'auto';
            attachedPlaceId = null;
            stopTypingIndicator();

            // Add the new message to the chat immediately
            if (data.data && data.data._id) {
                // Add to loaded message IDs to prevent duplicate in polling
                loadedMessageIds.add(data.data._id);
                
                // Append the new message
                appendNewMessages([data.data]);
                
                // Scroll to bottom
                const container = document.getElementById('chatMessages');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        FoodConnectUtils.showToast('Failed to send message', 'error');
    }
}

// Start polling for new messages
function startChatPolling(communityId) {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }

    chatPollingInterval = setInterval(async () => {
        await pollNewMessages(communityId);
    }, 3000); // Poll every 3 seconds
}

// Poll for new messages
async function pollNewMessages(communityId) {
    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${communityId}/messages?limit=20${lastMessageId ? `&after=${lastMessageId}` : ''}`
        );
        if (!response) return;

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            // Filter out already loaded messages
            const newMessages = data.data.filter(msg => !loadedMessageIds.has(msg._id));
            
            if (newMessages.length > 0) {
                // Update last message ID
                lastMessageId = newMessages[newMessages.length - 1]._id;
                
                // Add to loaded message IDs
                newMessages.forEach(msg => loadedMessageIds.add(msg._id));
                
                // Append new messages
                appendNewMessages(newMessages);
            }
        }
    } catch (error) {
        console.error('Error polling messages:', error);
    }
}

// Append new messages to chat
function appendNewMessages(newMessages) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    // If container is empty state, clear it
    if (container.querySelector('.empty-state')) {
        container.innerHTML = '';
    }

    newMessages.forEach((message) => {
        const isSent = message.userId?._id === window.currentUser?._id;
        const senderName = isSent ? 'You' : message.userId?.name || 'Unknown';
        const timestamp = FoodConnectUtils.formatTime(message.createdAt);
        const canDelete = isSent || window.currentUser?.role === 'admin';

        const messageHTML = `
            <div class="message ${isSent ? 'sent' : 'received'}" data-message-id="${message._id}">
                <div class="message-header">
                    <span class="message-sender">
                        <div class="user-avatar" style="width: 24px; height: 24px; font-size: 0.75rem;">
                            ${message.userId?.name?.charAt(0) || 'U'}
                        </div>
                        ${senderName}
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="message-time">${timestamp}</span>
                        ${canDelete ? `
                            <button class="btn btn-sm btn-danger delete-message-btn" 
                                    style="padding: 0.125rem 0.25rem; font-size: 0.75rem;"
                                    onclick="deleteMessage('${message._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="message-content">
                    <p>${message.text}</p>
                    ${message.attachedPlaceId ? `
                        <div class="attached-place">
                            <a href="place.html?id=${message.attachedPlaceId._id}">
                                <i class="fas fa-map-marker-alt"></i>
                                ${message.attachedPlaceId.name}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', messageHTML);
    });

    // Scroll to bottom if user is near bottom
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollThreshold = container.scrollHeight - 100;
    
    if (scrollPosition >= scrollThreshold) {
        container.scrollTop = container.scrollHeight;
    }
}

// Stop chat polling
function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// Close chat
function closeChat() {
    const chatContainer = document.getElementById('chatContainer');
    const noChatSelected = document.getElementById('noChatSelected');
    
    if (chatContainer) chatContainer.classList.add('hidden');
    if (noChatSelected) noChatSelected.classList.remove('hidden');
    
    currentChatCommunity = null;
    lastMessageId = null;
    loadedMessageIds.clear();
    onlineMembers.clear();
    typingUsers.clear();
    
    // Clear typing indicator
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.classList.add('hidden');
}

// Simulate joining online (for demo)
function joinOnline(communityId) {
    if (!window.currentUser) return;
    
    onlineMembers.add(window.currentUser._id);
    updateOnlineMembersCount();
    
    // Simulate other members coming online
    setTimeout(() => {
        onlineMembers.add('user2');
        updateOnlineMembersCount();
        updateCommunityMembers();
    }, 2000);
    
    setTimeout(() => {
        onlineMembers.add('user3');
        updateOnlineMembersCount();
        updateCommunityMembers();
    }, 4000);
}

// Update online members count
function updateOnlineMembersCount() {
    const activeMembersEl = document.getElementById('chatActiveMembers');
    if (activeMembersEl) {
        activeMembersEl.textContent = `${onlineMembers.size} online`;
    }
}

// Update community members list
function updateCommunityMembers() {
    if (currentChatCommunity && currentChatCommunity.members) {
        renderCommunityMembers(currentChatCommunity.members);
    }
}

// Load places for attachment
async function loadPlacesForAttachment() {
    try {
        const response = await fetch('/api/places?limit=20');
        if (!response.ok) throw new Error('Failed to load places');
        const data = await response.json();

        renderPlacesForAttachment(data.data || []);
    } catch (error) {
        console.error('Error loading places:', error);
        const container = document.getElementById('placesSearchResults');
        if (container) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">Failed to load places</p>';
        }
    }
}

// Render places for attachment
function renderPlacesForAttachment(places) {
    const container = document.getElementById('placesSearchResults');
    if (!container) return;

    if (!places.length) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No places found</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

    places.forEach(place => {
        html += `
            <div class="place-attachment-item" 
                 data-place-id="${place._id}"
                 data-place-name="${place.name}"
                 style="padding: 0.75rem; border: 1px solid #eee; border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${place.name}</strong>
                        <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                            ${place.cuisine} • ${place.landmark}
                        </div>
                    </div>
                    <span class="badge ${place.vegFlag ? 'badge-success' : 'badge-danger'}">
                        ${place.vegFlag ? 'Veg' : 'Non-Veg'}
                    </span>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add click event listeners
    document.querySelectorAll('.place-attachment-item').forEach(item => {
        item.addEventListener('click', () => {
            const placeId = item.getAttribute('data-place-id');
            const placeName = item.getAttribute('data-place-name');
            
            attachedPlaceId = placeId;
            
            // Update message input placeholder
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.placeholder = `Attaching: ${placeName}... (Type your message)`;
                messageInput.focus();
            }
            
            // Close modal
            closeAllModals();
            
            FoodConnectUtils.showToast(`Attached ${placeName} to message`, 'success');
        });
    });
}

// Search places for attachment
async function searchPlacesForAttachment() {
    const searchInput = document.getElementById('searchPlaceInput');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    
    try {
        const response = await fetch(`/api/places?search=${encodeURIComponent(searchTerm)}&limit=10`);
        if (!response.ok) throw new Error('Failed to search places');
        const data = await response.json();
        
        renderPlacesForAttachment(data.data || []);
    } catch (error) {
        console.error('Error searching places:', error);
    }
}

// Open community polls
async function openCommunityPolls(event) {
    const communityId = event.currentTarget.getAttribute('data-community-id');

    const communities = await getMyCommunities();
    currentPollsCommunity = communities.find((c) => c._id === communityId);

    if (!currentPollsCommunity) {
        FoodConnectUtils.showToast('Community not found', 'error');
        return;
    }

    const pollsContainer = document.getElementById('pollsContainer');
    const noPollsSelected = document.getElementById('noPollsSelected');

    if (pollsContainer) pollsContainer.classList.remove('hidden');
    if (noPollsSelected) noPollsSelected.classList.add('hidden');

    switchTab('polls');

    await loadPolls(communityId);
}

// Load polls for community
async function loadPolls(communityId) {
    const container = document.getElementById('pollsList');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${communityId}/polls`
        );
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderPolls(data.data || []);
    } catch (error) {
        console.error('Error loading polls:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load polls. Please try again.</p>
                </div>
            `;
        }
    }
}

// Render polls
function renderPolls(polls) {
    const container = document.getElementById('pollsList');
    if (!container) return;

    if (!polls || !polls.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-poll" style="font-size: 2rem; color: var(--champagne); margin-bottom: 0.5rem;"></i>
                <h3>No Polls Yet</h3>
                <p>Create the first poll for this community!</p>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

    polls.forEach((poll) => {
        const isClosed = !poll.isActive || (poll.closesAt && new Date(poll.closesAt) < new Date());
        const totalVotes = poll.options?.reduce((sum, option) => sum + (option.votesCount || 0), 0) || 0;
        const userHasVoted = poll.hasVoted || false;
        const canDelete = window.currentUser?._id === poll.createdBy?._id || window.currentUser?.role === 'admin';

        html += `
            <div class="section-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 0.25rem 0;">${poll.question}</h3>
                        <p style="color: #666; font-size: 0.875rem; margin: 0;">
                            Created by ${poll.createdBy?.name || 'Unknown'}
                        </p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="badge ${isClosed ? 'badge-secondary' : 'badge-primary'}">
                            ${isClosed ? 'Closed' : 'Active'}
                        </span>
                        ${canDelete ? `
                            <button class="btn btn-sm btn-danger" onclick="deletePoll(event, '${poll._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>

                <p style="color: #666; margin-bottom: 1rem; font-size: 0.875rem;">
                    ${totalVotes} vote${totalVotes !== 1 ? 's' : ''}
                    ${poll.closesAt ? ` • Closes ${FoodConnectUtils.formatDate(poll.closesAt)}` : ''}
                </p>

                <div class="poll-options" style="margin-bottom: 1rem;">
        `;

        poll.options.forEach((option) => {
            const votes = option.votesCount || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const isUserChoice = userHasVoted && poll.userVoteId === option._id;

            html += `
                <div class="poll-option-item" style="margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                        <span>
                            ${option.text}
                            ${isUserChoice ? '<i class="fas fa-check" style="color: #198754; margin-left: 0.5rem;"></i>' : ''}
                        </span>
                        <span>${percentage}% (${votes})</span>
                    </div>
                    <div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${percentage}%; background: ${isClosed ? 'var(--champagne)' : 'var(--honey-garlic)'};"></div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>

                ${!isClosed && !userHasVoted ? `
                    <div class="vote-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${poll.options.map((option) => `
                            <button class="btn btn-outline btn-sm vote-btn" 
                                    data-poll-id="${poll._id}" 
                                    data-option-id="${option._id}">
                                ${option.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${isClosed ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 0.875rem; margin: 0;">
                            <i class="fas fa-info-circle"></i> This poll is closed
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners for vote buttons
    document.querySelectorAll('.vote-btn').forEach((btn) => {
        btn.addEventListener('click', voteInPoll);
    });
}

// Vote in poll
async function voteInPoll(event) {
    const pollId = event.currentTarget.getAttribute('data-poll-id');
    const optionId = event.currentTarget.getAttribute('data-option-id');

    try {
        const response = await FoodConnect.authFetch(`/api/polls/${pollId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ optionId }),
        });

        if (response && response.ok) {
            FoodConnectUtils.showToast('Vote recorded!', 'success');
            
            // Reload polls
            if (currentPollsCommunity) {
                await loadPolls(currentPollsCommunity._id);
            }
            
            // Update active polls in chat sidebar if open
            if (currentChatCommunity) {
                await loadActivePolls(currentChatCommunity._id);
            }
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(data.message || 'Failed to vote', 'error');
        }
    } catch (error) {
        console.error('Error voting:', error);
        FoodConnectUtils.showToast('Failed to vote', 'error');
    }
}

// Join public community
async function joinPublicCommunity(event) {
    const communityId = event.currentTarget.getAttribute('data-community-id');
    const button = event.currentTarget;

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${communityId}/join`,
            {
                method: 'POST',
                body: JSON.stringify({}),
            }
        );

        if (response && response.ok) {
            FoodConnectUtils.showToast('Successfully joined the community!', 'success');

            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check"></i> Joined';

            await loadMyCommunities();
            await loadPublicCommunities();
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(
                data.message || 'Failed to join community',
                'error'
            );
        }
    } catch (error) {
        console.error('Error joining community:', error);
        FoodConnectUtils.showToast('Failed to join community', 'error');
    }
}

// Join by invite code
async function joinByInvite() {
    const inviteCodeInput = document.getElementById('inviteCodeInput');
    const passwordInput = document.getElementById('invitePasswordInput');
    const passwordContainer = document.getElementById('invitePasswordContainer');

    const inviteCode = inviteCodeInput ? inviteCodeInput.value.trim() : '';
    if (!inviteCode) {
        FoodConnectUtils.showToast('Please enter an invite code', 'warning');
        return;
    }

    const password = passwordInput ? passwordInput.value.trim() : '';
    const requestBody = password ? { password } : {};

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/invite/${inviteCode}`,
            {
                method: 'POST',
                body: JSON.stringify(requestBody),
            }
        );

        if (response && response.ok) {
            FoodConnectUtils.showToast('Successfully joined the community!', 'success');

            if (inviteCodeInput) inviteCodeInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (passwordContainer) passwordContainer.style.display = 'none';

            await loadMyCommunities();
        } else {
            const data = response ? await response.json() : {};

            if (data.requiresPassword && passwordContainer) {
                passwordContainer.style.display = 'block';
                if (passwordInput) passwordInput.focus();
                FoodConnectUtils.showToast(
                    'Password required for this private community',
                    'info'
                );
            } else {
                FoodConnectUtils.showToast(
                    data.message || 'Failed to join community',
                    'error'
                );
            }
        }
    } catch (error) {
        console.error('Error joining by invite:', error);
        FoodConnectUtils.showToast('Failed to join community', 'error');
    }
}

// Handle create community
async function handleCreateCommunity(event) {
    event.preventDefault();

    const name = document.getElementById('communityName').value.trim();
    const description = document.getElementById('communityDescription').value.trim();
    const isPrivate = document.getElementById('isPrivateCommunity').checked;
    const password = document.getElementById('communityPassword').value;
    const tags = FoodConnectUtils.parseTags(
        document.getElementById('communityTags').value
    );
    const maxMembers = parseInt(document.getElementById('maxMembers').value, 10) || 50;

    if (!name || !description) {
        FoodConnectUtils.showToast(
            'Name and description are required',
            'warning'
        );
        return;
    }

    if (isPrivate && (!password || password.length < 4)) {
        FoodConnectUtils.showToast(
            'Private communities require a password of at least 4 characters',
            'warning'
        );
        return;
    }

    const communityData = {
        name,
        description,
        isPrivate,
        tags,
        maxMembers,
    };

    if (isPrivate) {
        communityData.password = password;
    }

    try {
        const response = await FoodConnect.authFetch('/api/communities', {
            method: 'POST',
            body: JSON.stringify(communityData),
        });

        if (response && response.ok) {
            FoodConnectUtils.showToast('Community created successfully!', 'success');

            closeAllModals();
            document.getElementById('createCommunityForm').reset();
            const pwdContainer = document.getElementById('passwordFieldContainer');
            if (pwdContainer) pwdContainer.classList.add('hidden');

            await loadMyCommunities();
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(
                data.message || 'Failed to create community',
                'error'
            );
        }
    } catch (error) {
        console.error('Error creating community:', error);
        FoodConnectUtils.showToast('Failed to create community', 'error');
    }
}

// Handle create poll
async function handleCreatePoll(event) {
    event.preventDefault();

    if (!currentPollsCommunity && !currentChatCommunity) {
        FoodConnectUtils.showToast('No community selected', 'warning');
        return;
    }

    const communityId = currentPollsCommunity?._id || currentChatCommunity?._id;
    const question = document.getElementById('pollQuestion').value.trim();
    const closesAt = document.getElementById('pollClosesAt').value;
    const optionInputs = document.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs)
        .map((input) => input.value.trim())
        .filter((option) => option.length > 0);

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
        options,
    };

    if (closesAt) {
        pollData.closesAt = new Date(closesAt).toISOString();
    }

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/${communityId}/polls`,
            {
                method: 'POST',
                body: JSON.stringify(pollData),
            }
        );

        if (response && response.ok) {
            FoodConnectUtils.showToast('Poll created successfully!', 'success');

            closeAllModals();
            document.getElementById('createPollForm').reset();

            // Reset poll options to default
            const optionsContainer = document.getElementById('pollOptionsContainer');
            if (optionsContainer) {
                optionsContainer.innerHTML = `
                    <div class="poll-option" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" class="form-control poll-option-input" placeholder="Option 1" required>
                        <button type="button" class="btn btn-sm btn-danger remove-option-btn" disabled>
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="poll-option" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <input type="text" class="form-control poll-option-input" placeholder="Option 2" required>
                        <button type="button" class="btn btn-sm btn-danger remove-option-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;

                document.querySelectorAll('.remove-option-btn').forEach((btn) => {
                    btn.addEventListener('click', removePollOption);
                });
            }

            // Refresh polls
            if (currentPollsCommunity) {
                await loadPolls(currentPollsCommunity._id);
            }
            
            // Refresh active polls in chat sidebar
            if (currentChatCommunity) {
                await loadActivePolls(currentChatCommunity._id);
            }
        } else {
            const data = response ? await response.json() : {};
            FoodConnectUtils.showToast(
                data.message || 'Failed to create poll',
                'error'
            );
        }
    } catch (error) {
        console.error('Error creating poll:', error);
        FoodConnectUtils.showToast('Failed to create poll', 'error');
    }
}

// Add poll option
function addPollOption() {
    const optionsContainer = document.getElementById('pollOptionsContainer');
    if (!optionsContainer) return;

    const currentCount = optionsContainer.querySelectorAll('.poll-option').length;
    const optionCount = currentCount + 1;

    if (optionCount > 6) {
        FoodConnectUtils.showToast('Maximum 6 options allowed', 'warning');
        return;
    }

    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option';
    optionDiv.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem;';

    optionDiv.innerHTML = `
        <input type="text" class="form-control poll-option-input" placeholder="Option ${optionCount}" required>
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
    const optionDiv = event.currentTarget.closest('.poll-option');
    const optionsContainer = document.getElementById('pollOptionsContainer');
    if (!optionsContainer || !optionDiv) return;

    const remainingOptions = optionsContainer.querySelectorAll('.poll-option');
    if (remainingOptions.length <= 2) {
        FoodConnectUtils.showToast('At least 2 options are required', 'warning');
        return;
    }

    optionDiv.remove();
}

// Copy invite code
function copyInviteCode(event) {
    const inviteCode = event.currentTarget.getAttribute('data-invite-code');

    FoodConnectUtils.copyToClipboard(inviteCode)
        .then(() => {
            FoodConnectUtils.showToast('Invite code copied to clipboard!', 'success');
        })
        .catch((error) => {
            console.error('Error copying invite code:', error);
            FoodConnectUtils.showToast('Failed to copy invite code', 'error');
        });
}

// Get user's communities (helper function)
async function getMyCommunities() {
    try {
        const response = await FoodConnect.authFetch('/api/communities/my');
        if (!response) throw new Error('No response');
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error getting communities:', error);
        return [];
    }
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.classList.remove('active');
    });
}

// Load public communities
async function loadPublicCommunities() {
    const container = document.getElementById('publicCommunitiesContainer');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    try {
        const response = await FoodConnect.authFetch('/api/communities/public');
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderPublicCommunities(data.data || []);
    } catch (error) {
        console.error('Error loading public communities:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Failed to load public communities. Please try again.</p>
                </div>
            `;
        }
    }
}

// Render public communities
function renderPublicCommunities(communities) {
    const container = document.getElementById('publicCommunitiesContainer');
    if (!container) return;

    if (!communities.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--champagne); margin-bottom: 1rem;"></i>
                <h3>No Public Communities Found</h3>
                <p>All communities are currently private or you've joined them all.</p>
            </div>
        `;
        return;
    }

    let html = '<div class="communities-grid">';

    communities.forEach((community) => {
        const memberCount = community.members?.length || 0;

        html += `
            <div class="community-card" data-community-id="${community._id}">
                <div class="community-header">
                    <h3>${community.name}</h3>
                    <span class="community-type public">Public</span>
                </div>

                <p style="margin-bottom: 1rem; color: #666;">${community.description || ''}</p>

                ${community.tags?.length ? `
                    <div class="community-tags">
                        ${community.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="community-meta">
                    <span><i class="fas fa-users"></i> ${memberCount} members</span>
                    <span><i class="fas fa-user"></i> ${community.createdBy?.name || 'Unknown'}</span>
                </div>

                <div class="community-actions">
                    <button class="btn btn-primary btn-sm join-community-btn" data-community-id="${community._id}">
                        <i class="fas fa-sign-in-alt"></i> Join
                    </button>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('.join-community-btn').forEach((btn) => {
        btn.addEventListener('click', joinPublicCommunity);
    });
}

// Search public communities
async function searchPublicCommunities() {
    const searchInput = document.getElementById('searchCommunities');
    const term = searchInput ? searchInput.value.trim() : '';

    try {
        const response = await FoodConnect.authFetch(
            `/api/communities/public?search=${encodeURIComponent(term)}`
        );
        if (!response) throw new Error('No response');
        const data = await response.json();

        renderPublicCommunities(data.data || []);
    } catch (error) {
        console.error('Error searching communities:', error);
    }
}

// Initialize page when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageSpecific);
} else {
    initPageSpecific();
}

// Global functions for onclick handlers
window.deletePoll = deletePoll;
window.deleteMessage = deleteMessage;
window.openPollModal = openPollModal;