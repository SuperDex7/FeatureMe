import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { UserRelationsService } from '../services/userService';

export default function FriendSuggestions({ limit = 5 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await UserRelationsService.getFriendSuggestions(limit);
        setSuggestions(response.data || []);
      } catch (error) {
        console.error('Error fetching friend suggestions:', error);
        // Set mock data for demo purposes
        setSuggestions([
          { userName: 'DJ Nova', profilePic: require('../assets/images/dpp.jpg'), followersCount: 3200 },
          { userName: 'LoFiCat', profilePic: require('../assets/images/pb.jpg'), followersCount: 2800 },
          { userName: '808King', profilePic: require('../assets/images/dpp.jpg'), followersCount: 2500 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [limit]);

  const handleFollow = async (userName) => {
    try {
      await UserRelationsService.toggleFollow(userName);
      // Remove from suggestions after following
      setSuggestions(prev => prev.filter(user => user.userName !== userName));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Friend Suggestions</Text>
        <Text style={styles.loadingText}>Loading suggestions...</Text>
      </View>
    );
  }

  if (suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Friend Suggestions</Text>
        <Text style={styles.noSuggestionsText}>No suggestions at the moment</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend Suggestions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {suggestions.map((user, index) => (
          <View key={index} style={styles.suggestionCard}>
            <Image 
              source={typeof user.profilePic === 'string' ? { uri: user.profilePic } : user.profilePic}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user.userName}</Text>
            <Text style={styles.followersCount}>
              {user.followersCount?.toLocaleString() || '0'} followers
            </Text>
            <TouchableOpacity 
              style={styles.followButton}
              onPress={() => handleFollow(user.userName)}
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(30, 34, 45, 0.8)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scrollView: {
    flexDirection: 'row',
  },
  suggestionCard: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    backgroundColor: 'rgba(127, 83, 172, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.1)',
    minWidth: 100,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  userName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  followersCount: {
    color: '#9ca3af',
    fontSize: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#7f53ac',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noSuggestionsText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
