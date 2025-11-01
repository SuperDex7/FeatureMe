import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { addView, addLike, addComment, deletePost, trackDownload } from '../services/postsService';
import { getCurrentUser } from '../services/api';
import { useAudio } from '../contexts/AudioContext';

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

// Profile Section Component
function ProfileSection({ userName, profilePic, time, styles, formatTime }) {
  return (
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
  );
}

// Main PostCard Component
export default function PostCard({ 
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
  currentUser,
  variant = 'default', // 'default', 'spotlight', 'profile'
  showModal = true,
  onCardPress,
  onSpotlightPress
}) {
  const { userName, profilePic, banner, role } = author ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPlayButtonLoading, setIsPlayButtonLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Use centralized audio context
  const { playTrack, currentTrack, isPlaying, isLoading, position, duration, seekTo, togglePlayPause } = useAudio();

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
    if (isPlayButtonLoading || isLoading) return;
    
    setIsPlayButtonLoading(true);
    
    try {
      // Add view tracking (existing functionality)
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
      
      // Create track object for audio context
      const trackData = {
        id,
        title,
        author,
        music,
        description,
        time,
        features,
        genre,
        likes: localLikes,
        comments: localComments,
        totalViews,
        totalComments,
        totalDownloads,
        freeDownload
      };
      
      // Check if this track is currently playing
      const isCurrentTrack = currentTrack && currentTrack.id === id;
      
      if (isCurrentTrack && isPlaying) {
        // Track is playing, this will pause it
        await playTrack(trackData);
      } else {
        // Play the track
        await playTrack(trackData);
      }
    } catch (error) {
      console.error('Error playing track:', error);
    } finally {
      setIsPlayButtonLoading(false);
    }
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

  const handleDownload = async () => {
    if (!freeDownload) {
      Alert.alert('Download Not Available', 'Downloads are not enabled for this track.');
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const fileName = `${title} - ${userName || 'Unknown'}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          const userName = currentUser ? currentUser.userName : 'unknown';
          await trackDownload(id, userName);
          console.log('Download tracked for:', title);
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

  const handleCardPress = () => {
    if (onCardPress) {
      onCardPress();
    } else if (showModal) {
      setModalOpen(true);
    } else {
      router.push(`/post/${id}`);
    }
  };

  const isLiked = currentUser && localLikes.some(like => like.userName === currentUser.userName);
  const isOwnPost = currentUser && currentUser.userName === userName;

  // Get styles based on variant
  const getCardStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightCard;
      case 'profile':
        return styles.profileCard;
      default:
        return styles.feedCard;
    }
  };

  const getBadgeStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightBadge;
      default:
        return null;
    }
  };

  const getPlayButtonStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightPlayButton;
      default:
        return styles.playButton;
    }
  };

  const getPlayIconStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightPlayIcon;
      default:
        return styles.playIcon;
    }
  };

  const getStatIconStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightStatIcon;
      default:
        return styles.statIcon;
    }
  };

  const getStatCountStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightStatCount;
      default:
        return styles.statCount;
    }
  };

  const getStatsRowStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightStatsRow;
      default:
        return styles.statsRow;
    }
  };

  const getStatItemStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightStatItem;
      default:
        return styles.statItem;
    }
  };

  const getFeatureLinkStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightFeatureLink;
      default:
        return styles.featureLink;
    }
  };

  const getGenreTagStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightGenreTag;
      default:
        return styles.genreTag;
    }
  };

  const getGenreTextStyles = () => {
    switch (variant) {
      case 'spotlight':
        return styles.spotlightGenreText;
      default:
        return styles.genreText;
    }
  };

  // Profile variant - simplified card for profile pages
  if (variant === 'profile') {
    return (
      <TouchableOpacity 
        style={styles.profileCard}
        onPress={() => router.push(`/post/${id}`)}
      >
        <Image 
          source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
          style={styles.profilePostImage}
          defaultSource={require('../assets/images/pb.jpg')}
        />
        <View style={styles.profilePostOverlay}>
          <Text style={styles.profilePostTitle} numberOfLines={2}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={[
          getCardStyles(),
          role === 'USERPLUS' && styles.premiumCard
        ]}
        onPress={handleCardPress}
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
          <TouchableOpacity 
            style={styles.playOverlay} 
            onPress={handlePlayClick}
          >
            <View style={getPlayButtonStyles()}>
              <Text style={getPlayIconStyles()}>
                {currentTrack?.id === id && isPlaying ? '⏸️' : '▶'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Variant-specific Badge */}
          {variant === 'spotlight' && (
            <View style={styles.spotlightBadge}>
              <Text style={styles.spotlightIcon}>⭐</Text>
              <Text style={styles.spotlightText}>Spotlight</Text>
            </View>
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
          <ProfileSection 
            userName={userName}
            profilePic={profilePic}
            time={time}
            styles={styles}
            formatTime={formatTime}
          />

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
                  <Text key={index} style={getFeatureLinkStyles()}>{feature}</Text>
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
                <View key={index} style={getGenreTagStyles()}>
                  <Text style={styles.genreIcon}>{getGenreIcon(genreItem)}</Text>
                  <Text style={getGenreTextStyles()}>{genreItem}</Text>
                </View>
              ))}
              {genre.length > 3 && (
                <Text style={styles.genreMore}>+{genre.length - 3}</Text>
              )}
            </View>
          )}

          {/* Stats Row */}
          <View style={getStatsRowStyles()}>
            <TouchableOpacity 
              style={getStatItemStyles()}
              onPress={handleLike}
              disabled={isLiking}
            >
              <Text style={[getStatIconStyles(), isLiked && styles.likedIcon]}>
                {isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={getStatCountStyles()}>{localLikes.length}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={getStatItemStyles()}
              onPress={() => setModalOpen(true)}
            >
              <Text style={getStatIconStyles()}>💬</Text>
              <Text style={getStatCountStyles()}>{totalComments || localComments.length}</Text>
            </TouchableOpacity>
            
            <View style={getStatItemStyles()}>
              <Text style={getStatIconStyles()}>👁️</Text>
              <Text style={getStatCountStyles()}>{totalViews || 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Profile-Style Modal */}
      {showModal && (
        <Modal
          visible={modalOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalOpen(false)}
        >
          <View style={styles.profileModalOverlay}>
            <View style={styles.profileModalContent}>
              {/* Modal Close Button */}
              <TouchableOpacity 
                style={styles.profileModalCloseBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.profileModalCloseIcon}>✕</Text>
              </TouchableOpacity>

              {/* Hero Section with Banner */}
              <View style={styles.profileModalHero}>
                <Image 
                  source={{ 
                    uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80"
                  }} 
                  style={styles.profileModalBanner}
                  defaultSource={require('../assets/images/pb.jpg')}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.profileModalGradientOverlay}
                />
                <View style={styles.profileModalHeroContent}>
                  <Text style={styles.profileModalHeroTitle}>{title}</Text>
                  
                  {/* Profile Info in Hero */}
                  <View style={styles.profileModalHeroProfile}>
                    <Image 
                      source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }} 
                      style={styles.profileModalHeroAvatar}
                      defaultSource={require('../assets/images/dpp.jpg')}
                    />
                    <View style={styles.profileModalHeroProfileInfo}>
                      <Text style={styles.profileModalHeroUsername}>
                        {userName}
                      </Text>
                      <Text style={styles.profileModalHeroDate}>
                        {formatTime(time)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Play Button in Hero */}
                <TouchableOpacity 
                  style={styles.profileModalHeroPlayBtn}
                  onPress={handlePlayClick}
                  disabled={isPlayButtonLoading || isLoading}
                >
                  {isPlayButtonLoading || isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.profileModalHeroPlayIcon}>
                      {currentTrack?.id === id && isPlaying ? '⏸️' : '▶'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              <ScrollView style={styles.profileModalScrollView} showsVerticalScrollIndicator={false}>
                {/* Description */}
                {description && description.trim() && (
                  <View style={styles.profileModalDescriptionContainer}>
                    <Text style={styles.profileModalDescription}>{description}</Text>
                  </View>
                )}

                {/* Audio Player Section - Only show if this track is currently playing */}
                {currentTrack?.id === id && (
                  <View style={styles.profileModalAudioPlayerContainer}>
                    <Text style={styles.profileModalAudioPlayerTitle}>Now Playing</Text>
                    
                    {/* Track Info */}
                    <View style={styles.profileModalTrackInfo}>
                      <Text style={styles.profileModalTrackTitle}>{title}</Text>
                      <Text style={styles.profileModalTrackArtist}>{userName}</Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.profileModalProgressContainer}>
                      <View style={styles.profileModalProgressBar}>
                        <View 
                          style={[
                            styles.profileModalProgressFill, 
                            { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                          ]} 
                        />
                      </View>
                      <View style={styles.profileModalTimeContainer}>
                        <Text style={styles.profileModalTimeText}>
                          {Math.floor(position / 60)}:{(Math.floor(position) % 60).toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.profileModalTimeText}>
                          {Math.floor(duration / 60)}:{(Math.floor(duration) % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                    </View>

                    {/* Play/Pause Button */}
                    <TouchableOpacity 
                      style={styles.profileModalPlayPauseBtn}
                      onPress={togglePlayPause}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.profileModalPlayPauseIcon}>
                          {isPlaying ? '⏸️' : '▶️'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Features */}
                {features && Array.isArray(features) && features.length > 0 && (
                  <View style={styles.profileModalFeaturesContainer}>
                    <Text style={styles.profileModalFeaturesLabel}>Featuring:</Text>
                    <View style={styles.profileModalFeaturesList}>
                      {features.map((feature, index) => (
                        <Text key={index} style={styles.profileModalFeatureTag}>
                          {feature}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Genre Tags */}
                {genre && Array.isArray(genre) && genre.length > 0 && (
                  <View style={styles.profileModalGenresContainer}>
                    {genre.map((genreItem, index) => (
                      <View key={index} style={styles.profileModalGenreTag}>
                        <Text style={styles.profileModalGenreTagText}>{genreItem}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Comments Section */}
                <View style={styles.profileModalCommentsContainer}>
                  <Text style={styles.profileModalCommentsTitle}>Comments ({localComments.length})</Text>
                  
                  {/* Comments List */}
                  <ScrollView 
                    style={styles.profileModalCommentsList}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {localComments.map((comment) => (
                      <View key={comment.id} style={styles.profileModalCommentItem}>
                        <Image 
                          source={{ uri: comment.userPic || profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }} 
                          style={styles.profileModalCommentAvatar}
                          defaultSource={require('../assets/images/dpp.jpg')}
                        />
                        <View style={styles.profileModalCommentContent}>
                          <View style={styles.profileModalCommentHeader}>
                            <Text style={styles.profileModalCommentUsername}>{comment.userName}</Text>
                            <Text style={styles.profileModalCommentTime}>
                              {formatTime(comment.time)}
                            </Text>
                          </View>
                          <Text style={styles.profileModalCommentText}>{comment.comment}</Text>
                        </View>
                      </View>
                    ))}
                    
                    {localComments.length === 0 && (
                      <View style={styles.profileModalNoComments}>
                        <Text style={styles.profileModalNoCommentsText}>No comments yet</Text>
                        <Text style={styles.profileModalNoCommentsSubtext}>Be the first to comment!</Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Comment Input */}
                  <View style={styles.profileModalCommentInputContainer}>
                    <Image 
                      source={{ uri: currentUser?.profilePic || profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }} 
                      style={styles.profileModalCommentInputAvatar}
                      defaultSource={require('../assets/images/dpp.jpg')}
                    />
                    <TextInput
                      style={styles.profileModalCommentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity 
                      style={[styles.profileModalCommentSubmitBtn, !commentText.trim() && styles.profileModalCommentSubmitBtnDisabled]}
                      onPress={handleAddComment}
                      disabled={!commentText.trim() || isCommenting}
                    >
                      <Text style={styles.profileModalCommentSubmitText}>
                        {isCommenting ? '...' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.profileModalActionsContainer}>
                  <TouchableOpacity 
                    style={styles.profileModalActionBtnPrimary}
                    onPress={() => {
                      setModalOpen(false);
                      router.push(`/post/${id}`);
                    }}
                  >
                    <Text style={styles.profileModalActionTextPrimary}>View Full Post</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.profileModalActionBtnSecondary}
                    onPress={() => {
                      setModalOpen(false);
                      router.push(`/profile/${userName}`);
                    }}
                  >
                    <Text style={styles.profileModalActionTextSecondary}>View Profile</Text>
                  </TouchableOpacity>
                  
                  {freeDownload && (
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
                  
                  {isOwnPost && onDeletePost && (
                    <TouchableOpacity 
                      style={[styles.profileModalActionBtnSecondary, styles.profileModalDeleteBtn]}
                      onPress={handleDeletePost}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color="#ff4444" />
                      ) : (
                        <Text style={styles.profileModalDeleteText}>🗑️ Delete Post</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>

              {/* Floating Stats */}
              <View style={styles.profileModalFloatingStats}>
                <TouchableOpacity 
                  style={styles.profileModalFloatingLikeBtn}
                  onPress={handleLike}
                  disabled={isLiking}
                >
                  <Text style={styles.profileModalFloatingLikeIcon}>
                    {isLiked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={styles.profileModalFloatingCount}>{localLikes.length}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.profileModalFloatingViewBtn}>
                  <Text style={styles.profileModalFloatingViewIcon}>👁️</Text>
                  <Text style={styles.profileModalFloatingCount}>{totalViews || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // Feed Card - Default variant
  feedCard: {
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
  
  
  // Spotlight Card - Spotlight variant
  spotlightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
    minHeight: 450,
  },
  
  // Profile Card - Profile variant
  profileCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  spotlightPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  playIcon: {
    fontSize: 24,
    color: '#667eea',
    marginLeft: 4,
  },
  spotlightPlayIcon: {
    fontSize: 28,
    color: '#000',
    marginLeft: 4,
  },
  
  // Badges
  spotlightBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  spotlightIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  spotlightText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
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
    color: '#667eea',
    fontSize: 12,
    fontWeight: '500',
  },
  spotlightFeatureLink: {
    color: '#FFD700',
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
  spotlightGenreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
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
  spotlightGenreText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
  },
  genreMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    alignSelf: 'center',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',

    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',

  },
  spotlightStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  spotlightStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  spotlightStatIcon: {
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
  spotlightStatCount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  spotlightLikedIcon: {
    transform: [{ scale: 1.2 }],
  },

  // Profile Card Styles
  profilePostImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
  },
  profilePostTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Profile-Style Modal Styles
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
  
  profileModalDeleteBtn: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  
  profileModalDeleteText: {
    color: '#ff4444',
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

  // Audio Player Section Styles
  profileModalAudioPlayerContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileModalAudioPlayerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    textAlign: 'center',
  },
  profileModalTrackInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileModalTrackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileModalTrackArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  profileModalProgressContainer: {
    marginBottom: 16,
  },
  profileModalProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  profileModalProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(120, 119, 198, 1)',
    borderRadius: 2,
  },
  profileModalTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileModalTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  profileModalPlayPauseBtn: {
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(120, 119, 198, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(120, 119, 198, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileModalPlayPauseIcon: {
    fontSize: 20,
    color: '#ffffff',
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
  },
  profileModalCommentSubmitBtn: {
    backgroundColor: 'rgba(120, 119, 198, 1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  profileModalCommentSubmitBtnDisabled: {
    backgroundColor: 'rgba(120, 119, 198, 0.3)',
  },
  profileModalCommentSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});



