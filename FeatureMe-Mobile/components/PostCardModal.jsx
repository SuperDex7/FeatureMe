import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useAudio } from '../contexts/AudioContext';
import { addView, addLike, addComment, trackDownload, deletePost } from '../services/postsService';
import { getCurrentUser } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

function formatTime(timestamp) {
  if (!timestamp) return '';
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

export default function PostCardModal({
  visible,
  onClose,
  post,
  currentUser,
  onPostUpdate,
  showDelete = false
}) {
  const { playTrack, currentTrack, isPlaying, isLoading } = useAudio();
  const [localLikes, setLocalLikes] = useState(post?.likes || []);
  const [localComments, setLocalComments] = useState(post?.comments || []);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  useEffect(() => {
    if (post) {
      setLocalLikes(post.likes || []);
      setLocalComments(post.comments || []);
    }
  }, [post]);

  if (!post) return null;

  const isLiked = currentUser && localLikes.some(like => 
    (typeof like === 'object' ? like.userName : like) === currentUser.userName
  );

  const handlePlayPress = async () => {
    if (!post || isButtonLoading || isLoading) return;
    
    setIsButtonLoading(true);
    
    try {
      // Add view with cooldown
      const cooldownKey = `view_${post.id}_${currentUser?.userName}`;
      const lastViewTime = await AsyncStorage.getItem(cooldownKey);
      const now = Date.now();
      const cooldown = 15 * 1000; // 15 seconds
      
      if (!lastViewTime || (now - parseInt(lastViewTime)) > cooldown) {
        if (currentUser) {
          try {
            await addView(post.id);
            await AsyncStorage.setItem(cooldownKey, now.toString());
          } catch (error) {
            console.error("Error adding view:", error);
          }
        }
      }

      // Check if this track is currently playing
      const isCurrentTrack = currentTrack && currentTrack.id === post.id;
      
      if (isCurrentTrack && isPlaying) {
        await playTrack(post);
      } else {
        await playTrack(post);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      Alert.alert('Error', 'Failed to play track');
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser || isLiking || !post) return;
    
    setIsLiking(true);
    try {
      await addLike(post.id);
      const isCurrentlyLiked = localLikes.some(like => 
        (typeof like === 'object' ? like.userName : like) === currentUser.userName
      );
      
      if (isCurrentlyLiked) {
        setLocalLikes(prev => prev.filter(like => 
          (typeof like === 'object' ? like.userName : like) !== currentUser.userName
        ));
      } else {
        setLocalLikes(prev => [...prev, { userName: currentUser.userName }]);
      }
      
      // Update parent if callback provided
      if (onPostUpdate) {
        onPostUpdate({ ...post, likes: isCurrentlyLiked ? 
          localLikes.filter(l => (typeof l === 'object' ? l.userName : l) !== currentUser.userName) :
          [...localLikes, { userName: currentUser.userName }]
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || isCommenting || !post) return;
    
    setIsCommenting(true);
    try {
      await addComment(post.id, commentText.trim());
      const newComment = {
        id: Date.now(),
        text: commentText.trim(),
        userName: currentUser.userName,
        userPic: currentUser.profilePic,
        time: new Date().toISOString()
      };
      
      const updatedComments = [...localComments, newComment];
      setLocalComments(updatedComments);
      setCommentText('');
      
      // Update parent if callback provided
      if (onPostUpdate) {
        onPostUpdate({ ...post, comments: updatedComments, totalComments: updatedComments.length });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleSharePost = async () => {
    if (!post) return;
    
    try {
      const shareMessage = post.title 
        ? `Check out "${post.title}" by ${post.author?.userName || 'Unknown'} on FeatureMe! 🎵`
        : `Check out this post on FeatureMe! 🎵`;
      
      // Use web URL format for better compatibility and clickable links
      const postUrl = `https://featureme.co/post/${post.id}`;
      
      // Use url property for clickable links (works better than putting it in message)
      await Share.share({
        message: shareMessage,
        url: postUrl, // This makes the link tappable on iOS and Android
        title: post.title || 'FeatureMe Post',
      });
    } catch (error) {
      // User cancelled the share dialog (this is expected behavior, not an error)
      if (error.message && !error.message.includes('User did not share')) {
        console.error('Error sharing post:', error);
        Alert.alert('Error', 'Failed to share post. Please try again.');
      }
    }
  };

  const handleDownload = async () => {
    if (!post || !post.freeDownload || isDownloading || !currentUser) return;
    
    setIsDownloading(true);
    try {
      const fileName = `${post.title} - ${post.author?.userName || 'Unknown'}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(post.music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          await trackDownload(post.id, currentUser.userName);
        } catch (error) {
          console.error('Error tracking download:', error);
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!post || !currentUser || isDeleting || !showDelete) return;
    
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
              await deletePost(post.id);
              onClose();
              if (onPostUpdate) {
                onPostUpdate(null); // Signal deletion
              }
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  const author = post.author || {};
  const banner = author.banner || post.banner || post.thumbnail || post.coverImage;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalOverlayPressable} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post</Text>
            <TouchableOpacity 
              style={styles.modalCloseBtn}
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalScrollView} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Banner */}
            <View style={styles.modalBanner}>
              <Image 
                source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
                style={styles.modalBannerImage}
                defaultSource={require('../assets/images/pb.jpg')}
              />
              <LinearGradient
                colors={['transparent', 'rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.7)']}
                style={styles.modalBannerOverlay}
              />
              
              {/* Premium Badge */}
              {author.role === 'USERPLUS' && (
                <View style={styles.modalPremiumBadge}>
                  <LinearGradient
                    colors={['#974d9e', '#5491cd']}
                    style={styles.modalPremiumBadgeGradient}
                  >
                    <Text style={styles.modalPremiumIcon}>✨</Text>
                    <Text style={styles.modalPremiumText}>USERPLUS</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Time Badge */}
              <View style={styles.modalTimeBadge}>
                <Text style={styles.modalTimeText}>{formatTime(post.time)}</Text>
              </View>

              <View style={styles.modalBannerContent}>
                <Text style={styles.modalPostTitle}>{post.title}</Text>
                <Text style={styles.modalPostSubtitle}>by {author.userName || 'Unknown'}</Text>
              </View>
            </View>

            <View style={styles.modalMainContent}>
              {/* Profile Section */}
              <View style={styles.modalProfileSection}>
                <TouchableOpacity 
                  style={styles.modalProfileTouchable}
                  onPress={() => {
                    onClose();
                    router.push(`/profile/${author.userName}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Image 
                    source={{ uri: author.profilePic || currentUser?.profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
                    style={styles.modalAvatar}
                    defaultSource={require('../assets/images/dpp.jpg')}
                  />
                  <View style={styles.modalProfileInfo}>
                    <Text style={styles.modalUsername}>{author.userName || 'Unknown'}</Text>
                    <Text style={styles.modalDate}>{formatTime(post.time)}</Text>
                    {author.role === 'USERPLUS' && (
                      <View style={styles.modalProfilePremiumBadge}>
                        <Text style={styles.modalProfilePremiumText}>✨ USERPLUS ARTIST</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                
                {/* Play Button */}
                <TouchableOpacity 
                  style={[
                    styles.modalSmallPlayButton,
                    (isButtonLoading || isLoading) && styles.modalSmallPlayButtonDisabled
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
                    style={styles.modalSmallPlayButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isButtonLoading || isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.modalSmallPlayIcon}>
                        {currentTrack && currentTrack.id === post.id && isPlaying ? '⏸' : '▶'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Description */}
              {post.description && post.description.trim() && (
                <Text style={styles.modalDescription}>{post.description}</Text>
              )}

              {/* Features */}
              {post.features && Array.isArray(post.features) && post.features.length > 0 && (
                <View style={styles.modalFeatures}>
                  <Text style={styles.modalFeaturesLabel}>🎤 Featuring:</Text>
                  <View style={styles.modalFeaturesList}>
                    {post.features.map((feature, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalFeatureTag}
                        onPress={() => {
                          onClose();
                          router.push(`/profile/${feature}`);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.modalFeatureText}>{feature}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Genre Tags */}
              {post.genre && Array.isArray(post.genre) && post.genre.length > 0 && (
                <View style={styles.modalGenres}>
                  <Text style={styles.modalGenresLabel}>🎵 Genres:</Text>
                  <View style={styles.modalGenresList}>
                    {post.genre.map((genreItem, index) => (
                      <View key={index} style={styles.modalGenreTag}>
                        <Text style={styles.modalGenreIcon}>{getGenreIcon(genreItem)}</Text>
                        <Text style={styles.modalGenreText}>{genreItem}</Text>
                      </View>
                    ))}
                  </View>
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
                  <Text style={styles.modalStatNumber}>{post.totalComments || localComments.length}</Text>
                  <Text style={styles.modalStatLabel}>Comments</Text>
                </View>
                
                <View style={styles.modalStatItem}>
                  <Text style={styles.modalStatIcon}>👁️</Text>
                  <Text style={styles.modalStatNumber}>{post.totalViews || 0}</Text>
                  <Text style={styles.modalStatLabel}>Views</Text>
                </View>
              </View>

              {/* Comments Section */}
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comments ({localComments.length})</Text>
                
                {localComments.length > 0 ? (
                  <View style={styles.commentsList}>
                    {localComments.map((comment, index) => (
                      <View key={comment.id || index} style={styles.commentItem}>
                        <Image 
                          source={{ uri: comment.userPic || author.profilePic || currentUser?.profilePic }} 
                          style={styles.commentAvatar}
                          defaultSource={require('../assets/images/dpp.jpg')}
                        />
                        <View style={styles.commentContent}>
                          <Text style={styles.commentAuthor}>{comment.userName || (typeof comment === 'object' ? comment.comment?.userName : null)}</Text>
                          <Text style={styles.commentText}>{comment.text || (typeof comment === 'object' ? comment.comment : comment)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noComments}>No comments yet</Text>
                )}

                {/* Add Comment */}
                <View style={styles.addCommentContainer}>
                  <Image 
                    source={{ uri: currentUser?.profilePic }} 
                    style={styles.commentInputAvatar}
                    defaultSource={require('../assets/images/dpp.jpg')}
                  />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
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

              {/* Actions */}
              <View style={styles.modalActionsContainer}>
                <TouchableOpacity 
                  style={styles.modalActionBtn}
                  onPress={() => {
                    onClose();
                    router.push(`/post/${post.id}`);
                  }}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.modalActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.modalActionIcon}>🎵</Text>
                    <Text style={styles.modalActionText}>View Full Post</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {post.freeDownload && (
                  <TouchableOpacity 
                    style={styles.modalDownloadBtn}
                    onPress={handleDownload}
                    disabled={isDownloading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#43e97b', '#38f9d7']}
                      style={styles.modalDownloadGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isDownloading ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                          <Text style={styles.modalDownloadText}>Downloading...</Text>
                        </>
                      ) : (
                        <>
                          <Text style={styles.modalDownloadIcon}>⬇️</Text>
                          <Text style={styles.modalDownloadText}>Free Download</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {showDelete && currentUser && author.userName === currentUser.userName && (
                  <TouchableOpacity 
                    style={styles.modalDeleteBtn}
                    onPress={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <ActivityIndicator size="small" color="#ff4444" />
                    ) : (
                      <Text style={styles.modalDeleteText}>🗑️ Delete Post</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  modalOverlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
    zIndex: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
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
    fontSize: 24,
    fontWeight: '300',
  },
  modalScrollView: {
    maxHeight: 600,
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
  modalPremiumBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalPremiumBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPremiumIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  modalPremiumText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalTimeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  modalTimeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  modalPostSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modalMainContent: {
    paddingBottom: 20,
  },
  modalProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 16,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  modalProfileInfo: {
    flex: 1,
  },
  modalUsername: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  modalProfilePremiumBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(151, 77, 158, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  modalProfilePremiumText: {
    color: '#974d9e',
    fontSize: 11,
    fontWeight: '700',
  },
  modalSmallPlayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  modalSmallPlayButtonDisabled: {
    opacity: 0.5,
  },
  modalSmallPlayButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSmallPlayIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginLeft: 2,
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
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  modalFeatureText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
  },
  modalGenres: {
    marginBottom: 24,
  },
  modalGenresLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalGenresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalGenreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalGenreIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  modalGenreText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  likedIcon: {
    transform: [{ scale: 1.1 }],
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
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    color: '#667eea',
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
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  commentButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  commentButtonDisabled: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
  },
  commentButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalActionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  modalActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalActionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalActionIcon: {
    fontSize: 18,
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDownloadBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalDownloadGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalDownloadIcon: {
    fontSize: 18,
  },
  modalDownloadText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalShareBtn: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalShareIcon: {
    fontSize: 18,
  },
  modalShareText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ff4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '700',
  },
});

