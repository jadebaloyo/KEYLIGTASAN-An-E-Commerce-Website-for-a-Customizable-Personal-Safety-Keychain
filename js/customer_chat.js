// ========================================
// CUSTOMER CHAT - Improved with Error Handling
// ========================================

let customerChatInterval = null;
let customerMessages = [];
let isCustomerChatOpen = false;

// Initialize chat widget
document.addEventListener('DOMContentLoaded', function() {
    console.log('💬 Customer Chat Widget initialized');
    
    // Check if user is logged in
    const userId = getUserId();
    if (userId) {
        console.log('✅ User ID found:', userId);
        // Load initial messages
        loadCustomerMessages();
        // Start polling
        startCustomerChatPolling();
    } else {
        console.warn('⚠️ User not logged in. Setting demo user ID.');
        // For testing, use a demo user ID
        sessionStorage.setItem('userId', '1');
    }
    
    // Auto-resize textarea
    const textarea = document.getElementById('customerMessageInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 80) + 'px';
        });
    }
});

// Toggle chat widget
function toggleChatWidget() {
    const chatWindow = document.getElementById('chatWidgetWindow');
    isCustomerChatOpen = !isCustomerChatOpen;
    
    if (isCustomerChatOpen) {
        chatWindow.classList.add('open');
        loadCustomerMessages();
        scrollToBottomCustomer();
        markCustomerMessagesRead();
    } else {
        chatWindow.classList.remove('open');
    }
}

// Load customer messages
function loadCustomerMessages() {
    const userId = getUserId();
    
    if (!userId) {
        console.error('❌ User ID not found');
        showEmptyState();
        return;
    }
    
    fetch(`../php/config/get_messages.php?user_id=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            // Try to parse as JSON
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    customerMessages = data.messages || [];
                    renderCustomerMessages(customerMessages);
                    updateCustomerUnreadCount();
                } else {
                    console.error('❌ Failed to load messages:', data.message);
                    showEmptyState();
                }
            } catch (e) {
                console.error('❌ Invalid JSON response:', text.substring(0, 100));
                showEmptyState('Unable to load messages. Please check backend connection.');
            }
        })
        .catch(error => {
            console.error('❌ Error loading messages:', error);
            showEmptyState('Unable to connect to chat server. Please try again later.');
        });
}

// Show empty state with custom message
function showEmptyState(message = 'Start a conversation with us!') {
    const container = document.getElementById('chatWidgetMessages');
    container.innerHTML = `
        <div class="chat-empty-state">
            <i class="fas fa-comments"></i>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// Render customer messages
function renderCustomerMessages(messages) {
    const container = document.getElementById('chatWidgetMessages');
    
    if (!messages || messages.length === 0) {
        showEmptyState();
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
        
        const isCustomer = msg.sender_type === 'customer';
        
        html += `
            <div class="chat-message ${isCustomer ? 'customer' : 'admin'}">
                <div class="chat-message-bubble">
                    ${escapeHtml(msg.message)}
                    <span class="chat-message-time">${formatMessageTime(msg.created_at)}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    scrollToBottomCustomer();
}

// Send customer message
function sendCustomerMessage() {
    const input = document.getElementById('customerMessageInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    const userId = getUserId();
    
    if (!userId) {
        alert('Please log in to send messages');
        return;
    }
    
    // Disable input
    input.disabled = true;
    const sendBtn = document.querySelector('.chat-widget-send');
    sendBtn.disabled = true;
    
    // Show sending indicator
    const originalIcon = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    fetch('../php/config/send_message.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            message: message,
            sender_type: 'customer'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                // Clear input
                input.value = '';
                input.style.height = 'auto';
                
                // Add message to UI immediately (optimistic update)
                addMessageToUI(message, 'customer');
                
                // Reload messages from server
                setTimeout(() => {
                    loadCustomerMessages();
                }, 500);
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (e) {
            console.error('❌ Error parsing response:', text.substring(0, 100));
            alert('Failed to send message. Backend not responding correctly.');
        }
    })
    .catch(error => {
        console.error('❌ Error sending message:', error);
        alert('Failed to send message. Please check your connection and try again.');
    })
    .finally(() => {
        input.disabled = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalIcon;
        input.focus();
    });
}

// Add message to UI (optimistic update)
function addMessageToUI(message, type) {
    const container = document.getElementById('chatWidgetMessages');
    
    // Remove empty state if present
    const emptyState = container.querySelector('.chat-empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const messageHtml = `
        <div class="chat-message ${type}">
            <div class="chat-message-bubble">
                ${escapeHtml(message)}
                <span class="chat-message-time">Just now</span>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottomCustomer();
}

// Handle Enter key press
function handleCustomerChatKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendCustomerMessage();
    }
}

// Mark customer messages as read
function markCustomerMessagesRead() {
    const userId = getUserId();
    
    if (!userId) {
        return;
    }
    
    fetch('../php/config/mark_customer_messages_read.php', {
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
            updateCustomerUnreadCount();
        }
    })
    .catch(error => {
        console.error('❌ Error marking messages as read:', error);
    });
}

// Update unread count
function updateCustomerUnreadCount() {
    const unreadMessages = customerMessages.filter(msg => 
        msg.sender_type === 'admin' && parseInt(msg.is_read) === 0
    );
    
    const unreadCount = unreadMessages.length;
    const badge = document.getElementById('unreadBadge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    }
}

// Start polling for new messages
function startCustomerChatPolling() {
    // Clear existing interval
    if (customerChatInterval) {
        clearInterval(customerChatInterval);
    }
    
    // Poll every 5 seconds
    customerChatInterval = setInterval(() => {
        if (isCustomerChatOpen) {
            loadCustomerMessages();
        }
    }, 5000);
}

// Stop polling
function stopCustomerChatPolling() {
    if (customerChatInterval) {
        clearInterval(customerChatInterval);
        customerChatInterval = null;
    }
}

// Scroll to bottom
function scrollToBottomCustomer() {
    const container = document.getElementById('chatWidgetMessages');
    if (container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// Get user ID from session/local storage
function getUserId() {
    // Try session storage first
    let userId = sessionStorage.getItem('userId');
    
    // Fall back to local storage
    if (!userId) {
        userId = localStorage.getItem('userId');
    }
    
    // Fall back to checking if there's a global variable
    if (!userId && typeof window.currentUserId !== 'undefined') {
        userId = window.currentUserId;
    }
    
    return userId;
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to format time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

// Helper function to format date
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
    stopCustomerChatPolling();
});

console.log('✅ Customer Chat Widget loaded with improved error handling');