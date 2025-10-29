import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '../services/api';
import { ChatService, chatWebSocketService } from '../services/ChatService';
import api from '../services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Cache for each conversation's messages and state
  const [conversationCache, setConversationCache] = useState({});
  const [pageCache, setPageCache] = useState({});
  const [hasMoreCache, setHasMoreCache] = useState({});
  
  // Create chat modal state
  const [newChatName, setNewChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Add user modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserSearchTerm, setAddUserSearchTerm] = useState('');
  const [addUserSearchResults, setAddUserSearchResults] = useState([]);
  const [addingUser, setAddingUser] = useState(false);
  
  // Show users modal
  const [showUsers, setShowUsers] = useState(false);
  
  // Audio player modal state
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const [currentAudioName, setCurrentAudioName] = useState('');
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progressLayout, setProgressLayout] = useState(null);
  
  // Image viewer modal state
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [currentImageName, setCurrentImageName] = useState('');
  
  const messagesScrollRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => {
      chatWebSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (userSearchTerm) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(userSearchTerm);
      }, 300);
    } else {
      setSearchedUsers([]);
    }
    
    return () => {
      clearTimeout(searchTimeoutRef.current);
    };
  }, [userSearchTerm, currentUser, selectedUsers]);

  useEffect(() => {
    if (addUserSearchTerm) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchUsersForAdd(addUserSearchTerm);
      }, 300);
    } else {
      setAddUserSearchResults([]);
    }
    
    return () => {
      clearTimeout(searchTimeoutRef.current);
    };
  }, [addUserSearchTerm, currentUser, selectedConversation]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to access messages');
        router.back();
        return;
      }
      
      setCurrentUser(user);
      
      // Connect to WebSocket with timeout (silently fail if not available)
      try {
        const connectPromise = chatWebSocketService.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000)
        );
        await Promise.race([connectPromise, timeoutPromise]);
        if (__DEV__) {
          console.log('WebSocket connected - real-time updates enabled');
        }
      } catch (error) {
        // Silently continue - WebSocket not available (backend needs restart with new endpoint)
        if (__DEV__) {
          console.log('Real-time updates unavailable - messages will still work');
        }
      }
      
      await loadConversations();
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await ChatService.getChats(0, 50);
      const chatData = response.data.content || response.data || [];
      setConversations(chatData);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchedUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await api.get(`/user/get/search/${searchTerm}?page=0&size=20`);
      const users = response.data.content || [];
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

  const searchUsersForAdd = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setAddUserSearchResults([]);
      return;
    }

    setAddingUser(true);
    try {
      const response = await api.get(`/user/get/search/${searchTerm}?page=0&size=20`);
      const users = response.data.content || [];
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

  const handleConversationSelect = async (conversation) => {
    const chatRoomId = conversation.ChatId || conversation.chatRoomId;
    
    // Set selected conversation immediately
    setSelectedConversation(conversation);
    setShowChatView(true);
    
    // Load cached messages immediately if they exist
    if (conversationCache[chatRoomId]) {
      setMessages(conversationCache[chatRoomId]);
    }
    
    // Load fresh messages in background
    await loadMessages(conversation);
  };

  const loadMessages = async (conversation) => {
    try {
      setLoadingMessages(true);
      const chatRoomId = conversation.ChatId || conversation.chatRoomId;
      
      // Only load if not cached
      if (!conversationCache[chatRoomId]) {
        const response = await ChatService.getChatMessagesPaged(chatRoomId, 0, 15);
        const pageData = response.data || [];
        
        // Cache the messages
        setConversationCache(prev => ({
          ...prev,
          [chatRoomId]: pageData
        }));
        setPageCache(prev => ({
          ...prev,
          [chatRoomId]: 0
        }));
        setHasMoreCache(prev => ({
          ...prev,
          [chatRoomId]: pageData.length === 15
        }));
        
        setMessages(pageData);
      } else {
        // Just update the display with cached messages
        setMessages(conversationCache[chatRoomId]);
      }
      
      // Subscribe to real-time updates
      if (chatWebSocketService.isWebSocketConnected()) {
        chatWebSocketService.unsubscribeFromChat(chatRoomId);
        chatWebSocketService.subscribeToChat(chatRoomId, (newMessage) => {
          // Update both cache and current display
          const updatedMessages = [...(conversationCache[chatRoomId] || []), newMessage];
          
          setConversationCache(prev => ({
            ...prev,
            [chatRoomId]: updatedMessages
          }));
          
          setMessages(updatedMessages);
          
          setConversations(prevConversations => 
            prevConversations.map(conv => 
              (conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId)
                ? { ...conv, message: newMessage.message, time: newMessage.time }
                : conv
            )
          );
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't alert on error, just show cached if available
      if (conversationCache[chatRoomId]) {
        setMessages(conversationCache[chatRoomId]);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!selectedConversation) return;
    
    const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
    const hasMore = hasMoreCache[chatRoomId] ?? true;
    const page = pageCache[chatRoomId] ?? 0;
    
    if (!hasMore || isFetchingMore) return;

    try {
      setIsFetchingMore(true);
      const nextPage = page + 1;
      
      const response = await ChatService.getChatMessagesPaged(chatRoomId, nextPage, 15);
      const olderMessages = response.data || [];
      
      if (olderMessages.length > 0) {
        // Update cache
        const updatedMessages = [...olderMessages, ...conversationCache[chatRoomId]];
        setConversationCache(prev => ({
          ...prev,
          [chatRoomId]: updatedMessages
        }));
        setPageCache(prev => ({
          ...prev,
          [chatRoomId]: nextPage
        }));
        setHasMoreCache(prev => ({
          ...prev,
          [chatRoomId]: olderMessages.length === 15
        }));
        
        // Update display
        setMessages(updatedMessages);
      } else {
        setHasMoreCache(prev => ({
          ...prev,
          [chatRoomId]: false
        }));
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return;

    try {
      const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
      
      if (chatWebSocketService.isWebSocketConnected()) {
        chatWebSocketService.sendMessage(
          chatRoomId, 
          messageText, 
          currentUser.userName
        );
        
        setMessageText('');
      } else {
        // WebSocket not connected - try to connect
        Alert.alert(
          'Real-time Unavailable',
          'Messages require a WebSocket connection. The backend may need to be restarted with the latest configuration.\n\nYour messages will work once connected.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const isValidFileType = (fileName) => {
    if (!fileName) return false;
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp3', '.wav'];
    return allowedExtensions.includes(extension);
  };

  const handleFileUpload = async () => {
    try {
      // Show action sheet for user to choose file type
      Alert.alert(
        'Upload File',
        'Choose file type (Images: PNG, JPG, GIF | Audio: MP3, WAV)',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Image', 
            onPress: async () => {
              try {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.All,
                  allowsEditing: true,
                  quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                  const asset = result.assets[0];
                  
                  // Validate file type
                  if (!isValidFileType(asset.fileName || asset.uri)) {
                    Alert.alert(
                      'Invalid File Type',
                      'Only PNG, JPG, JPEG, and GIF images are allowed.\n\nAudio files (MP3, WAV) must be uploaded via the Audio option.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
                  
                  const formData = new FormData();
                  formData.append('file', {
                    uri: asset.uri,
                    name: asset.fileName || 'image.jpg',
                    type: asset.mimeType || 'image/jpeg',
                  });

                  await api.post(`/chats/${chatRoomId}/files`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                  
                  Alert.alert('Success', 'File uploaded successfully');
                }
              } catch (error) {
                console.error('Error uploading image:', error);
                Alert.alert('Error', 'Failed to upload image');
              }
            }
          },
          { 
            text: 'Audio', 
            onPress: async () => {
              try {
                console.log('Opening document picker for audio files...');
                const pickerResult = await DocumentPicker.getDocumentAsync({
                  type: ['audio/*'],
                  copyToCacheDirectory: true,
                });

                console.log('Picker result:', JSON.stringify(pickerResult, null, 2));

                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
                  const file = pickerResult.assets[0];
                  const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
                  
                  console.log('File selected:', file.name, 'Type:', file.mimeType, 'Size:', file.size);
                  
                  // Validate file type
                  if (!isValidFileType(file.name)) {
                    Alert.alert(
                      'Invalid File Type',
                      'Only MP3 and WAV audio files are allowed.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  
                  console.log('Uploading file to chat:', chatRoomId);
                  
                  // Create FormData for file upload
                  const formData = new FormData();
                  formData.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'audio/mpeg',
                  });

                  console.log('Sending file upload request...');
                  const response = await api.post(`/chats/${chatRoomId}/files`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                  
                  console.log('Upload successful:', response.data);
                  Alert.alert('Success', 'File uploaded successfully');
                } else {
                  console.log('User canceled file picker or no file selected');
                }
              } catch (error) {
                console.error('Error uploading file:', error);
                console.error('Error response:', error.response?.data);
                console.error('Error message:', error.message);
                
                let errorMessage = 'Failed to upload file';
                if (error.response?.data?.message) {
                  errorMessage = error.response.data.message;
                } else if (error.message) {
                  errorMessage = error.message;
                }
                
                Alert.alert('Upload Error', errorMessage);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error with file picker:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleChatPhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
        
        if (!chatRoomId) {
          Alert.alert('Error', 'Chat ID not found');
          return;
        }
        
        // Upload to S3
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'photo.jpg',
          type: asset.mimeType || 'image/jpeg',
        });

        const uploadResponse = await api.post('/s3/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const fileUrl = uploadResponse.data;
        
        // Update chat photo
        await ChatService.updateChatPhoto(chatRoomId, fileUrl);
        
        // Send system message via WebSocket to notify all users
        if (chatWebSocketService.isWebSocketConnected()) {
          chatWebSocketService.sendMessage(
            chatRoomId,
            `${currentUser.userName} changed the chat photo | PHOTO_URL:${fileUrl}`,
            currentUser.userName
          );
        }
        
        // Update local state
        const updatedConversation = {
          ...selectedConversation,
          chatPhoto: fileUrl
        };
        setSelectedConversation(updatedConversation);
        
        setConversations(prev => prev.map(conv => 
          conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId
            ? { ...conv, chatPhoto: fileUrl }
            : conv
        ));
        
        // Reload to show the system message
        await loadMessages(updatedConversation);
        Alert.alert('Success', 'Chat photo updated');
      }
    } catch (error) {
      console.error('Error uploading chat photo:', error);
      Alert.alert('Error', 'Failed to upload chat photo');
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim() || selectedUsers.length === 0) return;

    try {
      const usernames = selectedUsers.map(user => user.userName);
      const response = await ChatService.createChat(usernames, newChatName);
      const newChat = response.data;
      
      clearModalState();
      
      setConversations(prev => [newChat, ...prev]);
      await handleConversationSelect(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat');
    }
  };

  const handleLeaveChat = async () => {
    if (!selectedConversation || !currentUser) return;
    
    const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
    if (!chatRoomId) return;

    Alert.alert(
      'Leave Chat',
      `Are you sure you want to leave "${selectedConversation.chatName}"? You will no longer receive messages from this chat.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (chatWebSocketService.isWebSocketConnected()) {
                chatWebSocketService.leaveChat(chatRoomId, currentUser.userName);
              }
              
              setConversations(prev => 
                prev.filter(conv => 
                  conv.ChatId !== chatRoomId && conv.chatRoomId !== chatRoomId
                )
              );
              
              setShowChatView(false);
              setSelectedConversation(null);
              setMessages([]);
            } catch (error) {
              console.error('Error leaving chat:', error);
              Alert.alert('Error', 'Failed to leave chat');
            }
          }
        }
      ]
    );
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => 
      prev.some(selectedUser => selectedUser.userName === user.userName) 
        ? prev.filter(selectedUser => selectedUser.userName !== user.userName)
        : [...prev, user]
    );
  };

  const handleAddUserToChat = async (user) => {
    if (!selectedConversation || !currentUser) return;
    
    const chatRoomId = selectedConversation.ChatId || selectedConversation.chatRoomId;
    if (!chatRoomId) return;

    try {
      if (chatWebSocketService.isWebSocketConnected()) {
        chatWebSocketService.addUserToChat(chatRoomId, user.userName, currentUser.userName);
      }
      
      setConversations(prev => 
        prev.map(conv => 
          (conv.ChatId === chatRoomId || conv.chatRoomId === chatRoomId)
            ? { ...conv, users: [...(conv.users || []), user.userName] }
            : conv
        )
      );
      
      setSelectedConversation(prev => ({
        ...prev,
        users: [...(prev.users || []), user.userName]
      }));
      
      setAddUserSearchTerm('');
      setAddUserSearchResults([]);
      setShowAddUser(false);
      
      Alert.alert('Success', `${user.userName} added to chat`);
    } catch (error) {
      console.error('Error adding user to chat:', error);
      Alert.alert('Error', 'Failed to add user to chat');
    }
  };

  const clearModalState = () => {
    setNewChatName('');
    setSelectedUsers([]);
    setUserSearchTerm('');
    setSearchedUsers([]);
    setShowNewMessageModal(false);
  };

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

  // Audio player functions
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const openAudioPlayer = async (url, name) => {
    try {
      setCurrentAudioUrl(url);
      setCurrentAudioName(name);
      setShowAudioPlayer(true);
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Load the sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false },
        (status) => {
          setPlaybackStatus(status);
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }
      );
      
      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio file');
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    
    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleStop = async () => {
    if (!sound) return;
    
    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handleSeek = async (position) => {
    if (!sound || !playbackStatus?.isLoaded) return;
    
    try {
      const newPosition = Math.max(0, Math.min(position, playbackStatus.durationMillis));
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error seeking audio:', error);
    }
  };

  const handleSkipBackward = async () => {
    if (!sound || !playbackStatus?.isLoaded) return;
    
    try {
      const currentPosition = playbackStatus.positionMillis || 0;
      const skipAmount = 10000; // 10 seconds
      const newPosition = Math.max(0, currentPosition - skipAmount);
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const handleSkipForward = async () => {
    if (!sound || !playbackStatus?.isLoaded) return;
    
    try {
      const currentPosition = playbackStatus.positionMillis || 0;
      const skipAmount = 10000; // 10 seconds
      const newPosition = Math.min(
        playbackStatus.durationMillis || 0,
        currentPosition + skipAmount
      );
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const closeAudioPlayer = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setShowAudioPlayer(false);
    setCurrentAudioUrl(null);
    setCurrentAudioName('');
    setPlaybackStatus(null);
    setIsPlaying(false);
  };

  const handleDownload = async () => {
    if (!currentAudioUrl || !currentAudioName || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const filename = currentAudioName;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(currentAudioUrl, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const openImageViewer = (url, name) => {
    setCurrentImageUrl(url);
    setCurrentImageName(name);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setCurrentImageUrl(null);
    setCurrentImageName('');
  };

  const handleDownloadImage = async () => {
    if (!currentImageUrl || !currentImageName || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const filename = currentImageName;
      const fileUri = FileSystem.documentDirectory + filename;
      
      const downloadResult = await FileSystem.downloadAsync(currentImageUrl, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderMessageContent = (message) => {
    // Check if it's a chat photo change message
    if (message.message.includes('changed the chat photo') && message.message.includes('| PHOTO_URL:')) {
      const photoUrlMatch = message.message.match(/\| PHOTO_URL:([^|]+)/);
      const photoUrl = photoUrlMatch ? photoUrlMatch[1].trim() : null;
      
      return (
        <View style={styles.fileMessage}>
          <Text style={styles.messageText}>
            {message.message.split(' | PHOTO_URL:')[0]}
      </Text>
          {photoUrl && (
            <Image source={{ uri: photoUrl }} style={styles.fileImage} />
          )}
        </View>
      );
    }
    
    // Check if it's a file message
    if (message.type === 'FILE' || message.message.includes('| FILE_URL:')) {
      const fileUrlMatch = message.message.match(/\| FILE_URL:([^|]+)/);
      const fileNameMatch = message.message.match(/sent a file: ([^|]+)/);
      
      const fileUrl = fileUrlMatch ? fileUrlMatch[1].trim() : null;
      let fileName = fileNameMatch ? fileNameMatch[1].trim() : 'Unknown file';
      
      // Decode URL-encoded filename
      try {
        fileName = decodeURIComponent(fileName);
      } catch (e) {
        // If decoding fails, use the original name
        console.log('Failed to decode filename:', fileName);
      }
      
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl || fileName);
      const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(fileUrl || fileName);
      
      return (
        <View style={styles.fileMessage}>
      <TouchableOpacity 
            onPress={() => {
              if (isAudio && fileUrl) {
                openAudioPlayer(fileUrl, fileName);
              } else if (isImage && fileUrl) {
                openImageViewer(fileUrl, fileName);
              } else if (fileUrl) {
                Linking.openURL(fileUrl);
              }
            }}
            style={styles.fileButton}
          >
            <Text style={styles.fileIcon}>
              {isImage ? '🖼️' : isAudio ? '🎵' : '📎'}
            </Text>
            <Text style={styles.fileName}>{fileName}</Text>
          </TouchableOpacity>
          {isImage && fileUrl && (
            <TouchableOpacity onPress={() => openImageViewer(fileUrl, fileName)}>
              <Image source={{ uri: fileUrl }} style={styles.fileImage} />
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    return <Text style={styles.messageText}>{message.message}</Text>;
  };

  const renderConversationItem = ({ item }) => (
      <TouchableOpacity 
      style={styles.conversationItem}
      onPress={() => handleConversationSelect(item)}
    >
      <Image 
        source={{ uri: item.chatPhoto || 'https://via.placeholder.com/60' }} 
        style={styles.conversationAvatar}
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.chatName}</Text>
          <Text style={styles.conversationTime}>{formatTimestamp(item.time)}</Text>
        </View>
        <Text style={styles.conversationPreview} numberOfLines={1}>
          {item.message || 'No messages yet'}
        </Text>
      </View>
      </TouchableOpacity>
  );

  const renderMessageItem = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === currentUser?.userName ? styles.myMessageContainer : styles.otherMessageContainer
    ]}>
      {item.sender !== currentUser?.userName && (
        <Text style={styles.messageSender}>{item.sender}</Text>
      )}
      <View style={[
        styles.messageBubble,
        item.sender === currentUser?.userName ? styles.myMessageBubble : styles.otherMessageBubble
      ]}>
        {renderMessageContent(item)}
        <Text style={styles.messageTime}>{formatTimestamp(item.time)}</Text>
      </View>
    </View>
  );

  const renderCreateChatModal = () => (
    <Modal
      visible={showNewMessageModal}
      transparent={true}
      animationType="slide"
      onRequestClose={clearModalState}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={clearModalState}
      >
        <View style={styles.createChatModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Chat</Text>
            <TouchableOpacity onPress={clearModalState}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Chat Name</Text>
              <TextInput
                style={styles.input}
                value={newChatName}
                onChangeText={setNewChatName}
                placeholder="Enter chat name..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Search Users</Text>
              <TextInput
                style={styles.input}
                value={userSearchTerm}
                onChangeText={setUserSearchTerm}
                placeholder="Search by username..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
              {searchingUsers && (
                <ActivityIndicator size="small" color="#667eea" style={styles.searchLoading} />
              )}
            </View>
            
            {selectedUsers.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Selected Users ({selectedUsers.length})</Text>
                {selectedUsers.map((user) => (
                  <View key={user.userName} style={styles.selectedUserItem}>
                    <Image source={{ uri: user.profilePic || 'https://via.placeholder.com/30' }} style={styles.selectedUserAvatar} />
                    <Text style={styles.selectedUserName}>{user.userName}</Text>
                    <TouchableOpacity onPress={() => toggleUserSelection(user)}>
                      <Text style={styles.removeUser}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {userSearchTerm && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Search Results</Text>
                {searchedUsers.length > 0 ? (
                  searchedUsers.map((user) => (
            <TouchableOpacity 
                      key={user.userName}
                      style={styles.userItem}
                      onPress={() => toggleUserSelection(user)}
                    >
                      <Image source={{ uri: user.profilePic || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
                      <Text style={styles.userName}>{user.userName}</Text>
                      {selectedUsers.some(u => u.userName === user.userName) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))
                ) : !searchingUsers ? (
                  <Text style={styles.noResults}>No users found</Text>
                ) : null}
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={clearModalState}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, (!newChatName.trim() || selectedUsers.length === 0) && styles.disabledButton]}
              onPress={handleCreateChat}
              disabled={!newChatName.trim() || selectedUsers.length === 0}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const renderAddUserModal = () => (
    <Modal
      visible={showAddUser}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddUser(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowAddUser(false)}
      >
        <View style={styles.createChatModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add User</Text>
            <TouchableOpacity onPress={() => setShowAddUser(false)}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Search Users</Text>
              <TextInput
                style={styles.input}
                value={addUserSearchTerm}
                onChangeText={setAddUserSearchTerm}
                placeholder="Search by username..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
              {addingUser && (
                <ActivityIndicator size="small" color="#667eea" style={styles.searchLoading} />
              )}
            </View>
            
            {addUserSearchTerm && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Search Results</Text>
                {addUserSearchResults.length > 0 ? (
                  addUserSearchResults.map((user) => (
                    <TouchableOpacity
                      key={user.userName}
                      style={styles.userItem}
                      onPress={() => handleAddUserToChat(user)}
                    >
                      <Image source={{ uri: user.profilePic || 'https://via.placeholder.com/40' }} style={styles.userAvatar} />
                      <Text style={styles.userName}>{user.userName}</Text>
                      <Text style={styles.addIcon}>+</Text>
                    </TouchableOpacity>
                  ))
                ) : !addingUser ? (
                  <Text style={styles.noResults}>No users found</Text>
                ) : null}
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddUser(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const renderUsersModal = () => (
    <Modal
      visible={showUsers}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowUsers(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowUsers(false)}
      >
        <View style={styles.createChatModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chat Members</Text>
            <TouchableOpacity onPress={() => setShowUsers(false)}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {selectedConversation?.users?.length || 0} Members
            </Text>
              {selectedConversation?.users && selectedConversation.users.length > 0 ? (
                selectedConversation.users.map((username) => (
                  <TouchableOpacity
                    key={username}
                    style={styles.userItem}
                    onPress={() => {
                      setShowUsers(false);
                      router.push(`/profile/${username}`);
                    }}
                  >
                    <Image 
                      source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userName}>{username}</Text>
                    {username === currentUser?.userName && (
                      <Text style={styles.youBadge}>(You)</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResults}>No members</Text>
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowUsers(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const renderImageViewerModal = () => (
    <Modal
      visible={showImageViewer}
      transparent={true}
      animationType="fade"
      onRequestClose={closeImageViewer}
    >
      <View style={styles.imageViewerOverlay}>
        <View style={styles.imageViewerHeader}>
          <Text style={styles.imageViewerTitle} numberOfLines={1}>
            🖼️ {currentImageName}
          </Text>
          <View style={styles.imageViewerActions}>
            <TouchableOpacity 
              style={styles.imageViewerButton}
              onPress={handleDownloadImage}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.imageViewerIcon}>⬇️</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.imageViewerButton}
              onPress={closeImageViewer}
            >
              <Text style={styles.imageViewerIcon}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.imageViewerContent}
          maximumZoomScale={5}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bouncesZoom={true}
        >
          <Image
            source={{ uri: currentImageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderAudioPlayerModal = () => {
    const formatDuration = (millis) => {
      const totalSeconds = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getCurrentTime = () => {
      if (playbackStatus?.isLoaded && playbackStatus.positionMillis !== undefined) {
        return formatDuration(playbackStatus.positionMillis);
      }
      return '0:00';
    };

    const getTotalDuration = () => {
      if (playbackStatus?.isLoaded && playbackStatus.durationMillis !== undefined) {
        return formatDuration(playbackStatus.durationMillis);
      }
      return '0:00';
    };

    const getProgress = () => {
      if (playbackStatus?.isLoaded && playbackStatus.durationMillis && playbackStatus.positionMillis !== undefined) {
        return playbackStatus.positionMillis / playbackStatus.durationMillis;
      }
      return 0;
    };

    return (
      <Modal
        visible={showAudioPlayer}
        transparent={true}
        animationType="slide"
        onRequestClose={closeAudioPlayer}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeAudioPlayer}
        >
          <View style={styles.audioPlayerModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>🎵 {currentAudioName}</Text>
              <TouchableOpacity onPress={closeAudioPlayer}>
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.audioPlayerContent}>
              {/* Progress Bar - Touchable for seeking */}
              <View style={styles.progressWrapper}>
                <TouchableOpacity 
                  style={styles.progressContainer}
                  onLayout={(event) => {
                    setProgressLayout(event.nativeEvent.layout);
                  }}
                  onPress={(event) => {
                    const { locationX, layout } = event.nativeEvent;
                    if (playbackStatus?.isLoaded && playbackStatus.durationMillis) {
                      const progress = locationX / layout.width;
                      const seekPosition = progress * playbackStatus.durationMillis;
                      handleSeek(seekPosition);
                    }
                  }}
                  activeOpacity={1}
                >
                  <View style={[styles.progressBar, { width: `${getProgress() * 100}%` }]} />
                </TouchableOpacity>
              </View>
              
              {/* Time Display */}
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{getCurrentTime()}</Text>
                <Text style={styles.timeText}>{getTotalDuration()}</Text>
              </View>
              
              {/* Main Controls */}
              <View style={styles.audioControls}>
                <TouchableOpacity 
                  style={[styles.audioControlButton, styles.skipButton]}
                  onPress={handleSkipBackward}
                  disabled={!sound || !playbackStatus?.isLoaded}
                >
                  <Text style={styles.skipButtonText}>⏮️ 10s</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.audioControlButton}
                  onPress={handleStop}
                  disabled={!sound}
                >
                  <Text style={styles.audioControlIcon}>⏹</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.audioControlButton, styles.playButton]}
                  onPress={handlePlayPause}
                  disabled={!sound}
                >
                  <Text style={styles.audioControlIcon}>
                    {isPlaying ? '⏸' : '▶️'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.audioControlButton}
                  onPress={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.audioControlIcon}>⬇️</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.audioControlButton, styles.skipButton]}
                  onPress={handleSkipForward}
                  disabled={!sound || !playbackStatus?.isLoaded}
                >
                  <Text style={styles.skipButtonText}>10s ⏭️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  // Show chat view
  if (showChatView && selectedConversation) {
    return (
      <KeyboardAvoidingView 
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.chatBackButton}
            onPress={() => setShowChatView(false)}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatAvatar}
            onPress={handleChatPhotoUpload}
          >
            <Image 
              source={{ uri: selectedConversation.chatPhoto || 'https://via.placeholder.com/50' }} 
              style={styles.chatAvatarImage}
            />
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>📷</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatInfo}
            onPress={() => setShowUsers(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.chatName} numberOfLines={1}>{selectedConversation.chatName}</Text>
            <Text style={styles.chatMembers}>
              {selectedConversation.users?.length || 0} members
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatActionButton}
            onPress={() => setShowAddUser(true)}
          >
            <Text style={styles.chatActionIcon}>➕</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.chatActionButton}
            onPress={handleLeaveChat}
          >
            <Text style={styles.chatActionIcon}>🚪</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={messagesScrollRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => item.messageId?.toString() || `msg-${index}`}
          inverted={false}
          refreshing={loadingMessages}
          onRefresh={() => selectedConversation && loadMessages(selectedConversation)}
          ListHeaderComponent={
            selectedConversation && hasMoreCache[selectedConversation.ChatId || selectedConversation.chatRoomId] ? (
              <View style={styles.loadEarlierContainer}>
                <TouchableOpacity 
                  style={styles.loadEarlierButton} 
                  onPress={loadOlderMessages}
                  disabled={isFetchingMore}
                >
                  {isFetchingMore ? (
                    <ActivityIndicator size="small" color="#667eea" />
                  ) : (
                    <Text style={styles.loadEarlierText}>Load Earlier</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        {/* Message Input */}
        <View style={styles.inputArea}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleFileUpload}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, !messageText.trim() && styles.disabledButton]}
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>

        {renderAddUserModal()}
        {renderUsersModal()}
        {renderAudioPlayerModal()}
        {renderImageViewerModal()}
      </KeyboardAvoidingView>
    );
  }

  // Show conversation list
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => setShowNewMessageModal(true)}
        >
          <Text style={styles.newMessageIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
          <FlatList
            data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.ChatId?.toString() || item.chatRoomId?.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with other users
            </Text>
            <TouchableOpacity 
              style={styles.startConversationButton}
              onPress={() => setShowNewMessageModal(true)}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.startConversationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startConversationText}>Start Conversation</Text>
              </LinearGradient>
            </TouchableOpacity>
      </View>
        }
        refreshing={false}
        onRefresh={loadConversations}
      />

      {renderCreateChatModal()}
      {renderAudioPlayerModal()}
      {renderImageViewerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  newMessageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  newMessageIcon: {
    fontSize: 18,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  conversationTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  conversationPreview: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startConversationButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startConversationGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  startConversationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatar: {
    marginLeft: 8,
    marginRight: 12,
  },
  chatAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: {
    fontSize: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  chatMembers: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chatActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  chatActionIcon: {
    fontSize: 18,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 12,
    padding: 12,
  },
  myMessageBubble: {
    backgroundColor: '#667eea',
  },
  otherMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 15,
    color: 'white',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  fileMessage: {
    marginBottom: 8,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  fileImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  loadEarlierContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadEarlierButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadEarlierText: {
    color: 'white',
    fontSize: 14,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0f0f23',
    marginBottom:35,
  },
  attachButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: 'white',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 20,
    color: '#667eea',
  },
  disabledButton: {
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createChatModal: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: 800,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom:20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalCloseText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  modalContent: {
    maxHeight: 600,
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 15,
  },
  searchLoading: {
    marginTop: 8,
    alignSelf: 'center',
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 20,
    marginBottom: 8,
  },
  selectedUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  selectedUserName: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  removeUser: {
    fontSize: 20,
    color: 'white',
    paddingLeft: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    flex: 1,
    fontSize: 15,
    color: 'white',
  },
  checkmark: {
    fontSize: 20,
    color: '#667eea',
  },
  addIcon: {
    fontSize: 20,
    color: '#667eea',
  },
  noResults: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    paddingVertical: 20,
    textAlign: 'center',
  },
  youBadge: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#667eea',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  audioPlayerModal: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  audioPlayerContent: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  progressWrapper: {
    marginBottom: 20,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  audioControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#667eea',
  },
  audioControlIcon: {
    fontSize: 24,
  },
  skipButton: {
    width: 60,
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 12,
    color: 'white',
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageViewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 12,
  },
  imageViewerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageViewerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerIcon: {
    fontSize: 24,
    color: 'white',
  },
  imageViewerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
