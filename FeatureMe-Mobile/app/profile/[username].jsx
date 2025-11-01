import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';
import { getPostById, trackDownload, deletePost } from '../../services/postsService';
import DemoService from '../../services/DemoService';
import { UserRelationsService, getCurrentUser } from '../../services/userService';
import LoggedInHeader from '../../components/ui/LoggedInHeader';
import AuthGuard from '../../components/AuthGuard';
import BottomNavigation from '../../components/BottomNavigation';
import FollowersModal from '../../components/FollowersModal';

// Genre to icon mapping (same as main-app.jsx)
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

function getGenreIcon(genre) {
  if (!genre) return GENRE_ICONS.Default;
  const lower = String(genre).toLowerCase();
  if (lower === 'hiphop' || lower === 'hip-hop') return GENRE_ICONS['Hip Hop'];
  if (lower === 'r&b' || lower === 'rnb') return GENRE_ICONS['R&B'];
  if (lower === 'afrobeats') return GENRE_ICONS['Afrobeat'];
  return GENRE_ICONS[genre] || GENRE_ICONS[genre?.trim()] || GENRE_ICONS.Default;
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [relationshipSummary, setRelationshipSummary] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [userDemos, setUserDemos] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Followers/Following modal state
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followModalType, setFollowModalType] = useState('followers');
  
  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  useEffect(() => {
    if (user) {
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

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch user data by username and current user
      const [userResponse, currentUserData] = await Promise.all([
        api.get(`/user/get/${username}`),
        getCurrentUser()
      ]);
      
      setUser(userResponse.data);
      setCurrentUser(currentUserData);
      
      // Get relationship summary and follow status
      try {
        const isOwnProfile = currentUserData?.userName === username;
        
        if (isOwnProfile) {
          // For own profile, just get summary
          const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
          setRelationshipSummary(relationshipResponse.data);
          setIsFollowing(false);
        } else {
          // For other profiles, get both summary and follow status
          const [relationshipResponse, followResponse] = await Promise.all([
            UserRelationsService.getRelationshipSummary(username),
            UserRelationsService.isFollowing(username)
          ]);
          setRelationshipSummary(relationshipResponse.data);
          setIsFollowing(followResponse.data);
        }
      } catch (err) {
        console.error('Failed to fetch relationship data:', err);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContent = async () => {
    if (activeContentTab === 'posts') {
      await fetchUserPosts(true);
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
      const demos = await DemoService.getAllUserDemos(user.id);
      setUserDemos(demos || []);
    } catch (err) {
      console.error('Failed to fetch user demos:', err);
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

  const handleDownload = async () => {
    if (!expandedPost || !expandedPost.freeDownload || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const fileName = `${expandedPost.title} - ${expandedPost.author?.userName || 'Unknown'}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(expandedPost.music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          const userName = currentUser?.userName || 'unknown';
          await trackDownload(expandedPost.id, userName);
          console.log('Download tracked for:', expandedPost.title);
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

  const handleDeletePost = async () => {
    if (!expandedPost || !currentUser || isDeletingPost) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingPost(true);
            try {
              await deletePost(expandedPost.id);
              closeModal();
              // Remove post from userPosts list
              setUserPosts(prev => prev.filter(post => post.id !== expandedPost.id));
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setIsDeletingPost(false);
            }
          }
        }
      ]
    );
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setExpandedPost(null);
    setComments([]);
    setNewComment('');
    setLikes([]);
    setIsDownloading(false);
    setIsLiked(false);
  };

  const openModal = (post) => {
    setExpandedPost(post);
    setIsModalVisible(true);
    setComments(post.comments || []);
    setLikes(post.likes || []);
    setIsLiked(post.likes?.some(like => like.userName === user?.userName) || false);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !expandedPost || !user) return;
    
    setIsSubmittingComment(true);
    try {
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

  const handleFollowToggle = async () => {
    if (!currentUser || !user || currentUser.userName === username) return;
    
    try {
      await UserRelationsService.toggleFollow(username);
      setIsFollowing(!isFollowing);
      
      // Update relationship summary to reflect new follower count
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
      setRelationshipSummary(relationshipResponse.data);
      
      Alert.alert(
        'Success', 
        isFollowing ? `You unfollowed ${username}` : `You are now following ${username}`
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
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
      
      // Fetch fresh user data and relationship data
      const [userResponse, currentUserData] = await Promise.all([
        api.get(`/user/get/${username}`),
        getCurrentUser()
      ]);
      
      setUser(userResponse.data);
      setCurrentUser(currentUserData);
      
      // Refresh relationship data
      try {
        const isOwnProfile = currentUserData?.userName === username;
        
        if (isOwnProfile) {
          // For own profile, just get summary
          const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
          setRelationshipSummary(relationshipResponse.data);
          setIsFollowing(false);
        } else {
          // For other profiles, get both summary and follow status
          const [relationshipResponse, followResponse] = await Promise.all([
            UserRelationsService.getRelationshipSummary(username),
            UserRelationsService.isFollowing(username)
          ]);
          setRelationshipSummary(relationshipResponse.data);
          setIsFollowing(followResponse.data);
        }
      } catch (err) {
        console.error('Failed to fetch relationship data during refresh:', err);
      }
      
      // Fetch fresh content
      await fetchContent();
    } catch (error) {
      console.error('Error refreshing profile:', error);
    } finally {
      setIsRefreshing(false);
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
        subtitle: 'This user hasn\'t posted anything yet',
      };
    } else if (activeContentTab === 'demos') {
      content = userDemos;
      hasMore = false;
      isLoadingMore = false;
      emptyStateConfig = {
        icon: '🎤',
        title: 'No demos yet',
        subtitle: 'This user hasn\'t uploaded any demos',
      };
    } else if (activeContentTab === 'featured') {
      content = featuredPosts;
      hasMore = hasMoreFeatured;
      isLoadingMore = isLoadingMoreFeatured;
      emptyStateConfig = {
        icon: '⭐',
        title: 'No features yet',
        subtitle: 'This user hasn\'t been featured on any posts',
      };
    }

    if (content.length === 0) {
      return (
        <View style={styles.profileEmptyState}>
          <Text style={styles.profileEmptyIcon}>{emptyStateConfig.icon}</Text>
          <Text style={styles.profileEmptyTitle}>{emptyStateConfig.title}</Text>
          <Text style={styles.profileEmptySubtitle}>{emptyStateConfig.subtitle}</Text>
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
              <View style={styles.profilePostHeader}>
                <Image 
                  source={{ 
                    uri: item.author?.banner || item.thumbnail || item.coverImage || user.banner || user.profilePic
                  }} 
                  style={styles.profilePostBanner}
                  defaultSource={require('../../assets/images/dpp.jpg')}
                />
                <View style={styles.profilePostBannerOverlay} />
                
                {/* Play Button Overlay - Visual only, clicking opens modal */}
                <View style={styles.profilePostPlayOverlay}>
                  <Text style={styles.profilePostPlayIcon}>▶</Text>
                </View>

                {item.author?.role === 'USERPLUS' && (
                  <View style={styles.profilePostPremiumBadge}>
                    <Text style={styles.profilePostPremiumIcon}>✨</Text>
                    <Text style={styles.profilePostPremiumText}>Premium</Text>
                  </View>
                )}

                <View style={styles.profilePostTimeBadge}>
                  <Text style={styles.profilePostTimeText}>
                    {new Date(item.time).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>

              <View style={styles.profilePostContent}>
                <View style={styles.profilePostProfile}>
                  <Image 
                    source={{ uri: item.author?.profilePic || user.profilePic }} 
                    style={styles.profilePostAvatar}
                    defaultSource={require('../../assets/images/dpp.jpg')}
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

                <Text style={styles.profilePostTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.description && (
                  <Text style={styles.profilePostDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                )}

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

  if (isLoading) {
    return (
      <AuthGuard>
        <View style={styles.loadingContainer}>
          <LoggedInHeader />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </View>
      </AuthGuard>
    );
  }

  if (!user) {
    return (
      <AuthGuard>
        <View style={styles.errorContainer}>
          <LoggedInHeader />
          <View style={styles.errorContent}>
            <Text style={styles.errorText}>User not found</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <View style={styles.container}>
        <LoggedInHeader />
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
            <View style={styles.profileBannerContainer}>
              <Image 
                source={{ uri: user.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }} 
                style={styles.profileBanner}
                defaultSource={require('../../assets/images/pb.jpg')}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.profileBannerOverlay}
              />
            </View>

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
                  source={{ uri: user.profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }} 
                  style={styles.profileAvatar}
                  defaultSource={require('../../assets/images/dpp.jpg')}
                />
                <View style={styles.profileOnlineIndicator} />
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
                      source={require('../../assets/images/PNGs/Logo-Gradient.png')}
                      style={styles.profileLogo}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text style={styles.profileDisplayName}>{user.displayName || user.userName}</Text>
                {user.bio && (
                  <Text style={styles.profileBio}>{user.bio}</Text>
                )}
                
                {/* Action Buttons */}
                {currentUser && currentUser.userName !== username && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.followButton, isFollowing && styles.followButtonFollowing]}
                      onPress={handleFollowToggle}
                    >
                      <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextFollowing]}>
                        {isFollowing ? '✓ Following' : '+ Follow'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.messageButton}
                      onPress={() => router.push(`/messages?createChat=true&user=${username}`)}
                    >
                      <Text style={styles.messageButtonText}>💬 Message</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Profile Stats */}
                <View style={styles.profileStatsContainer}>
                  <TouchableOpacity style={styles.profileStatItem}>
                    <Text style={styles.profileStatNumber}>{user?.posts?.length || 0}</Text>
                    <Text style={styles.profileStatLabel}>Posts</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.profileStatItem}
                    onPress={() => {
                      setFollowModalType('followers');
                      setShowFollowModal(true);
                    }}
                  >
                    <Text style={styles.profileStatNumber}>{relationshipSummary?.followersCount || 0}</Text>
                    <Text style={styles.profileStatLabel}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.profileStatItem}
                    onPress={() => {
                      setFollowModalType('following');
                      setShowFollowModal(true);
                    }}
                  >
                    <Text style={styles.profileStatNumber}>{relationshipSummary?.followingCount || 0}</Text>
                    <Text style={styles.profileStatLabel}>Following</Text>
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
                  <TouchableOpacity 
                    style={styles.profileModalCloseBtn}
                    onPress={closeModal}
                  >
                    <Text style={styles.profileModalCloseIcon}>✕</Text>
                  </TouchableOpacity>

                  <View style={styles.profileModalHero}>
                    <Image 
                      source={{ 
                        uri: expandedPost.banner || expandedPost.thumbnail || expandedPost.coverImage || user.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"
                      }} 
                      style={styles.profileModalBanner}
                      defaultSource={require('../../assets/images/pb.jpg')}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.profileModalGradientOverlay}
                    />
                    <View style={styles.profileModalHeroContent}>
                      <Text style={styles.profileModalHeroTitle}>{expandedPost.title}</Text>
                      
                      <View style={styles.profileModalHeroProfile}>
                        <Image 
                          source={{ uri: expandedPost.author?.profilePic || user.profilePic }} 
                          style={styles.profileModalHeroAvatar}
                          defaultSource={require('../../assets/images/dpp.jpg')}
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
                    
                    <TouchableOpacity style={styles.profileModalHeroPlayBtn}>
                      <Text style={styles.profileModalHeroPlayIcon}>▶</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.profileModalScrollView} showsVerticalScrollIndicator={false}>
                    {expandedPost.description && (
                      <View style={styles.profileModalDescriptionContainer}>
                        <Text style={styles.profileModalDescription}>{expandedPost.description}</Text>
                      </View>
                    )}

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
                    
                    {expandedPost.genre && Array.isArray(expandedPost.genre) && expandedPost.genre.length > 0 && (
                      <View style={styles.profileModalGenresContainer}>
                        {expandedPost.genre.map((genreItem, index) => (
                          <View key={index} style={styles.profileModalGenreTag}>
                            <Text style={styles.profileModalGenreTagText}>{genreItem}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.profileModalCommentsContainer}>
                      <Text style={styles.profileModalCommentsTitle}>Comments ({comments.length})</Text>
                      
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
                              defaultSource={require('../../assets/images/dpp.jpg')}
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

                      <View style={styles.profileModalCommentInputContainer}>
                        <Image 
                          source={{ uri: user?.profilePic }} 
                          style={styles.profileModalCommentInputAvatar}
                          defaultSource={require('../../assets/images/dpp.jpg')}
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

                    <View style={styles.profileModalActionsContainer}>
                      <TouchableOpacity 
                        style={styles.profileModalActionBtnPrimary}
                        onPress={() => {
                          closeModal();
                          router.push(`/post/${expandedPost.id}`);
                        }}
                      >
                        <Text style={styles.profileModalActionTextPrimary}>View Full Post</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.profileModalActionBtnSecondary}
                        onPress={() => {
                          closeModal();
                          const targetUser = expandedPost.author?.userName || user.userName;
                          if (targetUser !== username) {
                            router.push(`/profile/${targetUser}`);
                          }
                        }}
                      >
                        <Text style={styles.profileModalActionTextSecondary}>View Profile</Text>
                      </TouchableOpacity>
                      
                      {expandedPost.freeDownload && (
                        <TouchableOpacity 
                          style={styles.profileModalActionBtnSecondary}
                          onPress={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.profileModalActionTextSecondary}>⬇️ Download</Text>
                          )}
                        </TouchableOpacity>
                      )}
                      
                      {currentUser && expandedPost.author?.userName === currentUser.userName && (
                        <TouchableOpacity 
                          style={[styles.profileModalActionBtnSecondary, styles.profileModalDeleteBtn]}
                          onPress={handleDeletePost}
                          disabled={isDeletingPost}
                        >
                          {isDeletingPost ? (
                            <ActivityIndicator size="small" color="#ff4444" />
                          ) : (
                            <Text style={styles.profileModalDeleteText}>🗑️ Delete Post</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>

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

        {/* Followers/Following Modal */}
        <FollowersModal
          isVisible={showFollowModal}
          onClose={() => setShowFollowModal(false)}
          userName={username}
          type={followModalType}
        />

        <BottomNavigation />
      </View>
    </AuthGuard>
  );
}

// Include all the styles from main-app.jsx ProfileTab section
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 120,
    paddingBottom: 100
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
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
  profileDetails: {
    marginTop: 10,
  },
  profileUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    marginRight: 8,
  },
  profileLogo: {
    width: 20,
    height: 20,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  followButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  followButtonFollowing: {
    backgroundColor: 'transparent',
    borderColor: '#10b981',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  followButtonTextFollowing: {
    color: '#10b981',
  },
  messageButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  userPlusPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.3,
  },
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
  profileContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20
  },
  demoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 20
  },
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
    fontWeight: '700',
  },
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
    width: '48%',
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
  profileModalDeleteBtn: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  profileModalDeleteText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: '600',
  },
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
});
