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
import PostCard from '../components/PostCard';

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

// Main Liked Posts Component
export default function LikedPostsScreen() {
  const { width } = useWindowDimensions();
  const cardMaxWidth = 400;
  const numColumns = Math.max(1, Math.floor((width - 40) / (cardMaxWidth + 20)));
  
  const [user, setUser] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLikedPosts, setTotalLikedPosts] = useState(0);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.likedPosts && Array.isArray(user.likedPosts) && user.likedPosts.length > 0) {
      fetchLikedPosts();
    } else if (user && (!user.likedPosts || (Array.isArray(user.likedPosts) && user.likedPosts.length === 0))) {
      setIsLoading(false);
      setLikedPosts([]);
      setTotalPages(0);
      setTotalLikedPosts(0);
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

  const fetchLikedPosts = async () => {
    if (!user || !user.likedPosts || (Array.isArray(user.likedPosts) && user.likedPosts.length === 0)) {
      setIsLoading(false);
      setLikedPosts([]);
      setTotalPages(0);
      setTotalLikedPosts(0);
      return;
    }
    
    setIsLoading(true);
    try {
      const endpoint = `/posts/get/all/id/${user.likedPosts}?page=${page}&size=20`;
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
      
      setLikedPosts(postsData);
      setTotalPages(response.data.page?.totalPages || 0);
      setTotalLikedPosts(response.data.page?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(0);
    await fetchLikedPosts();
    setIsRefreshing(false);
  };

  const loadMorePosts = () => {
    if (page < totalPages - 1 && !isLoading) {
      setPage(page + 1);
    }
  };

  const renderLikedPostItem = ({ item }) => (
    <View style={styles.cardWrapper}>
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
    </View>
  );

  if (isLoading && page === 0) {
    return (
      <AuthGuard>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your liked posts...</Text>
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
          colors={['#f093fb', '#f5576c']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              <Text style={styles.headerIcon}>❤️</Text> Liked Posts
            </Text>
            <Text style={styles.headerSubtitle}>Posts you've loved</Text>
            
            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalLikedPosts}</Text>
                <Text style={styles.statLabel}>Total Liked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{likedPosts.length}</Text>
                <Text style={styles.statLabel}>Loaded</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Posts List */}
        {likedPosts.length > 0 ? (
          <FlatList
            data={likedPosts}
            renderItem={renderLikedPostItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.postsList}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor="#f093fb"
                colors={['#f093fb']}
              />
            }
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoading && page > 0 ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#f093fb" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              ) : null
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyTitle}>No Liked Posts</Text>
            <Text style={styles.emptyText}>
              You haven't liked any posts yet. Start exploring and like posts you enjoy!
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/feed')}
            >
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                style={styles.exploreButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.exploreButtonText}>🎵 Explore Feed</Text>
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
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 80,
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
  cardWrapper: {
    marginBottom: 20,
    flex: 1,
    marginHorizontal: 10,
    maxWidth: 400,
  },

  // Liked Card
  likedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(240, 147, 251, 0.3)',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
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
    backgroundColor: 'rgba(240, 147, 251, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f093fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  playIcon: {
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 4,
  },
  likedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 147, 251, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  likedIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  likedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
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
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    color: '#f093fb',
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
    backgroundColor: 'rgba(240, 147, 251, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(240, 147, 251, 0.3)',
  },
  genreIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  genreText: {
    color: '#f093fb',
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
    borderTopColor: 'rgba(240, 147, 251, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 20,
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
    backgroundColor: '#f093fb',
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
    backgroundColor: 'rgba(240, 147, 251, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(240, 147, 251, 0.3)',
  },
  modalFeatureText: {
    color: '#f093fb',
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
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(240, 147, 251, 0.2)',
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
    color: '#f093fb',
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
    borderColor: 'rgba(240, 147, 251, 0.2)',
  },
  commentButton: {
    backgroundColor: '#f093fb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  commentButtonDisabled: {
    backgroundColor: 'rgba(240, 147, 251, 0.3)',
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
  exploreButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
