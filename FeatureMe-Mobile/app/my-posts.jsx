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
import { addView, addLike, addComment, deletePost } from '../services/postsService';
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

// My Posts Item Component
function MyPostsItem({ 
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
  totalDownloads = 0,
  freeDownload = false,
  onLikeUpdate,
  onCommentUpdate,
  onDeletePost,
  currentUser 
}) {
  const { userName, profilePic, banner, role } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState('');

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
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

  const handleDeletePost = async () => {
    if (!currentUser || isDeleting) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deletePost(id);
              onDeletePost?.(id);
              setModalOpen(false);
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const isLiked = currentUser && localLikes.some(like => like.userName === currentUser.userName);
  const isOwnPost = currentUser && currentUser.userName === userName;

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.postCard,
          role === 'USERPLUS' && styles.premiumCard
        ]}
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
          {role === 'USERPLUS' && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>✨</Text>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}

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

            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⬇️</Text>
              <Text style={styles.statCount}>{totalDownloads || 0}</Text>
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
              <Text style={styles.modalTitle}>Your Post</Text>
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

                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatIcon}>⬇️</Text>
                    <Text style={styles.modalStatNumber}>{totalDownloads || 0}</Text>
                    <Text style={styles.modalStatLabel}>Downloads</Text>
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

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/post/${id}`)}
                  >
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.actionButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.actionButtonText}>View Full Post</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {isOwnPost && (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDeletePost}
                      disabled={isDeleting}
                    >
                      <LinearGradient
                        colors={['#ff6b6b', '#ee5a52']}
                        style={styles.actionButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.actionButtonText}>🗑️ Delete Post</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// Main My Posts Component
export default function MyPostsScreen() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.posts) {
      fetchPosts();
    } else if (user && !user.posts) {
      setIsLoading(false);
      setPosts([]);
    }
  }, [user, page]);

  const fetchUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      setIsLoading(false);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const endpoint = `/posts/get/all/id/${user.posts}/sorted?page=${page}&size=20`;
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
      
      setPosts(postsData);
      setTotalPages(response.data.page?.totalPages || 0);
      
      // Calculate stats
      calculateStats(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (postsData) => {
    const totalLikes = postsData.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalViews = postsData.reduce((sum, post) => sum + (post.totalViews || 0), 0);
    const totalComments = postsData.reduce((sum, post) => sum + (post.totalComments || 0), 0);
    
    setStats({
      totalPosts: postsData.length,
      totalLikes,
      totalViews,
      totalComments
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await fetchPosts();
    setIsRefreshing(false);
  };

  const loadMorePosts = () => {
    if (page < totalPages - 1 && !isLoading) {
      setPage(page + 1);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    // Recalculate stats
    const updatedPosts = posts.filter(post => post.id !== postId);
    calculateStats(updatedPosts);
  };

  const renderPostItem = ({ item }) => (
    <MyPostsItem
      key={item.id}
      {...item}
      currentUser={user}
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
      onDeletePost={handleDeletePost}
    />
  );

  if (isLoading && page === 0) {
    return (
      <AuthGuard>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your posts...</Text>
        </View>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <View style={styles.container}>
        <LoggedInHeader />
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerIcon}>📚</Text> My Posts
            </Text>
            <Text style={styles.headerSubtitle}>Your content library</Text>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalPosts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalLikes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalViews}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalComments}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Posts List */}
        {posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderPostItem}
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
            ListFooterComponent={
              isLoading && page > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#667eea" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No Posts Yet</Text>
            <Text style={styles.emptyText}>
              You haven't created any posts yet. Start sharing your music!
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/create-post')}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.createButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.createButtonText}>➕ Create Your First Post</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 70,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Posts List
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },

  // Post Card
  postCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  premiumCard: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  cardHeader: {
    height: 200,
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
  playIcon: {
    fontSize: 24,
    color: '#667eea',
    marginLeft: 4,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  premiumText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Card Content
  cardContent: {
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuresLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginRight: 8,
  },
  featuresList: {
    flex: 1,
  },
  featureLink: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '500',
  },
  featureMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  genreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  genreIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  genreText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '500',
  },
  genreMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
  },
  statCount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
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
  modalScrollView: {
    maxHeight: 500,
  },
  modalBanner: {
    height: 160,
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
    bottom: 16,
    left: 16,
    right: 16,
  },
  modalPostTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalPostSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
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

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100, // Space for bottom navigation
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
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
