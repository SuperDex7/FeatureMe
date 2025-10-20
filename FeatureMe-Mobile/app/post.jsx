import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import api, { getCurrentUserSafe } from '../services/api';
import {
  deleteComment,
  deletePost,
  addView,
  trackDownload,
  addComment,
  getCommentsPaginated,
} from '../services/postsService';

const { width: screenWidth } = Dimensions.get('window');

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState([]);
  const [localLikes, setLocalLikes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
  const [commentPage, setCommentPage] = useState(0);
  const [commentSize] = useState(10);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load comments with pagination
  const loadComments = async (page = 0, append = false) => {
    setLoadingComments(true);
    try {
      const response = await getCommentsPaginated(id, page, commentSize);
      const newComments = response.data.content || [];
      
      if (append) {
        setComments(prev => [...prev, ...newComments]);
      } else {
        setComments(newComments);
      }
      
      setHasMoreComments(newComments.length === commentSize && (page + 1) * commentSize < totalComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      if (!append) {
        setComments([]);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUserSafe();
        setCurrentUser(user);
        
        const res = await api.get(`/posts/get/id/${id}`);
        setPost(res.data);
        setLocalLikes(Array.isArray(res.data.likes) ? res.data.likes : []);
        setTotalComments(res.data.totalComments || 0);
        
        loadComments(0, false);
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Create a mock post for testing when API is not available
        if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
          const mockPost = {
            id: id,
            title: 'Sample Track',
            description: 'This is a sample track for testing the mobile app.',
            music: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Sample audio URL
            author: {
              userName: 'SampleArtist',
              profilePic: 'https://via.placeholder.com/150',
              banner: 'https://via.placeholder.com/400x200',
              bio: 'Sample music creator'
            },
            genre: ['Hip Hop', 'Electronic'],
            features: ['Vocals', 'Beat'],
            status: 'PUBLISHED',
            freeDownload: true,
            totalViews: 150,
            totalComments: 5,
            totalDownloads: 12,
            time: new Date().toISOString(),
            likes: [
              { userName: 'user1', profilePic: 'https://via.placeholder.com/50' },
              { userName: 'user2', profilePic: 'https://via.placeholder.com/50' }
            ]
          };
          
          setPost(mockPost);
          setLocalLikes(mockPost.likes);
          setTotalComments(mockPost.totalComments);
          
          // Mock comments
          const mockComments = [
            {
              id: 1,
              userName: 'user1',
              profilePic: 'https://via.placeholder.com/50',
              comment: 'Great track! Love the beat.',
              time: new Date().toISOString()
            },
            {
              id: 2,
              userName: 'user2',
              profilePic: 'https://via.placeholder.com/50',
              comment: 'Amazing work! 🔥',
              time: new Date().toISOString()
            }
          ];
          setComments(mockComments);
          
          Alert.alert(
            'Demo Mode', 
            'API is not available. Showing sample data for testing.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to load post');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Load more comments function
  const loadMoreComments = () => {
    if (!loadingComments && hasMoreComments) {
      const nextPage = commentPage + 1;
      setCommentPage(nextPage);
      loadComments(nextPage, true);
    }
  };

  const handleComment = async () => {
    if (commentInput.trim() && currentUser) {
      const newComment = {
        userName: currentUser.userName,
        profilePic: currentUser.profilePic,
        comment: commentInput
      };
      
      // Optimistically add comment to UI
      setComments(prevComments => [...prevComments, newComment]);
      setCommentInput('');
      
      try {
        await addComment(id, commentInput);
        setCommentPage(0);
        loadComments(0, false);
        setTotalComments(prev => prev + 1);
      } catch (err) {
        console.error(err);
        setComments(prevComments => 
          prevComments.filter(c => c.comment !== newComment.comment)
        );
        setCommentInput(newComment.comment);
        Alert.alert('Error', 'Failed to post comment');
      }
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!currentUser || !comment.id) {
      console.error('Cannot delete comment: missing user or comment ID');
      return;
    }
    
    setDeletingComment(comment.id);
    
    try {
      await deleteComment(comment.id);
      loadComments(commentPage, false);
      setTotalComments(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting comment:', err);
      Alert.alert('Error', 'Failed to delete comment');
    } finally {
      setDeletingComment(null);
    }
  };

  const handlePlayPause = async () => {
    // Add view tracking when playing
    if (!isPlaying) {
      const userName = currentUser ? currentUser.userName : 'unknown';
      try {
        await addView(id, userName);
      } catch (error) {
        console.error('Error adding view:', error);
      }
    }

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.createAsync(
          { uri: post.music },
          { shouldPlay: true, volume: isMuted ? 0 : volume }
        );
        setSound(newSound);
        setIsPlaying(true);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentTime(0);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const handleSeek = async (seekTime) => {
    if (sound) {
      try {
        await sound.setPositionAsync(seekTime * 1000);
        setCurrentTime(seekTime);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const handleVolumeChange = async (newVolume) => {
    setVolume(newVolume);
    if (sound) {
      try {
        await sound.setVolumeAsync(newVolume);
      } catch (error) {
        console.error('Error changing volume:', error);
      }
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = async () => {
    if (sound) {
      try {
        if (isMuted) {
          await sound.setVolumeAsync(volume);
          setIsMuted(false);
        } else {
          await sound.setVolumeAsync(0);
          setIsMuted(true);
        }
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLikeUpdate = (updatedLikes) => {
    setLocalLikes(updatedLikes);
  };

  const handleDownload = async () => {
    if (!post.freeDownload) {
      Alert.alert('Download Not Available', 'Downloads are not enabled for this track.');
      return;
    }

    try {
      const fileName = `${post.title} - ${post.author.userName}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(post.music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          const userName = currentUser ? currentUser.userName : 'unknown';
          await trackDownload(id, userName);
          console.log('Download tracked for:', post.title);
        } catch (error) {
          console.error('Error tracking download:', error);
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to delete posts');
      return;
    }

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
              await deletePost(id);
              router.replace('/feed');
            } catch (err) {
              console.error('Error deleting post:', err);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            } finally {
              setIsDeletingPost(false);
            }
          }
        }
      ]
    );
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading track...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Post Hero Section */}
      <View style={styles.heroSection}>
        <Image source={{ uri: post.author.banner }} style={styles.heroBackground} />
        <View style={styles.heroOverlay}>
          <View style={styles.heroContent}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeIcon}>🎵</Text>
              <Text style={styles.badgeText}>
                {post.status === 'PUBLISHED' && 'TRACK'}
                {post.status === 'DRAFT' && 'DRAFT'}
                {post.status === 'PARTIALLY_APPROVED' && 'PARTIALLY APPROVED'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{post.title}</Text>
            <Text style={styles.heroSubtitle}>by {post.author.userName}</Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.playButton, isPlaying && styles.playingButton]}
                onPress={handlePlayPause}
              >
                <Text style={styles.actionIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
                <Text style={styles.actionText}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.profileButton]}
                onPress={() => router.push(`/profile/${post.author.userName}`)}
              >
                <Text style={styles.actionIcon}>👤</Text>
                <Text style={styles.actionText}>View Profile</Text>
              </TouchableOpacity>
              
              {post.freeDownload && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.downloadButton]}
                  onPress={handleDownload}
                >
                  <Text style={styles.actionIcon}>⬇️</Text>
                  <Text style={styles.actionText}>Download</Text>
                </TouchableOpacity>
              )}
              
              {currentUser && currentUser.userName === post.author.userName && (
                <>
                  {currentUser.role === 'USERPLUS' ? (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.analyticsButton]}
                      onPress={() => setShowViewsAnalytics(true)}
                    >
                      <Text style={styles.actionIcon}>📊</Text>
                      <Text style={styles.actionText}>Analytics</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.analyticsButton]}
                      onPress={() => Alert.alert('Premium Feature', 'Get a Plus Membership to view analytics')}
                    >
                      <Text style={styles.actionIcon}>📊</Text>
                      <Text style={styles.actionText}>Analytics</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeletePost}
                    disabled={isDeletingPost}
                  >
                    <Text style={styles.actionIcon}>🗑️</Text>
                    <Text style={styles.actionText}>
                      {isDeletingPost ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Audio Player Section */}
      <View style={styles.audioPlayerSection}>
        <View style={styles.audioPlayerContainer}>
          <View style={styles.audioPlayerInfo}>
            <Image source={{ uri: post.author.banner }} style={styles.audioCover} />
            <View style={styles.audioDetails}>
              <Text style={styles.audioTrackTitle}>{post.title}</Text>
              <Text style={styles.audioTrackArtist}>{post.author.userName}</Text>
            </View>
          </View>
          
          <View style={styles.audioPlayerControls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
              <Text style={styles.controlIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <Text style={styles.timeDisplay}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <TouchableOpacity 
                  style={styles.progressBarTouchable}
                  onPress={(event) => {
                    const { locationX } = event.nativeEvent;
                    const progressWidth = screenWidth - 120; // Approximate progress bar width
                    const seekTime = (locationX / progressWidth) * duration;
                    handleSeek(seekTime);
                  }}
                >
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${duration ? (currentTime / duration) * 100 : 0}%` }
                    ]} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.timeDisplay}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          <View style={styles.audioPlayerVolume}>
            <TouchableOpacity style={styles.volumeButton} onPress={toggleMute}>
              <Text style={styles.volumeIcon}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </Text>
            </TouchableOpacity>
            {/* Volume slider would go here - simplified for now */}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContainer}>
        <View style={styles.contentGrid}>
          {/* Left Column - Track Details */}
          <View style={styles.leftColumn}>
            {/* Artist Profile Card */}
            <View style={styles.artistCard}>
              <View style={styles.artistHeader}>
                <Image source={{ uri: post.author.profilePic }} style={styles.artistAvatar} />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{post.author.userName}</Text>
                  <Text style={styles.artistBio}>{post.author.bio || 'Music creator'}</Text>
                </View>
              </View>
              <View style={styles.artistStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{localLikes?.length || 0}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{totalComments || 0}</Text>
                  <Text style={styles.statLabel}>Comments</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{post.totalViews || 0}</Text>
                  <Text style={styles.statLabel}>Views</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {(() => {
                      const postDate = new Date(post.time);
                      const currentDate = new Date();
                      const timeDiff = currentDate.getTime() - postDate.getTime();
                      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
                      
                      if (daysDiff === 0) return 'Today';
                      if (daysDiff === 1) return '1 day ago';
                      if (daysDiff < 7) return `${daysDiff} days ago`;
                      if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
                      if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
                      return `${Math.floor(daysDiff / 365)} years ago`;
                    })()}
                  </Text>
                  <Text style={styles.statLabel}>Released</Text>
                </View>
              </View>
            </View>

            {/* Track Information */}
            <View style={styles.trackDetailsCard}>
              <Text style={styles.cardTitle}>Track Details</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📅</Text>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Released</Text>
                    <Text style={styles.detailValue}>{new Date(post.time).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎭</Text>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Genre</Text>
                    <Text style={styles.detailValue}>{post.genre.join(' • ')}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🤝</Text>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Features</Text>
                    <Text style={styles.detailValue}>{post?.features?.join(' • ') || 'None'}</Text>
                  </View>
                </View>
                {post.freeDownload && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailIcon}>⬇️</Text>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Download</Text>
                      <TouchableOpacity style={styles.downloadTrackBtn} onPress={handleDownload}>
                        <Text style={styles.downloadTrackBtnText}>Download Track</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Tags Cloud */}
            <View style={styles.tagsCard}>
              <Text style={styles.cardTitle}>Tags</Text>
              <View style={styles.tagsCloud}>
                {post.genre.map((tag, index) => (
                  <Text key={index} style={[styles.tagPill, styles.genreTag]}>
                    #{tag.toLowerCase()}
                  </Text>
                ))}
                {post.features.map((feature, index) => (
                  <Text key={index} style={[styles.tagPill, styles.featureTag]}>
                    #{feature.toLowerCase()}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Right Column - Main Content */}
          <View style={styles.rightColumn}>
            {/* Content Navigation */}
            <View style={styles.contentNav}>
              <TouchableOpacity 
                style={[styles.navTab, activeTab === 'overview' && styles.activeNavTab]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={[styles.navTabText, activeTab === 'overview' && styles.activeNavTabText]}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navTab, styles.disabledNavTab]}
                disabled
              >
                <Text style={[styles.navTabText, styles.disabledNavTabText]}>
                  Licensing
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.navTab, activeTab === 'community' && styles.activeNavTab]}
                onPress={() => setActiveTab('community')}
              >
                <Text style={[styles.navTabText, activeTab === 'community' && styles.activeNavTabText]}>
                  Community
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                <View style={styles.overviewSection}>
                  <Text style={styles.sectionTitle}>About This Track</Text>
                  <Text style={styles.trackDescription}>{post.description}</Text>
                  
                  <View style={styles.trackMetrics}>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricIcon}>🎧</Text>
                      <View style={styles.metricContent}>
                        <Text style={styles.metricValue}>Ready to</Text>
                        <Text style={styles.metricLabel}>Record</Text>
                      </View>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricIcon}>🎯</Text>
                      <View style={styles.metricContent}>
                        <Text style={styles.metricValue}>Perfect for</Text>
                        <Text style={styles.metricLabel}>{post.genre[0]}</Text>
                      </View>
                    </View>
                    <View style={styles.metricCard}>
                      <Text style={styles.metricIcon}>⭐</Text>
                      <View style={styles.metricContent}>
                        <Text style={styles.metricValue}>Premium</Text>
                        <Text style={styles.metricLabel}>Quality</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'community' && (
              <View style={styles.tabContent}>
                <View style={styles.communitySection}>
                  <Text style={styles.sectionTitle}>Community</Text>
                  
                  {/* Likes Section - simplified for now */}
                  <View style={styles.likesSection}>
                    <Text style={styles.subsectionTitle}>Likes ({localLikes?.length || 0})</Text>
                    <TouchableOpacity style={styles.likeButton}>
                      <Text style={styles.likeIcon}>❤️</Text>
                      <Text style={styles.likeText}>Like</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Comments Section */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.subsectionTitle}>Comments ({totalComments || 0})</Text>
                    <View style={styles.commentsList}>
                      {loadingComments && comments.length === 0 ? (
                        <View style={styles.commentsLoading}>
                          <ActivityIndicator size="small" color="#007AFF" />
                          <Text style={styles.loadingText}>Loading comments...</Text>
                        </View>
                      ) : comments?.length > 0 ? (
                        comments.map((comment, index) => (
                          <View key={index} style={styles.commentItem}>
                            <TouchableOpacity onPress={() => router.push(`/profile/${comment.userName}`)}>
                              <Image source={{ uri: comment.profilePic }} style={styles.commentAvatar} />
                            </TouchableOpacity>
                            <View style={styles.commentContent}>
                              <View style={styles.commentHeader}>
                                <TouchableOpacity onPress={() => router.push(`/profile/${comment.userName}`)}>
                                  <Text style={styles.commentUsername}>{comment.userName}</Text>
                                </TouchableOpacity>
                                <View style={styles.commentHeaderRight}>
                                  <Text style={styles.commentTime}>{new Date(comment.time).toLocaleDateString()}</Text>
                                  {currentUser && (currentUser.userName === comment.userName || (post && currentUser.userName === post.author.userName)) && (
                                    <TouchableOpacity
                                      style={styles.deleteCommentBtn}
                                      onPress={() => handleDeleteComment(comment)}
                                      disabled={deletingComment === comment.id}
                                    >
                                      <Text style={styles.deleteCommentIcon}>
                                        {deletingComment === comment.id ? '...' : '🗑️'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                              <Text style={styles.commentText}>{comment.comment}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.noComments}>
                          <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Load More Comments Button */}
                    {hasMoreComments && (
                      <View style={styles.loadMoreSection}>
                        <TouchableOpacity 
                          style={styles.loadMoreBtn}
                          onPress={loadMoreComments}
                          disabled={loadingComments}
                        >
                          {loadingComments ? (
                            <>
                              <ActivityIndicator size="small" color="#007AFF" />
                              <Text style={styles.loadMoreText}>Loading...</Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.loadMoreIcon}>↓</Text>
                              <Text style={styles.loadMoreText}>Load More Comments</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    <View style={styles.addComment}>
                      <TextInput 
                        style={styles.commentInput}
                        value={commentInput}
                        onChangeText={setCommentInput}
                        placeholder="Add a comment..."
                        multiline
                      />
                      <TouchableOpacity style={styles.commentBtn} onPress={handleComment}>
                        <Text style={styles.commentBtnText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  heroSection: {
    height: 300,
    position: 'relative',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  playButton: {
    backgroundColor: '#007AFF',
  },
  playingButton: {
    backgroundColor: '#FF3B30',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  downloadButton: {
    backgroundColor: '#34C759',
  },
  analyticsButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  audioPlayerSection: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 20,
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  audioPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  audioCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  audioDetails: {
    flex: 1,
  },
  audioTrackTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  audioTrackArtist: {
    color: '#8E8E93',
    fontSize: 14,
  },
  audioPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  controlButton: {
    marginRight: 20,
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeDisplay: {
    color: '#8E8E93',
    fontSize: 12,
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
    marginHorizontal: 10,
    position: 'relative',
  },
  progressBarTouchable: {
    flex: 1,
    height: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  audioPlayerVolume: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  volumeButton: {
    padding: 5,
  },
  volumeIcon: {
    fontSize: 20,
    color: '#fff',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contentGrid: {
    flexDirection: 'row',
  },
  leftColumn: {
    flex: 1,
    marginRight: 20,
  },
  rightColumn: {
    flex: 2,
  },
  artistCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  artistAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  artistBio: {
    color: '#8E8E93',
    fontSize: 14,
  },
  artistStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  trackDetailsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  detailGrid: {
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 30,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
  },
  downloadTrackBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 5,
  },
  downloadTrackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
  },
  tagsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#3A3A3C',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 12,
  },
  genreTag: {
    backgroundColor: '#007AFF',
  },
  featureTag: {
    backgroundColor: '#34C759',
  },
  contentNav: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 4,
  },
  navTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeNavTab: {
    backgroundColor: '#007AFF',
  },
  disabledNavTab: {
    opacity: 0.5,
  },
  navTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#fff',
  },
  disabledNavTabText: {
    color: '#8E8E93',
  },
  tabContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
  },
  overviewSection: {
    gap: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  trackDescription: {
    color: '#8E8E93',
    fontSize: 16,
    lineHeight: 24,
  },
  trackMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricContent: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricLabel: {
    color: '#8E8E93',
    fontSize: 10,
  },
  communitySection: {
    gap: 20,
  },
  subsectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  likesSection: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 15,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  likeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  commentsSection: {
    gap: 15,
  },
  commentsList: {
    gap: 15,
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentUsername: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentTime: {
    color: '#8E8E93',
    fontSize: 12,
  },
  deleteCommentBtn: {
    padding: 5,
  },
  deleteCommentIcon: {
    fontSize: 14,
    color: '#FF3B30',
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noCommentsText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  loadMoreSection: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  loadMoreIcon: {
    fontSize: 16,
    color: '#007AFF',
  },
  loadMoreText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  commentBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  commentBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
