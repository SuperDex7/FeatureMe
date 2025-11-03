import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DemoCard({ 
  demo, 
  isPlaying = false, 
  onPress, 
  onDelete, 
  isDeleting = false,
  showDelete = false 
}) {
  const playingStyles = isPlaying ? {
    borderColor: 'rgba(67, 233, 123, 0.5)',
    shadowColor: '#43e97b',
    shadowOpacity: 0.4,
  } : {};

  return (
    <TouchableOpacity 
      style={[styles.demoCard, playingStyles]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDeleting}
    >
      {/* Horizontal Demo Card */}
      <View style={styles.demoCardLeft}>
        <LinearGradient
          colors={
            isPlaying 
              ? ['#43e97b', '#38f9d7'] 
              : ['#667eea', '#764ba2']
          }
          style={styles.demoCardThumbnail}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.demoPlayOverlayHorizontal}>
            <View style={[
              styles.demoPlayButtonHorizontal,
              isPlaying && styles.demoPlayButtonPlaying
            ]}>
              <Text style={styles.demoPlayIconHorizontal}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
      
      <View style={styles.demoCardRight}>
        <View style={styles.demoCardInfo}>
          <Text style={styles.demoTitleHorizontal} numberOfLines={2}>
            {demo.title}
          </Text>
          <Text style={styles.demoSubtitleHorizontal} numberOfLines={1}>
            Demo • {demo.features && demo.features.length > 0 ? demo.features.join(', ') : 'No features'}
          </Text>
        </View>
        
        <View style={styles.demoCardActions}>
          <View style={[
            styles.demoStatusIndicator,
            isPlaying && styles.demoStatusIndicatorPlaying
          ]}>
            <Text style={[
              styles.demoStatusText,
              isPlaying && styles.demoStatusTextPlaying
            ]}>
              {isPlaying ? 'Playing' : 'Tap to play'}
            </Text>
          </View>
          
          {showDelete && (
            <TouchableOpacity
              onPress={() => onDelete(demo)}
              style={styles.deleteButton}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal Demo Card Styles
  demoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
    height: 110,
  },
  demoCardLeft: {
    width: 110,
    height: 110,
  },
  demoCardThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoPlayOverlayHorizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoPlayButtonHorizontal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  demoPlayButtonPlaying: {
    backgroundColor: 'rgba(67, 233, 123, 0.95)',
    borderColor: 'rgba(67, 233, 123, 0.3)',
  },
  demoPlayIconHorizontal: {
    fontSize: 14,
    marginLeft: 1,
  },
  demoCardRight: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  demoCardInfo: {
    flex: 1,
  },
  demoTitleHorizontal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  demoSubtitleHorizontal: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  demoCardActions: {
    alignItems: 'flex-end',
  },
  demoStatusIndicator: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  demoStatusIndicatorPlaying: {
    backgroundColor: 'rgba(67, 233, 123, 0.2)',
    borderColor: 'rgba(67, 233, 123, 0.3)',
  },
  demoStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoStatusTextPlaying: {
    color: '#43e97b',
  },
  deleteButton: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 12,
  },
});

