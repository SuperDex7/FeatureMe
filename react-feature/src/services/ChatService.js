import api from './AuthService';
import { wsURL } from '../config/api';

// Chat Service for handling all chat-related API calls
export const ChatService = {
    // Create a new chat
    createChat: (users, chatName) => {
        return api.post('/chats/create', {
            users: users,
            chatname: chatName
        });
    },

    // Get all chats for the current user (paginated)
    getChats: (page = 0, size = 10) => {
        return api.get(`/chats/get/chats?page=${page}&size=${size}`);
    },

    // Get messages for a specific chat room
    getChatMessages: (chatRoomId) => {
        return api.get(`/chats/${chatRoomId}/messages`);
    },

    // Get paged messages for infinite scroll (oldest-first order within page)
    getChatMessagesPaged: (chatRoomId, page = 0, size = 15) => {
        return api.get(`/chats/${chatRoomId}/messages/paged?page=${page}&size=${size}`);
    },

    // Add a user to a chat
    addUserToChat: (chatRoomId, username) => {
        return api.post(`/chats/${chatRoomId}/users?username=${username}`);
    },

    // Remove a user from a chat
    removeUserFromChat: (chatRoomId, username) => {
        return api.delete(`/chats/${chatRoomId}/users/${username}`);
    },

    // Upload a file to a chat
    uploadFileToChat: (chatRoomId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post(`/chats/${chatRoomId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Update chat photo
    updateChatPhoto: (chatRoomId, photoUrl) => {
        return api.post(`/chats/${chatRoomId}/photo`, null, {
            params: {
                photoUrl: photoUrl
            }
        });
    }
};

// WebSocket Service for real-time messaging
export class ChatWebSocketService {
    constructor() {
        this.stompClient = null;
        this.socket = null;
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
    }

    // Connect to WebSocket
    connect() {
        return new Promise((resolve, reject) => {
            try {
                // Import SockJS and Stomp dynamically
                import('sockjs-client').then(SockJS => {
                    import('stompjs').then(Stomp => {
                        this.socket = new SockJS.default(wsURL);
                        this.stompClient = Stomp.default.over(this.socket);
                        
                        // Disable debug logging in production
                        this.stompClient.debug = null;
                        
                        this.stompClient.connect({}, (frame) => {
                            this.isConnected = true;
                            resolve(frame);
                        }, (error) => {
                            console.error('WebSocket connection error:', error);
                            this.isConnected = false;
                            reject(error);
                        });
                    });
                });
            } catch (error) {
                console.error('Error importing WebSocket libraries:', error);
                reject(error);
            }
        });
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.stompClient && this.isConnected) {
            this.stompClient.disconnect(() => {
                this.isConnected = false;
            });
        }
        this.subscriptions.clear();
        this.messageHandlers.clear();
    }

    // Subscribe to a chat room
    subscribeToChat(chatRoomId, messageHandler) {
        if (!this.isConnected || !this.stompClient) {
            console.error('WebSocket not connected');
            return;
        }

        const subscription = this.stompClient.subscribe(`/topic/chat/${chatRoomId}`, (message) => {
            try {
                const chatMessage = JSON.parse(message.body);
                messageHandler(chatMessage);
            } catch (error) {
                console.error('Error parsing chat message:', error);
            }
        });

        this.subscriptions.set(chatRoomId, subscription);
        this.messageHandlers.set(chatRoomId, messageHandler);
    }

    // Unsubscribe from a chat room
    unsubscribeFromChat(chatRoomId) {
        const subscription = this.subscriptions.get(chatRoomId);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(chatRoomId);
            this.messageHandlers.delete(chatRoomId);
        }
    }

    // Send a message to a chat room
    sendMessage(chatRoomId, message, sender) {
        if (!this.isConnected || !this.stompClient) {
            console.error('WebSocket not connected');
            return;
        }

        const chatMessage = {
            message: message,
            sender: sender,
            chatRoomId: chatRoomId,
            type: 'CHAT'
        };

        this.stompClient.send(`/app/chat/${chatRoomId}/send`, {}, JSON.stringify(chatMessage));
    }

    // Add a user to a chat room
    addUserToChat(chatRoomId, usernameToAdd, currentUsername) {
        if (!this.isConnected || !this.stompClient) {
            console.error('WebSocket not connected');
            return;
        }

        const chatMessage = {
            sender: usernameToAdd, // The user being added
            addedBy: currentUsername, // The user doing the adding
            chatRoomId: chatRoomId,
            type: 'JOIN'
        };

        this.stompClient.send(`/app/chat/${chatRoomId}/add`, {}, JSON.stringify(chatMessage));
    }

    // Leave a chat room
    leaveChat(chatRoomId, username) {
        if (!this.isConnected || !this.stompClient) {
            console.error('WebSocket not connected');
            return;
        }

        const chatMessage = {
            sender: username,
            chatRoomId: chatRoomId,
            type: 'LEAVE'
        };

        this.stompClient.send(`/app/chat/${chatRoomId}/leave`, {}, JSON.stringify(chatMessage));
    }

    // Check if connected
    isWebSocketConnected() {
        return this.isConnected;
    }
}

// Export a singleton instance
export const chatWebSocketService = new ChatWebSocketService();
