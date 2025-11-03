import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { getCurrentUser } from '../services/api';

export default function PendingFeaturesScreen() {
  const insets = useSafeAreaInsets();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/pending-features');
      setPendingRequests(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError('Failed to load pending feature requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    setProcessing(postId);
    try {
      await api.post(`/posts/approve-feature/${postId}`);
      // Remove from pending list
      setPendingRequests(prev => prev.filter(request => request.id !== postId));
      Alert.alert('Success', 'Feature request approved successfully!');
    } catch (err) {
      console.error('Error approving feature:', err);
      Alert.alert('Error', 'Failed to approve feature request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (postId) => {
    Alert.alert(
      'Reject Feature Request',
      'Are you sure you want to reject this feature request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessing(postId);
            try {
              await api.post(`/posts/reject-feature/${postId}`);
              // Remove from pending list
              setPendingRequests(prev => prev.filter(request => request.id !== postId));
              Alert.alert('Success', 'Feature request rejected.');
            } catch (err) {
              console.error('Error rejecting feature:', err);
              Alert.alert('Error', 'Failed to reject feature request. Please try again.');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Back Header */}
        <View style={{position:'absolute',top:25,left:0,right:0,zIndex:10,flexDirection:'row',alignItems:'center',paddingTop:40,paddingBottom:10,paddingHorizontal:16,backgroundColor:'rgba(24, 26, 32, 0.95)'}}>
          <TouchableOpacity onPress={() => router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.1)',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:24,color:'white'}}>{'‹'}</Text>
          </TouchableOpacity>
          <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18,fontWeight:'600',color:'white'}} numberOfLines={1}>
              Pending Features
            </Text>
          </View>
          <View style={{width:36}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f8cff" />
          <Text style={styles.loadingText}>Loading pending feature requests...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {/* Back Header */}
        <View style={{position:'absolute',top:25,left:0,right:0,zIndex:10,flexDirection:'row',alignItems:'center',paddingTop:40,paddingBottom:10,paddingHorizontal:16,backgroundColor:'rgba(24, 26, 32, 0.95)'}}>
          <TouchableOpacity onPress={() => router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.1)',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:24,color:'white'}}>{'‹'}</Text>
          </TouchableOpacity>
          <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18,fontWeight:'600',color:'white'}} numberOfLines={1}>
              Pending Features
            </Text>
          </View>
          <View style={{width:36}} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchPendingRequests}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <View style={styles.container}>
        {/* Back Header */}
        <View style={{position:'absolute',top:25,left:0,right:0,zIndex:10,flexDirection:'row',alignItems:'center',paddingTop:40,paddingBottom:10,paddingHorizontal:16,backgroundColor:'rgba(24, 26, 32, 0.95)'}}>
          <TouchableOpacity onPress={() => router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.1)',alignItems:'center',justifyContent:'center'}}>
            <Text style={{fontSize:24,color:'white'}}>{'‹'}</Text>
          </TouchableOpacity>
          <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18,fontWeight:'600',color:'white'}} numberOfLines={1}>
              Pending Features
            </Text>
          </View>
          <View style={{width:36}} />
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.noRequestsContainer}>
            <Text style={styles.noRequestsIcon}>✅</Text>
            <Text style={styles.noRequestsTitle}>No Pending Feature Requests</Text>
            <Text style={styles.noRequestsText}>
              You don't have any feature requests waiting for approval.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Header */}
      <View style={{position:'absolute',top:25,left:0,right:0,zIndex:10,flexDirection:'row',alignItems:'center',paddingTop:40,paddingBottom:10,paddingHorizontal:16,backgroundColor:'rgba(24, 26, 32, 0.95)'}}>
        <TouchableOpacity onPress={() => router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,255,255,0.1)',alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:24,color:'white'}}>{'‹'}</Text>
        </TouchableOpacity>
        <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
          <Text style={{fontSize:18,fontWeight:'600',color:'white'}} numberOfLines={1}>
            Pending Features
          </Text>
        </View>
        <View style={{width:36}} />
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Pending Feature Requests</Text>
          <Text style={styles.subtitle}>Review and approve posts that want to feature you</Text>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          {pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* Request Header */}
              <View style={styles.requestHeader}>
                <TouchableOpacity
                  style={styles.authorInfo}
                  onPress={() => router.push(`/profile/${request.author?.userName || ''}`)}
                >
                  <Image
                    source={{
                      uri: request.author?.profilePic || 'https://via.placeholder.com/50'
                    }}
                    style={styles.authorAvatar}
                    defaultSource={require('../assets/images/dpp.jpg')}
                  />
                  <View style={styles.authorDetails}>
                    <Text style={styles.authorName}>{request.author?.userName || 'Unknown'}</Text>
                    <Text style={styles.authorSubtext}>wants to feature you in their post</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.requestTime}>
                  {formatDate(request.time)}
                </Text>
              </View>

              {/* Request Content */}
              <View style={styles.requestContent}>
                <TouchableOpacity onPress={() => router.push(`/post/${request.id}`)}>
                  <Text style={styles.postTitle}>{request.title}</Text>
                </TouchableOpacity>
                <Text style={styles.postDescription}>{request.description}</Text>
                
                {/* Genre Tags */}
                {request.genre && request.genre.length > 0 && (
                  <View style={styles.genreTags}>
                    {request.genre.map((genre, index) => (
                      <View key={index} style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{genre}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Other Features */}
                {request.pendingFeatures && request.pendingFeatures.length > 1 && (
                  <View style={styles.featuresInfo}>
                    <Text style={styles.featuresLabel}>Other Features:</Text>
                    <Text style={styles.featuresList}>
                      {request.pendingFeatures
                        .filter(f => f !== currentUser?.userName)
                        .join(', ')}
                    </Text>
                  </View>
                )}

                {(!request.pendingFeatures || request.pendingFeatures.length <= 1) && (
                  <View style={styles.featuresInfo}>
                    <Text style={styles.featuresLabel}>Other Features:</Text>
                    <Text style={styles.noOtherFeatures}>None</Text>
                  </View>
                )}
                
                {/* Already Approved Features */}
                {request.features && request.features.length > 0 && (
                  <View style={styles.featuresInfo}>
                    <Text style={styles.featuresLabel}>Already Approved Features:</Text>
                    <Text style={[styles.featuresList, styles.approvedFeatures]}>
                      {request.features.join(', ')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Request Actions */}
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[styles.approveButton, processing === request.id && styles.buttonDisabled]}
                  onPress={() => handleApprove(request.id)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>✅</Text>
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.rejectButton, processing === request.id && styles.buttonDisabled]}
                  onPress={() => handleReject(request.id)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>❌</Text>
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181a20',
  },
  scrollView: {
    flex: 1,
    marginTop: 150
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 150,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4f8cff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(243, 243, 243, 0.8)',
    textAlign: 'center',
    maxWidth: 350,
    lineHeight: 22,
  },
  requestsList: {
    gap: 20,
  },
  requestCard: {
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(127, 83, 172, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  authorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(79, 140, 255, 0.3)',
    marginRight: 12,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f8cff',
    marginBottom: 4,
  },
  authorSubtext: {
    fontSize: 14,
    color: 'rgba(243, 243, 243, 0.7)',
  },
  requestTime: {
    fontSize: 12,
    color: 'rgba(139, 157, 195, 1)',
    fontWeight: '500',
  },
  requestContent: {
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f3f7',
    marginBottom: 8,
    lineHeight: 26,
  },
  postDescription: {
    fontSize: 15,
    color: 'rgba(243, 243, 243, 0.8)',
    lineHeight: 22,
    marginBottom: 16,
  },
  genreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genreTag: {
    backgroundColor: 'rgba(79, 140, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 140, 255, 0.3)',
  },
  genreTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4f8cff',
  },
  featuresInfo: {
    marginBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featuresLabel: {
    fontSize: 14,
    color: '#f3f3f7',
    fontWeight: '600',
    marginRight: 8,
  },
  featuresList: {
    fontSize: 14,
    color: '#4f8cff',
    fontWeight: '500',
    flex: 1,
  },
  approvedFeatures: {
    color: '#28a745',
    fontWeight: '600',
  },
  noOtherFeatures: {
    fontSize: 14,
    color: 'rgba(139, 157, 195, 1)',
    fontStyle: 'italic',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 16,
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  noRequestsContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingTop: 70,
    backgroundColor: 'rgba(30, 34, 45, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noRequestsIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noRequestsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f3f3f7',
    marginBottom: 12,
    textAlign: 'center',
  },
  noRequestsText: {
    fontSize: 16,
    color: 'rgba(243, 243, 243, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
