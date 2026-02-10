// ========================================
// ADMIN CHAT SUPPORT JAVASCRIPT
// ========================================

let currentChatUserId = null;
let adminUserId = 11; // ✅ ADD THIS - Store admin user ID
let chatPollingInterval = null;
let allChats = [];
let chatMessages = [];

// Initialize chat support when page loads
// Initialize chat support when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('💬 Initializing Admin Chat Support...');
    
    // ✅ NEW: Fetch admin session data from server
    fetch('../php/config/get_admin_session.php')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user_id) {
                adminUserId = data.user_id;
                console.log('👤 Admin User ID loaded:', adminUserId);
                
                // Update admin name in UI if element exists
                const adminNameElement = document.getElementById('adminName');
                if (adminNameElement && data.name) {
                    adminNameElement.textContent = data.name;
                }
            } else {
                console.error('❌ Failed to load admin session');
                // Fallback: Try to get from hidden input if it exists
                const adminInput = document.getElementById('adminUserId');
                if (adminInput && adminInput.value) {
                    adminUserId = adminInput.value;
                }
            }
        })
        .catch(error => {
            console.error('❌ Error loading admin session:', error);
        });
    
    // Load chats when chat section is opened
    const chatMenuItem = document.querySelector('[data-section="chat-support"]');
    if (chatMenuItem) {
        chatMenuItem.addEventListener('click', function() {
            loadAllChats();
            startChatPolling();
        });
    }
    
    // Setup filter buttons
    setupChatFilters();
    
    // Setup search
    setupChatSearch();
    
    // Auto-resize textarea
    const textarea = document.getElementById('chatMessageInput');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
    }
});

// Load all chat conversations
function loadAllChats() {
    console.log('📥 Loading all chats...');
    
    fetch('../php/config/get_chats.php')
        .then(response => response.json())
        .then(data => {
            console.log('✅ Chats loaded:', data);
            
            if (data.success) {
                allChats = data.chats || [];
                renderChatList(allChats);
                updateChatCounts();
            } else {
                console.error('❌ Failed to load chats:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error loading chats:', error);
        });
}

// Render chat list
function renderChatList(chats) {
    const chatList = document.getElementById('chatList');
    
    if (!chats || chats.length === 0) {
        chatList.innerHTML = `
            <div class="chat-list-empty">
                <i class="fas fa-comments"></i>
                <p>No chat conversations yet</p>
            </div>
        `;
        return;
    }
    
    chatList.innerHTML = chats.map(chat => {
        const initials = getInitials(chat.customer_name);
        const isUnread = parseInt(chat.unread_count) > 0;
        const isActive = currentChatUserId === chat.user_id;
        
        return `
            <div class="chat-list-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}" 
                 onclick="openChat(${chat.user_id}, '${escapeHtml(chat.customer_name)}')">
                <div class="chat-item-avatar">${initials}</div>
                <div class="chat-item-content">
                    <div class="chat-item-header">
                        <span class="chat-item-name">${escapeHtml(chat.customer_name)}</span>
                        <span class="chat-item-time">${formatChatTime(chat.last_message_time)}</span>
                    </div>
                    <div class="chat-item-message">${escapeHtml(chat.last_message || 'No messages yet')}</div>
                    ${isUnread ? `<span class="chat-item-badge">${chat.unread_count} new</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Open chat conversation
function openChat(userId, userName) {
    console.log('💬 Opening chat with user:', userId, userName);
    
    currentChatUserId = userId;
    
    // Update UI
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatActive').style.display = 'flex';
    document.getElementById('chatUserName').textContent = userName;
    
    // Mark as active in list
    document.querySelectorAll('.chat-list-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    loadChatMessages(userId);
    
    // Mark messages as read
    markMessagesAsRead(userId);
    
    // Load customer info
    loadCustomerInfo(userId);
}

// Load chat messages
function loadChatMessages(userId) {
    console.log('📨 Loading messages for user:', userId);
    
    fetch(`../php/config/get_messages.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Messages loaded:', data);
            
            if (data.success) {
                chatMessages = data.messages || [];
                renderChatMessages(chatMessages);
                scrollToBottom();
            } else {
                console.error('❌ Failed to load messages:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error loading messages:', error);
        });
}

// Render chat messages
function renderChatMessages(messages) {
    const chatMessagesContainer = document.getElementById('chatMessages');
    
    if (!messages || messages.length === 0) {
        chatMessagesContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #9ca3af;">
                <i class="fas fa-comments" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let currentDate = null;
    let html = '';
    
    messages.forEach(msg => {
        const msgDate = new Date(msg.created_at).toLocaleDateString();
        
        // Add date divider if date changed
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            html += `
                <div class="date-divider">
                    <span>${formatMessageDate(msg.created_at)}</span>
                </div>
            `;
        }
        
        const isAdmin = msg.sender_type === 'admin';
        const initials = isAdmin ? 'A' : getInitials(msg.sender_name || 'User');
        
        html += `
            <div class="chat-message ${isAdmin ? 'admin' : 'customer'}">
                <div class="message-avatar">${initials}</div>
                <div class="message-content">
                    <div class="message-bubble">
                        <p class="message-text">${escapeHtml(msg.message)}</p>
                    </div>
                    <span class="message-time">
                        ${formatMessageTime(msg.created_at)}
                        ${isAdmin ? `<span class="message-status ${msg.is_read ? 'read' : 'delivered'}">
                            <i class="fas fa-check${msg.is_read ? '-double' : ''}"></i>
                        </span>` : ''}
                    </span>
                </div>
            </div>
        `;
    });
    
    chatMessagesContainer.innerHTML = html;
}

// ✅ UPDATED - Send message with receiver_id
function sendMessage() {
    const input = document.getElementById('chatMessageInput');
    const message = input.value.trim();
    
    if (!message || !currentChatUserId) {
        return;
    }
    
    // ✅ ADD THIS - Validate admin user ID
    if (!adminUserId) {
        console.error('❌ Admin user ID not found');
        alert('Error: Unable to send message. Admin ID not found.');
        return;
    }
    
    console.log('📤 Sending message to user:', currentChatUserId);
    console.log('👤 From admin:', adminUserId);
    
    // Disable input
    input.disabled = true;
    document.querySelector('.send-btn').disabled = true;
    
    fetch('../php/config/send_message.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: parseInt(adminUserId),        // ✅ CHANGED - Admin ID (sender)
            receiver_id: parseInt(currentChatUserId), // ✅ ADDED - Customer ID (receiver)
            message: message,
            sender_type: 'admin'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ Message sent:', data);
        
        if (data.success) {
            // Clear input
            input.value = '';
            input.style.height = 'auto';
            
            // Reload messages
            loadChatMessages(currentChatUserId);
            
            // Update chat list
            loadAllChats();
        } else {
            alert('Failed to send message: ' + data.message);
        }
    })
    .catch(error => {
        console.error('❌ Error sending message:', error);
        alert('Failed to send message. Please try again.');
    })
    .finally(() => {
        input.disabled = false;
        document.querySelector('.send-btn').disabled = false;
        input.focus();
    });
}

// Handle Enter key press in textarea
function handleChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Mark messages as read
function markMessagesAsRead(userId) {
    fetch('../php/config/mark_messages_read.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Messages marked as read');
            updateChatCounts();
        }
    })
    .catch(error => {
        console.error('❌ Error marking messages as read:', error);
    });
}

// Load customer info
function loadCustomerInfo(userId) {
    fetch(`../php/config/get_customer_info.php?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const customer = data.customer;
                
                document.getElementById('customerEmail').textContent = customer.email || 'N/A';
                document.getElementById('customerPhone').textContent = customer.phone || 'N/A';
                
                // Load customer orders
                if (data.orders && data.orders.length > 0) {
                    const ordersHtml = data.orders.map(order => `
                        <div class="info-item" style="flex-direction: column; align-items: flex-start; padding: 10px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
                            <strong>${order.order_number}</strong>
                            <small style="color: #9ca3af;">₱${parseFloat(order.total_amount).toLocaleString()} - ${order.status}</small>
                        </div>
                    `).join('');
                    
                    document.getElementById('customerOrders').innerHTML = ordersHtml;
                } else {
                    document.getElementById('customerOrders').innerHTML = '<p class="text-muted">No orders yet</p>';
                }
            }
        })
        .catch(error => {
            console.error('❌ Error loading customer info:', error);
        });
}

// View customer info
function viewCustomerInfo() {
    const panel = document.getElementById('customerInfoPanel');
    panel.classList.toggle('active');
}

// Close customer info
function closeCustomerInfo() {
    document.getElementById('customerInfoPanel').classList.remove('active');
}

// Close chat
function closeChat() {
    currentChatUserId = null;
    document.getElementById('noChatSelected').style.display = 'flex';
    document.getElementById('chatActive').style.display = 'none';
    document.getElementById('customerInfoPanel').classList.remove('active');
    
    // Remove active state from list items
    document.querySelectorAll('.chat-list-item').forEach(item => {
        item.classList.remove('active');
    });
}

// Setup chat filters
function setupChatFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filter chats
            const filter = this.dataset.filter;
            filterChats(filter);
        });
    });
}

// Filter chats
function filterChats(filter) {
    let filteredChats = allChats;
    
    if (filter === 'unread') {
        filteredChats = allChats.filter(chat => parseInt(chat.unread_count) > 0);
    }
    
    renderChatList(filteredChats);
}

// Setup chat search
function setupChatSearch() {
    const searchInput = document.getElementById('chatSearchInput');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (!query) {
            renderChatList(allChats);
            return;
        }
        
        const filtered = allChats.filter(chat => 
            chat.customer_name.toLowerCase().includes(query) ||
            (chat.last_message && chat.last_message.toLowerCase().includes(query))
        );
        
        renderChatList(filtered);
    });
}

// Update chat counts
function updateChatCounts() {
    const totalChats = allChats.length;
    const unreadChats = allChats.filter(chat => parseInt(chat.unread_count) > 0).length;
    
    document.getElementById('allChatsCount').textContent = totalChats;
    document.getElementById('unreadBadge').textContent = unreadChats;
    document.getElementById('unreadChatsCount').textContent = unreadChats;
    
    // Hide badge if no unread messages
    const badge = document.getElementById('unreadChatsCount');
    if (unreadChats === 0) {
        badge.style.display = 'none';
    } else {
        badge.style.display = 'inline-block';
    }
}

// Start polling for new messages
function startChatPolling() {
    // Clear existing interval
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
    }
    
    // Poll every 5 seconds
    chatPollingInterval = setInterval(() => {
        // Reload chat list
        loadAllChats();
        
        // Reload current chat messages
        if (currentChatUserId) {
            loadChatMessages(currentChatUserId);
        }
    }, 5000);
}

// Stop polling
function stopChatPolling() {
    if (chatPollingInterval) {
        clearInterval(chatPollingInterval);
        chatPollingInterval = null;
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('chatMessageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Scroll to bottom of messages
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Attach file (placeholder)
function attachFile() {
    alert('File attachment feature coming soon!');
}

// Helper Functions
function getInitials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatChatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopChatPolling();
});

console.log('✅ Admin Chat Support initialized');