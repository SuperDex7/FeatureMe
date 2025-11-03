import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRelationsService } from '../services/userService';
import { router } from 'expo-router';

export default function FollowersModal({ 
  isVisible, 
  onClose, 
  userName, 
  type = 'followers' // 'followers' or 'following'
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState({});

  useEffect(() => {
    if (isVisible) {
      loadUsers(true);
    }
  }, [isVisible, userName, type]);

  const loadUsers = async (isInitial = false) => {
    if (loading || loadingMore) return;
    
    if (isInitial) {
      setLoading(true);
      setPage(0);
      setUsers([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isInitial ? 0 : page;
      const response = type === 'followers' 
        ? await UserRelationsService.getFollowers(userName, currentPage, 20)
        : await UserRelationsService.getFollowing(userName, currentPage, 20);

      const newUsers = response.data.content || [];
      
      if (isInitial) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === 20);
      setPage(currentPage + 1);

      // Load follow status for each user
      if (newUsers.length > 0) {
        loadFollowStatus(newUsers);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      Alert.alert('Error', `Failed to load ${type}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadFollowStatus = async (userList) => {
    try {
      const followPromises = userList.map(async (user) => {
        try {
          const response = await UserRelationsService.isFollowing(user.userName);
          return { userName: user.userName, isFollowing: response.data };
        } catch (error) {
          return { userName: user.userName, isFollowing: false };
        }
      });

      const followStatuses = await Promise.all(followPromises);
      const followMap = {};
      followStatuses.forEach(status => {
        followMap[status.userName] = status.isFollowing;
      });

      setIsFollowing(prev => ({ ...prev, ...followMap }));
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const handleFollowToggle = async (targetUserName) => {
    try {
      await UserRelationsService.toggleFollow(targetUserName);
      setIsFollowing(prev => ({
        ...prev,
        [targetUserName]: !prev[targetUserName]
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderUser = ({ item }) => {
    const handleUserPress = () => {
      onClose(); // Close the modal first
      router.push(`/profile/${item.userName}`);
    };

    return (
      <View style={styles.userItem}>
        <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
          <Image 
            source={{ uri: item.profilePic || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
            style={styles.userAvatar}
            defaultSource={require('../assets/images/dpp.jpg')}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <Text style={styles.userName}>{item.userName}</Text>
          {item.displayName && item.displayName !== item.userName && (
            <Text style={styles.userDisplayName}>{item.displayName}</Text>
          )}
          {item.bio && (
            <Text style={styles.userBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.followButton,
            isFollowing[item.userName] && styles.followButtonFollowing
          ]}
          onPress={() => handleFollowToggle(item.userName)}
        >
          <Text style={[
            styles.followButtonText,
            isFollowing[item.userName] && styles.followButtonTextFollowing
          ]}>
            {isFollowing[item.userName] ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#1a1a2e', '#16213e']}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>
              {type === 'followers' ? 'Followers' : 'Following'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Loading {type}...</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.userName}
              style={styles.userList}
              onEndReached={() => hasMore && loadUsers(false)}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>
                    {type === 'followers' ? '👥' : '👤'}
                  </Text>
                  <Text style={styles.emptyTitle}>
                    No {type} yet
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {type === 'followers' 
                      ? 'This user doesn\'t have any followers yet'
                      : 'This user isn\'t following anyone yet'
                    }
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 12,
  },
  userList: {
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  userDisplayName: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  followButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  followButtonFollowing: {
    backgroundColor: 'transparent',
    borderColor: '#10b981',
  },
  followButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  followButtonTextFollowing: {
    color: '#10b981',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
