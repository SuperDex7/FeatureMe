import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  Modal, 
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { listPosts, addView, addLike, getLikesSummary, addComment, getCommentsPaginated, deletePost } from '../services/postsService';
import { getCurrentUser } from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import AuthGuard from '../components/AuthGuard';
import SpotlightCard from '../components/SpotlightCard';
import PostCard from '../components/PostCard';
import ViewsAnalytics from '../components/ViewsAnalytics';
import PostCardModal from '../components/PostCardModal';
import { useAudio } from '../contexts/AudioContext';

// Pagination constant
const POSTS_PER_PAGE = 6;

// Profile Section Component with Navigation
function ProfileSection({ userName, profilePic, time, styles, formatTime }) {
  const handleProfilePress = () => {
    if (!userName) {
      console.log('No username provided for navigation');
      return;
    }
    console.log('Navigating to profile:', `/profile/${userName}`);
    router.push(`/profile/${userName}`);
  };

  // Don't render if no userName
  if (!userName) {
    return (
      <View style={styles.profileSection}>
        <Image 
          source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
          style={styles.avatar}
          defaultSource={require('../assets/images/dpp.jpg')}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.username}>Unknown User</Text>
          <Text style={styles.time}>{formatTime(time)}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.profileSection}
      onPress={handleProfilePress}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
        style={styles.avatar}
        defaultSource={require('../assets/images/dpp.jpg')}
      />
      <View style={styles.profileInfo}>
        <Text style={styles.username}>{userName}</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
      </View>
    </TouchableOpacity>
  );
}

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

// FeedItem wrapper using PostCard
function FeedItem({ 
  id, 
  author, 
  description, 
  time, 
  title, 
  features, 
  genre, 
  music, 
  comments = [], 
  likes = [], 
  totalViews = 0, 
  totalComments = 0, 
  freeDownload = false,
  onLikeUpdate,
  onCommentUpdate,
  onDeletePost
}) {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Use centralized audio context
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const handlePlayClick = async () => {
    // Check cooldown before adding view
    const cooldownKey = `view_${id}_${currentUser?.userName}`;
    const lastViewTime = await AsyncStorage.getItem(cooldownKey);
    const now = Date.now();
    const oneMinute = 15 * 1000; // 15 seconds in milliseconds
    
    let shouldAddView = true;
    if (lastViewTime) {
      const timeSinceLastView = now - parseInt(lastViewTime);
      if (timeSinceLastView < oneMinute) {
        shouldAddView = false;
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        await AsyncStorage.setItem(cooldownKey, now.toString());
      } catch (error) {
        console.error("Error adding view:", error);
      }
    }
    
    // Play track using centralized audio player
    const trackData = {
      id,
      title,
      author,
      music,
      genre,
      features,
      description,
      time
    };
    playTrack(trackData);
  };

  return (
    <PostCard
      id={id}
      author={author}
      description={description}
      time={time}
      title={title}
      features={features}
      genre={genre}
      music={music}
      comments={comments}
      likes={likes}
      totalViews={totalViews}
      totalComments={totalComments}
      freeDownload={freeDownload}
      onLikeUpdate={onLikeUpdate}
      onCommentUpdate={onCommentUpdate}
      onDeletePost={onDeletePost}
      currentUser={currentUser}
      variant="default"
      showModal={true}
      currentTrack={currentTrack}
      isPlaying={isPlaying}
    />
  );
}

// Genre Filter Modal Component
function GenreFilterModal({ isOpen, onClose, genreData, selectedGenres, onGenreToggle }) {
  if (!isOpen) return null;

  const requiredGenres = ['Song', 'Beat', 'Loop', 'Instrument', 'Sample', 'Acapella', 'Free', 'Paid', 'Open'];
  
  const requiredGenreData = requiredGenres.map(reqGenre => 
    genreData.find(({ genre }) => genre.toLowerCase() === reqGenre.toLowerCase())
  ).filter(Boolean);
  
  const regularGenreData = genreData.filter(({ genre }) => 
    !requiredGenres.some(req => req.toLowerCase() === genre.toLowerCase())
  );

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.genreModalOverlay} onPress={onClose}>
        <Pressable style={styles.genreModalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.genreModalHeader}>
            <Text style={styles.genreModalTitle}>Filter by Genre</Text>
            <TouchableOpacity style={styles.genreModalClose} onPress={onClose}>
              <Text style={styles.genreModalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.genreModalBody} showsVerticalScrollIndicator={false}>
            {requiredGenreData.length > 0 && (
              <View style={styles.genreModalSection}>
                <Text style={styles.genreModalSectionTitle}>Type</Text>
                <View style={styles.genreModalGrid}>
                  {requiredGenreData.map(({ genre, banner, profilePic }) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreModalItem,
                        selectedGenres.includes(genre) && styles.selectedGenreItem
                      ]}
                      onPress={() => onGenreToggle(genre)}
                    >
                      <Image 
                        source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
                        style={styles.genreModalBanner}
                        defaultSource={require('../assets/images/pb.jpg')}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.genreModalBannerOverlay}
                      />
                      <Text style={styles.genreModalIcon}>{getGenreIcon(genre)}</Text>
                      <Text style={styles.genreModalName}>{genre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {regularGenreData.length > 0 && (
              <View style={styles.genreModalSection}>
                <Text style={styles.genreModalSectionTitle}>Genres</Text>
                <View style={styles.genreModalGrid}>
                  {regularGenreData.map(({ genre, banner, profilePic }) => (
                    <TouchableOpacity
                      key={genre}
                      style={[
                        styles.genreModalItem,
                        selectedGenres.includes(genre) && styles.selectedGenreItem
                      ]}
                      onPress={() => onGenreToggle(genre)}
                    >
                      <Image 
                        source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
                        style={styles.genreModalBanner}
                        defaultSource={require('../assets/images/pb.jpg')}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.genreModalBannerOverlay}
                      />
                      <Text style={styles.genreModalIcon}>{getGenreIcon(genre)}</Text>
                      <Text style={styles.genreModalName}>{genre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.genreModalActions}>
            <TouchableOpacity 
              style={styles.genreModalClearBtn}
              onPress={() => {
                selectedGenres.forEach(genre => onGenreToggle(genre));
              }}
            >
              <Text style={styles.genreModalClearText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.genreModalApplyBtn}
              onPress={onClose}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.genreModalApplyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.genreModalApplyText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Liked Posts Item Component (simplified version)
// LikedPostsItem wrapper using PostCard
function LikedPostsItem({ 
  id, 
  author, 
  description, 
  time, 
  title, 
  features, 
  genre, 
  music, 
  comments = [], 
  likes = [], 
  totalViews = 0, 
  totalComments = 0, 
  freeDownload = false,
  onLikeUpdate,
  onCommentUpdate 
}) {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Use centralized audio context
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const handlePlayClick = async () => {
    const cooldownKey = `view_${id}_${currentUser?.userName}`;
    const lastViewTime = await AsyncStorage.getItem(cooldownKey);
    const now = Date.now();
    const oneMinute = 15 * 1000;
    
    let shouldAddView = true;
    if (lastViewTime) {
      const timeSinceLastView = now - parseInt(lastViewTime);
      if (timeSinceLastView < oneMinute) {
        shouldAddView = false;
      }
    }
    
    if (shouldAddView && currentUser) {
      try {
        await addView(id);
        await AsyncStorage.setItem(cooldownKey, now.toString());
      } catch (error) {
        console.error("Error adding view:", error);
      }
    }
    
    // Play track using centralized audio player
    const trackData = {
      id,
      title,
      author,
      music,
      genre,
      features,
      description,
      time
    };
    playTrack(trackData);
  };

  return (
    <PostCard
      id={id}
      author={author}
      description={description}
      time={time}
      title={title}
      features={features}
      genre={genre}
      music={music}
      comments={comments}
      likes={likes}
      totalViews={totalViews}
      totalComments={totalComments}
      freeDownload={freeDownload}
      onLikeUpdate={onLikeUpdate}
      onCommentUpdate={onCommentUpdate}
      currentUser={currentUser}
      variant="default"
      showModal={true}
    />
  );
}


// Profile-style post card for My Posts tab
function ProfilePostCard({ 
  item,
  onAnalyticsPress,
  onPostPress,
  currentUser
}) {
  return (
    <TouchableOpacity 
      key={item.id} 
      style={styles.profilePostCard}
      onPress={() => onPostPress(item)}
      activeOpacity={0.85}
    >
      {/* Post Header with Banner */}
      <View style={styles.profilePostHeader}>
        <Image 
          source={{ 
            uri: item.author?.banner || item.thumbnail || item.coverImage || item.author?.profilePic
          }} 
          style={styles.profilePostBanner}
          defaultSource={require('../assets/images/dpp.jpg')}
        />
        <View style={styles.profilePostBannerOverlay} />
        
        {/* Play Button Overlay - Visual only */}
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
            source={{ uri: item.author?.profilePic || item.author?.profilePic }} 
            style={styles.profilePostAvatar}
            defaultSource={require('../assets/images/dpp.jpg')}
          />
          <View style={styles.profilePostAuthorInfo}>
            <Text style={styles.profilePostAuthorName}>
              {item.author?.userName || 'Unknown'}
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

        {/* Analytics Button - Only show for USERPLUS */}
        {currentUser?.role === 'USERPLUS' && onAnalyticsPress && (
          <TouchableOpacity
            style={styles.profilePostAnalyticsButton}
            onPress={() => onAnalyticsPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.profilePostAnalyticsIcon}>📊</Text>
            <Text style={styles.profilePostAnalyticsText}>Analytics</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Tab Navigation Component
function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'spotlight', label: 'Spotlight', icon: '✨' },
    { id: 'feed', label: 'Feed', icon: '🎵' },
    { id: 'liked', label: 'Liked', icon: '❤️' },
    { id: 'my-posts', label: 'My Posts', icon: '📚' }
  ];

  return (
    <View style={styles.tabContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabItem,
              activeTab === tab.id && styles.activeTabItem
            ]}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabIcon,
              activeTab === tab.id && styles.activeTabIcon
            ]}>
              {tab.icon}
            </Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.id && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && (
              <View style={styles.tabIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Main Feed Component
export function FeedScreen({ skipAuth = false, onSpotlightPress }) {
  const [activeTab, setActiveTab] = useState('spotlight');
  const [posts, setPosts] = useState([]);
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loadedTabs, setLoadedTabs] = useState(new Set()); // Track which tabs have been loaded
  const [isSearchActive, setIsSearchActive] = useState(false); // Track if search is active
  const [searchPage, setSearchPage] = useState(0);
  const [hasMoreSearch, setHasMoreSearch] = useState(false);
  const [searchSort, setSearchSort] = useState('likes'); // Sort by likes or time
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  
  // Pagination state for each section
  const [feedPage, setFeedPage] = useState(0);
  const [spotlightPage, setSpotlightPage] = useState(0);
  const [likedPage, setLikedPage] = useState(0);
  const [myPostsPage, setMyPostsPage] = useState(0);
  
  // Loading states for pagination
  const [isLoadingMoreFeed, setIsLoadingMoreFeed] = useState(false);
  const [isLoadingMoreSpotlight, setIsLoadingMoreSpotlight] = useState(false);
  const [isLoadingMoreLiked, setIsLoadingMoreLiked] = useState(false);
  const [isLoadingMoreMyPosts, setIsLoadingMoreMyPosts] = useState(false);
  
  // Has more data flags
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [hasMoreSpotlight, setHasMoreSpotlight] = useState(true);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const [hasMoreMyPosts, setHasMoreMyPosts] = useState(true);
  
  // Analytics modal state
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
  const [analyticsPost, setAnalyticsPost] = useState(null);
  
  // Post modal state
  const [expandedPost, setExpandedPost] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Only fetch data if the tab hasn't been loaded yet
    if (!loadedTabs.has(activeTab)) {
      if (activeTab === 'feed') {
        fetchPosts();
      } else if (activeTab === 'spotlight') {
        fetchSpotlightPosts();
      } else if (activeTab === 'liked') {
        fetchLikedPosts();
      } else if (activeTab === 'my-posts') {
        fetchMyPosts();
      }
      // Mark this tab as loaded
      setLoadedTabs(prev => new Set([...prev, activeTab]));
    }
  }, [activeTab, user, loadedTabs]);

  // Re-run search when sort changes
  useEffect(() => {
    if (isSearchActive && (searchQuery.trim() || selectedGenres.length > 0)) {
      handleSearch(); // Reset to page 0 when sort changes
    }
  }, [searchSort]);

  const fetchCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    setUser(user);
  };

  const fetchPosts = async (showLoading = true, isLoadMore = false) => {
    if (showLoading && !isLoadMore) setIsLoading(true);
    if (isLoadMore) setIsLoadingMoreFeed(true);
    
    try {
      const currentPage = isLoadMore ? feedPage : 0;
      const response = await api.get(`/posts/get?page=${currentPage}&size=${POSTS_PER_PAGE}`);
      const newPosts = response.data.content || [];
      
      if (isLoadMore) {
        setPosts(prevPosts => {
          // Filter out duplicates based on post ID
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        setFeedPage(prevPage => prevPage + 1);
      } else {
        setPosts(newPosts);
        setFeedPage(1);
      }
      
      // Check if there are more posts
      setHasMoreFeed(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreFeed(false);
    }
  };

  const fetchSpotlightPosts = async (showLoading = true, isLoadMore = false) => {
    if (showLoading && !isLoadMore) setIsLoading(true);
    if (isLoadMore) setIsLoadingMoreSpotlight(true);
    
    try {
      const currentPage = isLoadMore ? spotlightPage : 0;
      const response = await api.get(`/posts/get/likesdesc/role/USERPLUS?page=${currentPage}&size=${POSTS_PER_PAGE}`);
      const newPosts = response.data.content || [];
      
      if (isLoadMore) {
        setSpotlightPosts(prevPosts => {
          // Filter out duplicates based on post ID
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        setSpotlightPage(prevPage => prevPage + 1);
      } else {
        setSpotlightPosts(newPosts);
        setSpotlightPage(1);
      }
      
      // Check if there are more posts
      setHasMoreSpotlight(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching spotlight posts:', error);
      try {
        const currentPage = isLoadMore ? spotlightPage : 0;
        const fallbackResponse = await api.get(`/posts/get/likesdesc?page=${currentPage}&size=${POSTS_PER_PAGE}`);
        const fallbackPosts = fallbackResponse.data.content || [];
        
        if (isLoadMore) {
          setSpotlightPosts(prevPosts => {
            // Filter out duplicates based on post ID
            const existingIds = new Set(prevPosts.map(post => post.id));
            const uniqueNewPosts = fallbackPosts.filter(post => !existingIds.has(post.id));
            return [...prevPosts, ...uniqueNewPosts];
          });
          setSpotlightPage(prevPage => prevPage + 1);
        } else {
          setSpotlightPosts(fallbackPosts);
          setSpotlightPage(1);
        }
        
        setHasMoreSpotlight(fallbackPosts.length === POSTS_PER_PAGE);
      } catch (fallbackError) {
        console.error('Error fetching fallback posts:', fallbackError);
        Alert.alert('Error', 'Failed to load spotlight posts. Please try again.');
      }
    } finally {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreSpotlight(false);
    }
  };

  const fetchLikedPosts = async (showLoading = true, isLoadMore = false) => {
    if (!user || !user.likedPosts || (Array.isArray(user.likedPosts) && user.likedPosts.length === 0)) {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreLiked(false);
      setLikedPosts([]);
      setHasMoreLiked(false);
      return;
    }
    
    if (showLoading && !isLoadMore) setIsLoading(true);
    if (isLoadMore) setIsLoadingMoreLiked(true);
    
    try {
      const currentPage = isLoadMore ? likedPage : 0;
      const endpoint = `/posts/get/all/id/${user.likedPosts}?page=${currentPage}&size=${POSTS_PER_PAGE}`;
      const response = await api.get(endpoint);
      const newPosts = response.data.content || [];
      
      if (isLoadMore) {
        setLikedPosts(prevPosts => {
          // Filter out duplicates based on post ID
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        setLikedPage(prevPage => prevPage + 1);
      } else {
        setLikedPosts(newPosts);
        setLikedPage(1);
      }
      
      // Check if there are more posts
      setHasMoreLiked(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
      setHasMoreLiked(false);
    } finally {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreLiked(false);
    }
  };

  const fetchMyPosts = async (showLoading = true, isLoadMore = false) => {
    if (!user || !user.posts || (Array.isArray(user.posts) && user.posts.length === 0)) {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreMyPosts(false);
      setMyPosts([]);
      setHasMoreMyPosts(false);
      return;
    }
    
    if (showLoading && !isLoadMore) setIsLoading(true);
    if (isLoadMore) setIsLoadingMoreMyPosts(true);
    
    try {
      const currentPage = isLoadMore ? myPostsPage : 0;
      const endpoint = `/posts/get/all/id/${user.posts}/sorted?page=${currentPage}&size=${POSTS_PER_PAGE}`;
      const response = await api.get(endpoint);
      const newPosts = response.data.content || [];
      
      if (isLoadMore) {
        setMyPosts(prevPosts => {
          // Filter out duplicates based on post ID
          const existingIds = new Set(prevPosts.map(post => post.id));
          const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
          return [...prevPosts, ...uniqueNewPosts];
        });
        setMyPostsPage(prevPage => prevPage + 1);
      } else {
        setMyPosts(newPosts);
        setMyPostsPage(1);
      }
      
      // Check if there are more posts
      setHasMoreMyPosts(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setMyPosts([]);
      setHasMoreMyPosts(false);
    } finally {
      if (showLoading && !isLoadMore) setIsLoading(false);
      if (isLoadMore) setIsLoadingMoreMyPosts(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh current user so likedPosts/order is up to date
      await fetchCurrentUser();

      // Reset pagination and lists to force a clean first-page reload
      setFeedPage(0);
      setSpotlightPage(0);
      setLikedPage(0);
      setMyPostsPage(0);
      setHasMoreFeed(true);
      setHasMoreSpotlight(true);
      setHasMoreLiked(true);
      setHasMoreMyPosts(true);
      setPosts([]);
      setSpotlightPosts([]);
      setLikedPosts([]);
      setMyPosts([]);

      if (activeTab === 'feed') {
        await fetchPosts(false);
      } else if (activeTab === 'spotlight') {
        await fetchSpotlightPosts(false);
      } else if (activeTab === 'liked') {
        await fetchLikedPosts(false);
      } else if (activeTab === 'my-posts') {
        await fetchMyPosts(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear search when switching tabs
    setIsSearchActive(false);
    setSearchPage(0);
    setHasMoreSearch(false);
    setSearchTotalPages(0);
    // Reset pagination for all tabs
    setFeedPage(0);
    setSpotlightPage(0);
    setLikedPage(0);
    setMyPostsPage(0);
    setHasMoreFeed(true);
    setHasMoreSpotlight(true);
    setHasMoreLiked(true);
    setHasMoreMyPosts(true);
  };

  const handleDeletePost = (postId) => {
    setMyPosts(prev => prev.filter(post => post.id !== postId));
  };

  const loadMorePosts = () => {
    // Don't load more automatically for search - use page buttons instead
    if (isSearchActive) {
      return;
    }
    
    if (activeTab === 'feed' && hasMoreFeed && !isLoadingMoreFeed) {
      fetchPosts(false, true);
    } else if (activeTab === 'spotlight' && hasMoreSpotlight && !isLoadingMoreSpotlight) {
      fetchSpotlightPosts(false, true);
    } else if (activeTab === 'liked' && hasMoreLiked && !isLoadingMoreLiked) {
      fetchLikedPosts(false, true);
    } else if (activeTab === 'my-posts' && hasMoreMyPosts && !isLoadingMoreMyPosts) {
      fetchMyPosts(false, true);
    }
  };

  const getCurrentLoadingMore = () => {
    // Search now uses buttons, not infinite scroll, so no loading state needed
    if (isSearchActive) return false;
    
    switch (activeTab) {
      case 'feed': return isLoadingMoreFeed;
      case 'spotlight': return isLoadingMoreSpotlight;
      case 'liked': return isLoadingMoreLiked;
      case 'my-posts': return isLoadingMoreMyPosts;
      default: return false;
    }
  };

  const getCurrentHasMore = () => {
    // Return search pagination when search is active
    if (isSearchActive) {
      return hasMoreSearch;
    }
    
    switch (activeTab) {
      case 'feed': return hasMoreFeed;
      case 'spotlight': return hasMoreSpotlight;
      case 'liked': return hasMoreLiked;
      case 'my-posts': return hasMoreMyPosts;
      default: return false;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedGenres.length === 0) {
      setIsSearchActive(false);
      setSearchPage(0);
      setHasMoreSearch(false);
      setSearchTotalPages(0);
      fetchPosts();
      return;
    }
    
    setIsLoading(true);
    setIsSearchActive(true);
    
    try {
      const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : "";
      const searchParam = searchQuery.trim() || "";
      
      const response = await api.get(
        `/posts/get/advanced-search?page=0&size=${POSTS_PER_PAGE}&search=${searchParam}&genres=${genreParam}&sortBy=${searchSort}`
      );
      const newPosts = response.data.content || [];
      console.log('Search response:', {
        requestedPage: 0,
        requestedSize: POSTS_PER_PAGE,
        receivedCount: newPosts.length,
        totalPages: response.data.page?.totalPages,
        totalElements: response.data.page?.totalElements
      });
      
      setPosts(newPosts);
      setSearchPage(0);
      setSearchTotalPages(response.data.page?.totalPages || 0);
      
      // Check if there are more posts
      setHasMoreSearch((response.data.page?.totalPages || 0) > 1);
    } catch (error) {
      console.error('Error searching posts:', error);
      Alert.alert('Error', 'Failed to search posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchPage = async (page) => {
    if (!isSearchActive || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : "";
      const searchParam = searchQuery.trim() || "";
      
      const response = await api.get(
        `/posts/get/advanced-search?page=${page}&size=${POSTS_PER_PAGE}&search=${searchParam}&genres=${genreParam}&sortBy=${searchSort}`
      );
      const newPosts = response.data.content || [];
      
      setPosts(newPosts);
      setSearchPage(page);
    } catch (error) {
      console.error('Error loading search page:', error);
      Alert.alert('Error', 'Failed to load page. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedGenres([]);
    setIsSearchActive(false);
    setSearchPage(0);
    setHasMoreSearch(false);
    setSearchTotalPages(0);
    setSearchSort('likes'); // Reset sort to default
    fetchPosts();
  };

  // Extract unique genres and their first post's banner/profilePic
  const genreData = Array.from(
    new Map(
      posts
        .flatMap((p) => (Array.isArray(p.genre) ? p.genre : [p.genre]).filter(Boolean).map((g) => [g, p]))
    ).entries()
  ).map(([genre, post]) => ({
    genre,
    banner: post.author?.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80",
    profilePic: post.author?.profilePic || "https://randomuser.me/api/portraits/men/32.jpg"
  }));

  const renderFeedItem = ({ item }) => (
    <FeedItem
      key={item.id}
      {...item}
      onLikeUpdate={(likes) => {
        setPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, likes } : post
        ));
      }}
      onCommentUpdate={(comments) => {
        setPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, comments } : post
        ));
      }}
      onDeletePost={(postId) => setPosts(prev => prev.filter(post => post.id !== postId))}
    />
  );

  const renderSpotlightItem = ({ item }) => (
    <SpotlightCard
      key={item.id}
      {...item}
      onLikeUpdate={(likes) => {
        setSpotlightPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, likes } : post
        ));
      }}
      onCommentUpdate={(comments) => {
        setSpotlightPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, comments } : post
        ));
      }}
      onSpotlightPress={onSpotlightPress}
      onDeletePost={(postId) => setSpotlightPosts(prev => prev.filter(post => post.id !== postId))}
    />
  );

  const renderLikedPostItem = ({ item }) => (
    <LikedPostsItem
      key={item.id}
      {...item}
      onLikeUpdate={(likes) => {
        setLikedPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, likes } : post
        ));
      }}
      onCommentUpdate={(comments) => {
        setLikedPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, comments } : post
        ));
      }}
    />
  );

  const openPostModal = (post) => {
    setExpandedPost(post);
    setIsModalVisible(true);
  };

  const closePostModal = () => {
    setIsModalVisible(false);
    setExpandedPost(null);
  };

  const handlePostUpdate = (updatedPost) => {
    if (!updatedPost) {
      // Post was deleted
      setMyPosts(prev => prev.filter(p => p.id !== expandedPost?.id));
      closePostModal();
      return;
    }
    
    // Update the post in the list
    setMyPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
    
    // Update expanded post if it's the same
    if (expandedPost && expandedPost.id === updatedPost.id) {
      setExpandedPost(updatedPost);
    }
  };

  const renderMyPostItem = ({ item }) => (
    <ProfilePostCard
      item={item}
      currentUser={user}
      onPostPress={openPostModal}
      onAnalyticsPress={(post) => {
        setAnalyticsPost(post);
        setShowViewsAnalytics(true);
      }}
    />
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'feed':
        return posts;
      case 'spotlight':
        return spotlightPosts;
      case 'liked':
        return likedPosts;
      case 'my-posts':
        return myPosts;
      default:
        return posts;
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'feed':
        return renderFeedItem;
      case 'spotlight':
        return renderSpotlightItem;
      case 'liked':
        return renderLikedPostItem;
      case 'my-posts':
        return renderMyPostItem;
      default:
        return renderFeedItem;
    }
  };

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case 'feed':
        return {
          icon: '🎵',
          title: 'No posts found',
          text: searchQuery.trim() || selectedGenres.length > 0 
            ? "Try adjusting your search terms or filters"
            : "Be the first to share some music!",
          showClearButton: searchQuery.trim() || selectedGenres.length > 0
        };
      case 'spotlight':
        return {
          icon: '✨',
          title: 'No Premium Content',
          text: 'No premium posts available at the moment. Check back later for exclusive content!',
          showClearButton: false
        };
      case 'liked':
        return {
          icon: '💔',
          title: 'No Liked Posts',
          text: "You haven't liked any posts yet. Start exploring and like posts you enjoy!",
          showClearButton: false
        };
      case 'my-posts':
        return {
          icon: '📝',
          title: 'No Posts Yet',
          text: "You haven't created any posts yet. Start sharing your music!",
          showClearButton: false
        };
      default:
        return {
          icon: '🎵',
          title: 'No posts found',
          text: 'Be the first to share some music!',
          showClearButton: false
        };
    }
  };

  const emptyStateContent = getEmptyStateContent();

  const feedContent = (
    <View style={styles.container}>
        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Search and Filter Section - Only show for Feed tab */}
        {activeTab === 'feed' && (
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search tracks, artists, genres..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.searchClear}
                    onPress={() => setSearchQuery("")}
                  >
                    <Text style={styles.searchClearText}>×</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={handleSearch}
                >
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterContainer}>
                <TouchableOpacity 
                  style={styles.genreFilter}
                  onPress={() => setIsGenreModalOpen(true)}
                >
                  <Text style={styles.genreFilterText}>
                    {selectedGenres.length === 0 ? (
                      "All Genres"
                    ) : selectedGenres.length === 1 ? (
                      `${getGenreIcon(selectedGenres[0])} ${selectedGenres[0]}`
                    ) : selectedGenres.length <= 3 ? (
                      selectedGenres.map(genre => `${getGenreIcon(genre)} ${genre}`).join(', ')
                    ) : (
                      `${selectedGenres.slice(0, 2).map(genre => `${getGenreIcon(genre)} ${genre}`).join(', ')} +${selectedGenres.length - 2} more`
                    )}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sortFilter}
                  onPress={() => setSearchSort(searchSort === 'likes' ? 'time' : 'likes')}
                >
                  <Text style={styles.sortFilterText}>
                    {searchSort === 'likes' ? '🔥 Popular' : '🕐 Newest'}
                  </Text>
                </TouchableOpacity>

                {(searchQuery.trim() || selectedGenres.length > 0) && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={clearSearch}
                  >
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Posts List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : (
          <FlatList
            data={getCurrentData()}
            renderItem={getCurrentRenderItem()}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            contentContainerStyle={styles.postsList}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#667eea"
                colors={['#667eea']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>{emptyStateContent.icon}</Text>
                <Text style={styles.emptyTitle}>{emptyStateContent.title}</Text>
                <Text style={styles.emptyText}>{emptyStateContent.text}</Text>
                {emptyStateContent.showClearButton && (
                  <TouchableOpacity 
                    style={styles.emptyActionButton}
                    onPress={clearSearch}
                  >
                    <Text style={styles.emptyActionText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              <>
                {!isSearchActive && getCurrentHasMore() && (
                  <View style={styles.loadMoreContainer}>
                    {getCurrentLoadingMore() && (
                      <>
                        <ActivityIndicator size="small" color="#667eea" />
                        <Text style={styles.loadMoreText}>Loading more posts...</Text>
                      </>
                    )}
                  </View>
                )}
                {isSearchActive && searchTotalPages > 0 && (
                  <View style={styles.searchPaginationContainer}>
                    <TouchableOpacity 
                      style={[styles.searchPageButton, searchPage === 0 && styles.searchPageButtonDisabled]}
                      onPress={() => searchPage > 0 && loadSearchPage(searchPage - 1)}
                      disabled={searchPage === 0 || isLoading}
                    >
                      <Text style={[styles.searchPageButtonText, searchPage === 0 && styles.searchPageButtonTextDisabled]}>
                        ← Previous
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.searchPageInfo}>
                      Page {searchPage + 1} of {searchTotalPages}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.searchPageButton, searchPage >= searchTotalPages - 1 && styles.searchPageButtonDisabled]}
                      onPress={() => searchPage < searchTotalPages - 1 && loadSearchPage(searchPage + 1)}
                      disabled={searchPage >= searchTotalPages - 1 || isLoading}
                    >
                      <Text style={[styles.searchPageButtonText, searchPage >= searchTotalPages - 1 && styles.searchPageButtonTextDisabled]}>
                        Next →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            }
          />
        )}

        {/* Genre Filter Modal - Only show for Feed tab */}
        {activeTab === 'feed' && (
          <GenreFilterModal
            isOpen={isGenreModalOpen}
            onClose={() => setIsGenreModalOpen(false)}
            genreData={genreData}
            selectedGenres={selectedGenres}
            onGenreToggle={handleGenreToggle}
          />
        )}

        {/* Post Card Modal */}
        <PostCardModal
          visible={isModalVisible}
          onClose={closePostModal}
          post={expandedPost}
          currentUser={user}
          onPostUpdate={handlePostUpdate}
          showDelete={true}
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
            currentUser={user}
            postAuthor={analyticsPost.author || user}
            totalDownloads={analyticsPost.totalDownloads || 0}
            totalViews={analyticsPost.totalViews || 0}
            totalComments={analyticsPost.totalComments || 0}
          />
        )}
      </View>
  );

  // Conditionally wrap with AuthGuard
  if (skipAuth) {
    return feedContent;
  } else {
    return <AuthGuard>{feedContent}</AuthGuard>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  // Tab Navigation
  tabContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  activeTabItem: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.7,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabLabel: {
    color: '#667eea',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 2,
    backgroundColor: '#667eea',
    borderRadius: 1,
  },
  

  // Search Section
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  searchClear: {
    padding: 4,
    marginRight: 8,
  },
  searchClearText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreFilterText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  dropdownArrow: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  sortFilter: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  sortFilterText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  clearButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },

  // Load More
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  loadMoreText: {
    color: '#667eea',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },

  // Posts List
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(120, 119, 198, 0.3)',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  time: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  modalMainContent: {
    paddingBottom: 20,
  },
  modalProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  modalProfileInfo: {
    flex: 1,
  },
  modalUsername: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  modalDescription: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalFeatures: {
    marginBottom: 16,
  },
  modalFeaturesLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFeatureTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  modalFeatureText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '500',
  },
  modalGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  modalGenreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalGenreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
    flex: 1,
  },
  modalStatIcon: {
    fontSize: 20,
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
    fontSize: 12,
  },

  // Comments Section
  commentsSection: {
    marginTop: 20,
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  commentButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  commentButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Action Buttons
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: 8,
  },

  // Genre Modal
  genreModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  genreModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  genreModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  genreModalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  genreModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreModalCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  genreModalBody: {
    maxHeight: 400,
  },
  genreModalSection: {
    marginBottom: 24,
  },
  genreModalSectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  genreModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreModalItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGenreItem: {
    borderColor: '#667eea',
  },
  genreModalBanner: {
    width: '100%',
    height: '100%',
  },
  genreModalBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  genreModalIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 16,
  },
  genreModalName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  genreModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  genreModalClearBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    alignItems: 'center',
  },
  genreModalClearText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '600',
  },
  genreModalApplyBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  genreModalApplyGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  genreModalApplyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Profile Modal Styles - Copied from main-app.jsx
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
    paddingTop: 20
  },

  // Profile Post Card Styles (from main-app.jsx)
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
    marginHorizontal: 16,
  },
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
  searchPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchPageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  searchPageButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  searchPageButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  searchPageButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  searchPageInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});

// Export FeedScreen as default for direct usage
export default FeedScreen;
