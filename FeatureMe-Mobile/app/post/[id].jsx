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
  RefreshControl,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api, { getCurrentUserSafe } from '../../services/api';
import {
  deleteComment,
  deletePost,
  addView,
  trackDownload,
  addComment,
  getCommentsPaginated,
  addLike,
} from '../../services/postsService';
import BottomNavigation from '../../components/BottomNavigation';
import { useAudio } from '../../contexts/AudioContext';
import CentralizedAudioPlayer from '../../components/CentralizedAudioPlayer';

const { width: screenWidth } = Dimensions.get('window');

export default function PostScreen() {
  const { id } = useLocalSearchParams();
  
  const { playTrack, showPlayer, currentTrack, isPlaying, isLoading, position, duration, seekTo, setVolumeLevel } = useAudio();
  
  const [post, setPost] = useState(null);
  const [sound, setSound] = useState(null);
  const [activeTab, setActiveTab] = useState('community');
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPlayButtonLoading, setIsPlayButtonLoading] = useState(false);

  // Log once when component mounts or id changes
  useEffect(() => {
    console.log('=== POST PAGE LOADED ===');
    console.log('PostScreen - Received ID:', id);
    console.log('PostScreen - ID type:', typeof id);
  }, [id]);

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

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const user = await getCurrentUserSafe();
      setCurrentUser(user);
      
      const res = await api.get(`/posts/get/id/${id}`);
      setPost(res.data);
      setLocalLikes(Array.isArray(res.data.likes) ? res.data.likes : []);
      setTotalComments(res.data.totalComments || 0);
      
      // Reset and reload comments
      setCommentPage(0);
      await loadComments(0, false);
    } catch (error) {
      console.error('Error refreshing post:', error);
    } finally {
      setRefreshing(false);
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

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert('Please Login', 'You must be logged in to like posts');
      return;
    }

    // Save original state before optimistic update
    const originalLikes = [...localLikes];
    const userAlreadyLiked = localLikes.some(like => like.userName === currentUser.userName);
    
    try {
      // Optimistically update UI first
      if (userAlreadyLiked) {
        // Remove like immediately
        setLocalLikes(localLikes.filter(like => like.userName !== currentUser.userName));
      } else {
        // Add like immediately
        setLocalLikes([...localLikes, {
          userName: currentUser.userName,
          profilePic: currentUser.profilePic
        }]);
      }
      
      // Then call API
      await addLike(id);
    } catch (err) {
      console.error('Error toggling like:', err);
      
      // Revert to original state on error
      setLocalLikes(originalLikes);
      
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleSharePost = async () => {
    try {
      const shareMessage = post?.title 
        ? `Check out "${post.title}" by ${post.author?.userName || 'Unknown'} on FeatureMe! 🎵`
        : `Check out this post on FeatureMe! 🎵`;
      
      // Use web URL format for better compatibility and clickable links
      const postUrl = `https://featureme.co/post/${id}`;
      
      // Use url property for clickable links (works better than putting it in message)
      await Share.share({
        message: shareMessage,
        url: postUrl, // This makes the link tappable on iOS and Android
        title: post?.title || 'FeatureMe Post',
      });
    } catch (error) {
      // User cancelled the share dialog (this is expected behavior, not an error)
      if (error.message && !error.message.includes('User did not share')) {
        console.error('Error sharing post:', error);
        Alert.alert('Error', 'Failed to share post. Please try again.');
      }
    }
  };

  const handlePlayPause = async () => {
    if (isLoading || isPlayButtonLoading) return;
    
    setIsPlayButtonLoading(true);
    
    try {
      // Add view tracking with cooldown (only track when play button is pressed)
      if (currentUser) {
        const cooldownKey = `view_${id}_${currentUser.userName}`;
        const lastViewTime = await AsyncStorage.getItem(cooldownKey);
        const now = Date.now();
        const cooldown = 15 * 1000; // 15 seconds cooldown
        
        if (!lastViewTime || (now - parseInt(lastViewTime)) > cooldown) {
          try {
            await addView(id, currentUser.userName);
            await AsyncStorage.setItem(cooldownKey, now.toString());
          } catch (error) {
            console.error('Error adding view:', error);
          }
        }
      }
      
      // Create track object for audio context
      const trackData = {
        id: post.id,
        title: post.title,
        author: post.author,
        music: post.music,
        description: post.description,
        time: post.time,
        features: post.features,
        genre: post.genre,
        likes: localLikes,
        comments,
        totalViews: post.totalViews,
        totalComments,
        totalDownloads: post.totalDownloads,
        freeDownload: post.freeDownload
      };
      
      // Check if this track is currently playing
      const isCurrentTrack = currentTrack && currentTrack.id === post.id;
      
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

    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const fileName = `${post.title} - ${post.author?.userName || 'Unknown'}.mp3`;
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
    } finally {
      setIsDownloading(false);
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
              router.replace('/main-app');
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

  // Show player when current track changes and matches post
  useEffect(() => {
    if (currentTrack && currentTrack.id === post?.id) {
      showPlayer();
    }
  }, [currentTrack, post, showPlayer]);

  if (loading) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading track...</Text>
        </View>
        <BottomNavigation activeTab="" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found</Text>
        </View>
        <BottomNavigation activeTab="" />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      {/* Back Header */}
      <View style={{position:'absolute',top:25,left:0,right:0,zIndex:10,flexDirection:'row',alignItems:'center',paddingTop:40,paddingBottom:10,paddingHorizontal:16,backgroundColor:'rgba(15, 15, 35, 0.95)'}}>
        <TouchableOpacity onPress={() => router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.1)',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:24,color:'white'}}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18,fontWeight:'600',color:'white'}} numberOfLines={1}>
            {post ? `${post.title} - ${post.author?.userName || 'Unknown'}` : 'Post'}
          </Text>
        </View>
        <View style={{width:36}} />
      </View>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
            colors={['#00d4ff']}
          />
        }
      >
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
                disabled={isPlayButtonLoading || isLoading}
              >
                {isPlayButtonLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.actionText}>Loading...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.actionIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
                    <Text style={styles.actionText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                  </>
                )}
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
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.actionIcon}>⬇️</Text>
                      <Text style={styles.actionText}>Download</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleSharePost}
              >
                <Text style={styles.actionIcon}>🔗</Text>
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>
              
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

            {/* Community Section */}
            <View style={styles.communityCard}>
              <Text style={styles.cardTitle}>Community</Text>
              
              {/* Likes Section */}
              <View style={styles.likesSection}>
                <Text style={styles.subsectionTitle}>Likes ({localLikes?.length || 0})</Text>
                <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                  <Text style={styles.likeIcon}>❤️</Text>
                  <Text style={styles.likeText}>
                    {localLikes?.some(like => like.userName === currentUser?.userName) ? 'Liked' : 'Like'}
                  </Text>
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

            {/* Track Information */}
            <View style={styles.trackDetailsCard}>
              <Text style={styles.cardTitle}>Track Details</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Text style={styles.detailIcon}>📅</Text>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Released</Text>
                    <Text style={styles.detailValue}>{new Date(post.time).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Text style={styles.detailIcon}>🎭</Text>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Genre</Text>
                    <Text style={styles.detailValue}>{post.genre.join(' • ')}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Text style={styles.detailIcon}>🤝</Text>
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Features</Text>
                    <Text style={styles.detailValue}>{post?.features?.join(' • ') || 'None'}</Text>
                  </View>
                </View>
                {post.freeDownload && (
                  <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                      <Text style={styles.detailIcon}>⬇️</Text>
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Download</Text>
                      <TouchableOpacity 
                        style={styles.downloadTrackBtn} 
                        onPress={handleDownload}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.downloadTrackBtnText}>Download Track</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Tags Cloud */}
            <View style={[styles.tagsCard, { marginTop: 20 }]}>
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
        </View>
      </View>
    </ScrollView>
    <BottomNavigation activeTab="" />
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingBottom: 90, // Space for bottom navigation
  },
  container: {
    marginTop:30,
    flex: 1,
    backgroundColor: '#0f0f23',

  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
  heroSection: {
    height: 300,
    position: 'relative',
    marginTop: 75,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    marginBottom: 20,
  },
  badgeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  badgeText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#b8b8b8',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 30,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  playButton: {
    backgroundColor: '#00d4ff',
  },
  playingButton: {
    backgroundColor: '#ff6b6b',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shareButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  downloadButton: {
    backgroundColor: '#00d4ff',
  },
  analyticsButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  actionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  audioPlayerSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 20,
  },
  audioPlayerContainer: {
    flexDirection: 'column',
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  audioPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  audioCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
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
    color: '#b8b8b8',
    fontSize: 14,
  },
  audioPlayerControls: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  timeDisplay: {
    color: '#b8b8b8',
    fontSize: 14,
    minWidth: 45,
    fontWeight: '500',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginHorizontal: 10,
    position: 'relative',
  },
  progressBarTouchable: {
    flex: 1,
    height: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 3,
  },
  audioPlayerVolume: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  contentGrid: {
    flexDirection: 'column',
  },
  leftColumn: {
    flex: 1,
    width: '100%',
  },
  rightColumn: {
    flex: 1,
    marginTop: 15,
    width: '100%',
  },
  artistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  artistAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.5)',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  artistBio: {
    color: '#b8b8b8',
    fontSize: 12,
  },
  artistStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  statNumber: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#b8b8b8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trackDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.3)',
    paddingBottom: 8,
  },
  detailGrid: {
    gap: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 10,
    marginRight: 15,
  },
  detailIcon: {
    fontSize: 20,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#b8b8b8',
    fontSize: 12,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadTrackBtn: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 5,
    width:110,
  },
  downloadTrackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  tagsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '500',
  },
  genreTag: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    color: '#00d4ff',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  featureTag: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    color: '#ff6b6b',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  contentNav: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 4,
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeNavTab: {
    backgroundColor: '#00d4ff',
  },
  disabledNavTab: {
    opacity: 0.5,
  },
  navTabText: {
    color: '#b8b8b8',
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#fff',
  },
  disabledNavTabText: {
    color: '#b8b8b8',
  },
  tabContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
  },
  overviewSection: {
    gap: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  trackDescription: {
    color: '#b8b8b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  trackMetrics: {
    flexDirection: 'column',
    gap: 10,
  },
  metricCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
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
    color: '#b8b8b8',
    fontSize: 14,
    marginBottom: 5,
  },
  metricLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  communityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  subsectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  likesSection: {
    marginBottom: 15,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  likeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  likeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  commentsSection: {
    gap: 10,
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
    gap: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
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
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentTime: {
    color: '#b8b8b8',
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
    color: '#b8b8b8',
    fontSize: 14,
    fontStyle: 'italic',
  },
  loadMoreSection: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  loadMoreIcon: {
    fontSize: 16,
    color: '#fff',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 15,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  commentBtn: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  commentBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

