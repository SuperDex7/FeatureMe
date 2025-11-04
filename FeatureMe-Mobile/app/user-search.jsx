import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchUsers } from '../services/userService';

export default function UserSearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadingRef = useRef(false);

  const fetchUsers = useCallback(async (term, pageNum) => {
    // Prevent duplicate calls
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    
    if (pageNum === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      const response = await searchUsers(term, pageNum, size);
      const data = response.data;
      
      // Handle different possible response structures
      let usersData = [];
      let totalPagesCount = 0;
      let currentPageNum = pageNum;
      
      if (Array.isArray(data)) {
        // If response is directly an array
        usersData = data;
        totalPagesCount = 1;
      } else if (data.content) {
        // Standard PagedModel structure
        usersData = data.content || [];
        totalPagesCount = data.page?.totalPages ?? data.totalPages ?? 0;
        currentPageNum = data.page?.number ?? data.number ?? pageNum;
      } else {
        // Fallback
        usersData = [];
        totalPagesCount = 0;
      }
      
      if (pageNum === 0) {
        setUsers(usersData);
      } else {
        setUsers(prev => [...prev, ...usersData]);
      }
      
      setTotalPages(totalPagesCount);
      setHasMore(currentPageNum < totalPagesCount - 1);
      setPage(currentPageNum);
      setHasSearched(true);
    } catch (error) {
      if (pageNum === 0) {
        Alert.alert('Error', 'Failed to search users');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [size]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setPage(0);
        fetchUsers(searchQuery, 0);
      } else {
        setUsers([]);
        setTotalPages(0);
        setHasMore(false);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchUsers]);

  const loadMoreUsers = useCallback(() => {
    if (hasMore && !isLoading && !isLoadingMore && !loadingRef.current && searchQuery.trim()) {
      fetchUsers(searchQuery, page + 1);
    }
  }, [hasMore, isLoading, isLoadingMore, page, searchQuery, fetchUsers]);

  const handleUserPress = (user) => {
    router.push(`/profile/${user.userName}`);
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
    >
      <Image 
        source={{ 
          uri: item.profilePic || 'https://via.placeholder.com/50'
        }}
        style={styles.userAvatar}
        defaultSource={require('../assets/images/dpp.jpg')}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.userRole}>{item.role || 'USER'}</Text>
        {(item.firstName || item.lastName) && (
          <Text style={styles.userFullName}>
            {item.firstName} {item.lastName}
          </Text>
        )}
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>
        {hasSearched ? 'No users found' : 'Search for users'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasSearched 
          ? 'Try a different search term' 
          : 'Enter a username or name to find users'
        }
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearIcon}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsSection}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Searching users...</Text>
          </View>
        ) : (
          <>
            {users.length > 0 ? (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id?.toString() || item.userName}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                onEndReached={loadMoreUsers}
                onEndReachedThreshold={0.3}
                removeClippedSubviews={false}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.loadingMore}>
                      <ActivityIndicator size="small" color="#667eea" />
                      <Text style={styles.loadingMoreText}>Loading more...</Text>
                    </View>
                  ) : hasMore ? (
                    <TouchableOpacity
                      style={styles.loadMoreButton}
                      onPress={loadMoreUsers}
                      disabled={isLoadingMore}
                    >
                      <Text style={styles.loadMoreButtonText}>Load More</Text>
                    </TouchableOpacity>
                  ) : users.length > 0 ? (
                    <View style={styles.endOfResults}>
                      <Text style={styles.endOfResultsText}>
                        Showing {users.length} result{users.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ) : null
                }
              />
            ) : (
              renderEmptyState()
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  clearIcon: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
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
  listContainer: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userFullName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  arrowIcon: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '300',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop:-400
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 8,
  },
  loadMoreButton: {
    marginVertical: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  loadMoreButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  endOfResults: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfResultsText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
