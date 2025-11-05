import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { getCurrentUser, logout } from '../../services/api';
import { clearMyNotifications } from '../../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

export default function LoggedInHeader() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // Fetch notifications
      if (user && user.userName) {
        const response = await api.get(`/user/get/notifications/${user.userName}`);
        setNotifications(response.data || []);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsLoading(false);
    }
  }, []);

  // Refresh data when component comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const handleNotificationPress = () => {
    setShowNotifications(!showNotifications);
  };

  const handleUserMenuPress = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleClearNotifications = async () => {
    try {
      await clearMyNotifications();
      setNotifications([]);
      setShowNotifications(false);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const handleLogout = async () => {
    try {
      // Close menus
      setShowUserMenu(false);
      setShowNotifications(false);
      
      // Call logout service which handles API call and AsyncStorage clearing
      await logout();
      
      // Clear any cached data
      setCurrentUser(null);
      setNotifications([]);
      
      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      await AsyncStorage.removeItem('authToken');
      api.defaults.headers.common['Authorization'] = '';
      router.replace('/login');
    }
  };

  const navigateToUserSearch = () => {
    setShowUserMenu(false);
    router.push('/user-search');
  };

  const navigateToMessaging = () => {
    setShowUserMenu(false);
    router.push('/messages');
  };

  const navigateToProfile = () => {
    setShowUserMenu(false);
    router.push(`/profile/${currentUser?.userName}`);
  };

  const navigateToCreatePost = () => {
    setShowUserMenu(false);
    router.push('/create-post');
  };

  const navigateToSubscription = () => {
    setShowUserMenu(false);
    router.push('/subscription');
  };

  const navigateToPendingFeatures = () => {
    setShowUserMenu(false);
    router.push('/pending-features');
  };

  // Format time function
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
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

  const handleNotificationItemPress = (notification) => {
    if (!notification.notiType || !notification.userName) return;
    
    setShowNotifications(false);
    
    switch (notification.notiType) {
      case 'PROFILE':
        router.push(`/profile/${notification.userName}`);
        break;
      case 'POST':
        router.push(`/profile/${notification.userName}`);
        break;
      case 'CHAT':
        router.push('/messages');
        break;
      default:
        if (notification.userName) {
          router.push(`/profile/${notification.userName}`);
        }
        break;
    }
  };

  const renderNotificationItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.notificationItem}
      onPress={() => handleNotificationItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationDot} />
      <View style={styles.notificationTextContainer}>
        <Text style={styles.notificationUsername}>
          {String(item.userName || 'Unknown User')}
        </Text>
        <Text style={styles.notificationText}>
          {String(item.noti || item.message || item.text || 'Notification')}
        </Text>
        {item.time && (
          <Text style={styles.notificationTime}>
            {formatTime(new Date(item.time))}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyNotifications = () => (
    <View style={styles.emptyNotifications}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyText}>No notifications yet</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          {/* Logo Section */}
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={() => router.push('/main-app')}
          >
            <Image 
              source={require('../../assets/images/PNGs/Logo-Lockup-Gradient.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Actions Section */}
          <View style={styles.actionsContainer}>
            {/* Notifications */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotificationPress}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* User Menu */}
            <TouchableOpacity 
              style={styles.userButton}
              onPress={handleUserMenuPress}
            >
              <Image 
                source={{ 
                  uri: currentUser?.profilePic || 'https://via.placeholder.com/40'
                }}
                style={styles.userAvatar}
                defaultSource={require('../../assets/images/dpp.jpg')}
              />
              <Text style={styles.userArrow}>
                {showUserMenu ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowNotifications(false)}
        >
          <View style={styles.notificationsModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {notifications.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleClearNotifications}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.notificationsContent}>
              {notifications.length > 0 ? (
                <FlatList
                  data={notifications}
                  renderItem={renderNotificationItem}
                  keyExtractor={(item, index) => {
                    // Create a unique key by combining multiple fields
                    const id = item._id?.toString() || item.id?.toString() || '';
                    const timestamp = item.time?.toString() || '';
                    return `${id}-${timestamp}-${index}`;
                  }}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                renderEmptyNotifications()
              )}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowUserMenu(false)}
        >
          <View style={styles.userMenuModal}>
            <View style={styles.modalHandle} />
            
            {/* User Info */}
            <View style={styles.userInfoSection}>
              <Image 
                source={{ 
                  uri: currentUser?.profilePic || 'https://via.placeholder.com/60'
                }}
                style={styles.userInfoAvatar}
                defaultSource={require('../../assets/images/dpp.jpg')}
              />
              <View style={styles.userInfoText}>
                <Text style={styles.userInfoName}>{currentUser?.userName || 'User'}</Text>
                <Text style={styles.userInfoRole}>{currentUser?.role || 'USER'}</Text>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToProfile}
              >
                <Text style={styles.menuIcon}>👤</Text>
                <Text style={styles.menuText}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToUserSearch}
              >
                <Text style={styles.menuIcon}>🔍</Text>
                <Text style={styles.menuText}>User Search</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToMessaging}
              >
                <Text style={styles.menuIcon}>💬</Text>
                <Text style={styles.menuText}>Messaging</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToPendingFeatures}
              >
                <Text style={styles.menuIcon}>📋</Text>
                <Text style={styles.menuText}>Pending Features</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToCreatePost}
              >
                <Text style={styles.menuIcon}>✍️</Text>
                <Text style={styles.menuText}>Create Post</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={navigateToSubscription}
              >
                <Text style={styles.menuIcon}>⭐</Text>
                <Text style={styles.menuText}>Subscription</Text>
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ee5a52']}
                style={styles.logoutGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexShrink: 0,
  },
  logo: {
    height: 40,
    width: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 18,
    color: 'white',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userArrow: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationsModal: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    minHeight: 400,
  },
  userMenuModal: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationsContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginRight: 12,
    marginTop: 6,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationUsername: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.6,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  userInfoText: {
    flex: 1,
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  userInfoRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  logoutButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutIcon: {
    fontSize: 16,
    color: 'white',
  },
  logoutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});
