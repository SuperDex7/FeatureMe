import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { ChatService, chatWebSocketService } from '../services/ChatService';
import { getCurrentUser } from '../services/AuthService';
import { listUsers } from '../services/UserService';
import api from '../services/AuthService';
import { validateChatFile, validateChatPhoto, getFileRestrictionsMessage } from '../utils/fileValidation';
import '../Styling/Messages.css';

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserSearchTerm, setAddUserSearchTerm] = useState('');
  const [addUserSearchResults, setAddUserSearchResults] = useState([]);
  const [addingUser, setAddingUser] = useState(false);
  const fileInputRef = useRef(null);
  const chatPhotoInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (term) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          searchUsers(term);
        }, 300);
      };
    })(),
    [currentUser, selectedUsers]
  );

  // Debounced search function for adding users
  const debouncedAddUserSearch = useCallback(
    (() => {
      let timeoutId;
      return (term) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          searchUsersForAdd(term);
        }, 300);
      };
    })(),
    [currentUser, selectedConversation]
  );

  // Initialize the component
  useEffect(() => {
    initializeChat();
    return () => {
      chatWebSocketService.disconnect();
    };
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle user search
  useEffect(() => {
    debouncedSearch(userSearchTerm);
  }, [userSearchTerm, debouncedSearch]);

  // Handle add user search
  useEffect(() => {
    debouncedAddUserSearch(addUserSearchTerm);
  }, [addUserSearchTerm, debouncedAddUserSearch]);


  // Initialize chat functionality
  const initializeChat = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        setError('Please log in to access messages');
        return;
      }
      setCurrentUser(user);

      // Connect to WebSocket
      await chatWebSocketService.connect();

      // Load conversations
      await loadConversations();

      // Handle URL parameters for creating chat with specific user
      const createChatUser = searchParams.get('user');
      const shouldCreateChat = searchParams.get('createChat') === 'true';
      
      if (shouldCreateChat && createChatUser && createChatUser !== user.userName) {
        // Open create chat modal without setting search term
        setShowCreateChat(true);
        // Small delay to ensure WebSocket is fully ready, then search and auto-select
        setTimeout(async () => {
          try {
            await searchUsers(createChatUser);
            // Auto-select the user immediately after search
            const userToSelect = await findUserByUsername(createChatUser);
            if (userToSelect) {
              setSelectedUsers([userToSelect]);
            }
          } catch (error) {
            console.error('Error searching for user after delay:', error);
          }
        }, 100);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
      setError('Failed to initialize chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load conversations from backend
  const loadConversations = async () => {
    try {
      const response = await ChatService.getChats(0, 50);
      console.log('Full response from getChats:', response);
      console.log('Response data:', response.data);
      const chatData = response.data.content || response.data;
      console.log('Chat data:', chatData);
      console.log('First conversation:', chatData[0]);
      setConversations(chatData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    }
  };


  // Search for users by username
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchedUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await api.get(`/user/get/search/${searchTerm}?page=0&size=20`);
      const users = response.data.content || [];
      // Filter out current user and already selected users
      const filteredUsers = users.filter(user => 
        user.userName !== currentUser?.userName && 
        !selectedUsers.some(selectedUser => selectedUser.userName === user.userName)
      );
      setSearchedUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchedUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Helper function to find a user by username
  const findUserByUsername = async (username) => {
    try {
      const response = await api.get(`/user/get/search/${username}?page=0&size=20`);
      const users = response.data.content || [];
      return users.find(user => user.userName === username);
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    }
  };

  // Search for users to add to chat
  const searchUsersForAdd = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setAddUserSearchResults([]);
      return;
    }

    setAddingUser(true);
    try {
      const response = await api.get(`/user/get/search/${searchTerm}?page=0&size=20`);
      const users = response.data.content || [];
      // Filter out current user and users already in the chat
      const chatUserNames = selectedConversation?.users || [];
      const filteredUsers = users.filter(user => 
        user.userName !== currentUser?.userName && 
        !chatUserNames.includes(user.userName)
      );
      setAddUserSearchResults(filteredUsers);
    } catch (error) {
      console.error('Error searching users for add:', error);
      setAddUserSearchResults([]);
    } finally {
      setAddingUser(false);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversation) => {
    try {
      const chatRoomId = conversation.ChatId || conversation.chatRoomId;
      console.log('Loading messages for conversation:', conversation);
      console.log('ChatRoomId:', chatRoomId);
      // reset paging
      setPage(0);
      setHasMore(true);
      const response = await ChatService.getChatMessagesPaged(chatRoomId, 0, 15);
      const pageData = response.data || [];
      setMessages(pageData);
      setHasMore(pageData.length === 15);
      
      // Subscribe to real-time updates for this chat
      if (chatWebSocketService.isConnected()) {
        chatWebSocketService.subscribeToChat(chatRoomId, (newMessage) => {
          console.log('New message received:', newMessage);
          console.log('Message type:', newMessage.type);
          console.log('Message content:', newMessage.message);
          setMessages(prevMessages => [...prevMessages, newMessage]);
          // Update the conversation's last message
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              (conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId)
                ? { ...conv, message: newMessage.message, time: newMessage.time }
                : conv
            )
          );
        });
      } else {
        console.warn('WebSocket not connected, skipping subscription');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    console.log('Conversation selected:', conversation);
    console.log('ChatId:', conversation.ChatId);
    console.log('Message:', conversation.message);
    console.log('Users:', conversation.users);
    setSelectedConversation(conversation);
    loadMessages(conversation);
  };

  // Infinite scroll: fetch older messages when scrolled to top
  const handleScroll = async () => {
    if (!messagesContainerRef.current || !selectedConversation || isFetchingMore || !hasMore) return;
    if (messagesContainerRef.current.scrollTop <= 0) {
      try {
        setIsFetchingMore(true);
        const nextPage = page + 1;
        const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
        const prevHeight = messagesContainerRef.current.scrollHeight;
        const response = await ChatService.getChatMessagesPaged(chatRoomId, nextPage, 15);
        const older = response.data || [];
        setMessages(prev => [...older, ...prev]);
        setPage(nextPage);
        setHasMore(older.length === 15);
        // maintain scroll position after prepending
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newHeight - prevHeight;
          }
        });
      } catch (e) {
        console.error('Error loading older messages', e);
      } finally {
        setIsFetchingMore(false);
      }
    }
  };

  // Manual load older for mobile (button)
  const loadOlderManually = async () => {
    if (!selectedConversation || isFetchingMore || !hasMore) return;
    try {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
      const prevHeight = messagesContainerRef.current?.scrollHeight || 0;
      const response = await ChatService.getChatMessagesPaged(chatRoomId, nextPage, 15);
      const older = response.data || [];
      setMessages(prev => [...older, ...prev]);
      setPage(nextPage);
      setHasMore(older.length === 15);
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          const newHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newHeight - prevHeight;
        }
      });
    } catch (e) {
      console.error('Error loading older messages (manual)', e);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Send a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    try {
      // Send message via WebSocket
      const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
      
      if (chatWebSocketService.isConnected()) {
        chatWebSocketService.sendMessage(
          chatRoomId, 
          messageText, 
          currentUser.userName
        );
        
        // Clear the input
        setMessageText('');
      } else {
        console.error('WebSocket not connected, cannot send message');
        setError('Connection lost. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation || !currentUser) return;

    // Validate file based on user role
    const validation = validateChatFile(file, currentUser.role);
    if (!validation.isValid) {
      setError(validation.error);
      // Clear the file input
      event.target.value = '';
      return;
    }

    try {
      const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
      await ChatService.uploadFileToChat(chatRoomId, file);
      // File upload success - the message will be added via WebSocket
      // Clear any previous errors
      setError(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    }
  };

  // Handle chat photo upload
  const handleChatPhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation || !currentUser) return;

    // Validate file based on user role (only images allowed for chat photos)
    const validation = validateChatPhoto(file, currentUser.role);
    if (!validation.isValid) {
      setError(validation.error);
      // Clear the file input
      event.target.value = '';
      return;
    }

    try {
      const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
      
      if (!chatRoomId) {
        throw new Error('Chat Room ID is undefined');
      }
      
      // Upload file directly to S3 without creating a file message
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await api.post(`/s3/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Extract the S3 URL from the response
      const fileUrl = uploadResponse.data;
      
      // Update the chat photo with the URL
      await ChatService.updateChatPhoto(chatRoomId, fileUrl);
      
      // Update the selected conversation with the new photo
      const updatedConversation = {
        ...selectedConversation,
        chatPhoto: fileUrl
      };
      setSelectedConversation(updatedConversation);
      
      // Update the conversations list
      setConversations(prev => prev.map(conv => 
        conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId
          ? { ...conv, chatPhoto: fileUrl }
          : conv
      ));
      
      // Reload messages to show the "changed chat photo" message
      await loadMessages(updatedConversation);
      
      // Clear any previous errors
      setError(null);
      
    } catch (error) {
      console.error('Error uploading chat photo:', error);
      setError('Failed to upload chat photo');
    }
  };

  // Create a new chat
  const handleCreateChat = async () => {
    if (!newChatName.trim() || selectedUsers.length === 0) return;

    try {
      // Extract usernames from user objects
      const usernames = selectedUsers.map(user => user.userName);
      const response = await ChatService.createChat(usernames, newChatName);
      const newChat = response.data;
      
      // Clear modal first
      clearModalState();
      
      // Refresh the page to reload all conversations and ensure proper state
      window.location.reload();
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat');
    }
  };

  // Handle leaving a chat
  const handleLeaveChat = async (conversation) => {
    if (!conversation || !currentUser) return;
    
    const chatRoomId = conversation.ChatId || conversation.chatRoomId;
    if (!chatRoomId) return;

    // Show confirmation dialog
    const chatName = conversation.chatName || 'this chat';
    const confirmed = window.confirm(
      `Are you sure you want to leave "${chatName}"?\n\nYou will no longer receive messages from this chat and won't be able to rejoin unless someone adds you back.`
    );

    if (!confirmed) {
      return; // User cancelled
    }

    try {
      // Use WebSocket for instant delivery
      if (chatWebSocketService.isConnected()) {
        chatWebSocketService.leaveChat(chatRoomId, currentUser.userName);
      } else {
        console.warn('WebSocket not connected, leaving chat without real-time notification');
      }
      
      // Remove from conversations list immediately for instant UI feedback
      setConversations(prev => 
        prev.filter(conv => 
          conv.ChatId !== chatRoomId && conv.chatRoomId !== chatRoomId
        )
      );
      
      // Clear selected conversation if it's the one being left
      if (selectedConversation && 
          (selectedConversation.ChatId === chatRoomId || selectedConversation.chatRoomId === chatRoomId)) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
    } catch (error) {
      console.error('Error leaving chat:', error);
      setError('Failed to leave chat');
    }
  };

  // Add user to selected users for new chat
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(selectedUser => selectedUser.userName === user.userName) 
        ? prev.filter(selectedUser => selectedUser.userName !== user.userName)
        : [...prev, user]
    );
  };

  // Add user to existing chat
  const handleAddUserToChat = async (user) => {
    if (!selectedConversation || !currentUser) return;
    
    const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
    if (!chatRoomId) return;

    try {
      // Use WebSocket for instant delivery
      if (chatWebSocketService.isConnected()) {
        chatWebSocketService.addUserToChat(chatRoomId, user.userName, currentUser.userName);
      } else {
        console.warn('WebSocket not connected, adding user without real-time notification');
      }
      
      // Update the conversation's user list immediately for instant UI feedback
      setConversations(prev => 
        prev.map(conv => 
          (conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId)
            ? { ...conv, users: [...(conv.users || []), user.userName] }
            : conv
        )
      );
      
      // Update selected conversation if it's the current one
      if (selectedConversation.ChatId === chatRoomId || selectedConversation.chatRoomId === chatRoomId) {
        setSelectedConversation(prev => ({
          ...prev,
          users: [...(prev.users || []), user.userName]
        }));
      }
      
      // Clear search and close modal
      setAddUserSearchTerm('');
      setAddUserSearchResults([]);
      setShowAddUser(false);
      
    } catch (error) {
      console.error('Error adding user to chat:', error);
      setError('Failed to add user to chat');
    }
  };

  // Clear modal state
  const clearModalState = () => {
    setNewChatName('');
    setSelectedUsers([]);
    setUserSearchTerm('');
    setSearchedUsers([]);
    setShowCreateChat(false);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render different types of message content
  const renderMessageContent = (message) => {
    // Check if it's a chat photo change message
    if (message.message.includes('changed the chat photo') && message.message.includes('| PHOTO_URL:')) {
      const photoUrlMatch = message.message.match(/\| PHOTO_URL:([^|]+)/);
      const photoUrl = photoUrlMatch ? photoUrlMatch[1].trim() : null;
      
      return (
        <div className="messaging-photo-change-message">
          <p className="messaging-photo-change-text">{message.message.split(' | PHOTO_URL:')[0]}</p>
          {photoUrl && (
            <div className="messaging-photo-change-preview">
              <img src={photoUrl} alt="New chat photo" className="messaging-photo-change-image" />
            </div>
          )}
        </div>
      );
    }
    
    // Check if it's a file message
    if (message.type === 'FILE' || message.message.includes('| FILE_URL:')) {
      const fileUrlMatch = message.message.match(/\| FILE_URL:([^|]+)/);
      const fileSizeMatch = message.message.match(/\| FILE_SIZE:(\d+)/);
      const fileNameMatch = message.message.match(/sent a file: ([^|]+)/);
      
      const fileUrl = fileUrlMatch ? fileUrlMatch[1].trim() : null;
      const fileSize = fileSizeMatch ? parseInt(fileSizeMatch[1]) : 0;
      const fileName = fileNameMatch ? fileNameMatch[1].trim() : 'Unknown file';
      
      // Determine file type from URL or filename
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl || fileName);
      const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl || fileName);
      const isVideo = /\.(mp4|avi|mov|wmv)$/i.test(fileUrl || fileName);
      
      return (
        <div className="messaging-file-message">
          <div className="messaging-file-info">
            <span className="messaging-file-icon">
              {isImage ? '🖼️' : isAudio ? '🎵' : isVideo ? '🎥' : '📎'}
            </span>
            <div className="messaging-file-details">
              <div className="messaging-file-name">{fileName}</div>
              <div className="messaging-file-size">{formatFileSize(fileSize)}</div>
            </div>
          </div>
          {fileUrl && (
            <div className="messaging-file-preview">
              {isImage ? (
                <img src={fileUrl} alt={fileName} className="messaging-file-image" />
              ) : isAudio ? (
                <audio controls className="messaging-file-audio">
                  <source src={fileUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              ) : isVideo ? (
                <video controls className="messaging-file-video">
                  <source src={fileUrl} type="video/mp4" />
                  Your browser does not support the video element.
                </video>
              ) : (
                <button 
                  onClick={() => handleFileDownload(fileUrl, fileName)} 
                  className="messaging-file-download"
                >
                  Download File
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // Regular text message
    return <p>{message.message}</p>;
  };

  // Handle file download
  const handleFileDownload = async (fileUrl, fileName) => {
    try {
      // Fetch the file as a blob to force download
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('File download started:', fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll when a new conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation]);

  // Show loading state
  if (loading) {
    return (
      <div className="messaging-page">
        <Header />
        <div className="messaging-container">
          <div className="messaging-loading-state">
            <div className="messaging-loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="messaging-page">
        <Header />
        <div className="messaging-container">
          <div className="messaging-error-state">
            <div className="messaging-error-icon">⚠️</div>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={initializeChat} className="messaging-retry-btn">Try Again</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="messaging-page">
      <Header />
      
      <div className="messaging-container">
        {/* Conversations Sidebar */}
        <div className="messaging-conversations-sidebar">
          <div className="messaging-sidebar-header">
            <h2>Messages</h2>
            <button 
              className="messaging-new-message-btn"
              onClick={() => setShowCreateChat(true)}
            >
              <span className="messaging-icon">✏️</span>
            </button>
          </div>
          
          <div className="messaging-search-bar">
            <span className="messaging-search-icon">🔍</span>
            <input type="text" placeholder="Search conversations..." />
          </div>

          <div className="messaging-conversations-list">
            {conversations.map((conversation) => (
              <div
                key={conversation.ChatId || conversation.chatRoomId}
                className={`messaging-conversation-item ${selectedConversation?.ChatId === conversation.ChatId || selectedConversation?.chatRoomId === conversation.chatRoomId ? 'active' : ''}`}
                onClick={() => handleConversationSelect(conversation)}
              >
                <div className="messaging-conversation-avatar">
                  <img 
                    src={conversation.chatPhoto || "/dpp.jpg"} 
                    alt={conversation.chatName}
                    onError={(e) => {
                      e.target.src = "/dpp.jpg";
                    }}
                  />
                </div>
                
                <div className="messaging-conversation-content">
                  <div className="messaging-conversation-header">
                    <h3 className="messaging-conversation-name">{conversation.chatName}</h3>
                    <span className="messaging-conversation-time">{formatTimestamp(conversation.time)}</span>
                  </div>
                  <p className="messaging-conversation-preview">
                    {conversation.message || 'No messages yet'}
                  </p>
                  <div className="messaging-conversation-meta">
                    <span className="messaging-conversation-users">
                      {conversation.users?.length || 0} members
                    </span>
                    {conversation.time && (
                      <span className="messaging-conversation-last-active">
                        Last active: {formatTimestamp(conversation.time)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="messaging-chat-area">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="messaging-chat-header">
                <div className="messaging-chat-user-info">
                  <div className="messaging-chat-avatar">
                    <img 
                      src={selectedConversation.chatPhoto || "/dpp.jpg"} 
                      alt={selectedConversation.chatName}
                      onError={(e) => {
                        e.target.src = "/dpp.jpg";
                      }}
                    />
                    <button 
                      className="messaging-chat-photo-upload-btn"
                      onClick={() => chatPhotoInputRef.current?.click()}
                      title={currentUser ? `Change chat photo - ${getFileRestrictionsMessage(currentUser.role)}` : 'Change chat photo'}
                    >
                      📷
                    </button>
                    <input
                      ref={chatPhotoInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      onChange={handleChatPhotoUpload}
                      accept={currentUser?.role === 'USERPLUS' 
                        ? "image/jpeg,image/jpg,image/png,image/gif" 
                        : "image/jpeg,image/jpg,image/png"
                      }
                    />
                  </div>
                  <div className="messaging-chat-user-details">
                    <h3>{selectedConversation.chatName}</h3>
                    <span className="messaging-user-status">
                      {selectedConversation.users?.length || 0} members
                      {selectedConversation.users && selectedConversation.users.length > 0 && (
                        <span className="messaging-user-names">
                          : {selectedConversation.users.map((username, index) => (
                            <React.Fragment key={username}>
                              <Link 
                                to={`/profile/${username}`} 
                                className={`messaging-user-link ${username === currentUser?.userName ? 'current-user' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {username}
                              </Link>
                              {index < selectedConversation.users.length - 1 && ', '}
                            </React.Fragment>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="messaging-chat-actions">
                  <button 
                    className="messaging-chat-action-btn"
                    title="Add User"
                    onClick={() => setShowAddUser(true)}
                  >
                    ➕
                  </button>
                  <button 
                    className="messaging-chat-action-btn leave-btn"
                    title="Leave Chat"
                    onClick={() => handleLeaveChat(selectedConversation)}
                  >
                    🚪
                  </button>
                  <button className="messaging-chat-action-btn" title="Chat Info">ℹ️</button>
                </div>
              </div>

              {/* Messages */}
              {isMobile && hasMore && (
                <div className="messaging-load-earlier-container">
                  <button className="messaging-load-earlier-btn" onClick={loadOlderManually} disabled={isFetchingMore}>
                    {isFetchingMore ? 'Loading…' : 'Load earlier'}
                  </button>
                </div>
              )}
              <div className="messaging-messages-area" ref={messagesContainerRef} onScroll={!isMobile ? handleScroll : undefined}>
                {isFetchingMore && (
                  <div className="messaging-loading-older">Loading older messages...</div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.messageId || message.id || Math.random()}
                    className={`messaging-message ${message.sender === currentUser?.userName ? 'messaging-message-sent' : 'messaging-message-received'}`}
                  >
                    <div className="messaging-message-bubble">
                      {message.sender !== currentUser?.userName && (
                        <div className="messaging-message-sender">{message.sender}</div>
                      )}
                      {renderMessageContent(message)}
                      <span className="messaging-message-time">{formatTimestamp(message.time)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="messaging-message-input-area">
                <div className="messaging-message-input-container">
                  <button 
                    className="messaging-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title={currentUser ? getFileRestrictionsMessage(currentUser.role) : 'File upload not available'}
                  >
                    📎
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept={currentUser?.role === 'USERPLUS' 
                      ? "image/jpeg,image/jpg,image/png,image/gif,audio/mp3,audio/wav" 
                      : "image/jpeg,image/jpg,image/png,audio/mp3"
                    }
                  />
                  <div className="messaging-input-wrapper">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows="1"
                    />
                  </div>
                  <button 
                    className="messaging-send-btn"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    <span className="messaging-send-icon">➤</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="messaging-no-conversation">
              <div className="messaging-no-conversation-content">
                <div className="messaging-no-conversation-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose from your existing conversations or start a new one</p>
                <button 
                  className="messaging-start-conversation-btn"
                  onClick={() => setShowCreateChat(true)}
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Chat Modal */}
      {showCreateChat && (
        <div className="messaging-modal-overlay">
          <div className="messaging-modal-content">
            <div className="messaging-modal-header">
              <h3>Create New Chat</h3>
              <button 
                className="messaging-close-btn"
                onClick={() => setShowCreateChat(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="messaging-modal-body">
              <div className="messaging-form-group">
                <label htmlFor="chatName">Chat Name</label>
                <input
                  id="chatName"
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Enter chat name..."
                />
              </div>
              
              <div className="messaging-form-group">
                <label>Search and Select Users</label>
                <div className="messaging-user-search-container">
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    className="messaging-user-search-input"
                  />
                  {searchingUsers && (
                    <div className="messaging-search-loading">
                      <div className="messaging-search-spinner"></div>
                    </div>
                  )}
                </div>
                
                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="messaging-selected-users-section">
                    <label className="messaging-selected-users-label">Selected Users ({selectedUsers.length})</label>
                    <div className="messaging-selected-users-list">
                      {selectedUsers.map((user) => (
                        <div key={user.userName} className="messaging-selected-user-item">
                          <img src={user.profilePic || "/dpp.jpg"} alt={user.userName} />
                          <span>{user.userName}</span>
                          <button 
                            className="messaging-remove-user-btn"
                            onClick={() => toggleUserSelection(user)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Search Results */}
                {userSearchTerm && (
                  <div className="messaging-search-results-section">
                    <label className="messaging-search-results-label">Search Results</label>
                    <div className="messaging-users-list">
                      {searchedUsers.length > 0 ? (
                        searchedUsers.map((user) => (
                          <div
                            key={user.userName}
                            className={`messaging-user-item ${selectedUsers.some(selectedUser => selectedUser.userName === user.userName) ? 'selected' : ''}`}
                            onClick={() => toggleUserSelection(user)}
                          >
                            <img src={user.profilePic || "/dpp.jpg"} alt={user.userName} />
                            <div className="messaging-user-info">
                              <span className="messaging-user-name">{user.userName}</span>
                              {user.bio && <span className="messaging-user-bio">{user.bio}</span>}
                            </div>
                            {selectedUsers.some(selectedUser => selectedUser.userName === user.userName) && <span className="messaging-check">✓</span>}
                          </div>
                        ))
                      ) : !searchingUsers ? (
                        <div className="messaging-no-search-results">
                          <span>No users found for "{userSearchTerm}"</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
                
                {/* Search Hint when no search term */}
                {!userSearchTerm && (
                  <div className="messaging-search-hint">
                    <span>💡 Start typing a username to search for users to add to your chat</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="messaging-modal-footer">
              <button 
                className="messaging-cancel-btn"
                onClick={clearModalState}
              >
                Cancel
              </button>
              <button 
                className="messaging-create-btn"
                onClick={handleCreateChat}
                disabled={!newChatName.trim() || selectedUsers.length === 0}
              >
                Create Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && selectedConversation && (
        <div className="messaging-modal-overlay">
          <div className="messaging-modal-content">
            <div className="messaging-modal-header">
              <h3>Add User to "{selectedConversation.chatName}"</h3>
              <button 
                className="messaging-close-btn"
                onClick={() => {
                  setShowAddUser(false);
                  setAddUserSearchTerm('');
                  setAddUserSearchResults([]);
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="messaging-modal-body">
              <div className="messaging-form-group">
                <label>Search Users to Add</label>
                <div className="messaging-user-search-container">
                  <input
                    type="text"
                    value={addUserSearchTerm}
                    onChange={(e) => setAddUserSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    className="messaging-user-search-input"
                  />
                  {addingUser && (
                    <div className="messaging-search-loading">
                      <div className="messaging-search-spinner"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {addUserSearchTerm && (
                  <div className="messaging-search-results-section">
                    <label className="messaging-search-results-label">Search Results</label>
                    <div className="messaging-users-list">
                      {addUserSearchResults.length > 0 ? (
                        addUserSearchResults.map((user) => (
                          <div
                            key={user.userName}
                            className="messaging-user-item"
                            onClick={() => handleAddUserToChat(user)}
                          >
                            <img src={user.profilePic || "/dpp.jpg"} alt={user.userName} />
                            <div className="messaging-user-info">
                              <span className="messaging-user-name">{user.userName}</span>
                              {user.bio && <span className="messaging-user-bio">{user.bio}</span>}
                            </div>
                            <span className="messaging-check">➕</span>
                          </div>
                        ))
                      ) : !addingUser ? (
                        <div className="messaging-no-search-results">
                          <span>No users found for "{addUserSearchTerm}"</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="messaging-modal-footer">
              <button 
                className="messaging-cancel-btn"
                onClick={() => {
                  setShowAddUser(false);
                  setAddUserSearchTerm('');
                  setAddUserSearchResults([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MessagesPage;
