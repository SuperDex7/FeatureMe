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
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { addView, addLike, addComment } from '../services/postsService';
import { getCurrentUser } from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import AuthGuard from '../components/AuthGuard';
import LoggedInHeader from '../components/ui/LoggedInHeader';

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

function getGenreIcon(genre) {
  if (!genre) return GENRE_ICONS.Default;
  const lower = String(genre).toLowerCase();
  if (lower === 'hiphop' || lower === 'hip-hop') return GENRE_ICONS['Hip Hop'];
  if (lower === 'r&b' || lower === 'rnb') return GENRE_ICONS['R&B'];
  if (lower === 'afrobeats') return GENRE_ICONS['Afrobeat'];
  return GENRE_ICONS[genre] || GENRE_ICONS[genre?.trim()] || GENRE_ICONS.Default;
}

// Spotlight Item Component
function SpotlightItem({ 
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
  const { userName, profilePic, banner, role } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const formatTime = (timestamp) => {
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
  };

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
    
    setShowAudioPlayer(true);
  };

  const handleLike = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    try {
      await addLike(id);
      const isCurrentlyLiked = localLikes.some(like => like.userName === currentUser.userName);
      if (isCurrentlyLiked) {
        setLocalLikes(prev => prev.filter(like => like.userName !== currentUser.userName));
      } else {
        setLocalLikes(prev => [...prev, { userName: currentUser.userName }]);
      }
      onLikeUpdate?.(localLikes);
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || isCommenting) return;
    
    setIsCommenting(true);
    try {
      await addComment(id, commentText.trim());
      const newComment = {
        id: Date.now(),
        comment: commentText.trim(),
        userName: currentUser.userName,
        time: new Date().toISOString()
      };
      setLocalComments(prev => [...prev, newComment]);
      setCommentText('');
      onCommentUpdate?.(localComments);
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setIsCommenting(false);
    }
  };

  const isLiked = currentUser && localLikes.some(like => like.userName === currentUser.userName);

  return (
    <>
      <TouchableOpacity 
        style={styles.spotlightCard}
        onPress={() => setModalOpen(true)}
        activeOpacity={0.8}
      >
        {/* Card Header with Banner */}
        <View style={styles.cardHeader}>
          <Image 
            source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
            style={styles.cardBanner}
            defaultSource={require('../assets/images/pb.jpg')}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardOverlay}
          />
          
          {/* Play Button Overlay */}
          {!showAudioPlayer && (
            <TouchableOpacity 
              style={styles.playOverlay} 
              onPress={handlePlayClick}
            >
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Premium Badge */}
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumIcon}>⭐</Text>
            <Text style={styles.premiumText}>Plus</Text>
          </View>

          {/* Time Badge */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{formatTime(time)}</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Image 
              source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.avatar}
              defaultSource={require('../assets/images/dpp.jpg')}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{userName}</Text>
              <Text style={styles.time}>{formatTime(time)}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>{title}</Text>

          {/* Description */}
          {description && description.trim() && (
            <Text style={styles.description} numberOfLines={3}>{description}</Text>
          )}

          {/* Features */}
          {features && features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresLabel}>Feat:</Text>
              <Text style={styles.featuresList}>
                {features.slice(0, 2).map((feature, index) => (
                  <Text key={index} style={styles.featureLink}>{feature}</Text>
                ))}
                {features.length > 2 && (
                  <Text style={styles.featureMore}>+{features.length - 2} more</Text>
                )}
              </Text>
            </View>
          )}

          {/* Genre Tags */}
          {genre && Array.isArray(genre) && genre.length > 0 && (
            <View style={styles.genresContainer}>
              {genre.slice(0, 3).map((genreItem, index) => (
                <View key={index} style={styles.genreTag}>
                  <Text style={styles.genreIcon}>{getGenreIcon(genreItem)}</Text>
                  <Text style={styles.genreText}>{genreItem}</Text>
                </View>
              ))}
              {genre.length > 3 && (
                <Text style={styles.genreMore}>+{genre.length - 3}</Text>
              )}
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={handleLike}
              disabled={isLiking}
            >
              <Text style={[styles.statIcon, isLiked && styles.likedIcon]}>
                {isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={styles.statCount}>{localLikes.length}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => setModalOpen(true)}
            >
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statCount}>{totalComments || localComments.length}</Text>
            </TouchableOpacity>
            
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👁️</Text>
              <Text style={styles.statCount}>{totalViews || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Premium Post</Text>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.modalBanner}>
                <Image 
                  source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
                  style={styles.modalBannerImage}
                  defaultSource={require('../assets/images/pb.jpg')}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.modalBannerOverlay}
                />
                <View style={styles.modalBannerContent}>
                  <Text style={styles.modalPostTitle}>{title}</Text>
                  <Text style={styles.modalPostSubtitle}>by {userName}</Text>
                </View>
              </View>

              <View style={styles.modalMainContent}>
                <View style={styles.modalProfileSection}>
                  <Image 
                    source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
                    style={styles.modalAvatar}
                    defaultSource={require('../assets/images/dpp.jpg')}
                  />
                  <View style={styles.modalProfileInfo}>
                    <Text style={styles.modalUsername}>{userName}</Text>
                    <Text style={styles.modalDate}>{formatTime(time)}</Text>
                  </View>
                </View>

                {description && description.trim() && (
                  <Text style={styles.modalDescription}>{description}</Text>
                )}

                {/* Features */}
                {features && Array.isArray(features) && features.length > 0 && (
                  <View style={styles.modalFeatures}>
                    <Text style={styles.modalFeaturesLabel}>Featuring:</Text>
                    <View style={styles.modalFeaturesList}>
                      {features.map((feature, index) => (
                        <TouchableOpacity key={index} style={styles.modalFeatureTag}>
                          <Text style={styles.modalFeatureText}>{feature}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Genre Tags */}
                {genre && Array.isArray(genre) && genre.length > 0 && (
                  <View style={styles.modalGenres}>
                    {genre.map((genreItem, index) => (
                      <View key={index} style={styles.modalGenreTag}>
                        <Text style={styles.modalGenreText}>{genreItem}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Stats Grid */}
                <View style={styles.modalStatsGrid}>
                  <TouchableOpacity 
                    style={styles.modalStatItem}
                    onPress={handleLike}
                    disabled={isLiking}
                  >
                    <Text style={[styles.modalStatIcon, isLiked && styles.likedIcon]}>
                      {isLiked ? '❤️' : '🤍'}
                    </Text>
                    <Text style={styles.modalStatNumber}>{localLikes.length}</Text>
                    <Text style={styles.modalStatLabel}>Likes</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatIcon}>💬</Text>
                    <Text style={styles.modalStatNumber}>{totalComments || localComments.length}</Text>
                    <Text style={styles.modalStatLabel}>Comments</Text>
                  </View>
                  
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatIcon}>👁️</Text>
                    <Text style={styles.modalStatNumber}>{totalViews || 0}</Text>
                    <Text style={styles.modalStatLabel}>Views</Text>
                  </View>
                </View>

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>Comments</Text>
                  
                  {localComments.length > 0 ? (
                    <View style={styles.commentsList}>
                      {localComments.slice(-5).map((comment, index) => (
                        <View key={comment.id || index} style={styles.commentItem}>
                          <Text style={styles.commentAuthor}>{comment.userName}</Text>
                          <Text style={styles.commentText}>{comment.comment}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noComments}>No comments yet</Text>
                  )}

                  {/* Add Comment */}
                  <View style={styles.addCommentContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={200}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.commentButton,
                        (!commentText.trim() || isCommenting) && styles.commentButtonDisabled
                      ]}
                      onPress={handleAddComment}
                      disabled={!commentText.trim() || isCommenting}
                    >
                      {isCommenting ? (
                        <ActivityIndicator size="small" color="#667eea" />
                      ) : (
                        <Text style={styles.commentButtonText}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Main Spotlight Component
export default function SpotlightScreen() {
  const [spotlightPosts, setSpotlightPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchSpotlightPosts();
    fetchCurrentUser();
  }, [page]);

  const fetchCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const fetchSpotlightPosts = async () => {
    setIsLoading(true);
    try {
      // Fetch posts filtered by USERPLUS role for spotlight
      const response = await api.get(`/posts/get/likesdesc/role/USERPLUS?page=${page}&size=20`);
      const posts = response.data.content || [];
      setSpotlightPosts(posts);
      setTotalPages(response.data.page?.totalPages || 0);
    } catch (error) {
      console.error('Error fetching spotlight posts:', error);
      // Fallback to regular posts if role filtering fails
      try {
        const fallbackResponse = await api.get(`/posts/get/likesdesc?page=${page}&size=20`);
        const fallbackPosts = fallbackResponse.data.content || [];
        setSpotlightPosts(fallbackPosts);
        setTotalPages(fallbackResponse.data.page?.totalPages || 0);
      } catch (fallbackError) {
        console.error('Error fetching fallback posts:', fallbackError);
        Alert.alert('Error', 'Failed to load spotlight posts. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await fetchSpotlightPosts();
    setIsRefreshing(false);
  };

  const loadMorePosts = () => {
    if (page < totalPages - 1 && !isLoading) {
      setPage(page + 1);
    }
  };

  const renderSpotlightItem = ({ item }) => (
    <SpotlightItem
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
    />
  );

  const getTopPostsOverall = (count = 8) => {
    return spotlightPosts
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, count);
  };

  return (
    <AuthGuard>
      <View style={styles.container}>
        <LoggedInHeader />
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerIcon}>✨</Text> Premium Spotlight
            </Text>
            <Text style={styles.headerSubtitle}>Discover exceptional content from Plus creators</Text>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{spotlightPosts.length}</Text>
                <Text style={styles.statLabel}>Premium Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalPages}</Text>
                <Text style={styles.statLabel}>Pages</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Posts List */}
        {isLoading && page === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading Premium Content...</Text>
          </View>
        ) : (
          <FlatList
            data={spotlightPosts}
            renderItem={renderSpotlightItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.postsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#667eea"
                colors={['#667eea']}
              />
            }
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✨</Text>
                <Text style={styles.emptyTitle}>No Premium Content</Text>
                <Text style={styles.emptyText}>
                  No premium posts available at the moment. Check back later for exclusive content!
                </Text>
              </View>
            }
            ListFooterComponent={
              isLoading && page > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#667eea" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
        )}

        {/* Bottom Navigation */}
        <BottomNavigation />
      </View>
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingTop: 100, // Space for LoggedInHeader
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerIcon: {
    fontSize: 32,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
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
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },

  // Posts List
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },

  // Spotlight Card
  spotlightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  cardHeader: {
    height: 220,
    position: 'relative',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  playIcon: {
    fontSize: 28,
    color: '#000',
    marginLeft: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  premiumText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Card Content
  cardContent: {
    padding: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  time: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 26,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuresLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginRight: 8,
  },
  featuresList: {
    flex: 1,
  },
  featureLink: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
  },
  featureMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  genreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  genreIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  genreText: {
    color: '#ffd700',
    fontSize: 13,
    fontWeight: '600',
  },
  genreMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
  },
  statCount: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    backgroundColor: '#ffd700',
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
  modalScrollView: {
    maxHeight: 500,
  },
  modalBanner: {
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  modalBannerImage: {
    width: '100%',
    height: '100%',
  },
  modalBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBannerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  modalPostTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalPostSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
  },
  modalMainContent: {
    paddingBottom: 20,
  },
  modalProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalProfileInfo: {
    flex: 1,
  },
  modalUsername: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
  },
  modalDescription: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 24,
  },
  modalFeatures: {
    marginBottom: 20,
  },
  modalFeaturesLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalFeatureTag: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  modalFeatureText: {
    color: '#ffd700',
    fontSize: 15,
    fontWeight: '600',
  },
  modalGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 10,
  },
  modalGenreTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalGenreText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  modalStatNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalStatLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },

  // Comments Section
  commentsSection: {
    marginTop: 24,
  },
  commentsTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  commentsList: {
    marginBottom: 20,
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  commentAuthor: {
    color: '#ffd700',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  commentText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  noComments: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 24,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 15,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  commentButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  commentButtonDisabled: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  commentButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
