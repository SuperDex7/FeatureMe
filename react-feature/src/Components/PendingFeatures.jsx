import React, { useState, useEffect } from 'react';
import api, { getCurrentUser } from '../services/AuthService';
import Header from './Header';
import Footer from './Footer';
import './PendingFeatures.css';

const PendingFeatures = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
      setPendingRequests(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError('Failed to load pending feature requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await api.post(`/posts/approve-feature/${postId}`);
      // Remove from pending list
      setPendingRequests(prev => prev.filter(request => request.id !== postId));
      // Show success message
      alert('Feature request approved successfully!');
    } catch (err) {
      console.error('Error approving feature:', err);
      alert('Failed to approve feature request. Please try again.');
    }
  };

  const handleReject = async (postId) => {
    try {
      await api.post(`/posts/reject-feature/${postId}`);
      // Remove from pending list
      setPendingRequests(prev => prev.filter(request => request.id !== postId));
      // Show success message
      alert('Feature request rejected.');
    } catch (err) {
      console.error('Error rejecting feature:', err);
      alert('Failed to reject feature request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="pending-features-page">
        <Header />
        <div className="pending-features">
          <div className="loading">Loading pending feature requests...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-features-page">
        <Header />
        <div className="pending-features">
          <div className="error">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="pending-features-page">
        <Header />
        <div className="pending-features">
          <div className="no-requests">
            <div className="no-requests-icon">✅</div>
            <h3>No Pending Feature Requests</h3>
            <p>You don't have any feature requests waiting for approval.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="pending-features-page">
      <Header />
      <div className="pending-features">
      <div className="pending-features-header">
        <h2>Pending Feature Requests</h2>
        <p>Review and approve posts that want to feature you</p>
      </div>

      <div className="requests-list">
        {pendingRequests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="author-info">
                <a href={`/profile/${request.author.userName}`}><img 
                  src={request.author.profilePic || '/default-avatar.png'} 
                  alt={request.author.userName}
                  className="author-avatar"
                /></a>
                <div className="author-details">
                  <a href={`/profile/${request.author.userName}`}><h4>{request.author.userName}</h4></a>
                  <p>wants to feature you in their post</p>
                </div>
              </div>
              <div className="request-time">
                {new Date(request.time).toLocaleDateString()}
              </div>
            </div>

            <div className="request-content">
              <a href={`/post/${request.id}`}><h3 className="post-title">{request.title}</h3></a>
              <p className="post-description">{request.description}</p>
              
              <div className="post-meta">
                <div className="genre-tags">
                  {request.genre.map((genre, index) => (
                    <span key={index} className="genre-tag">{genre}</span>
                  ))}
                </div>
                
                                 <div className="features-info">
                   <strong>Other Features:</strong>
                   {request.pendingFeatures && request.pendingFeatures.length > 1 ? (
                     <span className="features-list">
                       {request.pendingFeatures.filter(f => f !== currentUser?.userName).join(', ')}
                     </span>
                   ) : (
                     <span className="no-other-features">None</span>
                   )}
                 </div>
                 
                 {request.features && request.features.length > 0 && (
                   <div className="features-info">
                     <strong>Already Approved Features:</strong>
                     <span className="features-list approved">
                       {request.features.join(', ')}
                     </span>
                   </div>
                 )}
              </div>
            </div>

            <div className="request-actions">
              <button 
                className="approve-btn"
                onClick={() => handleApprove(request.id)}
              >
                ✅ Approve
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleReject(request.id)}
              >
                ❌ Reject
              </button>
            </div>
          </div>
                 ))}
       </div>
      </div>
      <Footer />
     </div>
   );
 };
 
 export default PendingFeatures;
