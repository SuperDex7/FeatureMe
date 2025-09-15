import React, { useState, useEffect } from 'react';
import Stomp from 'stompjs'
import SockJS from 'sockjs-client'
import { getCurrentUser } from '../services/AuthService'
import api from '../services/AuthService'

function MessageTest() {
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const [username, setUsername] = useState('')
    const [chatRoomId, setChatRoomId] = useState('')
    const [jwtToken, setJwtToken] = useState('')
    const [stompClient, setStompClient] = useState(null)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState('')
    const [currentUser, setCurrentUser] = useState(null)
    const [newChatUsers, setNewChatUsers] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initializeUser = async () => {
            try {
                setIsLoading(true)
                // Get current user info
                const user = await getCurrentUser()
                if (user) {
                    setCurrentUser(user)
                    setUsername(user.userName)
                    setJwtToken('AUTO_LOADED') // We'll use cookies for auth
                }
            } catch (err) {
                console.error('Error getting current user:', err)
                setError('Failed to get user information. Please make sure you are logged in.')
            } finally {
                setIsLoading(false)
            }
        }
        
        initializeUser()
    }, [])

    const createChat = async () => {
        try {
            if (!newChatUsers.trim()) {
                setError('Please enter usernames to create a chat with (comma-separated)')
                return
            }

            const usersList = newChatUsers.split(',').map(user => user.trim()).filter(user => user.length > 0)
            
            const response = await api.post('/chats/create', usersList)
            
            if (response.data && response.data.chatRoomId) {
                setChatRoomId(response.data.chatRoomId)
                setError('')
                setNewChatUsers('')
                // Auto-connect to the newly created chat
                setTimeout(() => {
                    connectToChat()
                }, 500)
            }
        } catch (err) {
            console.error('Error creating chat:', err)
            
            // Parse error response for better user feedback
            let errorMessage = 'Failed to create chat'
            
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data
                } else if (err.response.data.error) {
                    errorMessage = `${err.response.data.error}: ${err.response.data.details || 'Unknown error'}`
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message
                }
            } else if (err.message) {
                errorMessage = err.message
            }
            
            setError(errorMessage)
        }
    }

    const connectToChat = async () => {
        try {
            if (!chatRoomId.trim()) {
                setError('Please enter a chat room ID or create a new chat')
                return
            }
            if (!username.trim()) {
                setError('Please enter your username')
                return
            }

            // First, fetch existing messages
            try {
                const response = await api.get(`/chats/${chatRoomId}/messages`)
                if (response.data && response.data.messages) {
                    setMessages(response.data.messages)
                    setError('') // Clear any previous errors
                }
            } catch (err) {
                console.error('Error fetching existing messages:', err)
                // Parse error response for better user feedback
                let errorMessage = 'Could not load existing messages'
                
                if (err.response?.data) {
                    if (typeof err.response.data === 'string') {
                        errorMessage = err.response.data
                    } else if (err.response.data.error) {
                        errorMessage = `${err.response.data.error}: ${err.response.data.details || 'Unknown error'}`
                    } else if (err.response.data.message) {
                        errorMessage = err.response.data.message
                    }
                } else if (err.message) {
                    errorMessage = err.message
                }
                
                setError(`Warning: ${errorMessage}`)
            }

            const SockJS = (await import('sockjs-client')).default;
            const Stomp = (await import('stompjs')).default;
            
            const socket = new SockJS('http://localhost:8080/ws')
            const client = Stomp.over(socket)
            
            client.connect(
                {}, // No headers needed since we're using cookies
                () => {
                    setConnected(true)
                    setError('')
                    
                    // Subscribe to the specific chat room
                    client.subscribe(`/topic/chat/${chatRoomId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    })
                },
                (error) => {
                    setError(`Connection failed: ${error}`)
                    setConnected(false)
                }
            )
            
            setStompClient(client);

        } catch (err) {
            setError(`Error connecting: ${err.message}`)
            setConnected(false)
        }
    }

    const loadExistingMessages = async () => {
        if (!chatRoomId.trim()) {
            setError('Please enter a chat room ID')
            return
        }

        try {
            const response = await api.get(`/chats/${chatRoomId}/messages`)
            if (response.data && response.data.messages) {
                setMessages(response.data.messages)
                setError('')
            }
        } catch (err) {
            console.error('Error fetching messages:', err)
            
            // Parse error response for better user feedback
            let errorMessage = 'Failed to load messages'
            
            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data
                } else if (err.response.data.error) {
                    errorMessage = `${err.response.data.error}: ${err.response.data.details || 'Unknown error'}`
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message
                }
            } else if (err.message) {
                errorMessage = err.message
            }
            
            setError(errorMessage)
        }
    }

    const disconnectFromChat = () => {
        if (stompClient) {
            stompClient.disconnect()
            setStompClient(null)
            setConnected(false)
            setMessages([])
        }
    }

    const sendMessage = () => {
        if (message.trim() && stompClient && connected) {
            const chatMessage = {
                message: message,
                sender: username,
                type: 'CHAT'
            };
            
            stompClient.send(`/app/chat/${chatRoomId}/send`, {}, JSON.stringify(chatMessage));
            setMessage(''); // Clear the message input after sending
        }
    }

    const joinChat = () => {
        if (stompClient && connected) {
            const joinMessage = {
                message: `${username} joined the chat`,
                sender: username,
                type: 'JOIN'
            };
            
            stompClient.send(`/app/chat/${chatRoomId}/add`, {}, JSON.stringify(joinMessage));
        }
    }

    const leaveChat = () => {
        if (stompClient && connected) {
            const leaveMessage = {
                message: `${username} left the chat`,
                sender: username,
                type: 'LEAVE'
            };
            
            stompClient.send(`/app/chat/${chatRoomId}/leave`, {}, JSON.stringify(leaveMessage));
        }
    }

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    }

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    }

    const handleChatRoomIdChange = (e) => {
        setChatRoomId(e.target.value);
    }

    const handleNewChatUsersChange = (e) => {
        setNewChatUsers(e.target.value);
    }

    if (isLoading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading Chat Interface...</h2>
                <p>Getting user information...</p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Chat Test Interface</h2>
            
            {currentUser && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                    <strong>Logged in as:</strong> {currentUser.userName} ({currentUser.email})
                </div>
            )}
            
            {error && (
                <div style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid red', borderRadius: '4px' }}>
                    {error}
                </div>
            )}

            {!connected ? (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <h3>Chat Options</h3>
                    
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                        <h4>Create New Chat</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Add users (comma-separated usernames): </label>
                            <input 
                                type="text" 
                                value={newChatUsers} 
                                onChange={handleNewChatUsersChange}
                                placeholder="e.g., user1, user2, user3"
                                style={{ width: '300px', padding: '5px', marginLeft: '10px' }}
                            />
                        </div>
                        <button 
                            onClick={createChat}
                            style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Create Chat
                        </button>
                    </div>

                    <div style={{ padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}>
                        <h4>Join Existing Chat</h4>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Chat Room ID: </label>
                            <input 
                                type="text" 
                                value={chatRoomId} 
                                onChange={handleChatRoomIdChange}
                                placeholder="Enter existing chat room ID"
                                style={{ width: '250px', padding: '5px', marginLeft: '10px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <button 
                                onClick={loadExistingMessages}
                                style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Load Messages
                            </button>
                            <button 
                                onClick={connectToChat}
                                style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Connect to Chat
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>
                    <h3>Connected to Chat Room: {chatRoomId}</h3>
                    <p>Username: {username}</p>
                    <button 
                        onClick={loadExistingMessages}
                        style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Refresh Messages
                    </button>
                    <button 
                        onClick={joinChat}
                        style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Join Chat
                    </button>
                    <button 
                        onClick={leaveChat}
                        style={{ marginRight: '10px', padding: '8px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Leave Chat
                    </button>
                    <button 
                        onClick={disconnectFromChat}
                        style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Disconnect
                    </button>
                </div>
            )}

            {connected && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <input 
                            type="text" 
                            value={message} 
                            onChange={handleMessageChange}
                            placeholder="Type your message..."
                            style={{ width: '400px', padding: '8px', marginRight: '10px' }}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <button 
                            onClick={sendMessage} 
                            disabled={!message.trim()}
                            style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Send Message
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h3>Messages ({messages.length})</h3>
                <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: '#f9f9f9' }}>
                    {messages.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No messages yet...</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {messages.map((msg, index) => (
                                <li key={index} style={{ 
                                    marginBottom: '8px', 
                                    padding: '8px', 
                                    backgroundColor: msg.type === 'JOIN' ? '#e6ffe6' : msg.type === 'LEAVE' ? '#ffe6e6' : '#ffffff',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}>
                                    <strong>{msg.sender}:</strong> {msg.message}
                                    {msg.type && msg.type !== 'CHAT' && (
                                        <span style={{ fontSize: '0.8em', color: '#666', marginLeft: '10px' }}>
                                            [{msg.type}]
                                        </span>
                                    )}
                                    {msg.time && (
                                        <div style={{ fontSize: '0.7em', color: '#888', marginTop: '2px' }}>
                                            {new Date(msg.time).toLocaleTimeString()}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
export default MessageTest