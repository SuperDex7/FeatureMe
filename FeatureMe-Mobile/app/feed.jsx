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

// Feed Item Component
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
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

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
    
    setShowAudioPlayer(true);
  };

  const handleLike = async () => {
    if (!currentUser || isLiking) return;
    
    setIsLiking(true);
    try {
      await addLike(id);
      // Optimistically update UI
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
        id: Date.now(), // Temporary ID
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
        style={[
          styles.feedCard,
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
              <Text style={styles.modalTitle}>Post Details</Text>
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

// Spotlight Item Component (simplified version)
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

// Liked Posts Item Component (simplified version)
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

  const isLiked = currentUser && localLikes.some(like => like.userName === currentUser.userName);

  return (
    <>
      <TouchableOpacity 
        style={[
          styles.likedCard,
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

          {/* Liked Badge */}
          <View style={styles.likedBadge}>
            <Text style={styles.likedIcon}>❤️</Text>
            <Text style={styles.likedText}>Liked</Text>
          </View>

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
              <Text style={styles.modalTitle}>Liked Post</Text>
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

// My Posts Item Component (simplified version)
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
export function FeedScreen({ skipAuth = false }) {
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadedTabs, setLoadedTabs] = useState(new Set()); // Track which tabs have been loaded

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

  const fetchCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    setUser(user);
  };

  const fetchPosts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get('/posts/get?page=0&size=20');
      setPosts(response.data.content || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchSpotlightPosts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get(`/posts/get/likesdesc/role/USERPLUS?page=0&size=20`);
      const posts = response.data.content || [];
      setSpotlightPosts(posts);
    } catch (error) {
      console.error('Error fetching spotlight posts:', error);
      try {
        const fallbackResponse = await api.get(`/posts/get/likesdesc?page=0&size=20`);
        const fallbackPosts = fallbackResponse.data.content || [];
        setSpotlightPosts(fallbackPosts);
      } catch (fallbackError) {
        console.error('Error fetching fallback posts:', fallbackError);
        Alert.alert('Error', 'Failed to load spotlight posts. Please try again.');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchLikedPosts = async (showLoading = true) => {
    if (!user || !user.likedPosts) {
      if (showLoading) setIsLoading(false);
      setLikedPosts([]);
      return;
    }
    
    if (showLoading) setIsLoading(true);
    try {
      const endpoint = `/posts/get/all/id/${user.likedPosts}?page=0&size=20`;
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
      setLikedPosts(postsData);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      setLikedPosts([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const fetchMyPosts = async (showLoading = true) => {
    if (!user || !user.posts) {
      if (showLoading) setIsLoading(false);
      setMyPosts([]);
      return;
    }
    
    if (showLoading) setIsLoading(true);
    try {
      const endpoint = `/posts/get/all/id/${user.posts}/sorted?page=0&size=20`;
      const response = await api.get(endpoint);
      const postsData = response.data.content || [];
      setMyPosts(postsData);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      setMyPosts([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeTab === 'feed') {
      await fetchPosts(false);
    } else if (activeTab === 'spotlight') {
      await fetchSpotlightPosts(false);
    } else if (activeTab === 'liked') {
      await fetchLikedPosts(false);
    } else if (activeTab === 'my-posts') {
      await fetchMyPosts(false);
    }
    setIsRefreshing(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(0);
  };

  const handleDeletePost = (postId) => {
    setMyPosts(prev => prev.filter(post => post.id !== postId));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && selectedGenres.length === 0) {
      fetchPosts();
      return;
    }
    
    setIsLoading(true);
    try {
      const genreParam = selectedGenres.length > 0 ? selectedGenres.join(',') : "";
      const searchParam = searchQuery.trim() || "";
      const response = await api.get(
        `/posts/get/advanced-search?page=0&size=20&search=${searchParam}&genres=${genreParam}&sortBy=likes`
      );
      setPosts(response.data.content || []);
    } catch (error) {
      console.error('Error searching posts:', error);
      Alert.alert('Error', 'Failed to search posts. Please try again.');
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
    />
  );

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

  const renderMyPostItem = ({ item }) => (
    <MyPostsItem
      key={item.id}
      {...item}
      currentUser={user}
      onLikeUpdate={(likes) => {
        setMyPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, likes } : post
        ));
      }}
      onCommentUpdate={(comments) => {
        setMyPosts(prev => prev.map(post => 
          post.id === item.id ? { ...post, comments } : post
        ));
      }}
      onDeletePost={handleDeletePost}
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
  
  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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

  // Posts List
  postsList: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },

  // Feed Card
  feedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
});

// Default export redirects to main app with feed tab
import MainApp from './main-app';

export default function Feed() {
  return <MainApp initialTab="feed" />;
}
