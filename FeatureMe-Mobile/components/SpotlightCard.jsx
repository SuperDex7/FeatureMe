import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addView, addLike } from '../services/postsService';
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

// Normalize genre names and provide a robust icon lookup
function getGenreIcon(genre) {
  if (!genre) return GENRE_ICONS.Default;
  const lower = String(genre).toLowerCase();
  if (lower === 'hiphop' || lower === 'hip-hop') return GENRE_ICONS['Hip Hop'];
  if (lower === 'r&b' || lower === 'rnb') return GENRE_ICONS['R&B'];
  if (lower === 'afrobeats') return GENRE_ICONS['Afrobeat'];
  return GENRE_ICONS[genre] || GENRE_ICONS[genre?.trim()] || GENRE_ICONS.Default;
}

// Enhanced Spotlight Card Component - Special version of regular posts
export default function SpotlightCard({ 
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
  onSpotlightPress // New prop for handling spotlight-specific interactions
}) {
  const { userName, profilePic, banner, role } = author ?? {};
  const [localLikes, setLocalLikes] = useState(likes);
  const [localComments, setLocalComments] = useState(comments);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isPlayButtonLoading, setIsPlayButtonLoading] = useState(false);
  
  // Audio context
  const { playTrack, currentTrack, isPlaying, isLoading } = useAudio();

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

  const handleSpotlightPress = () => {
    // Call the spotlight press handler from main-app.jsx
    if (onSpotlightPress) {
      onSpotlightPress({
        id,
        author,
        description,
        time,
        title,
        features,
        genre,
        music,
        comments: localComments,
        likes: localLikes,
        totalViews,
        totalComments,
        totalDownloads,
        freeDownload
      });
    }
  };

  const isLiked = currentUser && localLikes.some(like => like.userName === currentUser.userName);

  return (
    <TouchableOpacity 
      style={styles.spotlightCard}
      onPress={handleSpotlightPress}
      activeOpacity={0.8}
    >
      {/* Enhanced Spotlight Header with Special Effects */}
      <View style={styles.spotlightCardHeader}>
        <Image 
          source={{ uri: banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" }}
          style={styles.spotlightCardBanner}
          defaultSource={require('../assets/images/pb.jpg')}
        />
        
        {/* Special Spotlight Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.4)']}
          style={styles.spotlightCardOverlay}
        />
        
        {/* Spotlight Glow Effect */}
        <View style={styles.spotlightGlow} />
        
        {/* Play Button Overlay */}
        <TouchableOpacity 
          style={[
            styles.spotlightPlayOverlay,
            (isPlayButtonLoading || isLoading) && styles.spotlightPlayOverlayDisabled
          ]} 
          onPress={handlePlayClick}
          disabled={isPlayButtonLoading || isLoading}
          activeOpacity={0.8}
        >
          <View style={[
            styles.spotlightPlayButton,
            (isPlayButtonLoading || isLoading) && styles.spotlightPlayButtonDisabled
          ]}>
            {isPlayButtonLoading || isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.spotlightPlayIcon}>
                {currentTrack && currentTrack.id === id && isPlaying ? '⏸' : '▶'}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Enhanced Spotlight Badge */}
        <View style={styles.spotlightBadge}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.spotlightBadgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.spotlightBadgeIcon}>⭐</Text>
            <Text style={styles.spotlightBadgeText}>SPOTLIGHT</Text>
          </LinearGradient>
        </View>

        {/* Time Badge */}
        <View style={styles.spotlightTimeBadge}>
          <Text style={styles.spotlightTimeText}>{formatTime(time)}</Text>
        </View>

        {/* Spotlight Stats Overlay */}
        <View style={styles.spotlightStatsOverlay}>
          <View style={styles.spotlightStatItem}>
            <Text style={styles.spotlightStatIcon}>🔥</Text>
            <Text style={styles.spotlightStatNumber}>{localLikes.length}</Text>
          </View>
          <View style={styles.spotlightStatItem}>
            <Text style={styles.spotlightStatIcon}>💬</Text>
            <Text style={styles.spotlightStatNumber}>{totalComments || localComments.length}</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Spotlight Content */}
      <View style={styles.spotlightCardContent}>
        {/* Profile Section */}
        <View style={styles.spotlightProfileSection}>
          <Image 
            source={{ uri: profilePic || "https://randomuser.me/api/portraits/men/32.jpg" }}
            style={styles.spotlightAvatar}
            defaultSource={require('../assets/images/dpp.jpg')}
          />
          <View style={styles.spotlightProfileInfo}>
            <Text style={styles.spotlightUsername}>{userName}</Text>
            <Text style={styles.spotlightTime}>{formatTime(time)}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.spotlightTitle} numberOfLines={2}>{title}</Text>

        {/* Description */}
        {description && description.trim() && (
          <Text style={styles.spotlightDescription} numberOfLines={3}>{description}</Text>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <View style={styles.spotlightFeaturesContainer}>
            <Text style={styles.spotlightFeaturesLabel}>Feat:</Text>
            <Text style={styles.spotlightFeaturesList}>
              {features.slice(0, 2).map((feature, index) => (
                <Text key={index} style={styles.spotlightFeatureLink}>{feature}</Text>
              ))}
              {features.length > 2 && (
                <Text style={styles.spotlightFeatureMore}>+{features.length - 2} more</Text>
              )}
            </Text>
          </View>
        )}

        {/* Genre Tags */}
        {genre && Array.isArray(genre) && genre.length > 0 && (
          <View style={styles.spotlightGenresContainer}>
            {genre.slice(0, 3).map((genreItem, index) => (
              <View key={index} style={styles.spotlightGenreTag}>
                <Text style={styles.spotlightGenreIcon}>{getGenreIcon(genreItem)}</Text>
                <Text style={styles.spotlightGenreText}>{genreItem}</Text>
              </View>
            ))}
            {genre.length > 3 && (
              <Text style={styles.spotlightGenreMore}>+{genre.length - 3}</Text>
            )}
          </View>
        )}

        {/* Enhanced Stats Row */}
        <View style={styles.spotlightStatsRow}>
          <TouchableOpacity 
            style={styles.spotlightStatItem}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Text style={[styles.spotlightStatIcon, isLiked && styles.spotlightLikedIcon]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.spotlightStatCount}>{localLikes.length}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.spotlightStatItem}
            onPress={handleSpotlightPress}
          >
            <Text style={styles.spotlightStatIcon}>💬</Text>
            <Text style={styles.spotlightStatCount}>{totalComments || localComments.length}</Text>
          </TouchableOpacity>
          
          <View style={styles.spotlightStatItem}>
            <Text style={styles.spotlightStatIcon}>👁️</Text>
            <Text style={styles.spotlightStatCount}>{totalViews || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Enhanced Spotlight Card Styles
  spotlightCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    position: 'relative',
  },

  // Spotlight Header
  spotlightCardHeader: {
    position: 'relative',
    height: 220,
    overflow: 'hidden',
  },
  spotlightCardBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  spotlightCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  spotlightGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },

  // Play Button
  spotlightPlayOverlay: {
    position: 'absolute',
    top: '43%',
    left: '50%',
    transform: [{ translateX: -35 }, { translateY: -35 }],
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  spotlightPlayOverlayDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  spotlightPlayButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightPlayButtonDisabled: {
    backgroundColor: '#4a5568',
  },
  spotlightPlayIcon: {
    fontSize: 24,
    color: '#ffffff',
    marginLeft: 3,
    fontWeight: 'bold',
  },

  // Spotlight Badge
  spotlightBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  spotlightBadgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  spotlightBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Time Badge
  spotlightTimeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  spotlightTimeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Overlay
  spotlightStatsOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  spotlightStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  spotlightStatIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  spotlightStatNumber: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Content
  spotlightCardContent: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Profile Section
  spotlightProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  spotlightAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#667eea',
    marginRight: 12,
  },
  spotlightProfileInfo: {
    flex: 1,
  },
  spotlightUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },

  // Title and Description
  spotlightTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotlightDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },

  // Features
  spotlightFeaturesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotlightFeaturesLabel: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotlightFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  spotlightFeatureLink: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  spotlightFeatureMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },

  // Genres
  spotlightGenresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  spotlightGenreTag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotlightGenreIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  spotlightGenreText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  spotlightGenreMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },

  // Stats Row
  spotlightStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102, 126, 234, 0.2)',
  },
  spotlightStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  spotlightStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  spotlightStatCount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  spotlightLikedIcon: {
    transform: [{ scale: 1.2 }],
  },
});
