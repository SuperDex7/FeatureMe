import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { getCurrentUser } from '../services/api';

export default function FeatureRequestScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // TODO: Implement actual feature request API calls
      // For now, we'll show placeholder data
      setFeatureRequests([
        {
          id: 1,
          title: 'Dark Mode Theme',
          description: 'Add a dark mode option for better user experience',
          status: 'pending',
          votes: 15,
          author: 'user123',
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          title: 'Playlist Feature',
          description: 'Allow users to create and share playlists',
          status: 'in-progress',
          votes: 8,
          author: 'musiclover',
          createdAt: '2024-01-10'
        },
        {
          id: 3,
          title: 'Advanced Search Filters',
          description: 'Add more search options like date range, genre combinations',
          status: 'completed',
          votes: 12,
          author: 'searchmaster',
          createdAt: '2024-01-05'
        }
      ]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequestTitle.trim() || !newRequestDescription.trim()) {
      Alert.alert('Error', 'Please fill in both title and description');
      return;
    }

    try {
      // TODO: Implement actual API call to submit feature request
      Alert.alert('Success', 'Feature request submitted successfully!');
      setNewRequestTitle('');
      setNewRequestDescription('');
      setShowNewRequestModal(false);
    } catch (error) {
      console.error('Error submitting feature request:', error);
      Alert.alert('Error', 'Failed to submit feature request');
    }
  };

  const handleVote = async (requestId) => {
    try {
      // TODO: Implement actual API call to vote on feature request
      Alert.alert('Success', 'Vote recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to vote');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa726';
      case 'in-progress': return '#42a5f5';
      case 'completed': return '#66bb6a';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const renderFeatureRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.requestDescription}>{item.description}</Text>
      
      <View style={styles.requestFooter}>
        <View style={styles.requestMeta}>
          <Text style={styles.requestAuthor}>by {item.author}</Text>
          <Text style={styles.requestDate}>{item.createdAt}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.voteButton}
          onPress={() => handleVote(item.id)}
        >
          <Text style={styles.voteIcon}>👍</Text>
          <Text style={styles.voteCount}>{item.votes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNewRequestModal = () => (
    <Modal
      visible={showNewRequestModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowNewRequestModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowNewRequestModal(false)}
      >
        <View style={styles.newRequestModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Feature Request</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowNewRequestModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Feature title..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newRequestTitle}
              onChangeText={setNewRequestTitle}
            />
            
            <TextInput
              style={styles.descriptionInput}
              placeholder="Describe your feature request..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newRequestDescription}
              onChangeText={setNewRequestDescription}
              multiline={true}
              numberOfLines={4}
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitRequest}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>Submit Request</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading feature requests...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Feature Requests</Text>
        <TouchableOpacity 
          style={styles.newRequestButton}
          onPress={() => setShowNewRequestModal(true)}
        >
          <Text style={styles.newRequestIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={featureRequests}
          renderItem={renderFeatureRequest}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      {renderNewRequestModal()}
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
  newRequestButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  newRequestIcon: {
    fontSize: 18,
  },
  content: {
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
    paddingVertical: 16,
  },
  requestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  requestTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  requestDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestMeta: {
    flex: 1,
  },
  requestAuthor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  voteIcon: {
    fontSize: 14,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  newRequestModal: {
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
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '300',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
