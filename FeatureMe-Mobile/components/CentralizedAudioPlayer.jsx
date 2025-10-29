import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { trackDownload } from '../services/postsService';

const { height: screenHeight } = Dimensions.get('window');

const CentralizedAudioPlayer = ({ 
  isVisible, 
  currentTrack, 
  onClose,
  onPlayPause,
  isPlaying,
  position,
  duration,
  volume,
  onVolumeChange,
  onSeek,
  currentUser
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const dragPositionRef = useRef(0); // Use ref for real-time drag position
  const isDraggingRef = useRef(false); // Use ref for real-time dragging state
  const progressBarRef = useRef(null);
  const [progressBarWidth, setProgressBarWidth] = useState(300);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // PanResponder for drag functionality - recreate when width changes
  const panResponder = useRef(null);
  const tapStartLocation = useRef(null);
  const hasMoved = useRef(false);
  
  useEffect(() => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to touches within the progress bar bounds
        const { locationX } = evt.nativeEvent;
        const currentWidth = progressBarWidth || 300; // Use current width or fallback
        const isWithinBounds = locationX >= 0 && locationX <= currentWidth;
        if (isWithinBounds) {
          tapStartLocation.current = locationX;
          hasMoved.current = false;
        }
        return isWithinBounds;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Track if we've actually moved
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          hasMoved.current = true;
        }
        // Only respond to moves if we started the gesture
        return gestureState.dx !== 0 || gestureState.dy !== 0;
      },
      onPanResponderTerminationRequest: () => false, // Don't allow termination
      onShouldBlockNativeResponder: () => true, // Block native responder
      onPanResponderGrant: (evt) => {
        console.log('Drag grant - current position:', position, 'duration:', duration);
        isDraggingRef.current = true;
        setIsDragging(true);
        const { locationX } = evt.nativeEvent;
        const currentWidth = progressBarWidth || 300; // Use current width or fallback
        const percentage = Math.max(0, Math.min(100, (locationX / currentWidth) * 100));
        console.log('Drag start - locationX:', locationX, 'width:', currentWidth, 'percentage:', percentage);
        dragPositionRef.current = percentage;
        setDragPosition(percentage);
      },
      onPanResponderMove: (evt) => {
        if (!isDraggingRef.current) return; // Only update if we're actually dragging
        const { locationX } = evt.nativeEvent;
        const currentWidth = progressBarWidth || 300; // Use current width or fallback
        const percentage = Math.max(0, Math.min(100, (locationX / currentWidth) * 100));
        dragPositionRef.current = percentage;
        setDragPosition(percentage);
        console.log('Drag move - locationX:', locationX, 'width:', currentWidth, 'percentage:', percentage, 'ref:', dragPositionRef.current);
      },
      onPanResponderRelease: (evt) => {
        const finalPosition = dragPositionRef.current;
        const { locationX } = evt.nativeEvent;
        console.log('Drag release - final dragPosition:', finalPosition, 'duration:', duration, 'hasMoved:', hasMoved.current);
        
        // Only seek if this was a drag (has moved) OR if it was a tap (hasn't moved)
        // For tap, use the release location instead of drag position
        if (onSeek && duration > 0) {
          let seekTime;
          
          if (hasMoved.current) {
            // It was a drag, use the drag position
            seekTime = (finalPosition / 100) * duration;
          } else {
            // It was a tap, calculate from tap location
            const currentWidth = progressBarWidth || 300;
            const tapPercentage = Math.max(0, Math.min(100, (locationX / currentWidth) * 100));
            seekTime = (tapPercentage / 100) * duration;
          }
          
          console.log('Seeking to:', seekTime, 'seconds');
          onSeek(seekTime);
        }
        
        // Add a delay to ensure seek completes before clearing dragging state
        setTimeout(() => {
          isDraggingRef.current = false;
          setIsDragging(false);
          hasMoved.current = false;
        }, 100);
      },
    });
  }, [onSeek]); // Removed progressBarWidth from dependencies to prevent recreation

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Only update dragPosition when actually dragging, not from external position changes
  const progressPercentage = isDragging 
    ? dragPosition 
    : (duration > 0 ? (position / duration) * 100 : 0);
  
  const currentTime = isDragging 
    ? (dragPosition / 100) * duration 
    : position;

  // Reset dragPosition when not dragging to sync with actual position
  useEffect(() => {
    if (!isDragging && duration > 0) {
      const actualPercentage = (position / duration) * 100;
      dragPositionRef.current = actualPercentage;
      setDragPosition(actualPercentage);
    }
  }, [position, duration, isDragging]);

  // Initialize dragPosition when track changes
  useEffect(() => {
    if (currentTrack && duration > 0) {
      const actualPercentage = (position / duration) * 100;
      dragPositionRef.current = actualPercentage;
      setDragPosition(actualPercentage);
    }
  }, [currentTrack?.id, duration]);

  const handleDownload = async () => {
    if (!currentTrack?.freeDownload) {
      Alert.alert('Download Not Available', 'Downloads are not enabled for this track.');
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const fileName = `${currentTrack.title} - ${currentTrack.author?.userName || 'Unknown'}.mp3`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(currentTrack.music, fileUri);
      
      if (downloadResult.status === 200) {
        await Sharing.shareAsync(downloadResult.uri);
        
        // Track the download
        try {
          const userName = currentUser ? currentUser.userName : 'unknown';
          await trackDownload(currentTrack.id, userName);
          console.log('Download tracked for:', currentTrack.title);
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

  if (!currentTrack) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.95)', 'rgba(20,20,20,0.95)']}
        style={styles.gradient}
      >
        {/* Drag Handle */}
        <View style={styles.dragHandle} />
        
        {/* Track Info with Full-Width Banner */}
        <View style={styles.trackInfoContainer}>
          <Image 
            source={{ 
              uri: currentTrack.author?.banner || "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=facearea&w=400&q=80" 
            }} 
            style={styles.trackBanner}
            defaultSource={require('../assets/images/pb.jpg')}
          />
        </View>
        
        {/* Title and Username Below Banner */}
        <View style={styles.trackTextContainer}>
          <TouchableOpacity onPress={() => router.push(`/post/${currentTrack.id}`)} activeOpacity={0.7}>
            <Text style={styles.trackTitle} numberOfLines={2}>
              {currentTrack.title || 'Unknown Title'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/profile/${currentTrack.author?.userName}`)} activeOpacity={0.7}>
            <Text style={styles.trackArtist} numberOfLines={1}>
              by {currentTrack.author?.userName || 'Unknown Artist'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <View 
            ref={progressBarRef}
            style={styles.progressBar}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              console.log('Progress bar layout width:', width);
              setProgressBarWidth(width);
            }}
            {...(duration > 0 && panResponder.current?.panHandlers || {})}
            pointerEvents={duration > 0 ? 'auto' : 'none'}
          >
            <View style={styles.progressBackground} />
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%` }
              ]} 
            />
            {duration > 0 && (
              <View
                style={[
                  styles.progressThumb,
                  { left: `${Math.max(0, Math.min(100, progressPercentage))}%` }
                ]}
              />
            )}
          </View>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => onVolumeChange && onVolumeChange(Math.max(0, volume - 0.1))}
          >
            <Text style={styles.controlIcon}>🔉</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.playButton}
            onPress={onPlayPause}
            activeOpacity={0.8}
          >
            <View style={styles.playButtonInner}>
              {isPlaying ? (
                <View style={styles.pauseIcon}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              ) : (
                <View style={styles.playIcon}>
                  <View style={styles.playTriangle} />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => onVolumeChange && onVolumeChange(Math.min(1, volume + 0.1))}
          >
            <Text style={styles.controlIcon}>🔊</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>

        {/* Download Button - only show if freeDownload is true */}
        {currentTrack.freeDownload && (
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.downloadIcon}>⬇️</Text>
            )}
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.4,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  trackInfoContainer: {
    height: 120,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trackBanner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trackTextContainer: {
    alignItems: 'center',
    marginBottom: 5,
    paddingHorizontal: 16,
  },
  trackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  trackArtist: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 40, // Increased height for better touch target
    marginHorizontal: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    top: 18,
    left: 0,
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: 12,
    width: 16,
    height: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: -8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    padding: 12,
    marginHorizontal: 20,
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  playButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1, // Slight offset to center the triangle visually
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  pauseIcon: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    position: 'absolute',
    top: 20,
    right: 62,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CentralizedAudioPlayer;
