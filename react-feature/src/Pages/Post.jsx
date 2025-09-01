import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../services/AuthService";
import "./Post.css";
import Header from "../Components/Header";
import LikesSection from "../Components/LikesSection";

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
    
    const audioRef = useRef(null);
    const progressRef = useRef(null);
    const userString = localStorage.getItem('user');
    const userrr = JSON.parse(userString);

    useEffect(() => {
        api.get(`http://localhost:8080/api/posts/get/id/${id}`)
            .then(res => {
                setPost(res.data);
                setComments(Array.isArray(res.data.comments) ? res.data.comments : []);
                setLocalLikes(Array.isArray(res.data.likes) ? res.data.likes : []);
                console.log(res.data)
            }).catch(err => {
                console.error("Error fetching post:", err);
            });
    }, [id]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const handleComment = (e) => {
        e.preventDefault();
        
        if (commentInput.trim()) {
            // Create the new comment object
            const newComment = {
                userName: userrr.username,
                profilePic: userrr.profilePic,
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
            api.post(`/posts/add/comment/${id}/${userrr.username}`, commentInput, {
                headers: {
                    'Content-Type': 'text/plain'  // Since you're sending just text
                }
            })
            .then(res => {
                console.log(res);
                // Optionally refresh to get server-side data (timestamps, etc.)
                api.get(`/posts/get/id/${id}`)
                    .then(postRes => {
                        if (postRes.data && postRes.data.comments) {
                            setComments(postRes.data.comments);
                        }
                    })
                    .catch(err => console.error('Error fetching updated comments:', err));
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
    const handlePlayPause = () => {
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
            {/* Hero Section with Track Banner */}
            <div className="hero-section">
                <div className="hero-background" style={{ backgroundImage: `url(${post.author.banner})` }}>
                    <div className="hero-overlay">
                        <div className="hero-content">
                            <div className="track-badge">
                                <span className="badge-icon">🎵</span>
                                <span className="badge-text">TRACK</span>
                            </div>
                            <h1 className="hero-title">{post.title}</h1>
                            <p className="hero-subtitle">by {post.author.userName}</p>
                            <div className="hero-actions">
                                <button 
                                    className={`hero-play-btn ${isPlaying ? 'playing' : ''}`}
                                    onClick={handlePlayPause}
                                >
                                    <span className="play-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                                    <span className="play-text">{isPlaying ? 'Pause' : 'Play'}</span>
                                </button>
                                <a href={`/profile/${post.author.userName}`}><button className="hero-download-btn">
                                    <span className="download-icon">⬇️</span>
                                    View Profile
                                </button></a>
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
                                    <span className="stat-number">{comments?.length || 0}</span>
                                    <span className="stat-label">Comments</span>
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
                                className={`nav-tab ${activeTab === 'licensing' ? 'active' : ''}`}
                                onClick={() => setActiveTab('licensing')}
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
                                        <h3 className="subsection-title">Comments ({comments?.length || 0})</h3>
                                        <div className="comments-list">
                                            {comments?.map((comment, index) => (
                                                <div key={index} className="comment-item">
                                                    <div ><img className="comment-avatar" src={comment.profilePic} alt="" /></div>
                                                    <div className="comment-content">
                                                        <span className="comment-username">{comment.userName}</span>
                                                        <p className="comment-text">{comment.comment}</p>
                                                        <span className="comment-time">{new Date(comment.time).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            )) || "You will see comments here"}
                                        </div>
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
        </div>
    );
}

export default Post;