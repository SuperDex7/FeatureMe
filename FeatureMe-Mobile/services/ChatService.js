import api from './api';

// API base URL for WebSocket
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.0.200:8080'  // Development
  : 'https://FeatureMe.com';  // Production

// Use SockJS protocol for React Native (requires http/https, not ws/wss)
const WS_URL = __DEV__ 
  ? 'http://10.0.0.200:8080/ws'  // Development - SockJS needs http
  : 'https://FeatureMe.com/ws';  // Production - SockJS needs https

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
    uploadFileToChat: (chatRoomId, file, onUploadProgress) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return api.post(`/chats/${chatRoomId}/files`, formData, {
            onUploadProgress: onUploadProgress,
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

// WebSocket Service for real-time messaging using modern @stomp/stompjs
export class ChatWebSocketService {
    constructor() {
        this.stompClient = null;
        this.subscriptions = new Map();
        this.messageHandlers = new Map();
        this.isConnected = false;
    }

    // Connect to WebSocket
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                const { Client } = require('@stomp/stompjs');
                const SockJS = require('sockjs-client');
                
                // Create SockJS connection
                const socket = new SockJS(WS_URL);
                
                this.stompClient = new Client({
                    webSocketFactory: () => socket,
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    debug: function (str) {
                        // Don't log STOMP debug messages - too verbose
                    },
                    onConnect: (frame) => {
                        this.isConnected = true;
                        if (__DEV__) {
                            console.log('✅ WebSocket connected - real-time updates enabled');
                        }
                        resolve(frame);
                    },
                    onDisconnect: () => {
                        this.isConnected = false;
                        if (__DEV__) {
                            console.log('WebSocket disconnected');
                        }
                    },
                    onStompError: (frame) => {
                        console.error('STOMP error:', frame);
                        this.isConnected = false;
                        reject(frame);
                    },
                    onWebSocketError: (error) => {
                        console.error('WebSocket error:', error);
                        this.isConnected = false;
                        reject(error);
                    },
                });
                
                this.stompClient.activate();
            } catch (error) {
                console.error('Error setting up WebSocket:', error);
                reject(error);
            }
        });
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
            this.isConnected = false;
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

        try {
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
        } catch (error) {
            console.error('Error subscribing to chat:', error);
        }
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

        this.stompClient.publish({
            destination: `/app/chat/${chatRoomId}/send`,
            body: JSON.stringify(chatMessage)
        });
    }

    // Add a user to a chat room
    addUserToChat(chatRoomId, usernameToAdd, currentUsername) {
        if (!this.isConnected || !this.stompClient) {
            console.error('WebSocket not connected');
            return;
        }

        const chatMessage = {
            sender: usernameToAdd,
            addedBy: currentUsername,
            chatRoomId: chatRoomId,
            type: 'JOIN'
        };

        this.stompClient.publish({
            destination: `/app/chat/${chatRoomId}/add`,
            body: JSON.stringify(chatMessage)
        });
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

        this.stompClient.publish({
            destination: `/app/chat/${chatRoomId}/leave`,
            body: JSON.stringify(chatMessage)
        });
    }

    // Check if connected
    isWebSocketConnected() {
        return this.isConnected && this.stompClient && this.stompClient.connected;
    }
}

// Export a singleton instance
export const chatWebSocketService = new ChatWebSocketService();

