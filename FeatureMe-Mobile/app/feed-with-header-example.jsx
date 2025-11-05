// Example integration of LoggedInHeader into an existing screen
// This shows how to replace the existing header with the new LoggedInHeader component

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoggedInHeader from '../components/ui/LoggedInHeader';
import BottomNavigation from '../components/BottomNavigation';

export default function FeedScreenWithHeader() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* New LoggedInHeader - replaces the old header */}
      <LoggedInHeader />
      
      {/* Main content with proper top padding to account for header */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingTop: 100 }]} // Adjust padding based on header height
        showsVerticalScrollIndicator={false}
      >
        {/* Your existing feed content goes here */}
        <View style={styles.feedContent}>
          <Text style={styles.welcomeText}>Welcome to your feed!</Text>
          <Text style={styles.subtitleText}>
            The new header includes notifications, user search, messaging, and feature requests.
          </Text>
          
          {/* Example content */}
          <View style={styles.exampleCard}>
            <Text style={styles.cardTitle}>🎵 Featured Track</Text>
            <Text style={styles.cardDescription}>
              Check out this amazing track from our community!
            </Text>
          </View>
          
          <View style={styles.exampleCard}>
            <Text style={styles.cardTitle}>🔔 Notifications</Text>
            <Text style={styles.cardDescription}>
              Tap the bell icon in the header to see your notifications.
            </Text>
          </View>
          
          <View style={styles.exampleCard}>
            <Text style={styles.cardTitle}>🔍 User Search</Text>
            <Text style={styles.cardDescription}>
              Find other users through the user menu in the header.
            </Text>
          </View>
          
          <View style={styles.exampleCard}>
            <Text style={styles.cardTitle}>💬 Messaging</Text>
            <Text style={styles.cardDescription}>
              Access messaging features from the user menu.
            </Text>
          </View>
          
          <View style={styles.exampleCard}>
            <Text style={styles.cardTitle}>⏳ Feature Requests</Text>
            <Text style={styles.cardDescription}>
              Submit and vote on feature requests from the user menu.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom navigation */}
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for bottom navigation
  },
  feedContent: {
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
});
