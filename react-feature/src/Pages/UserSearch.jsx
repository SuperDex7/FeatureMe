import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/AuthService";
import DemoService from "../services/DemoService";
import AudioPlayer from "../Components/AudioPlayer";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "./UserSearch.css";

function UserSearch() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [followingStatus, setFollowingStatus] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [playingDemo, setPlayingDemo] = useState(null);
    const [loadedDemos, setLoadedDemos] = useState({});
    const [loadingDemos, setLoadingDemos] = useState({});

    // Debounced search function
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId;
            return (term) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (term.trim()) {
                        setPage(0);
                        fetchUsers(term, 0);
                    } else {
                        setUsers([]);
                        setTotalPages(0);
                        setHasMore(false);
                    }
                }, 300);
            };
        })(),
        []
    );

    const fetchUsers = async (term, pageNum) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/user/get/search/${term}?page=${pageNum}&size=${size}`);
            const data = response.data;
            const usersData = data.content || [];
            setUsers(usersData);
            setTotalPages(data.page?.totalPages || 0);
            setHasMore((data.page?.totalPages || 0) > pageNum);
            
            // Check following status for each user
            if (currentUser) {
                const followingChecks = usersData.map(user => 
                    api.get(`/user-relations/is-following/${user.userName}`)
                        .then(res => ({ userName: user.userName, isFollowing: res.data }))
                        .catch(() => ({ userName: user.userName, isFollowing: false }))
                );
                
                const results = await Promise.all(followingChecks);
                const statusMap = {};
                results.forEach(result => {
                    statusMap[result.userName] = result.isFollowing;
                });
                setFollowingStatus(prev => ({ ...prev, ...statusMap }));
            }
        } catch (err) {
            setError("Failed to fetch users. Please try again.");
            console.error("Error fetching users:", err);
        } finally {
            setLoading(false);
        }
    };

    // Get current user on component mount
    useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const response = await api.get('/user/me');
                setCurrentUser(response.data);
            } catch (err) {
                console.error("Error fetching current user:", err);
            }
        };
        getCurrentUser();
    }, []);

    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    const handleFollowToggle = async (targetUserName) => {
        if (!currentUser) return;
        
        try {
            const response = await api.post(`/user-relations/follow/${targetUserName}`);
            
            // Check the response text - backend returns "Followed" or "Unfollowed"
            const responseText = response.data.toString();
            const isFollowing = responseText === "Followed";
            
            setFollowingStatus(prev => ({
                ...prev,
                [targetUserName]: isFollowing
            }));
            
            // Update the user's follower count in the local state
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.userName === targetUserName 
                        ? { 
                            ...user, 
                            followersCount: isFollowing 
                                ? (user.followersCount || 0) + 1 
                                : Math.max((user.followersCount || 0) - 1, 0)
                          }
                        : user
                )
            );
        } catch (err) {
            console.error("Error toggling follow:", err);
        }
    };

    const handleProfileClick = (userName) => {
        navigate(`/profile/${userName}`);
    };

    const handleDemoPlay = async (demoId, userName) => {
        try {
            setLoading(true);
            const demoData = await DemoService.getDemoById(demoId);
            if (demoData && demoData.songUrl) {
                setPlayingDemo({ 
                    url: demoData.songUrl, 
                    userName,
                    title: demoData.title || `${userName}'s Demo`
                });
            } else {
                console.error("Demo data not found or missing audio URL");
            }
        } catch (error) {
            console.error("Error fetching demo:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserDemos = async (userId, demoIds) => {
        if (loadedDemos[userId] || loadingDemos[userId]) return;
        
        setLoadingDemos(prev => ({ ...prev, [userId]: true }));
        
        try {
            const demoPromises = demoIds.map(demoId => 
                DemoService.getDemoById(demoId).catch(err => {
                    console.error(`Error loading demo ${demoId}:`, err);
                    return null;
                })
            );
            
            const demos = await Promise.all(demoPromises);
            const validDemos = demos.filter(demo => demo && demo.songUrl);
            
            setLoadedDemos(prev => ({ ...prev, [userId]: validDemos }));
        } catch (error) {
            console.error("Error loading demos:", error);
        } finally {
            setLoadingDemos(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleDemoClose = () => {
        setPlayingDemo(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setPage(0);
            fetchUsers(searchTerm, 0);
        }
    };

    const nextPage = () => {
        if (hasMore && !loading) {
            const nextPageNum = page + 1;
            setPage(nextPageNum);
            fetchUsers(searchTerm, nextPageNum);
        }
    };

    const prevPage = () => {
        if (page > 0 && !loading) {
            const prevPageNum = page - 1;
            setPage(prevPageNum);
            fetchUsers(searchTerm, prevPageNum);
        }
    };

    const goToPage = (pageNum) => {
        if (pageNum >= 0 && pageNum < totalPages && !loading) {
            setPage(pageNum);
            fetchUsers(searchTerm, pageNum);
        }
    };
    
    return (
        <div className="user-search-page">
            <Header />
            <div className="user-search-container">
            <div className="user-search-header">
                <h1 className="search-title">Find Users</h1>
                <p className="search-subtitle">Discover and connect with other users</p>
            </div>

            <form className="search-form" onSubmit={handleSearch}>
                <div className="search-input-container">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by username..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button" disabled={loading}>
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {loading && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Searching users...</p>
                </div>
            )}

            {!loading && users.length > 0 && (
                <div className="users-results">
                    <div className="results-header">
                        <h2>Search Results</h2>
                        <span className="results-count">
                            {users.length} user{users.length !== 1 ? 's' : ''} found
                        </span>
                    </div>
                    
                    <div className="users-grid">
                        {users.map((user) => (
                            <div key={user.id} className={`user-card ${user.role === 'USERPLUS' ? 'userplus-card' : ''}`}>
                                <div className="user-card-header">
                                    <img
                                        src={user.profilePic || '/dpp.jpg'}
                                        alt={user.userName}
                                        className="search-user-avatar search-clickable"
                                        onClick={() => handleProfileClick(user.userName)}
                                        title="Click to view profile"
                                    />
                                    <div className="user-info">
                                        <div className="user-name-container">
                                            <h3 
                                                className="search-user-name search-clickable"
                                                onClick={() => handleProfileClick(user.userName)}
                                                title="Click to view profile"
                                            >
                                                {user.userName}
                                            </h3>
                                            {user.role && user.role !== 'USER' && (
                                                <span className="user-role-badge">{user.role}</span>
                                            )}
                                            {user.role === 'USERPLUS' && (
                                                <span className="premium-indicator">⭐</span>
                                            )}
                                        </div>
                                        {user.location && (
                                            <p className="user-location">📍 {user.location}</p>
                                        )}
                                        {user.bio && (
                                            <p className="user-bio">{user.bio}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="user-card-content">
                                    <div className="user-card-main">
                                        <div className="user-card-details">
                                            {/* Badges */}
                                            {user.badges && user.badges.length > 0 && (
                                                <div className="user-badges">
                                                    <div className="badges-label">Badges:</div>
                                                    <div className="badges-list">
                                                        {user.badges.slice(0, 3).map((badge, index) => (
                                                            <span key={index} className="badge">
                                                                {badge}
                                                            </span>
                                                        ))}
                                                        {user.badges.length > 3 && (
                                                            <span className="badge more-badges">
                                                                +{user.badges.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Demo Section with Playable Demo */}
                                            {user.demo && user.demo.length > 0 && (
                                                <div className="user-demos">
                                                    <div className="demos-label">Demos:</div>
                                                    <div className="demos-list">
                                                        {/* Most recent demo with play button */}
                                                        <button 
                                                            className="demo-play-btn"
                                                            onClick={() => handleDemoPlay(user.demo[0], user.userName)}
                                                            title="Play demo"
                                                            disabled={loading}
                                                        >
                                                            {loading ? "Loading..." : "🎵 Play Demo"}
                                                        </button>
                                                        
                                                        {/* Load more demos button */}
                                                        {user.demo.length > 1 && !loadedDemos[user.id] && (
                                                            <button 
                                                                className="load-demos-btn"
                                                                onClick={() => loadUserDemos(user.id, user.demo.slice(1))}
                                                                disabled={loadingDemos[user.id]}
                                                            >
                                                                {loadingDemos[user.id] ? "Loading..." : `+${user.demo.length - 1} More`}
                                                            </button>
                                                        )}
                                                        
                                                        {/* Additional loaded demos */}
                                                        {loadedDemos[user.id] && loadedDemos[user.id].map((demo, index) => (
                                                            <button 
                                                                key={index + 1}
                                                                className="demo-play-btn secondary"
                                                                onClick={() => handleDemoPlay(demo.id, user.userName)}
                                                                title={`Play ${demo.title}`}
                                                                disabled={loading}
                                                            >
                                                                🎵 {demo.title || `Demo ${index + 2}`}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Row */}
                                        <div className="user-search-stats">
                                            <div className="user-search-stat-item">
                                                <span className="user-search-stat-number">{user.followersCount || 0}</span>
                                                <span className="user-search-stat-label">Followers</span>
                                            </div>
                                            <div className="user-search-stat-item">
                                                <span className="user-search-stat-number">{user.followingCount || 0}</span>
                                                <span className="user-search-stat-label">Following</span>
                                            </div>
                                            <div className="user-search-stat-item">
                                                <span className="user-search-stat-number">{user.postsCount || 0}</span>
                                                <span className="user-search-stat-label">Posts</span>
                                            </div>
                                        </div>

                                        {/* Follow/Unfollow Button */}
                                        {currentUser && currentUser.userName !== user.userName && (
                                            <div className="user-actions">
                                                <button 
                                                    className={`follow-btn ${followingStatus[user.userName] ? 'following' : 'not-following'}`}
                                                    onClick={() => handleFollowToggle(user.userName)}
                                                >
                                                    {followingStatus[user.userName] ? 'Unfollow' : 'Follow'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={prevPage}
                                disabled={page === 0 || loading}
                                className="pagination-btn prev-btn"
                            >
                                Previous
                            </button>
                            
                            <div className="pagination-numbers">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (page < 3) {
                                        pageNum = i;
                                    } else if (page >= totalPages - 3) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            className={`pagination-number ${page === pageNum ? 'active' : ''}`}
                                            disabled={loading}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button
                                onClick={nextPage}
                                disabled={!hasMore || loading}
                                className="pagination-btn next-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!loading && searchTerm && users.length === 0 && (
                <div className="no-results">
                    <div className="no-results-icon">🔍</div>
                    <h3>No users found</h3>
                    <p>Try searching with a different username or check your spelling.</p>
                </div>
            )}

            {!searchTerm && (
                <div className="search-prompt">
                    <div className="search-prompt-icon">👥</div>
                    <h3>Start searching for users</h3>
                    <p>Enter a username in the search box above to find other users.</p>
                </div>
            )}

            {/* Audio Player Modal */}
            {playingDemo && (
                <div className="audio-player-modal">
                    <div className="audio-player-backdrop" onClick={handleDemoClose}></div>
                    <div className="audio-player-container">
                        <AudioPlayer 
                            src={playingDemo.url}
                            title={playingDemo.title}
                            onClose={handleDemoClose}
                        />
                    </div>
            </div>
            )}
            </div>
            <Footer />
        </div>
    );
}

export default UserSearch;