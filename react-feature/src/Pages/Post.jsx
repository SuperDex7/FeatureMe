import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api, { getCurrentUser } from "../services/AuthService";
import { deleteComment, deletePost, addView } from "../services/PostsService";
import "./Post.css";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import LikesSection from "../Components/LikesSection";
import ViewsAnalytics from "../Components/ViewsAnalytics";

function Post() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [comments, setComments] = useState([]); 
    const [localLikes, setLocalLikes] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [deletingComment, setDeletingComment] = useState(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [showViewsAnalytics, setShowViewsAnalytics] = useState(false);
    const [commentPage, setCommentPage] = useState(0);
    const [commentSize] = useState(10);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [loadingComments, setLoadingComments] = useState(false);
    const [totalComments, setTotalComments] = useState(0);
    
    const audioRef = useRef(null);
    const progressRef = useRef(null);

    // Load comments with pagination
    const loadComments = async (page = 0, append = false) => {
        setLoadingComments(true);
        try {
            const response = await api.get(`/posts/comments/${id}/paginated?page=${page}&size=${commentSize}`);
            const newComments = response.data.content || [];
            
            if (append) {
                setComments(prev => [...prev, ...newComments]);
            } else {
                setComments(newComments);
            }
            
            // Check if there are more comments to load using the cached totalComments
            setHasMoreComments(newComments.length === commentSize && (page + 1) * commentSize < totalComments);
        } catch (error) {
            console.error('Error loading comments:', error);
            // Fallback to empty array if pagination fails
            if (!append) {
                setComments([]);
            }
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
                
                const res = await api.get(`/posts/get/id/${id}`);
                setPost(res.data);
                setLocalLikes(Array.isArray(res.data.likes) ? res.data.likes : []);
                setTotalComments(res.data.totalComments || 0);
                console.log(res.data);
                
                // Load first page of comments
                loadComments(0, false);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [id]);

    // Load more comments function
    const loadMoreComments = () => {
        if (!loadingComments && hasMoreComments) {
            const nextPage = commentPage + 1;
            setCommentPage(nextPage);
            loadComments(nextPage, true); // append = true
        }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handleComment = (e) => {
        e.preventDefault();
        
        if (commentInput.trim() && currentUser) {
            // Create the new comment object
            const newComment = {
                userName: currentUser.userName,
                profilePic: currentUser.profilePic,
                comment: commentInput
            };
            
            // Optimistically add comment to UI immediately
            setComments(prevComments => {
                const currentComments = Array.isArray(prevComments) ? prevComments : [];
                return [...currentComments, newComment];
            });
            
            // Clear input immediately
            setCommentInput("");
            
            // Send to backend
            api.post(`/posts/add/comment/${id}`, commentInput, {
                headers: {
                    'Content-Type': 'text/plain'  // Since you're sending just text
                }
            })
            .then(res => {
                console.log(res);
                // Reload the first page of comments to get the latest data
                setCommentPage(0);
                loadComments(0, false);
                // Update total comments count
                setTotalComments(prev => prev + 1);
            })
            .catch(err => {
                console.error(err);
                // Remove the optimistic comment on error
                setComments(prevComments => {
                    const currentComments = Array.isArray(prevComments) ? prevComments : [];
                    return currentComments.filter(c => c.comment !== newComment.comment);
                });
                // Restore the input
                setCommentInput(newComment.comment);
            });
        }
    };

    const handleDeleteComment = async (comment) => {
        if (!currentUser || !comment.id) {
            console.error('Cannot delete comment: missing user or comment ID');
            return;
        }
        
        setDeletingComment(comment.id);
        
        try {
            await deleteComment(comment.id);
            
            // Reload current page of comments to reflect the deletion
            loadComments(commentPage, false);
            // Update total comments count
            setTotalComments(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error deleting comment:', err);
            // Could add error handling here if needed
        } finally {
            setDeletingComment(null);
        }
    };

    const handlePlayPause = async () => {
        // Add view tracking when playing
        if (!isPlaying && currentUser) {
            const cooldownKey = `view_${id}_${currentUser?.userName}`;
            const lastViewTime = localStorage.getItem(cooldownKey);
            const now = Date.now();
            const oneMinute = 60 * 1000; // 1 minute in milliseconds
            
            let shouldAddView = true;
            if (lastViewTime) {
                const timeSinceLastView = now - parseInt(lastViewTime);
                if (timeSinceLastView < oneMinute) {
                    shouldAddView = false;
                    console.log(`View cooldown active. ${Math.ceil((oneMinute - timeSinceLastView) / 1000)}s remaining`);
                }
            }
            
            if (shouldAddView) {
                try {
                    await addView(id);
                    localStorage.setItem(cooldownKey, now.toString());
                    console.log("View added for post:", id);
                } catch (error) {
                    console.error("Error adding view:", error);
                }
            }
        }

        if (!audioRef.current) {
            const newAudio = new Audio(post.music);
            newAudio.addEventListener('loadedmetadata', () => {
                setDuration(newAudio.duration);
            });
            newAudio.addEventListener('timeupdate', () => {
                setCurrentTime(newAudio.currentTime);
            });
            newAudio.addEventListener('ended', () => {
                setIsPlaying(false);
                setCurrentTime(0);
            });
            audioRef.current = newAudio;
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * duration;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
        if (newVolume === 0) {
            setIsMuted(true);
        } else {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            if (isMuted) {
                audioRef.current.volume = volume;
                setIsMuted(false);
            } else {
                audioRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    const handleLikeUpdate = (updatedLikes) => {
        setLocalLikes(updatedLikes);
    };

    const handleDeletePost = async () => {
        if (!currentUser || !window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        setIsDeletingPost(true);
        
        try {
            await deletePost(id);
            console.log('Post deleted successfully');
            // Redirect to home page after successful deletion
            window.location.href = '/feed';
        } catch (err) {
            console.error('Error deleting post:', err);
            alert('Failed to delete post. Please try again.');
        } finally {
            setIsDeletingPost(false);
        }
    };

    if (!post) {
        return (
            <div className="post-loading">
                <div className="loading-spinner"></div>
                <p>Loading track...</p>
            </div>
        );
    }

    return (
        <div className="post-page">
            <Header/>
            {/* Post Hero Section with Track Banner */}
            <div className="post-hero-section">
                <div className="post-hero-background" style={{ backgroundImage: `url(${post.author.banner})` }}>
                    <div className="post-hero-overlay">
                        <div className="post-hero-content">
                            <div className="post-track-badge">
                                <span className="post-badge-icon">🎵</span>
                                {post.status === 'PUBLISHED' && (
                                <span className="post-badge-text">TRACK</span>
                                )}
                                {post.status === 'DRAFT' && (
                                    <span className="post-badge-text">DRAFT</span>
                                )}
                                {post.status === 'PARTIALLY_APPROVED' && (
                                    <span className="post-badge-text">PARTIALLY APPROVED</span>
                                )}
                            </div>
                            <h1 className="post-hero-title">{post.title}</h1>
                            <p className="post-hero-subtitle">by {post.author.userName}</p>
                            <div className="post-hero-actions">
                                <button 
                                    className={`post-hero-play-btn ${isPlaying ? 'playing' : ''}`}
                                    onClick={handlePlayPause}
                                >
                                    <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                                    <span className="play-text">{isPlaying ? 'Pause' : 'Play'}</span>
                                </button>
                                <a href={`/profile/${post.author.userName}`}><button className="post-hero-download-btn">
                                    <span className="download-icon">⬇️</span>
                                    View Profile
                                </button></a>
                                {currentUser && currentUser.userName === post.author.userName && (
                                    
                                    <>
                                    {currentUser.role === 'USERPLUS' && (
                                        <button 
                                            className="post-hero-analytics-btn"
                                            onClick={() => setShowViewsAnalytics(true)}
                                            title="View Analytics (Premium Feature)"
                                        >
                                            <span className="post-analytics-icon">📊</span>
                                            <span className="post-analytics-text">Analytics</span>
                                        </button>
                                    ) ||  <button 
                                    className="post-hero-analytics-btn"
                                    onClick={() => alert('Get a Plus Membership to view analytics')}
                                    title="View Analytics (Premium Feature)"
                                >
                                    <span className="post-analytics-icon">📊</span>
                                    <span className="post-analytics-text">Analytics</span>
                                </button>}
                                        <button 
                                            className="post-hero-delete-btn"
                                            onClick={handleDeletePost}
                                            disabled={isDeletingPost}
                                            title="Delete post"
                                        >
                                            <span className="post-delete-icon">🗑️</span>
                                            <span className="post-delete-text">{isDeletingPost ? 'Deleting...' : 'Delete'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audio Player Section */}
            <div className={`audio-player-section ${isPlaying ? 'volume-expanded' : ''}`}>
                <div className="audio-player-container">
                    <div className="audio-player-info">
                        <div className="audio-player-cover">
                            <img src={post.author.banner} alt="Track Cover" />
                        </div>
                        <div className="audio-player-details">
                            <h3 className="audio-track-title">{post.title}</h3>
                            <p className="audio-track-artist">{post.author.userName}</p>
                        </div>
                    </div>
                    
                    <div className="audio-player-controls">
                        <button className="control-btn" onClick={handlePlayPause}>
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        
                        <div className="progress-container">
                            <span className="time-display">{formatTime(currentTime)}</span>
                            <div 
                                className="progress-bar" 
                                ref={progressRef}
                                onClick={handleSeek}
                            >
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                ></div>
                                <div 
                                    className="progress-handle" 
                                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="time-display">{formatTime(duration)}</span>
                        </div>
                    </div>
                    
                    <div className="audio-player-volume">
                        <button className="volume-btn" onClick={toggleMute}>
                            {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="volume-slider"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="main-container">
                <div className="content-grid">
                    {/* Left Column - Track Details */}
                    <div className="left-column">
                        {/* Artist Profile Card */}
                        <div className="artist-card">
                            <div className="artist-header">
                                <img src={post.author.profilePic} alt={post.author.userName} className="artist-avatar" />
                                <div className="artist-info">
                                    <h3 className="artist-name">{post.author.userName}</h3>
                                    <p className="artist-bio">{post.author.bio || "Music creator"}</p>
                                </div>
                            </div>
                            <div className="artist-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{localLikes?.length || 0}</span>
                                    <span className="stat-label">Likes</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{totalComments || 0}</span>
                                    <span className="stat-label">Comments</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{post.totalViews || 0}</span>
                                    <span className="stat-label">Views</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">
                                        {(() => {
                                            const postDate = new Date(post.time);
                                            const currentDate = new Date();
                                            const timeDiff = currentDate.getTime() - postDate.getTime();
                                            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
                                            
                                            if (daysDiff === 0) return "Today";
                                            if (daysDiff === 1) return "1 day ago";
                                            if (daysDiff < 7) return `${daysDiff} days ago`;
                                            if (daysDiff < 30) return `${Math.floor(daysDiff / 7)} weeks ago`;
                                            if (daysDiff < 365) return `${Math.floor(daysDiff / 30)} months ago`;
                                            return `${Math.floor(daysDiff / 365)} years ago`;
                                        })()}
                                    </span>
                                    <span className="stat-label">Released</span>
                                </div>
                            </div>
                        </div>

                        {/* Track Information */}
                        <div className="track-details-card">
                            <h3 className="card-title">Track Details</h3>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-icon">📅</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Released</span>
                                        <span className="detail-value">{new Date(post.time).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">🎭</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Genre</span>
                                        <span className="detail-value">{post.genre.join(" • ")}</span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-icon">🤝</span>
                                    <div className="detail-content">
                                        <span className="detail-label">Features</span>
                                        <span className="detail-value">{post?.features?.join(" • ")|| "None"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tags Cloud */}
                        <div className="tags-card">
                            <h3 className="card-title">Tags</h3>
                            <div className="tags-cloud">
                                {post.genre.map((tag, index) => (
                                    <span key={index} className="tag-pill genre-tag">#{tag.toLowerCase()}</span>
                                ))}
                                {post.features.map((feature, index) => (
                                    <span key={index} className="tag-pill feature-tag">#{feature.toLowerCase()}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Main Content */}
                    <div className="right-column">
                        {/* Content Navigation */}
                        <div className="content-nav">
                            <button 
                                className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                            <button 
                                className={`nav-tab disabled ${activeTab === 'licensing' ? 'active' : ''}`}
                                onClick={(e) => e.preventDefault()}
                                disabled
                                aria-disabled="true"
                                title="Licensing is currently unavailable"
                            >
                                Licensing
                            </button>
                            <button 
                                className={`nav-tab ${activeTab === 'community' ? 'active' : ''}`}
                                onClick={() => setActiveTab('community')}
                            >
                                Community
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'overview' && (
                            <div className="tab-content">
                                <div className="overview-section">
                                    <h2 className="section-title">About This Track</h2>
                                    <p className="track-description">{post.description}</p>
                                    
                                    <div className="track-metrics">
                                        <div className="metric-card">
                                            <div className="metric-icon">🎧</div>
                                            <div className="metric-content">
                                                <span className="metric-value">Ready to</span>
                                                <span className="metric-label">Record</span>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-icon">🎯</div>
                                            <div className="metric-content">
                                                <span className="metric-value">Perfect for</span>
                                                <span className="metric-label">{post.genre[0]}</span>
                                            </div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-icon">⭐</div>
                                            <div className="metric-content">
                                                <span className="metric-value">Premium</span>
                                                <span className="metric-label">Quality</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'licensing' && (
                            <div className="tab-content">
                                <div className="licensing-section">
                                    <h2 className="section-title">Choose Your License</h2>
                                    <div className="license-options">
                                        <div className="license-option basic">
                                            <div className="license-header">
                                                <h3 className="license-name">Basic</h3>
                                                <span className="license-price">$19</span>
                                            </div>
                                            <ul className="license-features">
                                                <li>MP3 Download</li>
                                                <li>Personal Use</li>
                                                <li>Demo Recording</li>
                                            </ul>
                                            <button className="license-select-btn">Select Basic</button>
                                        </div>
                                        
                                        <div className="license-option premium">
                                            <div className="license-badge">Most Popular</div>
                                            <div className="license-header">
                                                <h3 className="license-name">Premium</h3>
                                                <span className="license-price">$49</span>
                                            </div>
                                            <ul className="license-features">
                                                <li>WAV + MP3 Download</li>
                                                <li>Commercial Use</li>
                                                <li>Up to 10,000 Streams</li>
                                                <li>Music Video Rights</li>
                                            </ul>
                                            <button className="license-select-btn premium">Select Premium</button>
                                        </div>
                                        
                                        <div className="license-option exclusive">
                                            <div className="license-header">
                                                <h3 className="license-name">Exclusive</h3>
                                                <span className="license-price">Contact</span>
                                            </div>
                                            <ul className="license-features">
                                                <li>Full Rights Transfer</li>
                                                <li>Unlimited Use</li>
                                                <li>Stems Included</li>
                                                <li>Priority Support</li>
                                            </ul>
                                            <button className="license-select-btn">Contact Us</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'community' && (
                            <div className="tab-content">
                                <div className="community-section">
                                    <h2 className="section-title">Community</h2>
                                    
                                    <LikesSection
                                        postId={id}
                                        likes={localLikes}
                                        onLikeUpdate={handleLikeUpdate}
                                    />

                                    
                                    
                                    <div className="comments-section">
                                        <h3 className="subsection-title">Comments ({totalComments || 0})</h3>
                                        <div className="comments-list">
                                            {loadingComments && comments.length === 0 ? (
                                                <div className="comments-loading">
                                                    <div className="loading-spinner"></div>
                                                    <p>Loading comments...</p>
                                                </div>
                                            ) : comments?.length > 0 ? (
                                                comments.map((comment, index) => (
                                                    <div key={index} className="comment-item">
                                                        <div><a href={`/profile/${comment.userName}`}><img className="comment-avatar" src={comment.profilePic} alt="" /></a></div>
                                                        <div className="comment-content">
                                                            <div className="comment-header">
                                                                <a href={`/profile/${comment.userName}`}><span className="comment-username">{comment.userName}</span></a>
                                                                <div className="comment-header-right">
                                                                    <span className="comment-time">{new Date(comment.time).toLocaleDateString()}</span>
                                                                    {currentUser && (currentUser.userName === comment.userName || (post && currentUser.userName === post.author.userName)) && (
                                                                        <button
                                                                            className="delete-comment-btn"
                                                                            onClick={() => handleDeleteComment(comment)}
                                                                            disabled={deletingComment === comment.id}
                                                                            title={currentUser.userName === comment.userName ? "Delete your comment" : "Delete comment (as post author)"}
                                                                        >
                                                                            {deletingComment === comment.id ? '...' : '🗑️'}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="comment-text">{comment.comment}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="no-comments">
                                                    <p>No comments yet. Be the first to comment!</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Load More Comments Button */}
                                        {hasMoreComments && (
                                            <div className="load-more-section">
                                                <button 
                                                    className="load-more-btn"
                                                    onClick={loadMoreComments}
                                                    disabled={loadingComments}
                                                >
                                                    {loadingComments ? (
                                                        <>
                                                            <span className="loading-spinner-small"></span>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="load-more-icon">↓</span>
                                                            Load More Comments
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                        
                                        <div className="add-comment">
                                            <input 
                                                type="text"
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="comment-input"
                                            />
                                            <button className="comment-btn" onClick={handleComment}>Post</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <ViewsAnalytics
                postId={id}
                postTitle={post.title}
                isOpen={showViewsAnalytics}
                onClose={() => setShowViewsAnalytics(false)}
                currentUser={currentUser}
                postAuthor={post.author}
                totalDownloads={post?.totalDownloads || 0}
            />
            <Footer />
        </div>
    );
}

export default Post;