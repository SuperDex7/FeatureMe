import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
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

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      // TODO: Implement actual messaging API calls
      // For now, we'll show a placeholder
      setConversations([]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsLoading(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with other users
      </Text>
      <TouchableOpacity 
        style={styles.startConversationButton}
        onPress={() => setShowNewMessageModal(true)}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.startConversationGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.startConversationText}>Start Conversation</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderNewMessageModal = () => (
    <Modal
      visible={showNewMessageModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowNewMessageModal(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowNewMessageModal(false)}
      >
        <View style={styles.newMessageModal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Message</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowNewMessageModal(false)}
            >
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.comingSoonText}>
              Messaging feature is coming soon! 
            </Text>
            <Text style={styles.comingSoonSubtext}>
              You'll be able to send direct messages to other users.
            </Text>
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
          <Text style={styles.loadingText}>Loading messages...</Text>
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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => setShowNewMessageModal(true)}
        >
          <Text style={styles.newMessageIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={() => null} // TODO: Implement conversation item
            keyExtractor={(item) => item.id?.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {renderNewMessageModal()}
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
  newMessageButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  newMessageIcon: {
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startConversationButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startConversationGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  startConversationText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  newMessageModal: {
    backgroundColor: 'rgba(15, 15, 35, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    minHeight: 200,
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
    paddingVertical: 32,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
