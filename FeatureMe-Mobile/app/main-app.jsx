import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { 
  listPosts, 
  addView, 
  addLike, 
  getLikesSummary, 
  addComment, 
  getCommentsPaginated, 
  deletePost,
  getPostById,
  trackDownload 
} from '../services/postsService';
import { UserRelationsService, clearMyNotifications, changePassword } from '../services/userService';
import DemoService from '../services/DemoService';
import LoggedInHeader from '../components/ui/LoggedInHeader';
import { getCurrentUser } from '../services/api';
import AuthGuard from '../components/AuthGuard';
import BottomNavigation from '../components/BottomNavigation';
import { useAudio } from '../contexts/AudioContext';
import FollowersModal from '../components/FollowersModal';
import CentralizedAudioPlayer from '../components/CentralizedAudioPlayer';
import ViewsAnalytics from '../components/ViewsAnalytics';
import DemoCard from '../components/DemoCard';
import PostCardModal from '../components/PostCardModal';

// Import the existing feed components
import FeedScreen from './feed';

// Genre to icon mapping
const GENRE_ICONS = {
  Rock: "🎸",
  Punk: "🧷",
  Pop: "🎤",
  Jazz: "🎷",
  "Hip Hop": "🎧",
  Trap: "🔊",
  Drill: "🛠️",
  Electronic: "🎹",
  Afrobeat: "🥁",
  Indie: "🌈",
  Classical: "🎻",
  Country: "🤠",
  Blues: "🎺",
  Underground: "🕳️",
  Sample: "🧰",
  Acapella: "🎙️",
  "R&B": "🎧",
  Default: "🎵"
};

// Normalize genre names and provide a robust icon lookup
function getGenreIcon(genre) {
  if (!genre) return GENRE_ICONS.Default;
  const lower = String(genre).toLowerCase();
  if (lower === 'hiphop' || lower === 'hip-hop') return GENRE_ICONS['Hip Hop'];
  if (lower === 'r&b' || lower === 'rnb') return GENRE_ICONS['R&B'];
  if (lower === 'afrobeats') return GENRE_ICONS['Afrobeat'];
  return GENRE_ICONS[genre] || GENRE_ICONS[genre?.trim()] || GENRE_ICONS.Default;
}

// Format time function
function formatTime(timestamp) {
  if (!timestamp) return 'Unknown time';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
}

// Completely Redesigned Homepage Tab Component
function HomepageTab({ user, relationshipSummary, latestPost, onShowFollow, onShowActivity, onShowLatest, onRefresh, onNotificationPress }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing homepage:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#667eea"
          colors={["#667eea", "#764ba2"]}
          progressBackgroundColor="#0a0a0a"
        />
      }
    >
      {/* Modern Header Card */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* User Banner Background - Full Width */}
          {user.banner && (
            <Image 
              source={{ uri: user.banner }} 
              style={styles.headerBanner}
              defaultSource={require('../assets/images/dpp.jpg')}
            />
          )}
          <View style={styles.headerBannerOverlay} />
          
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <Image 
                  source={{ uri: user.profilePic }} 
                  style={styles.profileAvatar}
                  defaultSource={require('../assets/images/dpp.jpg')}
                />
                <View style={styles.onlineStatus} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.userName}>{user.userName}</Text>
                {user.role === "USERPLUS" && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>✨ PREMIUM</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem} onPress={() => onShowFollow('followers')}>
                <Text style={styles.statNumber}>{relationshipSummary?.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => onShowFollow('following')}>
                <Text style={styles.statNumber}>{relationshipSummary?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.posts?.length || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Carousel */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/create-post')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
              <Text style={styles.actionEmoji}>🎵</Text>
              <Text style={styles.actionTitle}>Post Beat</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/create-post')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.actionGradient}>
              <Text style={styles.actionEmoji}>🎤</Text>
              <Text style={styles.actionTitle}>Post Song</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/user-search')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.actionGradient}>
              <Text style={styles.actionEmoji}>🔍</Text>
              <Text style={styles.actionTitle}>Discover</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/messages')}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.actionGradient}>
              <Text style={styles.actionEmoji}>💬</Text>
              <Text style={styles.actionTitle}>Messages</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Activity Feed Card */}
      <View style={styles.activityCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={onShowActivity}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityContent}>
          {user.notifications && user.notifications.length > 0 ? (
            <View style={styles.activityList}>
              {user.notifications.slice(0, 3).map((notification, index) => {
                // Create a unique key by combining multiple fields
                const id = notification._id?.toString() || notification.id?.toString() || '';
                const timestamp = notification.time?.toString() || '';
                const uniqueKey = `${id}-${timestamp}-${index}`;
                
                return (
                  <TouchableOpacity 
                    key={uniqueKey} 
                    style={styles.activityItem}
                    onPress={() => onNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityIndicator} />
                    <View style={styles.activityTextContainer}>
                      <Text style={styles.activityUsername}>
                        {String(notification.userName || 'Unknown User')}
                      </Text>
                      <Text style={styles.activityText}>
                        {String(notification.noti || notification.message || notification.text || 'Notification')}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {notification.time ? formatTime(new Date(notification.time)) : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>No new notifications</Text>
            </View>
          )}
        </View>
      </View>

      {/* Latest Creation Spotlight */}
      {latestPost && (
        <View style={styles.spotlightCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Latest Hit</Text>
            <TouchableOpacity onPress={onShowLatest}>
              <Text style={styles.seeAllText}>View</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.spotlightContent} onPress={onShowLatest}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.spotlightGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.spotlightInfo}>
                <Text style={styles.spotlightTitle}>{latestPost.title || 'Untitled'}</Text>
                <Text style={styles.spotlightDate}>
                  {latestPost.time ? new Date(latestPost.time).toLocaleDateString() : 'Unknown date'}
                </Text>
              </View>
              
              <View style={styles.spotlightStats}>
                <View style={styles.spotlightStat}>
                  <Text style={styles.spotlightStatIcon}>🔥</Text>
                  <Text style={styles.spotlightStatNumber}>{latestPost?.likes?.length || 0}</Text>
                </View>
                <View style={styles.spotlightStat}>
                  <Text style={styles.spotlightStatIcon}>💬</Text>
                  <Text style={styles.spotlightStatNumber}>{latestPost?.totalComments || 0}</Text>
                </View>
                <View style={styles.spotlightStat}>
                  <Text style={styles.spotlightStatIcon}>⬇️</Text>
                  <Text style={styles.spotlightStatNumber}>{latestPost?.totalDownloads || 0}</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Trending Section */}
      <View style={styles.trendingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Trending Now</Text>
          <TouchableOpacity onPress={() => router.push('/feed')}>
            <Text style={styles.seeAllText}>Explore</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
          <View style={styles.trendingItem}>
            <Text style={styles.trendingIcon}>🎵</Text>
            <Text style={styles.trendingText}>Hip Hop</Text>
          </View>
          <View style={styles.trendingItem}>
            <Text style={styles.trendingIcon}>🎤</Text>
            <Text style={styles.trendingText}>R&B</Text>
          </View>
          <View style={styles.trendingItem}>
            <Text style={styles.trendingIcon}>🎸</Text>
            <Text style={styles.trendingText}>Rock</Text>
          </View>
          <View style={styles.trendingItem}>
            <Text style={styles.trendingIcon}>🎹</Text>
            <Text style={styles.trendingText}>Electronic</Text>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// Profile Tab Component
function ProfileTab({ user, relationshipSummary, onShowFollow, onRefresh }) {
  const { playTrack, currentTrack, isPlaying, isLoading } = useAudio();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeContentTab, setActiveContentTab] = useState('demos');
  const [userPosts, setUserPosts] = useState([]);
  const [userDemos, setUserDemos] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingDemos, setIsLoadingDemos] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  
  // Add Demo Modal state
  const [showAddDemoModal, setShowAddDemoModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [demoTitle, setDemoTitle] = useState('');
  const [demoFeatures, setDemoFeatures] = useState('');
  const [selectedDemoFile, setSelectedDemoFile] = useState(null);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [isDeletingDemoId, setIsDeletingDemoId] = useState(null);
  
  // Pagination state
  const [postsPage, setPostsPage] = useState(0);
  const [featuredPage, setFeaturedPage] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isLoadingMoreFeatured, setIsLoadingMoreFeatured] = useState(false);
  
  // Modal state for expandable cards
  const [expandedPost, setExpandedPost] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Edit Profile Modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    location: '',
    about: '',
    profilePic: '',
    banner: '',
    socialMedia: []
  });
  const [selectedProfilePic, setSelectedProfilePic] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Edit Profile Tab state
  const [editProfileTab, setEditProfileTab] = useState('basic');
  
  // Analytics modal state
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
  const [analyticsPost, setAnalyticsPost] = useState(null);
  
  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track the user ID to detect user changes
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (user) {
      // If user changed, reset all data
      if (currentUserId !== user.id) {
        setCurrentUserId(user.id);
        setPostsPage(0);
        setFeaturedPage(0);
        setUserPosts([]);
        setUserDemos([]);
        setFeaturedPosts([]);
        setHasMorePosts(true);
        setHasMoreFeatured(true);
      }
      
      // Only fetch if data for the active tab hasn't been loaded yet
      if (activeContentTab === 'posts' && userPosts.length === 0) {
        fetchUserPosts(true);
      } else if (activeContentTab === 'demos' && userDemos.length === 0) {
        fetchUserDemos();
      } else if (activeContentTab === 'featured' && featuredPosts.length === 0) {
        fetchFeaturedPosts(true);
      }
    }
  }, [user, activeContentTab, currentUserId]);

  // Check if viewing own profile
  useEffect(() => {
    const checkOwnProfile = async () => {
      try {
        const loggedInUser = await getCurrentUser();
        setCurrentUser(loggedInUser);
        setIsOwnProfile(loggedInUser?.id === user?.id);
      } catch (error) {
        console.error('Error checking own profile:', error);
      }
    };
    if (user) {
      checkOwnProfile();
    }
  }, [user]);

  const fetchContent = async () => {
    if (activeContentTab === 'posts') {
      await fetchUserPosts(true); // true for initial load
    } else if (activeContentTab === 'demos') {
      await fetchUserDemos();
    } else if (activeContentTab === 'featured') {
      await fetchFeaturedPosts(true);
    }
  };

  const fetchUserPosts = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoadingPosts(true);
    } else {
      setIsLoadingMorePosts(true);
    }
    
    try {
      const postsPerPage = 6;
      const startIndex = postsPage * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      
      const posts = [];
      if (user.posts && user.posts.length > 0) {
        const postsToFetch = user.posts.slice(startIndex, endIndex);
        
        for (const postId of postsToFetch) {
          try {
            const response = await getPostById(postId);
            posts.push(response.data);
          } catch (err) {
            console.error(`Failed to fetch post ${postId}:`, err);
          }
        }
        
        // Check if there are more posts to load
        setHasMorePosts(endIndex < user.posts.length);
      }
      
      if (isInitialLoad) {
        setUserPosts(posts);
      } else {
        setUserPosts(prevPosts => [...prevPosts, ...posts]);
      }
      
      setPostsPage(prevPage => prevPage + 1);
    } catch (err) {
      console.error('Failed to fetch user posts:', err);
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingMorePosts(false);
    }
  };

  const fetchUserDemos = async () => {
    setIsLoadingDemos(true);
    try {
      // Load all demos initially - no pagination needed
      const demos = await DemoService.getAllUserDemos(user.id);
      setUserDemos(demos || []);
    } catch (err) {
      console.error('Failed to fetch user demos:', err);
      // Set empty array on error to show empty state
      setUserDemos([]);
    } finally {
      setIsLoadingDemos(false);
    }
  };

  const fetchFeaturedPosts = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoadingFeatured(true);
    } else {
      setIsLoadingMoreFeatured(true);
    }
    
    try {
      const postsPerPage = 6;
      const startIndex = featuredPage * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      
      const featuredPosts = [];
      if (user.featuredOn && user.featuredOn.length > 0) {
        const postsToFetch = user.featuredOn.slice(startIndex, endIndex);
        
        for (const postId of postsToFetch) {
          try {
            const response = await getPostById(postId);
            featuredPosts.push(response.data);
          } catch (err) {
            console.error(`Failed to fetch featured post ${postId}:`, err);
          }
        }
        
        // Check if there are more posts to load
        setHasMoreFeatured(endIndex < user.featuredOn.length);
      }
      
      if (isInitialLoad) {
        setFeaturedPosts(featuredPosts);
      } else {
        setFeaturedPosts(prevPosts => [...prevPosts, ...featuredPosts]);
      }
      
      setFeaturedPage(prevPage => prevPage + 1);
    } catch (err) {
      console.error('Failed to fetch featured posts:', err);
    } finally {
      setIsLoadingFeatured(false);
      setIsLoadingMoreFeatured(false);
    }
  };

  const handleCardPress = (item) => {
    if (activeContentTab === 'demos') {
      handleDemoPlay(item);
    } else {
      openModal(item);
    }
  };

  const handleDemoPlay = async (demo) => {
    try {
      // Check if this demo is currently playing
      const isCurrentTrack = currentTrack && currentTrack.id === demo.id;
      
      if (isCurrentTrack && isPlaying) {
        // Demo is playing, this will pause it
        await playTrack(demo);
      } else {
        // Create a track object with the correct music property for demos
        const audioUrl = demo.songUrl;
        
        if (!audioUrl) {
          Alert.alert('Error', 'No audio file found for this demo');
          return;
        }
        
        const trackData = {
          id: demo.id,
          title: demo.title,
          music: audioUrl,
          author: {
            userName: user?.userName,
            profilePic: user?.profilePic,
            banner: user?.banner
          }
        };
        
        // Play the demo
        await playTrack(trackData);
      }
    } catch (error) {
      console.error('Error playing demo:', error);
      Alert.alert('Playback Error', 'Failed to play demo. Please try again.');
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setExpandedPost(null);
  };

  const openModal = (post) => {
    setExpandedPost(post);
    setIsModalVisible(true);
  };

  const handlePostUpdate = (updatedPost) => {
    if (!updatedPost) {
      // Post was deleted
      setUserPosts(prev => prev.filter(p => p.id !== expandedPost?.id));
      setFeaturedPosts(prev => prev.filter(p => p.id !== expandedPost?.id));
      closeModal();
      return;
    }
    
    // Update the post in the list
    setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    setFeaturedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    
    // Update expanded post if it's the same
    if (expandedPost && expandedPost.id === updatedPost.id) {
      setExpandedPost(updatedPost);
    }
  };

  const loadMoreContent = () => {
    if (activeContentTab === 'posts' && hasMorePosts && !isLoadingMorePosts) {
      fetchUserPosts(false);
    } else if (activeContentTab === 'featured' && hasMoreFeatured && !isLoadingMoreFeatured) {
      fetchFeaturedPosts(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Reset pagination state
      setPostsPage(0);
      setFeaturedPage(0);
      setHasMorePosts(true);
      setHasMoreFeatured(true);
      
      // Call parent refresh function to update user and relationship data
      if (onRefresh) {
        await onRefresh();
      }
      
      // Fetch fresh content
      await fetchContent();
    } catch (error) {
      console.error('Error refreshing profile content:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDemoAdded = async () => {
    // Refresh demos after adding a new one
    await fetchUserDemos();
  };

  const isUserPlus = currentUser?.role === 'USERPLUS';

  const isAllowedByRole = (name = '', type = '') => {
    const lowerName = String(name).toLowerCase();
    const lowerType = String(type).toLowerCase();
    const isMp3 = lowerName.endsWith('.mp3') || lowerType.includes('audio/mpeg') || lowerType.includes('audio/mp3');
    const isWav = lowerName.endsWith('.wav') || lowerType.includes('audio/wav') || lowerType.includes('audio/x-wav');
    if (isUserPlus) {
      return isMp3 || isWav;
    }
    return isMp3; // USER can only upload mp3
  };

  const pickDemoFile = async () => {
    try {
      const allowedMimes = isUserPlus
        ? ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav']
        : ['audio/mpeg', 'audio/mp3'];

      const result = await DocumentPicker.getDocumentAsync({
        type: allowedMimes,
        multiple: false,
        copyToCacheDirectory: true,
      });

      // Handle both old and new return shapes
      if (result?.canceled) {
        return;
      }

      const asset = Array.isArray(result?.assets) ? result.assets[0] : result;
      if (!asset) return;

      const file = {
        uri: asset.uri,
        name: asset.name || `demo-${Date.now()}.mp3`,
        type: asset.mimeType || 'audio/mpeg',
      };
      if (!isAllowedByRole(file.name, file.type)) {
        Alert.alert(
          'File type not allowed',
          isUserPlus ? 'Please select an MP3 or WAV file.' : 'Please select an MP3 file.'
        );
        return;
      }
      setSelectedDemoFile(file);
    } catch (e) {
      console.error('Error picking file:', e);
      Alert.alert('Error', 'Failed to pick audio file.');
    }
  };

  const submitDemo = async () => {
    if (!demoTitle.trim() || !selectedDemoFile) {
      Alert.alert('Missing info', 'Please add a title and select an audio file.');
      return;
    }
    if (!isAllowedByRole(selectedDemoFile?.name, selectedDemoFile?.type)) {
      Alert.alert(
        'File type not allowed',
        isUserPlus ? 'Please select an MP3 or WAV file.' : 'Please select an MP3 file.'
      );
      return;
    }
    setIsSubmittingDemo(true);
    try {
      await DemoService.createDemo({ title: demoTitle.trim(), features: demoFeatures }, selectedDemoFile);
      // reset form
      setDemoTitle('');
      setDemoFeatures('');
      setSelectedDemoFile(null);
      setShowAddDemoModal(false);
      await handleDemoAdded();
      Alert.alert('Success', 'Demo uploaded successfully.');
    } catch (err) {
      console.error('Failed to create demo:', err);
      Alert.alert('Upload failed', 'Could not upload demo. Please try again.');
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  const confirmAndDeleteDemo = (demo) => {
    if (!demo?.id) return;
    Alert.alert(
      'Delete demo?',
      `Are you sure you want to delete "${demo.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDemo(demo.id),
        },
      ]
    );
  };

  const deleteDemo = async (demoId) => {
    if (!demoId) return;
    try {
      setIsDeletingDemoId(demoId);
      await DemoService.deleteDemo(demoId);
      await fetchUserDemos();
    } catch (e) {
      console.error('Failed to delete demo:', e);
      Alert.alert('Error', 'Failed to delete demo. Please try again.');
    } finally {
      setIsDeletingDemoId(null);
    }
  };

  // Edit Profile functions
  const handlePickProfilePic = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Convert ImagePicker result to format expected by the code
        setSelectedProfilePic({
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking profile picture:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePickBanner = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        // Convert ImagePicker result to format expected by the code
        setSelectedBanner({
          uri: asset.uri,
          name: asset.fileName || `banner_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      console.error('Error picking banner:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleOpenEditModal = () => {
    if (!user) return;
    setEditForm({
      bio: user.bio || '',
      location: user.location || '',
      about: user.about || '',
      profilePic: user.profilePic || '',
      banner: user.banner || '',
      socialMedia: user.socialMedia || []
    });
    setSelectedProfilePic(null);
    setSelectedBanner(null);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordFields(false);
    setEditProfileTab('basic');
    setShowEditProfileModal(true);
  };

  const handleEditProfileSubmit = async () => {
    if (isEditingProfile) return;
    
    setIsEditingProfile(true);
    try {
      const formData = new FormData();
      
      const userData = {
        bio: editForm.bio,
        location: editForm.location,
        about: editForm.about,
        socialMedia: editForm.socialMedia
      };
      
      // Add existing URLs if no new file was selected
      if (!selectedProfilePic && editForm.profilePic) {
        userData.profilePic = editForm.profilePic;
      }
      if (!selectedBanner && editForm.banner) {
        userData.banner = editForm.banner;
      }
      
      // Append user data as JSON string
      formData.append('user', JSON.stringify(userData));
      
      // Append files if selected
      if (selectedProfilePic) {
        formData.append('pp', {
          uri: selectedProfilePic.uri,
          name: selectedProfilePic.name,
          type: selectedProfilePic.mimeType || 'image/jpeg',
        });
      }
      
      if (selectedBanner) {
        formData.append('banner', {
          uri: selectedBanner.uri,
          name: selectedBanner.name,
          type: selectedBanner.mimeType || 'image/jpeg',
        });
      }
      
      // Import updateProfile from userService
      const { updateProfile } = require('../services/userService');
      
      await updateProfile(formData, true);
      
      // Refresh user data
      await onRefresh();
      
      setShowEditProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsEditingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (isChangingPassword) return;
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordFields(false);
      
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.error || 'Failed to change password. Please check your current password.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderContentGrid = () => {
    const isLoading = activeContentTab === 'posts' ? isLoadingPosts : 
                     activeContentTab === 'demos' ? isLoadingDemos : isLoadingFeatured;
    
    if (isLoading) {
      return (
        <View style={styles.profileLoadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.profileLoadingText}>
            Loading {activeContentTab === 'posts' ? 'posts' : 
                    activeContentTab === 'demos' ? 'demos' : 'featured posts'}...
          </Text>
        </View>
      );
    }

    let content = [];
    let emptyStateConfig = {};
    let hasMore = false;
    let isLoadingMore = false;

    if (activeContentTab === 'posts') {
      content = userPosts;
      hasMore = hasMorePosts;
      isLoadingMore = isLoadingMorePosts;
      emptyStateConfig = {
        icon: '🎵',
        title: 'No posts yet',
        subtitle: 'Share your first beat or song!',
        buttonText: 'Create Post',
        onPress: () => router.push('/create-post')
      };
    } else if (activeContentTab === 'demos') {
      content = userDemos;
      hasMore = false; // No pagination for demos
      isLoadingMore = false;
      emptyStateConfig = {
        icon: '🎤',
        title: 'No demos yet',
        subtitle: 'Upload your first demo!',
        buttonText: 'Add Demo',
        onPress: () => setShowAddDemoModal(true)
      };
    } else if (activeContentTab === 'featured') {
      content = featuredPosts;
      hasMore = hasMoreFeatured;
      isLoadingMore = isLoadingMoreFeatured;
      emptyStateConfig = {
        icon: '⭐',
        title: 'No features yet',
        subtitle: 'Get featured on other artists\' posts!',
        buttonText: 'Browse Posts',
        onPress: () => router.push('/feed')
      };
    }

    if (content.length === 0) {
      return (
        <View style={styles.profileEmptyState}>
          <Text style={styles.profileEmptyIcon}>{emptyStateConfig.icon}</Text>
          <Text style={styles.profileEmptyTitle}>{emptyStateConfig.title}</Text>
          <Text style={styles.profileEmptySubtitle}>{emptyStateConfig.subtitle}</Text>
          <TouchableOpacity 
            style={styles.profileCreateFirstBtn}
            onPress={emptyStateConfig.onPress}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.profileCreateFirstGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.profileCreateFirstText}>{emptyStateConfig.buttonText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={activeContentTab === 'demos' ? styles.demoGridContainer : styles.profileContentContainer}>
        {activeContentTab === 'demos' && isOwnProfile && (
          <TouchableOpacity 
            style={[styles.addDemoButton, { alignSelf: 'flex-start', marginBottom: 12 }]}
            onPress={() => setShowAddDemoModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.addDemoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.addDemoText}>+ Add Demo</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {activeContentTab === 'demos' && isOwnProfile && (
          <Text style={styles.addDemoDescription}>
            Share finished music here so listeners can hear your sound.
          </Text>
        )}
        {content.map((item, index) => (
          activeContentTab === 'demos' ? (
            <DemoCard
              key={item.id || index}
              demo={item}
              isPlaying={currentTrack && currentTrack.id === item.id && isPlaying}
              onPress={() => handleCardPress(item)}
              onDelete={confirmAndDeleteDemo}
              isDeleting={isDeletingDemoId === item.id}
              showDelete={isOwnProfile}
            />
          ) : (
            <TouchableOpacity 
              key={item.id || index} 
              style={styles.profilePostCard}
              onPress={() => handleCardPress(item)}
            >
              {/* Post Header with Banner */}
              <View style={styles.profilePostHeader}>
                <Image 
                  source={{ 
                    uri: item.author?.banner || item.thumbnail || item.coverImage || user.banner || user.profilePic
                  }} 
                  style={styles.profilePostBanner}
                  defaultSource={require('../assets/images/dpp.jpg')}
                />
                <View style={styles.profilePostBannerOverlay} />
                
                {/* Play Button Overlay - Visual only, clicking opens modal */}
                <View style={styles.profilePostPlayOverlay}>
                  <Text style={styles.profilePostPlayIcon}>▶</Text>
                </View>

                {/* Premium Badge */}
                {item.author?.role === 'USERPLUS' && (
                  <View style={styles.profilePostPremiumBadge}>
                    <Text style={styles.profilePostPremiumIcon}>✨</Text>
                    <Text style={styles.profilePostPremiumText}>UserPlus</Text>
                  </View>
                )}

                {/* Time Badge */}
                <View style={styles.profilePostTimeBadge}>
                  <Text style={styles.profilePostTimeText}>
                    {new Date(item.time).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              {/* Post Content */}
              <View style={styles.profilePostContent}>
                {/* Profile Section */}
                <View style={styles.profilePostProfile}>
                  <Image 
                    source={{ uri: item.author?.profilePic || user.profilePic }} 
                    style={styles.profilePostAvatar}
                    defaultSource={require('../assets/images/dpp.jpg')}
                  />
                  <View style={styles.profilePostAuthorInfo}>
                    <Text style={styles.profilePostAuthorName}>
                      {item.author?.userName || user.userName}
                    </Text>
                    <Text style={styles.profilePostDate}>
                      {new Date(item.time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.profilePostTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {/* Description */}
                {item.description && (
                  <Text style={styles.profilePostDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

                {/* Features */}
                {item.features && Array.isArray(item.features) && item.features.length > 0 && (
                  <View style={styles.profilePostFeatures}>
                    <Text style={styles.profilePostFeaturesLabel}>Feat:</Text>
                    <View style={styles.profilePostFeaturesList}>
                      {item.features.slice(0, 2).map((feature, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => router.push(`/profile/${feature}`)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.profilePostFeatureLink}>
                            {feature}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {item.features.length > 2 && (
                        <Text style={styles.profilePostFeatureMore}>
                          +{item.features.length - 2} more
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Genre Tags */}
                {item.genre && Array.isArray(item.genre) && item.genre.length > 0 && (
                  <View style={styles.profilePostTags}>
                    {item.genre.slice(0, 3).map((genre, idx) => (
                      <View key={idx} style={styles.profilePostTag}>
                        <Text style={styles.profilePostTagIcon}>{getGenreIcon(genre)}</Text>
                        <Text style={styles.profilePostTagText}>{genre}</Text>
                      </View>
                    ))}
                    {item.genre.length > 3 && (
                      <Text style={styles.profilePostFeatureMore}>
                        +{item.genre.length - 3}
                      </Text>
                    )}
                  </View>
                )}

                {/* Post Stats */}
                <View style={styles.profilePostStats}>
                  <View style={styles.profilePostStatItem}>
                    <Text style={styles.profilePostStatIcon}>❤️</Text>
                    <Text style={styles.profilePostStatText}>{item.likes?.length || 0}</Text>
                  </View>
                  <View style={styles.profilePostStatItem}>
                    <Text style={styles.profilePostStatIcon}>💬</Text>
                    <Text style={styles.profilePostStatText}>{item.totalComments || 0}</Text>
                  </View>
                  <View style={styles.profilePostStatItem}>
                    <Text style={styles.profilePostStatIcon}>👁️</Text>
                    <Text style={styles.profilePostStatText}>{item.totalViews || 0}</Text>
                  </View>
                </View>

                {/* Analytics Button - Only show for own posts if USERPLUS */}
                {isOwnProfile && currentUser?.role === 'USERPLUS' && (
                  <TouchableOpacity
                    style={styles.profilePostAnalyticsButton}
                    onPress={() => {
                      setAnalyticsPost(item);
                      setShowViewsAnalytics(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.profilePostAnalyticsIcon}>📊</Text>
                    <Text style={styles.profilePostAnalyticsText}>Analytics</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )
        ))}
        
        {/* Infinite Scroll Footer */}
        {hasMore && (
          <TouchableOpacity 
            style={styles.loadMoreContainer}
            onPress={loadMoreContent}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <View style={styles.loadMoreContent}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            ) : (
              <View style={styles.loadMoreContent}>
                <Text style={styles.loadMoreText}>Load More</Text>
                <Text style={styles.loadMoreIcon}>⬇️</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView 
        style={styles.profileScrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#667eea"
            colors={["#667eea", "#764ba2"]}
            progressBackgroundColor="#0a0a0a"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Banner */}
          <View style={styles.profileBannerContainer}>
            <Image 
              source={{ uri: user.banner }} 
              style={styles.profileBanner}
              defaultSource={require('../assets/images/pb.jpg')}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.profileBannerOverlay}
            />
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfoContainer}>
            {user.role === "USERPLUS" && (
              <LinearGradient
                colors={['#974d9e', '#5491cd']}
                style={styles.profileInfoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.userPlusPatternOverlay} />
              </LinearGradient>
            )}
            <View style={styles.profileAvatarContainer}>
              <Image 
                source={{ uri: user.profilePic }} 
                style={styles.profileAvatar}
                defaultSource={require('../assets/images/dpp.jpg')}
              />
              <View style={styles.profileOnlineIndicator} />
              {/* UserPlus Badge */}
              {user.role === "USERPLUS" && (
                <View style={styles.userPlusBadge}>
                  <LinearGradient
                    colors={['#974d9e', '#5491cd']}
                    style={styles.userPlusGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.userPlusText}>+</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            <View style={styles.profileDetails}>
              <View style={styles.profileUsernameRow}>
                <Text style={styles.profileUsername}>{user.userName}</Text>
                {user.role === "USERPLUS" && (
                  <Image 
                    source={require('../assets/images/PNGs/Logo-Gradient.png')}
                    style={styles.profileLogo}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.profileDisplayName}>{user.displayName || user.userName}</Text>
              {user.bio && (
                <Text style={styles.profileBio}>{user.bio}</Text>
              )}
              
              {/* Profile Stats */}
              <View style={styles.profileStatsContainer}>
                <TouchableOpacity style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>{user?.posts?.length || 0}</Text>
                  <Text style={styles.profileStatLabel}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.profileStatItem}
                  onPress={() => onShowFollow('followers')}
                >
                  <Text style={styles.profileStatNumber}>{relationshipSummary?.followersCount || 0}</Text>
                  <Text style={styles.profileStatLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.profileStatItem}
                  onPress={() => onShowFollow('following')}
                >
                  <Text style={styles.profileStatNumber}>{relationshipSummary?.followingCount || 0}</Text>
                  <Text style={styles.profileStatLabel}>Following</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.profileActionsContainer}>
                <TouchableOpacity 
                  style={styles.profileEditBtn}
                  onPress={handleOpenEditModal}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.profileEditGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.profileEditText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.profileShareBtn}
                  onPress={() => {/* Share profile functionality */}}
                >
                  <Text style={styles.profileShareIcon}>📤</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Content Tabs */}
        <View style={styles.profileContentTabsContainer}>
          <View style={styles.profileContentTabs}>
            <TouchableOpacity 
              style={[styles.profileTab, activeContentTab === 'posts' && styles.profileTabActive]}
              onPress={() => setActiveContentTab('posts')}
            >
              <Text style={[styles.profileTabText, activeContentTab === 'posts' && styles.profileTabTextActive]}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileTab, activeContentTab === 'demos' && styles.profileTabActive]}
              onPress={() => setActiveContentTab('demos')}
            >
              <Text style={[styles.profileTabText, activeContentTab === 'demos' && styles.profileTabTextActive]}>
                Demos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileTab, activeContentTab === 'featured' && styles.profileTabActive]}
              onPress={() => setActiveContentTab('featured')}
            >
              <Text style={[styles.profileTabText, activeContentTab === 'featured' && styles.profileTabTextActive]}>
                Featured On
              </Text>
            </TouchableOpacity>
          </View>
          
          
        </View>

        {/* Content Grid */}
        {renderContentGrid()}
      </ScrollView>

      {/* Add Demo Modal */}
      <Modal
        visible={showAddDemoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddDemoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addDemoModalContent}>
            <View style={styles.modalHandle} />
            {/* Redesigned Add Demo Card */}
            <View style={styles.addDemoHeaderCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2', '#a18cd1']}
                style={styles.addDemoHeaderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addDemoHeaderIcon}>🎤</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addDemoHeaderTitle}>Add New Demo</Text>
                  <Text style={styles.addDemoHeaderSubtitle}>Share a work-in-progress or idea</Text>
                </View>
                <View style={styles.addDemoRoleBadge}>
                  <Text style={styles.addDemoRoleBadgeText}>
                    {isUserPlus ? 'USERPLUS' : 'USER'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.addDemoSection}>
              <Text style={styles.addDemoLabel}>Title</Text>
              <TextInput
                placeholder="e.g. Midnight Sketch"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={demoTitle}
                onChangeText={setDemoTitle}
                style={styles.addDemoInput}
              />
            </View>

            <View style={styles.addDemoSection}>
              <Text style={styles.addDemoLabel}>Features (optional)</Text>
              <TextInput
                placeholder="Separate names with commas"
                placeholderTextColor="rgba(255,255,255,0.45)"
                value={demoFeatures}
                onChangeText={setDemoFeatures}
                style={styles.addDemoInput}
              />
            </View>

            <View style={styles.addDemoSection}>
              <Text style={styles.addDemoLabel}>Audio File</Text>
              <TouchableOpacity onPress={pickDemoFile} style={styles.addDemoPickBtn} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.addDemoPickGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.addDemoPickIcon}>🎧</Text>
                  <Text style={styles.addDemoPickText} numberOfLines={1}>
                    {selectedDemoFile ? selectedDemoFile.name : 'Select MP3' + (isUserPlus ? ' or WAV' : '')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.addDemoHint}>
                {isUserPlus ? 'Allowed formats: MP3, WAV' : 'Allowed format: MP3'}
              </Text>
            </View>

            <View style={styles.addDemoActionsRow}>
              <TouchableOpacity 
                onPress={() => setShowAddDemoModal(false)}
                style={styles.addDemoCancelBtn}
                activeOpacity={0.8}
                disabled={isSubmittingDemo}
              >
                <Text style={styles.addDemoCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={submitDemo}
                disabled={isSubmittingDemo || !demoTitle.trim() || !selectedDemoFile}
                style={styles.addDemoSubmitBtn}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#43e97b', '#38f9d7']}
                  style={styles.addDemoSubmitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmittingDemo ? (
                    <ActivityIndicator size="small" color="#0a0a0a" />
                  ) : (
                    <Text style={styles.addDemoSubmitText}>Upload Demo</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEditProfileModal(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setShowPasswordFields(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addDemoModalContent}>
            <View style={styles.modalHandle} />
            
            {/* Header */}
            <View style={styles.addDemoHeaderCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2', '#a18cd1']}
                style={styles.addDemoHeaderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.addDemoHeaderIcon}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addDemoHeaderTitle}>Edit Profile</Text>
                  <Text style={styles.addDemoHeaderSubtitle}>Update your profile information</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setShowEditProfileModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setShowPasswordFields(false);
                  }}
                  style={{ padding: 8 }}
                >
                  <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Tabs */}
            <View style={styles.editProfileTabs}>
              <TouchableOpacity
                style={[styles.editProfileTab, editProfileTab === 'basic' && styles.editProfileTabActive]}
                onPress={() => setEditProfileTab('basic')}
              >
                <Text style={[styles.editProfileTabText, editProfileTab === 'basic' && styles.editProfileTabTextActive]}>
                  Basic Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editProfileTab, editProfileTab === 'images' && styles.editProfileTabActive]}
                onPress={() => setEditProfileTab('images')}
              >
                <Text style={[styles.editProfileTabText, editProfileTab === 'images' && styles.editProfileTabTextActive]}>
                  Images
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editProfileTab, editProfileTab === 'security' && styles.editProfileTabActive]}
                onPress={() => setEditProfileTab('security')}
              >
                <Text style={[styles.editProfileTabText, editProfileTab === 'security' && styles.editProfileTabTextActive]}>
                  Security
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {/* Basic Info Tab */}
              {editProfileTab === 'basic' && (
                <>
                  {/* Bio */}
                  <View style={styles.addDemoSection}>
                    <Text style={styles.addDemoLabel}>Bio</Text>
                    <TextInput
                      placeholder="Tell us about yourself"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      value={editForm.bio}
                      onChangeText={(text) => setEditForm({...editForm, bio: text})}
                      style={[styles.addDemoInput, { minHeight: 80, textAlignVertical: 'top' }]}
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  {/* Location */}
                  <View style={styles.addDemoSection}>
                    <Text style={styles.addDemoLabel}>Location</Text>
                    <TextInput
                      placeholder="City, Country"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      value={editForm.location}
                      onChangeText={(text) => setEditForm({...editForm, location: text})}
                      style={styles.addDemoInput}
                    />
                  </View>

                  {/* About */}
                  <View style={styles.addDemoSection}>
                    <Text style={styles.addDemoLabel}>About</Text>
                    <TextInput
                      placeholder="More about you..."
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      value={editForm.about}
                      onChangeText={(text) => setEditForm({...editForm, about: text})}
                      style={[styles.addDemoInput, { minHeight: 100, textAlignVertical: 'top' }]}
                      multiline
                      numberOfLines={6}
                    />
                  </View>
                </>
              )}

              {/* Images Tab */}
              {editProfileTab === 'images' && (
                <>
                  {/* Profile Picture */}
                  <View style={styles.addDemoSection}>
                    <Text style={styles.addDemoLabel}>Profile Picture</Text>
                    <TouchableOpacity onPress={handlePickProfilePic} style={styles.addDemoPickBtn} activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.addDemoPickGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.addDemoPickIcon}>📷</Text>
                        <Text style={styles.addDemoPickText} numberOfLines={1}>
                          {selectedProfilePic ? selectedProfilePic.name : 'Select Image'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {!selectedProfilePic && editForm.profilePic && (
                      <Image 
                        source={{ uri: editForm.profilePic }} 
                        style={{ width: 60, height: 60, borderRadius: 30, marginTop: 8, alignSelf: 'flex-start' }}
                      />
                    )}
                  </View>

                  {/* Banner */}
                  <View style={styles.addDemoSection}>
                    <Text style={styles.addDemoLabel}>Banner Image</Text>
                    <TouchableOpacity onPress={handlePickBanner} style={styles.addDemoPickBtn} activeOpacity={0.85}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.addDemoPickGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.addDemoPickIcon}>🖼️</Text>
                        <Text style={styles.addDemoPickText} numberOfLines={1}>
                          {selectedBanner ? selectedBanner.name : 'Select Image'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    {!selectedBanner && editForm.banner && (
                      <Image 
                        source={{ uri: editForm.banner }} 
                        style={{ width: '100%', height: 120, borderRadius: 8, marginTop: 8 }}
                      />
                    )}
                  </View>
                </>
              )}

              {/* Security Tab */}
              {editProfileTab === 'security' && (
                <>
                  {/* Change Password Section */}
                  <View style={styles.addDemoSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={styles.addDemoLabel}>Change Password</Text>
                      <TouchableOpacity 
                        onPress={() => setShowPasswordFields(!showPasswordFields)}
                        style={{ padding: 4 }}
                      >
                        <Text style={{ color: '#667eea', fontSize: 14, fontWeight: '600' }}>
                          {showPasswordFields ? 'Hide' : 'Show'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {showPasswordFields && (
                      <>
                        <TextInput
                          placeholder="Current Password"
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          value={passwordForm.currentPassword}
                          onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                          style={styles.addDemoInput}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                        
                        <TextInput
                          placeholder="New Password"
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          value={passwordForm.newPassword}
                          onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                          style={[styles.addDemoInput, { marginTop: 12 }]}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                        
                        <TextInput
                          placeholder="Confirm New Password"
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          value={passwordForm.confirmPassword}
                          onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                          style={[styles.addDemoInput, { marginTop: 12 }]}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                        
                        <TouchableOpacity 
                          onPress={handleChangePassword}
                          disabled={isChangingPassword}
                          style={[styles.addDemoSubmitBtn, { marginTop: 16 }]}
                          activeOpacity={0.9}
                        >
                          <LinearGradient
                            colors={['#667eea', '#764ba2']}
                            style={styles.addDemoSubmitGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            {isChangingPassword ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.addDemoSubmitText}>Change Password</Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.addDemoActionsRow}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowEditProfileModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setShowPasswordFields(false);
                  }}
                  style={styles.addDemoCancelBtn}
                  activeOpacity={0.8}
                  disabled={isEditingProfile}
                >
                  <Text style={styles.addDemoCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleEditProfileSubmit}
                  disabled={isEditingProfile}
                  style={styles.addDemoSubmitBtn}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#43e97b', '#38f9d7']}
                    style={styles.addDemoSubmitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isEditingProfile ? (
                      <ActivityIndicator size="small" color="#0a0a0a" />
                    ) : (
                      <Text style={styles.addDemoSubmitText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Post Card Modal */}
      <PostCardModal
        visible={isModalVisible}
        onClose={closeModal}
        post={expandedPost}
        currentUser={currentUser}
        onPostUpdate={handlePostUpdate}
        showDelete={isOwnProfile}
      />

      {/* Views Analytics Modal */}
      {analyticsPost && (
        <ViewsAnalytics
          postId={analyticsPost.id}
          postTitle={analyticsPost.title}
          isOpen={showViewsAnalytics}
          onClose={() => {
            setShowViewsAnalytics(false);
            setAnalyticsPost(null);
          }}
          currentUser={currentUser}
          postAuthor={analyticsPost.author || user}
          totalDownloads={analyticsPost.totalDownloads || 0}
          totalViews={analyticsPost.totalViews || 0}
          totalComments={analyticsPost.totalComments || 0}
        />
      )}
      
    </>
  );
}

// Spotlight Modal Content Component (needs to be inside AudioProvider)
function SpotlightModalContent({ 
  selectedSpotlightPost, 
  setSpotlightModalOpen, 
  user, 
  formatTime, 
  getGenreIcon 
}) {
  const { playTrack, currentTrack, isPlaying, isLoading } = useAudio();
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePlayPress = async () => {
    if (!selectedSpotlightPost || isButtonLoading || isLoading) return;
    
    setIsButtonLoading(true);
    
    try {
      // Check if this track is currently playing
      const isCurrentTrack = currentTrack && currentTrack.id === selectedSpotlightPost.id;
      
      if (isCurrentTrack && isPlaying) {
        // Track is playing, this will pause it
        await playTrack(selectedSpotlightPost);
      } else {
        // Play the track
        await playTrack(selectedSpotlightPost);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedSpotlightPost || !selectedSpotlightPost.freeDownload || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const fileName = `${selectedSpotlightPost.title} - ${selectedSpotlightPost.author?.userName || 'Unknown'}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(selectedSpotlightPost.music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          const userName = user.userName || 'unknown';
          await trackDownload(selectedSpotlightPost.id, userName);
          console.log('Download tracked for:', selectedSpotlightPost.title);
        } catch (error) {
          console.error('Error tracking download:', error);
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ScrollView style={styles.spotlightModalScrollView} showsVerticalScrollIndicator={false}>
      {/* Enhanced Spotlight Banner */}
      <View style={styles.spotlightModalBanner}>
        <Image 
          source={{ uri: selectedSpotlightPost.author?.banner || user.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
          style={styles.spotlightModalBannerImage}
          defaultSource={require('../assets/images/pb.jpg')}
        />
        <LinearGradient
          colors={['transparent', 'rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.7)']}
          style={styles.spotlightModalBannerOverlay}
        />
        
        {/* Spotlight Glow Effect */}
        <View style={styles.spotlightModalGlow} />
        
        {/* Enhanced Spotlight Badge */}
        <View style={styles.spotlightModalBadge}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.spotlightModalBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.spotlightModalBadgeIcon}>⭐</Text>
            <Text style={styles.spotlightModalBadgeText}>SPOTLIGHT</Text>
          </LinearGradient>
        </View>

        {/* Premium Badge */}
        {selectedSpotlightPost.author?.role === 'USERPLUS' && (
          <View style={styles.spotlightModalPremiumBadge}>
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              style={styles.spotlightModalPremiumBadgeGradient}
            >
              <Text style={styles.spotlightModalPremiumIcon}>✨</Text>
              <Text style={styles.spotlightModalPremiumText}>PREMIUM</Text>
            </LinearGradient>
          </View>
        )}

        {/* Time Badge */}
        <View style={styles.spotlightModalTimeBadge}>
          <Text style={styles.spotlightModalTimeText}>{formatTime(selectedSpotlightPost.time)}</Text>
        </View>

        <View style={styles.spotlightModalBannerContent}>
          <Text style={styles.spotlightModalPostTitle}>{selectedSpotlightPost.title}</Text>
          <Text style={styles.spotlightModalPostSubtitle}>by {selectedSpotlightPost.author?.userName}</Text>
        </View>
      </View>

      <View style={styles.spotlightModalMainContent}>
        {/* Enhanced Profile Section */}
        <View style={styles.spotlightModalProfileSection}>
          <TouchableOpacity 
            style={styles.spotlightModalProfileTouchable}
            onPress={() => {
              setSpotlightModalOpen(false);
              router.push(`/profile/${selectedSpotlightPost.author?.userName}`);
            }}
            activeOpacity={0.7}
          >
            <Image 
              source={{ uri: selectedSpotlightPost.author?.profilePic || user.profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.spotlightModalAvatar}
              defaultSource={require('../assets/images/dpp.jpg')}
            />
            <View style={styles.spotlightModalProfileInfo}>
              <Text style={styles.spotlightModalUsername}>{selectedSpotlightPost.author?.userName}</Text>
              <Text style={styles.spotlightModalDate}>{formatTime(selectedSpotlightPost.time)}</Text>
              {selectedSpotlightPost.author?.role === 'USERPLUS' && (
                <View style={styles.spotlightModalProfilePremiumBadge}>
                  <Text style={styles.spotlightModalProfilePremiumText}>✨ PREMIUM ARTIST</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Small Play Button */}
          <TouchableOpacity 
            style={[
              styles.spotlightModalSmallPlayButton,
              (isButtonLoading || isLoading) && styles.spotlightModalSmallPlayButtonDisabled
            ]}
            onPress={handlePlayPress}
            activeOpacity={0.8}
            disabled={isButtonLoading || isLoading}
          >
            <LinearGradient
              colors={
                (isButtonLoading || isLoading) 
                  ? ['#4a5568', '#2d3748'] 
                  : ['#667eea', '#764ba2']
              }
              style={styles.spotlightModalSmallPlayButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isButtonLoading || isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.spotlightModalSmallPlayIcon}>
                  {currentTrack && currentTrack.id === selectedSpotlightPost.id && isPlaying ? '⏸' : '▶'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {selectedSpotlightPost.description && selectedSpotlightPost.description.trim() && (
          <Text style={styles.spotlightModalDescription}>{selectedSpotlightPost.description}</Text>
        )}

        {/* Enhanced Features */}
        {selectedSpotlightPost.features && selectedSpotlightPost.features.length > 0 && (
          <View style={styles.spotlightModalFeaturesContainer}>
            <Text style={styles.spotlightModalFeaturesLabel}>🎤 Featuring:</Text>
            <View style={styles.spotlightModalFeaturesList}>
              {selectedSpotlightPost.features.map((feature, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.spotlightModalFeatureTag}
                  onPress={() => {
                    setModalOpen(false);
                    router.push(`/profile/${feature}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.spotlightModalFeatureText}>{feature}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {/* Enhanced Genre Tags */}
        {selectedSpotlightPost.genre && selectedSpotlightPost.genre.length > 0 && (
          <View style={styles.spotlightModalGenresContainer}>
            <Text style={styles.spotlightModalGenresLabel}>🎵 Genres:</Text>
            <View style={styles.spotlightModalGenresList}>
              {selectedSpotlightPost.genre.map((genreItem, index) => (
                <View key={index} style={styles.spotlightModalGenreTag}>
                  <Text style={styles.spotlightModalGenreIcon}>{getGenreIcon(genreItem)}</Text>
                  <Text style={styles.spotlightModalGenreText}>{genreItem}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Enhanced Stats Grid */}
        <View style={styles.spotlightModalStatsGrid}>
          <View style={styles.spotlightModalStatItem}>
            <Text style={styles.spotlightModalStatIcon}>🔥</Text>
            <Text style={styles.spotlightModalStatNumber}>{selectedSpotlightPost.likes?.length || 0}</Text>
            <Text style={styles.spotlightModalStatLabel}>Likes</Text>
          </View>
          
          <View style={styles.spotlightModalStatItem}>
            <Text style={styles.spotlightModalStatIcon}>💬</Text>
            <Text style={styles.spotlightModalStatNumber}>{selectedSpotlightPost.totalComments || selectedSpotlightPost.comments?.length || 0}</Text>
            <Text style={styles.spotlightModalStatLabel}>Comments</Text>
          </View>
          
          <View style={styles.spotlightModalStatItem}>
            <Text style={styles.spotlightModalStatIcon}>👁️</Text>
            <Text style={styles.spotlightModalStatNumber}>{selectedSpotlightPost.totalViews || 0}</Text>
            <Text style={styles.spotlightModalStatLabel}>Views</Text>
          </View>
        </View>

        {/* Special Spotlight Actions */}
        <View style={styles.spotlightModalActionsContainer}>
          <TouchableOpacity 
            style={styles.spotlightModalActionBtn}
            onPress={() => {
              console.log('View Post clicked - Post ID:', selectedSpotlightPost.id);
              console.log('Navigating to:', `/post/${selectedSpotlightPost.id}`);
              setSpotlightModalOpen(false);
              router.push(`/post/${selectedSpotlightPost.id}`);
            }}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.spotlightModalActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.spotlightModalActionIcon}>🎵</Text>
              <Text style={styles.spotlightModalActionText}>View Post</Text>
            </LinearGradient>
          </TouchableOpacity>

          {selectedSpotlightPost.freeDownload && (
            <TouchableOpacity 
              style={styles.spotlightModalDownloadBtn}
              onPress={handleDownload}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                style={styles.spotlightModalDownloadGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isDownloading ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.spotlightModalDownloadText}>Downloading...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.spotlightModalDownloadIcon}>⬇️</Text>
                    <Text style={styles.spotlightModalDownloadText}>Free Download</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// Audio Player Wrapper Component
function AudioPlayerWrapper({ currentUser }) {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    volume, 
    isPlayerVisible, 
    isLoading,
    pauseTrack,
    resumeTrack,
    seekTo,
    setVolumeLevel,
    hidePlayer,
    togglePlayPause
  } = useAudio();

  return (
    <CentralizedAudioPlayer
      isVisible={isPlayerVisible}
      currentTrack={currentTrack}
      onClose={hidePlayer}
      onPlayPause={togglePlayPause}
      isPlaying={isPlaying}
      position={position}
      duration={duration}
      volume={volume}
      onVolumeChange={setVolumeLevel}
      onSeek={seekTo}
      currentUser={currentUser}
    />
  );
}

// Main App Component
export default function MainApp({ initialTab = 'home' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestPost, setLatestPost] = useState(null);
  const [relationshipSummary, setRelationshipSummary] = useState(null);
  const [latestModalOpen, setLatestModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [spotlightModalOpen, setSpotlightModalOpen] = useState(false);
  const [selectedSpotlightPost, setSelectedSpotlightPost] = useState(null);
  const [loadedTabs, setLoadedTabs] = useState(new Set(['home'])); // Track which tabs have been loaded
  
  // Follow modal state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');

  // Load saved tab preference on mount
  useEffect(() => {
    loadSavedTab();
    fetchData();
  }, []);

  // Save tab preference whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveTabPreference(activeTab);
    }
  }, [activeTab, isLoading]);

  const loadSavedTab = async () => {
    try {
      const savedTab = await AsyncStorage.getItem('lastActiveTab');
      if (savedTab) {
        setActiveTab(savedTab);
        setLoadedTabs(new Set([savedTab]));
      }
    } catch (error) {
      console.error('Error loading saved tab:', error);
    }
  };

  const saveTabPreference = async (tab) => {
    try {
      await AsyncStorage.setItem('lastActiveTab', tab);
    } catch (error) {
      console.error('Error saving tab preference:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get current user info
      const response = await api.get('/user/me');
      setUser(response.data);
      
      // Get relationship summary for current user
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(response.data.userName);
      setRelationshipSummary(relationshipResponse.data);
      
      // Get latest post if user has posts
      if (response.data.posts && response.data.posts.length > 0) {
        const postResponse = await getPostById(response.data.posts[0]);
        setLatestPost(postResponse.data);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      // If authentication fails, redirect to login
      router.replace('/login');
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Track which tabs have been loaded
    setLoadedTabs(prev => new Set([...prev, tabId]));
    // Save the new tab preference
    saveTabPreference(tabId);
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearMyNotifications();
      setUser(prev => prev ? { ...prev, notifications: [] } : prev);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const handleSpotlightPress = (spotlightPost) => {
    setSelectedSpotlightPost(spotlightPost);
    setSpotlightModalOpen(true);
  };

  const handleProfileRefresh = async () => {
    try {
      // Get fresh user info
      const response = await api.get('/user/me');
      setUser(response.data);
      
      // Get fresh relationship summary for current user
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(response.data.userName);
      setRelationshipSummary(relationshipResponse.data);
      
      // Get latest post if user has posts
      if (response.data.posts && response.data.posts.length > 0) {
        const postResponse = await getPostById(response.data.posts[0]);
        setLatestPost(postResponse.data);
      }
    } catch (err) {
      console.error('Error refreshing profile data:', err);
      throw err; // Re-throw to let ProfileTab handle the error
    }
  };

  const handleHomepageRefresh = async () => {
    try {
      // Get fresh user info
      const response = await api.get('/user/me');
      setUser(response.data);
      
      // Get fresh relationship summary for current user
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(response.data.userName);
      setRelationshipSummary(relationshipResponse.data);
      
      // Get latest post if user has posts
      if (response.data.posts && response.data.posts.length > 0) {
        const postResponse = await getPostById(response.data.posts[0]);
        setLatestPost(postResponse.data);
      }
    } catch (err) {
      console.error('Error refreshing homepage data:', err);
      throw err; // Re-throw to let HomepageTab handle the error
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.notiType || !notification.userName) return;
    
    // Close the activity modal if it's open
    setActivityModalOpen(false);
    
    switch (notification.notiType) {
      case 'PROFILE':
        router.push(`/profile/${notification.userName}`);
        break;
      case 'POST':
        // For post notifications, we need to find the post ID
        // Since we don't have post ID in the notification, we'll navigate to the user's profile
        // In a real implementation, you'd want to include postId in the notification data
        router.push(`/profile/${notification.userName}`);
        break;
      case 'CHAT':
        router.push('/messages');
        break;
      default:
        // Default to user profile if unknown type
        if (notification.userName) {
          router.push(`/profile/${notification.userName}`);
        }
        break;
    }
  };

  const renderTabContent = () => {
    return (
      <>
        {/* Always render all components but show/hide based on activeTab */}
        <View style={[styles.tabContent, activeTab !== 'home' && styles.hiddenTab]}>
          <HomepageTab 
            user={user}
            relationshipSummary={relationshipSummary}
            latestPost={latestPost}
            onShowFollow={(type) => {
              setFollowModalType(type);
              setShowFollowModal(true);
            }}
            onShowActivity={() => setActivityModalOpen(true)}
            onShowLatest={() => setLatestModalOpen(true)}
            onRefresh={handleHomepageRefresh}
            onNotificationPress={handleNotificationPress}
          />
        </View>
        
        <View style={[styles.tabContent, activeTab !== 'feed' && styles.hiddenTab]}>
          <FeedScreen skipAuth={true} onSpotlightPress={handleSpotlightPress} />
        </View>
        
        <View style={[styles.tabContent, activeTab !== 'profile' && styles.hiddenTab]}>
          <ProfileTab 
            user={user} 
            relationshipSummary={relationshipSummary}
            onShowFollow={(type) => {
              setFollowModalType(type);
              setShowFollowModal(true);
            }}
            onRefresh={handleProfileRefresh}
          />
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f53ac" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <AuthGuard>
      <View style={styles.container}>
        <LoggedInHeader />
        {renderTabContent()}

        {/* Latest Post Modal */}
        <Modal
          visible={latestModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setLatestModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Post Details</Text>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setLatestModalOpen(false)}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {latestPost && (
                <>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.modalBanner}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Image 
                      source={{ uri: user.banner }} 
                      style={styles.modalBannerImage}
                      defaultSource={require('../assets/images/pb.jpg')}
                    />
                    <View style={styles.modalAvatarOverlay}>
                      <Image 
                        source={{ uri: user.profilePic }} 
                        style={styles.modalAvatar}
                        defaultSource={require('../assets/images/dpp.jpg')}
                      />
                    </View>
                  </LinearGradient>
                  
                  <View style={styles.modalMainContent}>
                    <Text style={styles.modalPostTitle}>{latestPost.title}</Text>
                    <View style={styles.modalStatsGrid}>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>🔥</Text>
                        <Text style={styles.modalStatNumber}>{latestPost.likes.length}</Text>
                        <Text style={styles.modalStatLabel}>Likes</Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>💬</Text>
                        <Text style={styles.modalStatNumber}>{latestPost?.totalComments || 0}</Text>
                        <Text style={styles.modalStatLabel}>Comments</Text>
                      </View>
                      <View style={styles.modalStatItem}>
                        <Text style={styles.modalStatIcon}>⬇️</Text>
                        <Text style={styles.modalStatNumber}>{latestPost?.totalDownloads || 0}</Text>
                        <Text style={styles.modalStatLabel}>Downloads</Text>
                      </View>
                    </View>
                    <Text style={styles.modalDescription}>{latestPost.description}</Text>
                    
                    <TouchableOpacity 
                      style={styles.goToPostBtn}
                      onPress={() => {
                        setLatestModalOpen(false);
                        router.push(`/post/${latestPost.id}`);
                      }}
                    >
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.goToPostGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.goToPostText}>View Full Post</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Activity Modal */}
        <Modal
          visible={activityModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActivityModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>All Notifications</Text>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setActivityModalOpen(false)}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {user?.notifications && user.notifications.length > 0 ? (
                <>
                  <ScrollView 
                    style={styles.activityModalList}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.activityModalScrollContent}
                  >
                    {user.notifications.map((notification, index) => {
                      // Create a unique key by combining multiple fields
                      const id = notification._id?.toString() || notification.id?.toString() || '';
                      const timestamp = notification.time?.toString() || '';
                      const uniqueKey = `${id}-${timestamp}-${index}`;
                      
                      return (
                        <TouchableOpacity 
                          key={uniqueKey} 
                          style={styles.activityModalItem}
                          onPress={() => handleNotificationPress(notification)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.activityModalDot} />
                          <View style={styles.activityModalTextContainer}>
                            <Text style={styles.activityModalUsername}>
                              {String(notification.userName || 'Unknown User')}
                            </Text>
                            <Text style={styles.activityModalText}>
                              {String(notification.noti || notification.message || notification.text || 'Notification')}
                            </Text>
                            {notification.time && (
                              <Text style={styles.activityModalTime}>
                                {formatTime(new Date(notification.time))}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity 
                    style={styles.clearAllBtn}
                    onPress={handleClearAllNotifications}
                  >
                    <LinearGradient
                      colors={['#ff6b6b', '#ee5a52']}
                      style={styles.clearAllGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyModalState}>
                  <Text style={styles.emptyModalIcon}>✨</Text>
                  <Text style={styles.emptyModalText}>All caught up!</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Followers/Following Modal */}
        <FollowersModal
          isVisible={showFollowModal}
          onClose={() => setShowFollowModal(false)}
          userName={user?.userName}
          type={followModalType}
        />

        {/* Enhanced Spotlight Post Modal */}
        <Modal
          visible={spotlightModalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSpotlightModalOpen(false)}
        >
          <View style={styles.spotlightModalOverlay}>
            <View style={styles.spotlightModalContent}>
              <View style={styles.spotlightModalHandle} />
              
              {selectedSpotlightPost && (
                <>
                  <SpotlightModalContent
                    selectedSpotlightPost={selectedSpotlightPost}
                    setSpotlightModalOpen={setSpotlightModalOpen}
                    user={user}
                    formatTime={formatTime}
                    getGenreIcon={getGenreIcon}
                  />

                  {/* Modal Close Button */}
                  <TouchableOpacity 
                    style={styles.spotlightModalCloseBtn}
                    onPress={() => setSpotlightModalOpen(false)}
                  >
                    <Text style={styles.spotlightModalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Audio Player */}
        <AudioPlayerWrapper currentUser={user} />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  // Main Container
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 120, // Space for LoggedInHeader
    paddingBottom:100
  },
  tabContent: {
    flex: 1,
  },
  hiddenTab: {
    display: 'none',
  },
  scrollView: {
    flex: 1,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  profileScrollView: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  profileHeader: {
    position: 'relative',
  },
  profileBannerContainer: {
    height: 200,
    position: 'relative',
  },
  profileBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  profileInfoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  profileInfoGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  profileAvatarContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginTop: -50,
    marginBottom: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#0a0a0a',
  },
  profileOnlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#0a0a0a',
  },
  profileDetails: {
    marginTop: 1,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileDisplayName: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 16,
  },
  profileStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  profileActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileEditBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileEditGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileEditText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileShareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileShareIcon: {
    fontSize: 20,
  },

  // UserPlus Styles
  userPlusBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#0a0a0a',
    shadowColor: '#974d9e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  userPlusGradient: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPlusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileLogo: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  userPlusPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.3,
  },

  // Content Tabs
  profileContentTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileContentTabs: {
    flexDirection: 'row',
    flex: 1,
  },
  profileTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  profileTabActive: {
    borderBottomColor: '#667eea',
  },
  addDemoButton: {
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addDemoGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addDemoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  profileTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  profileTabTextActive: {
    color: '#667eea',
  },

  // Content Container
  profileContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop:20
  },

  // Demo Grid Container - Now vertical for horizontal cards
  demoGridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20,
  },

  // Modern Post Cards - Glassmorphism Style inspired by website
  profilePostCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 32,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
    minHeight: 400,
    position: 'relative',
  },
  // Post Header with Banner
  profilePostHeader: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
    borderRadius: 32,
  },
  profilePostBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePostBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  profilePostPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
  profilePostPlayIcon: {
    fontSize: 32,
    color: '#7877c6',
    marginLeft: 4,
  },
  // Premium Badge
  profilePostPremiumBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#7877c6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7877c6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  profilePostPremiumIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  profilePostPremiumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Time Badge
  profilePostTimeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePostTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Post Content - Modern Design
  profilePostContent: {
    padding: 24,
    flex: 1,
    backgroundColor: 'transparent',
  },
  profilePostProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(120, 119, 198, 0.3)',
    marginRight: 12,
  },
  profilePostAuthorInfo: {
    flex: 1,
  },
  profilePostAuthorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  profilePostDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  profilePostTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: -0.01,
  },
  profilePostDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 16,
  },
  // Features and Tags
  profilePostFeatures: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profilePostFeaturesLabel: {
    color: '#7877c6',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  profilePostFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profilePostFeatureLink: {
    color: '#ff77c6',
    fontSize: 14,
    fontWeight: '600',
  },
  profilePostFeatureMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  profilePostTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  profilePostTag: {
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(120, 119, 198, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePostTagIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  profilePostTagText: {
    fontSize: 12,
    color: '#7877c6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Post Media
  profilePostMedia: {
    position: 'relative',
    height: 250,
    backgroundColor: '#0a0a0a',
  },
  profilePostImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePostPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePostPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  profilePostPlayIcon: {
    fontSize: 24,
    marginLeft: 3,
  },

  // Post Stats - Modern Design
  profilePostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  profilePostStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profilePostStatIcon: {
    fontSize: 18,
  },
  profilePostStatText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profilePostAnalyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  profilePostAnalyticsIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  profilePostAnalyticsText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },

  // Post Actions - Instagram/TikTok Style
  profilePostActionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-around',
  },
  profilePostActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 60,
  },
  profilePostActionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  profilePostActionButtonIcon: {
    fontSize: 16,
  },
  profilePostActionButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading and Empty States
  profileLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  profileLoadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 12,
  },
  profileEmptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  profileEmptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  profileEmptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileEmptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  profileCreateFirstBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileCreateFirstGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  profileCreateFirstText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Full-Screen Modal Styles
  profileModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
  },
  profileModalContent: {
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
    borderRadius: 24,
    marginTop: 80,
    marginHorizontal: 12,
    marginBottom: 20,
    height: '75%',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(120, 119, 198, 0.2)',
    alignSelf: 'stretch',
  },
  profileModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  profileModalCloseIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileModalScrollView: {
    flex: 1,
    paddingBottom: 20,
    paddingTop:20
  },

  // Hero Section
  profileModalHero: {
    position: 'relative',
    height: 160,
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  profileModalBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileModalGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileModalHeroContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
    zIndex: 3,
  },
  profileModalHeroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 28,
  },
  profileModalHeroProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileModalHeroAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileModalHeroProfileInfo: {
    flex: 1,
  },
  profileModalHeroUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  profileModalHeroDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  profileModalHeroPlayBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(120, 119, 198, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(120, 119, 198, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 4,
  },
  profileModalHeroPlayIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 2,
  },


  // Description
  profileModalDescriptionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(120, 119, 198, 1)',
  },
  profileModalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },

  // Features
  profileModalFeaturesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileModalFeaturesLabel: {
    color: 'rgba(120, 119, 198, 1)',
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  profileModalFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  profileModalFeatureTag: {
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    color: 'rgba(120, 119, 198, 1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(120, 119, 198, 0.3)',
  },

  // Genres
  profileModalGenresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  profileModalGenreTag: {
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120, 119, 198, 0.3)',
  },
  profileModalGenreTagText: {
    color: 'rgba(120, 119, 198, 1)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Floating Stats
  profileModalFloatingStats: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  profileModalFloatingLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  profileModalFloatingViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  profileModalFloatingLikeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  profileModalFloatingViewIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  profileModalFloatingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Actions
  profileModalActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  profileModalActionBtnPrimary: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(120, 119, 198, 1)',
    alignItems: 'center',
    shadowColor: 'rgba(120, 119, 198, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileModalActionTextPrimary: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileModalActionBtnSecondary: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  profileModalActionTextSecondary: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },


  // Comments Section
  profileModalCommentsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  profileModalCommentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  profileModalCommentsList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  profileModalCommentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileModalCommentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileModalCommentContent: {
    flex: 1,
  },
  profileModalCommentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileModalCommentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  profileModalCommentTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  profileModalCommentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  profileModalNoComments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileModalNoCommentsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  profileModalNoCommentsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Comment Input
  profileModalCommentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileModalCommentInputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileModalCommentInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  profileModalCommentSubmitBtn: {
    backgroundColor: 'rgba(120, 119, 198, 1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  profileModalCommentSubmitBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileModalCommentSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Infinite Scroll Styles
  loadMoreContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  loadMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadMoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  loadMoreIcon: {
    fontSize: 16,
  },

  // Completely New Modern Homepage Styles
  
  // Header Card
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  headerGradient: {
    padding: 24,
    position: 'relative',
  },
  headerBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '120%',
    height: '65%',
    resizeMode: 'cover',
  },
  headerBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 2,
    position: 'relative',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
    zIndex: 2,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    zIndex: 2,
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width:130,
    overflow: 'hidden',
  },
  userName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },

  // Quick Actions Section
  quickActionsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsScroll: {
    paddingLeft: 0,
  },
  actionCard: {
    width: 120,
    height: 100,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    transform: [{ scale: 1 }],
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Card Components
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  spotlightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  trendingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeAllText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },

  // Activity Content
  activityContent: {
    minHeight: 80,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginBottom: 4,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  activityUsername: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 18,
  },
  activityTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.8,
  },
  emptyTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
  },

  // Spotlight Content
  spotlightContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  spotlightGradient: {
    padding: 20,
  },
  spotlightInfo: {
    marginBottom: 16,
  },
  spotlightTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  spotlightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  spotlightStat: {
    alignItems: 'center',
  },
  spotlightStatIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  spotlightStatNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Trending Section
  trendingScroll: {
    paddingLeft: 0,
  },
  trendingItem: {
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  trendingIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  trendingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  addDemoModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 22,
    paddingBottom: 42,
    height: '92%',
    marginTop: 30,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.25)',
  },
  addDemoHeaderCard: {
    marginBottom: 16,
  },
  addDemoHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  addDemoHeaderIcon: {
    fontSize: 26,
    marginRight: 2,
  },
  addDemoHeaderTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  addDemoHeaderSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  addDemoRoleBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  addDemoRoleBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addDemoSection: {
    marginBottom: 14,
  },
  addDemoLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  addDemoInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addDemoPickBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addDemoPickGradient: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addDemoPickIcon: {
    fontSize: 16,
  },
  addDemoPickText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  addDemoHint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    marginTop: 6,
  },
  addDemoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  addDemoCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flex: 1,
    alignItems: 'center',
  },
  addDemoCancelText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  addDemoSubmitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1.2,
  },
  addDemoSubmitGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addDemoSubmitText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  editProfileTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editProfileTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  editProfileTabActive: {
    borderBottomColor: '#667eea',
  },
  editProfileTabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  editProfileTabTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#404040',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Post Modal Specific
  modalBanner: {
    height: 140,
    borderRadius: 16,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  modalBannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  modalAvatarOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 150,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#1a1a1a',
  },
  modalMainContent: {
    marginTop: 20,
  },
  modalPostTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  modalStatNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalStatLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  modalDescription: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  goToPostBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  goToPostGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  goToPostText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Activity Modal Specific
  activityModalList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  activityModalScrollContent: {
    paddingBottom: 20,
  },
  activityModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityModalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  activityModalTextContainer: {
    flex: 1,
  },
  activityModalUsername: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityModalText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  activityModalTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  clearAllBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  clearAllGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  clearAllText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyModalState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyModalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyModalText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    fontWeight: '500',
  },

  // Follow Modal Specific
  followModalContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  followModalEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  followModalText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Spotlight Modal Styles
  modalFeaturesContainer: {
    marginBottom: 16,
  },
  modalFeaturesLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFeatureTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalGenresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalGenreTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalGenreTagText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Enhanced Spotlight Modal Styles
  spotlightModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 10, 0.98)',
  },
  spotlightModalContent: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderRadius: 28,
    marginTop: 60,
    marginHorizontal: 8,
    marginBottom: 20,
    height: '85%',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.4)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 25,
  },
  spotlightModalHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#667eea',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  spotlightModalScrollView: {
    flex: 1,
  },
  spotlightModalBanner: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  spotlightModalBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  spotlightModalBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  spotlightModalGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderRadius: 40,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 30,
  },
  spotlightModalBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  spotlightModalBadgeGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightModalBadgeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  spotlightModalBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  spotlightModalPremiumBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  spotlightModalPremiumBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightModalPremiumIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  spotlightModalPremiumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  spotlightModalTimeBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  spotlightModalTimeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  spotlightModalBannerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  spotlightModalPostTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spotlightModalPostSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightModalMainContent: {
    padding: 24,
  },
  spotlightModalProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102, 126, 234, 0.2)',
  },
  spotlightModalProfileTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spotlightModalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#667eea',
    marginRight: 16,
  },
  spotlightModalProfileInfo: {
    flex: 1,
  },
  spotlightModalUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  spotlightModalDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  spotlightModalProfilePremiumBadge: {
    backgroundColor: 'rgba(240, 147, 251, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  spotlightModalProfilePremiumText: {
    color: '#f093fb',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spotlightModalSmallPlayButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  spotlightModalSmallPlayButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  spotlightModalSmallPlayButtonGradient: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightModalSmallPlayIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 2,
  },
  spotlightModalDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 20,
  },
  spotlightModalFeaturesContainer: {
    marginBottom: 20,
  },
  spotlightModalFeaturesLabel: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  spotlightModalFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spotlightModalFeatureTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  spotlightModalFeatureText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  spotlightModalGenresContainer: {
    marginBottom: 24,
  },
  spotlightModalGenresLabel: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  spotlightModalGenresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spotlightModalGenreTag: {
    backgroundColor: 'rgba(118, 75, 162, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(118, 75, 162, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightModalGenreIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  spotlightModalGenreText: {
    color: '#764ba2',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotlightModalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  spotlightModalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  spotlightModalStatIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  spotlightModalStatNumber: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  spotlightModalStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotlightModalActionsContainer: {
    gap: 16,
  },
  spotlightModalActionBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  spotlightModalActionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightModalActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  spotlightModalActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spotlightModalDownloadBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#43e97b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  spotlightModalDownloadGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightModalDownloadIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  spotlightModalDownloadText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spotlightModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  spotlightModalCloseIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addDemoDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginLeft: 18,
    marginBottom: 8,
  },
});
