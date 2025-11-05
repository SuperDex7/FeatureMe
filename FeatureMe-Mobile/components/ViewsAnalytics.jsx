import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getViewsSummary,
  getViewsPaginated,
  getDownloadsPaginated,
  getLikesPaginated,
  getLikesSummary,
  getCommentsPaginated,
  addComment,
  deleteComment,
} from '../services/postsService';

export default function ViewsAnalytics({
  postId,
  postTitle,
  isOpen,
  onClose,
  currentUser,
  postAuthor,
  totalDownloads: postTotalDownloads = 0,
  totalViews: postTotalViews = 0,
  totalComments: postTotalComments = 0,
}) {
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [likerUsernames, setLikerUsernames] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [sortBy, setSortBy] = useState('lastView');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination state
  const [viewsPage, setViewsPage] = useState(0);
  const [downloadsPage, setDownloadsPage] = useState(0);
  const [likesPage, setLikesPage] = useState(0);
  const [commentsPage, setCommentsPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [viewsTotalPages, setViewsTotalPages] = useState(0);
  const [downloadsTotalPages, setDownloadsTotalPages] = useState(0);
  const [likesTotalPages, setLikesTotalPages] = useState(0);
  const [commentsTotalPages, setCommentsTotalPages] = useState(0);
  const [viewsTotalElements, setViewsTotalElements] = useState(0);
  const [downloadsTotalElements, setDownloadsTotalElements] = useState(0);
  const [likesTotalElements, setLikesTotalElements] = useState(0);
  const [commentsTotalElements, setCommentsTotalElements] = useState(0);

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    totalDownloads: 0,
    totalLikes: 0,
    totalComments: 0,
    avgViewsPerUser: 0,
  });

  // UI state
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && postId) {
      setViewsPage(0);
      setDownloadsPage(0);
      setLikesPage(0);
      setCommentsPage(0);
      setAnalyticsData((prev) => ({
        ...prev,
        totalViews: postTotalViews || 0,
        totalDownloads: postTotalDownloads || 0,
        totalComments: postTotalComments || 0,
      }));
      fetchSummary();
      fetchLikesSummary();
      fetchViews();
      fetchDownloads();
      fetchLikes();
      fetchLikers();
      fetchComments();
    }
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchViews();
    }
  }, [viewsPage, pageSize, isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchDownloads();
    }
  }, [downloadsPage, pageSize, isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchLikes();
    }
  }, [likesPage, pageSize, isOpen, postId]);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [commentsPage, pageSize, isOpen, postId]);

  const fetchViews = async () => {
    try {
      setLoading(true);
      const response = await getViewsPaginated(postId, viewsPage, pageSize);
      if (response.data) {
        const content = response.data.content || response.data._embedded?.viewsDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;

        setViews(content);
        setViewsTotalPages(totalPages);
        setViewsTotalElements(totalElements);

        const uniqueViewers = totalElements || 0;
        setAnalyticsData((prev) => ({
          ...prev,
          uniqueViewers,
          avgViewsPerUser:
            uniqueViewers > 0 ? (prev.totalViews / uniqueViewers).toFixed(1) : 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching views:', error);
      setViews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await getDownloadsPaginated(postId, downloadsPage, pageSize);
      if (response.data) {
        const content =
          response.data.content || response.data._embedded?.postDownloadDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;

        setDownloads(content);
        setDownloadsTotalPages(totalPages);
        setDownloadsTotalElements(totalElements);

        setAnalyticsData((prev) => ({
          ...prev,
          totalDownloads: totalElements || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setDownloads([]);
    }
  };

  const fetchLikes = async () => {
    try {
      const response = await getLikesPaginated(postId, likesPage, pageSize);
      if (response.data) {
        const content = response.data.content || response.data._embedded?.likesDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;

        setLikes(content);
        setLikesTotalPages(totalPages);
        setLikesTotalElements(totalElements);

        setAnalyticsData((prev) => ({
          ...prev,
          totalLikes: totalElements || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
      setLikes([]);
    }
  };

  const fetchLikers = async () => {
    try {
      const response = await getLikesPaginated(postId, 0, 1000);
      if (response.data) {
        const content = response.data.content || response.data._embedded?.likesDTO || [];
        const names = new Set(content.map((l) => l.userName).filter(Boolean));
        setLikerUsernames(names);
      }
    } catch (e) {
      console.error('Error fetching liker usernames:', e);
      setLikerUsernames(new Set());
    }
  };

  const fetchLikesSummary = async () => {
    try {
      const response = await getLikesSummary(postId);
      if (response.data && typeof response.data.totalLikes !== 'undefined') {
        setAnalyticsData((prev) => ({
          ...prev,
          totalLikes: response.data.totalLikes || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching likes summary:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await getViewsSummary(postId);
      if (response.data) {
        const summaryTotalViews = response.data.totalViews || 0;
        const summaryUniqueViewers = response.data.uniqueViewers || 0;
        const summaryAvg =
          summaryUniqueViewers > 0
            ? (summaryTotalViews / summaryUniqueViewers).toFixed(1)
            : 0;
        setAnalyticsData((prev) => ({
          ...prev,
          totalViews: summaryTotalViews,
          uniqueViewers: summaryUniqueViewers,
          avgViewsPerUser: summaryAvg,
        }));
      }
    } catch (e) {
      console.error('Error fetching view summary:', e);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsPaginated(postId, commentsPage, pageSize);
      if (response.data) {
        const content =
          response.data.content || response.data._embedded?.commentDTO || [];
        const totalPages = response.data.page?.totalPages || 0;
        const totalElements = response.data.page?.totalElements || 0;
        setComments(content);
        setCommentsTotalPages(totalPages);
        setCommentsTotalElements(totalElements);
        setAnalyticsData((prev) => ({
          ...prev,
          totalComments: totalElements || prev.totalComments,
        }));
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    const text = (newComment || '').trim();
    if (!text) return;
    if (!currentUser) return;
    setPostingComment(true);
    try {
      await addComment(postId, text);
      setNewComment('');
      setCommentsPage(0);
      await fetchComments();
    } catch (e) {
      console.error('Error adding comment:', e);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setAnalyticsData((prev) => ({
        ...prev,
        totalComments: Math.max(0, (prev.totalComments || 1) - 1),
      }));
    } catch (e) {
      console.error('Error deleting comment:', e);
      Alert.alert('Error', 'Failed to delete comment. Please try again.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEngagementRate = () => {
    if (analyticsData.totalViews === 0) return '0%';
    const rate = ((analyticsData.totalDownloads / analyticsData.totalViews) * 100).toFixed(1);
    return `${rate}%`;
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>📊</Text>
              <View style={styles.headerTitle}>
                <Text style={styles.headerTitleText}>Post Analytics</Text>
                {postTitle && (
                  <Text style={styles.headerSubtitle}>{postTitle}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.navContainer}
          >
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'overview' && styles.navTabActive]}
              onPress={() => setActiveTab('overview')}
            >
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'overview' && styles.navTabTextActive,
                ]}
              >
                📈 Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'views' && styles.navTabActive]}
              onPress={() => setActiveTab('views')}
            >
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'views' && styles.navTabTextActive,
                ]}
              >
                👁️ Views ({analyticsData.uniqueViewers})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navTab,
                activeTab === 'downloads' && styles.navTabActive,
              ]}
              onPress={() => setActiveTab('downloads')}
            >
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'downloads' && styles.navTabTextActive,
                ]}
              >
                ⬇️ Downloads ({analyticsData.totalDownloads})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'likes' && styles.navTabActive]}
              onPress={() => setActiveTab('likes')}
            >
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'likes' && styles.navTabTextActive,
                ]}
              >
                ❤️ Likes ({analyticsData.totalLikes})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navTab, activeTab === 'comments' && styles.navTabActive]}
              onPress={() => setActiveTab('comments')}
            >
              <Text
                style={[
                  styles.navTabText,
                  activeTab === 'comments' && styles.navTabTextActive,
                ]}
              >
                💬 Comments ({analyticsData.totalComments})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Content */}
          <ScrollView style={styles.content}>
            {activeTab === 'overview' && (
              <View style={styles.overviewTab}>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👁️</Text>
                    <Text style={styles.statNumber}>
                      {formatNumber(analyticsData.totalViews)}
                    </Text>
                    <Text style={styles.statLabel}>Total Views</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👤</Text>
                    <Text style={styles.statNumber}>
                      {formatNumber(analyticsData.uniqueViewers)}
                    </Text>
                    <Text style={styles.statLabel}>Unique Viewers</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>⬇️</Text>
                    <Text style={styles.statNumber}>
                      {formatNumber(analyticsData.totalDownloads)}
                    </Text>
                    <Text style={styles.statLabel}>Downloads</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📊</Text>
                    <Text style={styles.statNumber}>
                      {analyticsData.avgViewsPerUser}
                    </Text>
                    <Text style={styles.statLabel}>Avg Views/User</Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statIcon}>💯</Text>
                    <Text style={styles.statNumber}>{getEngagementRate()}</Text>
                    <Text style={styles.statLabel}>Engagement Rate</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'views' && (
              <View style={styles.viewsTab}>
                {loading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading viewers...</Text>
                  </View>
                ) : views.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No views recorded yet</Text>
                  </View>
                ) : (
                  <>
                    {views.map((view, index) => (
                      <View key={index} style={styles.viewItem}>
                        <View style={styles.viewUser}>
                          <View style={styles.userAvatar}>
                            {view.profilePic ? (
                              <Image
                                source={{ uri: view.profilePic }}
                                style={styles.avatarImage}
                                defaultSource={require('../assets/images/dpp.jpg')}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {view.userName?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            )}
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.username}>
                              {view.userName || 'Unknown User'}
                              {likerUsernames.has(view.userName) && (
                                <Text style={styles.likedIndicator}> ❤️</Text>
                              )}
                            </Text>
                            <Text style={styles.userRole}>Viewer</Text>
                          </View>
                        </View>
                        <View style={styles.viewStats}>
                          <Text style={styles.viewCount}>
                            {view.viewCount || 1} views
                          </Text>
                          <Text style={styles.viewTime}>
                            First: {formatDate(view.firstView)}
                          </Text>
                          <Text style={styles.viewTime}>
                            Last: {formatDate(view.lastView)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {viewsTotalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            viewsPage === 0 && styles.paginationButtonDisabled,
                          ]}
                          onPress={() => setViewsPage(Math.max(0, viewsPage - 1))}
                          disabled={viewsPage === 0}
                        >
                          <Text style={styles.paginationButtonText}>← Previous</Text>
                        </TouchableOpacity>
                        <Text style={styles.paginationInfo}>
                          Page {viewsPage + 1} of {viewsTotalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            viewsPage >= viewsTotalPages - 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setViewsPage(Math.min(viewsTotalPages - 1, viewsPage + 1))
                          }
                          disabled={viewsPage >= viewsTotalPages - 1}
                        >
                          <Text style={styles.paginationButtonText}>Next →</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {activeTab === 'downloads' && (
              <View style={styles.downloadsTab}>
                {loading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading downloads...</Text>
                  </View>
                ) : downloads.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No downloads recorded yet</Text>
                  </View>
                ) : (
                  <>
                    {downloads.map((download, index) => (
                      <View key={index} style={styles.downloadItem}>
                        <View style={styles.viewUser}>
                          <View style={styles.userAvatar}>
                            {download.profilePic ? (
                              <Image
                                source={{ uri: download.profilePic }}
                                style={styles.avatarImage}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {download.userName?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            )}
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.username}>
                              {download.userName || 'Unknown User'}
                            </Text>
                            <Text style={styles.userRole}>Downloader</Text>
                          </View>
                        </View>
                        <Text style={styles.downloadDate}>
                          {formatDate(download.downloadTime)}
                        </Text>
                      </View>
                    ))}
                    {downloadsTotalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            downloadsPage === 0 && styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setDownloadsPage(Math.max(0, downloadsPage - 1))
                          }
                          disabled={downloadsPage === 0}
                        >
                          <Text style={styles.paginationButtonText}>← Previous</Text>
                        </TouchableOpacity>
                        <Text style={styles.paginationInfo}>
                          Page {downloadsPage + 1} of {downloadsTotalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            downloadsPage >= downloadsTotalPages - 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setDownloadsPage(
                              Math.min(downloadsTotalPages - 1, downloadsPage + 1)
                            )
                          }
                          disabled={downloadsPage >= downloadsTotalPages - 1}
                        >
                          <Text style={styles.paginationButtonText}>Next →</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {activeTab === 'likes' && (
              <View style={styles.likesTab}>
                {loading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#667eea" />
                    <Text style={styles.loadingText}>Loading likes...</Text>
                  </View>
                ) : likes.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No likes yet</Text>
                  </View>
                ) : (
                  <>
                    {likes.map((like, index) => (
                      <View key={index} style={styles.viewItem}>
                        <View style={styles.viewUser}>
                          <View style={styles.userAvatar}>
                            {like.profilePic ? (
                              <Image
                                source={{ uri: like.profilePic }}
                                style={styles.avatarImage}
                                defaultSource={require('../assets/images/dpp.jpg')}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {like.userName?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            )}
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.username}>
                              {like.userName || 'Unknown User'}
                            </Text>
                            <Text style={styles.userRole}>Liked</Text>
                          </View>
                        </View>
                        <Text style={styles.viewTime}>{formatDate(like.time)}</Text>
                      </View>
                    ))}
                    {likesTotalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            likesPage === 0 && styles.paginationButtonDisabled,
                          ]}
                          onPress={() => setLikesPage(Math.max(0, likesPage - 1))}
                          disabled={likesPage === 0}
                        >
                          <Text style={styles.paginationButtonText}>← Previous</Text>
                        </TouchableOpacity>
                        <Text style={styles.paginationInfo}>
                          Page {likesPage + 1} of {likesTotalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            likesPage >= likesTotalPages - 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setLikesPage(Math.min(likesTotalPages - 1, likesPage + 1))
                          }
                          disabled={likesPage >= likesTotalPages - 1}
                        >
                          <Text style={styles.paginationButtonText}>Next →</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {activeTab === 'comments' && (
              <View style={styles.commentsTab}>
                {comments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No comments yet</Text>
                  </View>
                ) : (
                  <>
                    {comments.map((comment, index) => (
                      <View key={index} style={styles.viewItem}>
                        <View style={styles.viewUser}>
                          <View style={styles.userAvatar}>
                            {comment.profilePic ? (
                              <Image
                                source={{ uri: comment.profilePic }}
                                style={styles.avatarImage}
                                defaultSource={require('../assets/images/dpp.jpg')}
                              />
                            ) : (
                              <Text style={styles.avatarText}>
                                {comment.userName?.charAt(0)?.toUpperCase() || '?'}
                              </Text>
                            )}
                          </View>
                          <View style={styles.userInfo}>
                            <Text style={styles.username}>
                              {comment.userName || 'Unknown User'}
                            </Text>
                            <Text style={styles.userRole}>
                              {formatDate(comment.time)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.commentContent}>
                          <Text style={styles.commentText}>{comment.comment}</Text>
                          {(currentUser?.userName === comment.userName ||
                            currentUser?.userName === postAuthor?.userName) && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                            >
                              <Text style={styles.deleteButtonText}>
                                {deletingCommentId === comment.id
                                  ? 'Deleting...'
                                  : 'Delete'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                    {commentsTotalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            commentsPage === 0 && styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setCommentsPage(Math.max(0, commentsPage - 1))
                          }
                          disabled={commentsPage === 0}
                        >
                          <Text style={styles.paginationButtonText}>← Previous</Text>
                        </TouchableOpacity>
                        <Text style={styles.paginationInfo}>
                          Page {commentsPage + 1} of {commentsTotalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            commentsPage >= commentsTotalPages - 1 &&
                              styles.paginationButtonDisabled,
                          ]}
                          onPress={() =>
                            setCommentsPage(
                              Math.min(commentsTotalPages - 1, commentsPage + 1)
                            )
                          }
                          disabled={commentsPage >= commentsTotalPages - 1}
                        >
                          <Text style={styles.paginationButtonText}>Next →</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#8E8E93"
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentSubmitButton,
                      (!newComment.trim() || postingComment) &&
                        styles.commentSubmitButtonDisabled,
                    ]}
                    onPress={handleAddComment}
                    disabled={postingComment || !newComment.trim()}
                  >
                    <Text style={styles.commentSubmitText}>
                      {postingComment ? 'Posting...' : 'Post'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '95%',
    maxWidth: 600,
    height: '90%',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 120, 255, 0.2)',
    backgroundColor: '#16213e',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  navContainer: {
    marginBottom:-550
  },
  navTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    height:50
  },
  navTabActive: {
    borderBottomColor: '#667eea',
  },
  navTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  navTabTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewTab: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  viewsTab: {
    flex: 1,
  },
  downloadsTab: {
    flex: 1,
  },
  likesTab: {
    flex: 1,
  },
  commentsTab: {
    flex: 1,
    paddingBottom: 100,
  },
  loadingState: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  viewItem: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadItem: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  likedIndicator: {
    color: '#ffa726',
  },
  userRole: {
    color: '#8E8E93',
    fontSize: 12,
  },
  viewStats: {
    alignItems: 'flex-end',
  },
  viewCount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  viewTime: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  downloadDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  commentContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  commentText: {
    color: '#bfc9d1',
    fontSize: 14,
    marginBottom: 8,
    maxWidth: '80%',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  paginationButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#4a5568',
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationInfo: {
    color: '#8E8E93',
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(120, 120, 255, 0.2)',
    backgroundColor: '#16213e',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120, 120, 255, 0.3)',
    borderRadius: 12,
    padding: 12,
    color: '#f3f3f7',
    fontSize: 14,
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 12,
    justifyContent: 'center',
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#4a5568',
    opacity: 0.5,
  },
  commentSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

