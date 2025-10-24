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
import api from '../services/api';
import { 
  listPosts, 
  addView, 
  addLike, 
  getLikesSummary, 
  addComment, 
  getCommentsPaginated, 
  deletePost,
  getPostById 
} from '../services/postsService';
import { UserRelationsService, clearMyNotifications } from '../services/userService';
import DemoService from '../services/DemoService';
import LoggedInHeader from '../components/ui/LoggedInHeader';
import { getCurrentUser } from '../services/api';
import AuthGuard from '../components/AuthGuard';
import BottomNavigation from '../components/BottomNavigation';

// Import the existing feed components
import { FeedScreen } from './feed';

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

// Completely Redesigned Homepage Tab Component
function HomepageTab({ user, relationshipSummary, latestPost, onShowFollow, onShowActivity, onShowLatest }) {
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* Modern Header Card */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
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
              <TouchableOpacity style={styles.statItem} onPress={() => onShowFollow('following')}>
                <Text style={styles.statNumber}>{relationshipSummary?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.posts?.length || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
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
              {user.notifications.slice(0, 3).map((notification, index) => (
                <View key={notification.id || index} style={styles.activityItem}>
                  <View style={styles.activityIndicator} />
                  <Text style={styles.activityText}>
                    {notification.noti || notification.message || notification.text || 'Notification'}
                  </Text>
                </View>
              ))}
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
                <Text style={styles.spotlightTitle}>{latestPost.title}</Text>
                <Text style={styles.spotlightDate}>
                  {new Date(latestPost.time).toLocaleDateString()}
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
            <View style={styles.trendingIcon}>🎵</View>
            <Text style={styles.trendingText}>Hip Hop</Text>
          </View>
          <View style={styles.trendingItem}>
            <View style={styles.trendingIcon}>🎤</View>
            <Text style={styles.trendingText}>R&B</Text>
          </View>
          <View style={styles.trendingItem}>
            <View style={styles.trendingIcon}>🎸</View>
            <Text style={styles.trendingText}>Rock</Text>
          </View>
          <View style={styles.trendingItem}>
            <View style={styles.trendingIcon}>🎹</View>
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
function ProfileTab({ user, relationshipSummary }) {
  const [activeContentTab, setActiveContentTab] = useState('demos');
  const [userPosts, setUserPosts] = useState([]);
  const [userDemos, setUserDemos] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingDemos, setIsLoadingDemos] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  
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
  
  // Comment and like state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likes, setLikes] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);

  useEffect(() => {
    if (user) {
      // Reset pagination when switching tabs
      setPostsPage(0);
      setFeaturedPage(0);
      setUserPosts([]);
      setUserDemos([]);
      setFeaturedPosts([]);
      setHasMorePosts(true);
      setHasMoreFeatured(true);
      fetchContent();
    }
  }, [user, activeContentTab]);

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
      const postsPerPage = 12;
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
    openModal(item);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setExpandedPost(null);
    setComments([]);
    setNewComment('');
    setLikes([]);
    setIsLiked(false);
  };

  const openModal = (post) => {
    setExpandedPost(post);
    setIsModalVisible(true);
    // Initialize comments and likes from post data
    setComments(post.comments || []);
    setLikes(post.likes || []);
    setIsLiked(post.likes?.some(like => like.userName === user?.userName) || false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !expandedPost || !user) return;
    
    setIsSubmittingComment(true);
    try {
      // Simulate API call - replace with actual API call
      const comment = {
        id: Date.now(),
        userName: user.userName,
        userPic: user.profilePic,
        text: newComment.trim(),
        time: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleLike = async () => {
    if (!expandedPost || !user || isSubmittingLike) return;
    
    setIsSubmittingLike(true);
    try {
      // Simulate API call - replace with actual API call
      if (isLiked) {
        setLikes(prev => prev.filter(like => like.userName !== user.userName));
      } else {
        const like = {
          userName: user.userName,
          userPic: user.profilePic,
          time: new Date().toISOString(),
        };
        setLikes(prev => [...prev, like]);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const loadMoreContent = () => {
    if (activeContentTab === 'posts' && hasMorePosts && !isLoadingMorePosts) {
      fetchUserPosts(false);
    } else if (activeContentTab === 'featured' && hasMoreFeatured && !isLoadingMoreFeatured) {
      fetchFeaturedPosts(false);
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
        onPress: () => router.push('/create-post') // You can change this to a demo creation route
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
        {content.map((item, index) => (
          activeContentTab === 'demos' ? (
            <TouchableOpacity 
              key={item.id || index} 
              style={styles.demoCard}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.8}
            >
              {/* Enhanced Demo Card with Gradient */}
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.demoCardHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.demoPlayOverlay}>
                  <View style={styles.demoPlayButton}>
                    <Text style={styles.demoPlayIcon}>▶️</Text>
                  </View>
                </View>
                
                {/* Subtle pattern overlay */}
                <View style={styles.demoPatternOverlay} />
              </LinearGradient>
              
              <View style={styles.demoCardContent}>
                <Text style={styles.demoTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.demoCardFooter}>
                  <Text style={styles.demoLabel}>Demo</Text>
                  <View style={styles.demoDot} />
                </View>
              </View>
            </TouchableOpacity>
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
                
                {/* Play Button Overlay */}
                <TouchableOpacity 
                  style={styles.profilePostPlayOverlay}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Handle play functionality
                  }}
                >
                  <Text style={styles.profilePostPlayIcon}>▶</Text>
                </TouchableOpacity>

                {/* Premium Badge */}
                {item.author?.role === 'USERPLUS' && (
                  <View style={styles.profilePostPremiumBadge}>
                    <Text style={styles.profilePostPremiumIcon}>✨</Text>
                    <Text style={styles.profilePostPremiumText}>Premium</Text>
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
                        <Text key={idx} style={styles.profilePostFeatureLink}>
                          {feature}
                        </Text>
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
      <ScrollView style={styles.profileScrollView} showsVerticalScrollIndicator={false}>
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
                <TouchableOpacity style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>{relationshipSummary?.followersCount || 0}</Text>
                  <Text style={styles.profileStatLabel}>Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileStatItem}>
                  <Text style={styles.profileStatNumber}>{relationshipSummary?.followingCount || 0}</Text>
                  <Text style={styles.profileStatLabel}>Following</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.profileActionsContainer}>
                <TouchableOpacity 
                  style={styles.profileEditBtn}
                  onPress={() => router.push('/profile/edit')}
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

        {/* Content Grid */}
        {renderContentGrid()}
      </ScrollView>

      {/* Full-Screen Post Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            {expandedPost && (
              <>
                {/* Modal Close Button */}
                <TouchableOpacity 
                  style={styles.profileModalCloseBtn}
                  onPress={closeModal}
                >
                  <Text style={styles.profileModalCloseIcon}>✕</Text>
                </TouchableOpacity>

                {/* Hero Section with Banner */}
                <View style={styles.profileModalHero}>
                  <Image 
                    source={{ 
                      uri: expandedPost.banner || expandedPost.thumbnail || expandedPost.coverImage || user.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"
                    }} 
                    style={styles.profileModalBanner}
                    defaultSource={require('../assets/images/pb.jpg')}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.profileModalGradientOverlay}
                  />
                  <View style={styles.profileModalHeroContent}>
                    <Text style={styles.profileModalHeroTitle}>{expandedPost.title}</Text>
                    
                    {/* Profile Info in Hero */}
                    <View style={styles.profileModalHeroProfile}>
                      <Image 
                        source={{ uri: expandedPost.author?.profilePic || user.profilePic }} 
                        style={styles.profileModalHeroAvatar}
                        defaultSource={require('../assets/images/dpp.jpg')}
                      />
                      <View style={styles.profileModalHeroProfileInfo}>
                        <Text style={styles.profileModalHeroUsername}>
                          {expandedPost.author?.userName || user.userName}
                        </Text>
                        <Text style={styles.profileModalHeroDate}>
                          {new Date(expandedPost.time).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Play Button in Hero */}
                  <TouchableOpacity style={styles.profileModalHeroPlayBtn}>
                    <Text style={styles.profileModalHeroPlayIcon}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Modal Content */}
                <ScrollView style={styles.profileModalScrollView} showsVerticalScrollIndicator={false}>

                  {/* Description */}
                  {expandedPost.description && (
                    <View style={styles.profileModalDescriptionContainer}>
                      <Text style={styles.profileModalDescription}>{expandedPost.description}</Text>
                    </View>
                  )}

                  {/* Features */}
                  {expandedPost.features && Array.isArray(expandedPost.features) && expandedPost.features.length > 0 && (
                    <View style={styles.profileModalFeaturesContainer}>
                      <Text style={styles.profileModalFeaturesLabel}>Featuring:</Text>
                      <View style={styles.profileModalFeaturesList}>
                        {expandedPost.features.map((feature, index) => (
                          <Text key={index} style={styles.profileModalFeatureTag}>
                            {feature}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  {/* Genre Tags */}
                  {expandedPost.genre && Array.isArray(expandedPost.genre) && expandedPost.genre.length > 0 && (
                    <View style={styles.profileModalGenresContainer}>
                      {expandedPost.genre.map((genreItem, index) => (
                        <View key={index} style={styles.profileModalGenreTag}>
                          <Text style={styles.profileModalGenreTagText}>{genreItem}</Text>
                        </View>
                      ))}
                    </View>
                  )}


                  {/* Comments Section */}
                  <View style={styles.profileModalCommentsContainer}>
                    <Text style={styles.profileModalCommentsTitle}>Comments ({comments.length})</Text>
                    
                    {/* Comments List */}
                    <ScrollView 
                      style={styles.profileModalCommentsList}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {comments.map((comment) => (
                        <View key={comment.id} style={styles.profileModalCommentItem}>
                          <Image 
                            source={{ uri: comment.userPic || user.profilePic }} 
                            style={styles.profileModalCommentAvatar}
                            defaultSource={require('../assets/images/dpp.jpg')}
                          />
                          <View style={styles.profileModalCommentContent}>
                            <View style={styles.profileModalCommentHeader}>
                              <Text style={styles.profileModalCommentUsername}>{comment.userName}</Text>
                              <Text style={styles.profileModalCommentTime}>
                                {new Date(comment.time).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>
                            <Text style={styles.profileModalCommentText}>{comment.text}</Text>
                          </View>
                        </View>
                      ))}
                      
                      {comments.length === 0 && (
                        <View style={styles.profileModalNoComments}>
                          <Text style={styles.profileModalNoCommentsText}>No comments yet</Text>
                          <Text style={styles.profileModalNoCommentsSubtext}>Be the first to comment!</Text>
                        </View>
                      )}
                    </ScrollView>

                    {/* Comment Input */}
                    <View style={styles.profileModalCommentInputContainer}>
                      <Image 
                        source={{ uri: user?.profilePic }} 
                        style={styles.profileModalCommentInputAvatar}
                        defaultSource={require('../assets/images/dpp.jpg')}
                      />
                      <TextInput
                        style={styles.profileModalCommentInput}
                        placeholder="Add a comment..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={newComment}
                        onChangeText={setNewComment}
                        multiline
                        maxLength={500}
                      />
                      <TouchableOpacity 
                        style={[styles.profileModalCommentSubmitBtn, !newComment.trim() && styles.profileModalCommentSubmitBtnDisabled]}
                        onPress={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                      >
                        <Text style={styles.profileModalCommentSubmitText}>
                          {isSubmittingComment ? '...' : 'Post'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.profileModalActionsContainer}>
                    <TouchableOpacity style={styles.profileModalActionBtnPrimary}>
                      <Text style={styles.profileModalActionTextPrimary}>View Full Post</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.profileModalActionBtnSecondary}>
                      <Text style={styles.profileModalActionTextSecondary}>View Profile</Text>
                    </TouchableOpacity>
                    
                    {expandedPost.freeDownload && (
                      <TouchableOpacity style={styles.profileModalActionBtnSecondary}>
                        <Text style={styles.profileModalActionTextSecondary}>⬇️ Download</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>

                {/* Floating Stats */}
                <View style={styles.profileModalFloatingStats}>
                  <TouchableOpacity 
                    style={styles.profileModalFloatingLikeBtn}
                    onPress={handleToggleLike}
                    disabled={isSubmittingLike}
                  >
                    <Text style={styles.profileModalFloatingLikeIcon}>
                      {isLiked ? '❤️' : '🤍'}
                    </Text>
                    <Text style={styles.profileModalFloatingCount}>{likes.length}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.profileModalFloatingViewBtn}>
                    <Text style={styles.profileModalFloatingViewIcon}>👁️</Text>
                    <Text style={styles.profileModalFloatingCount}>{expandedPost.totalViews || 0}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

// Main App Component
export default function MainApp({ initialTab = 'spotlight' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestPost, setLatestPost] = useState(null);
  const [showFollow, setShowFollow] = useState(false);
  const [followPopupType, setFollowPopupType] = useState('followers');
  const [relationshipSummary, setRelationshipSummary] = useState(null);
  const [latestModalOpen, setLatestModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState(new Set(['spotlight'])); // Track which tabs have been loaded

  useEffect(() => {
    fetchData();
  }, []);

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
  };

  const handleClearAllNotifications = async () => {
    try {
      await clearMyNotifications();
      setUser(prev => prev ? { ...prev, notifications: [] } : prev);
    } catch (err) {
      console.error('Failed to clear notifications', err);
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
              setFollowPopupType(type);
              setShowFollow(true);
            }}
            onShowActivity={() => setActivityModalOpen(true)}
            onShowLatest={() => setLatestModalOpen(true)}
          />
        </View>
        
        <View style={[styles.tabContent, activeTab !== 'feed' && styles.hiddenTab]}>
          <FeedScreen skipAuth={true} />
        </View>
        
        <View style={[styles.tabContent, activeTab !== 'profile' && styles.hiddenTab]}>
          <ProfileTab user={user} relationshipSummary={relationshipSummary} />
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
                      onPress={() => router.push(`/post/${latestPost.id}`)}
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
                  <View style={styles.activityModalList}>
                    {user.notifications.map((notification, index) => (
                      <View key={notification.id || index} style={styles.activityModalItem}>
                        <View style={styles.activityModalDot} />
                        <Text style={styles.activityModalText}>
                          {notification.noti || notification.message || notification.text || 'Notification'}
                        </Text>
                      </View>
                    ))}
                  </View>
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

        {/* Follow/Following Modal */}
        <Modal
          visible={showFollow}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFollow(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {followPopupType === 'followers' ? 'Followers' : 'Following'}
                </Text>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setShowFollow(false)}
                >
                  <Text style={styles.modalCloseText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.followModalContent}>
                <Text style={styles.followModalEmoji}>👥</Text>
                <Text style={styles.followModalText}>
                  {followPopupType === 'followers' ? 'Followers' : 'Following'} list coming soon...
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
    marginTop: 10,
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
  profileContentTabs: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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

  // Demo Grid Container
  demoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop:20
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
    fontWeight: '700',
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

  // Compact Demo Card Styles - Optimized for 3-6 cards
  demoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    width: '48%', // Two columns for demos
  },
  demoCardHeader: {
    position: 'relative',
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  demoPlayIcon: {
    fontSize: 18,
    marginLeft: 2,
  },
  demoPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.3,
  },
  demoCardContent: {
    padding: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'space-between',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  demoCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  demoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  demoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#667eea',
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
  },
  headerContent: {
    alignItems: 'center',
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
  },
  welcomeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingVertical: 8,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 12,
  },
  activityText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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
    maxHeight: 300,
    marginBottom: 20,
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
  activityModalText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
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
});
