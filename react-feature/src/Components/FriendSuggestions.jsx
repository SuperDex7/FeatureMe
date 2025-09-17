import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRelationsService } from '../services/UserService';
import './FriendSuggestions.css';

function FriendSuggestions({ limit = 5 }) {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await UserRelationsService.getFriendSuggestions(limit);
            setSuggestions(response.data);
        } catch (err) {
            console.error('Error loading friend suggestions:', err);
            setError('Failed to load suggestions');
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = (userName) => {
        navigate(`/profile/${userName}`);
    };

    const handleFollowUser = async (userName) => {
        try {
            await UserRelationsService.toggleFollow(userName);
            // Remove the user from suggestions after following
            setSuggestions(prev => prev.filter(user => user.userName !== userName));
        } catch (err) {
            console.error('Error following user:', err);
        }
    };

    if (loading) {
        return (
            <div className="friend-suggestions">
                <h3 className="suggestions-title">Suggested for You</h3>
                <div className="suggestions-loading">Loading suggestions...</div>
            </div>
        );
    }

    if (error || suggestions.length === 0) {
        return null; // Don't show the component if there are no suggestions
    }

    return (
        <div className="friend-suggestions">
            <h3 className="suggestions-title">Suggested for You</h3>
            <div className="suggestions-list">
                {suggestions.map((user) => (
                    <div key={user.id} className="suggestion-item">
                        <div className="suggestion-user-info" onClick={() => handleUserClick(user.userName)}>
                            <img 
                                src={user.profilePic || '/dpp.jpg'} 
                                alt={user.userName}
                                className="suggestion-avatar"
                                onError={(e) => {
                                    e.target.src = '/dpp.jpg'
                                }}
                            />
                            <div className="suggestion-details">
                                <span className="suggestion-username">{user.userName}</span>
                                <span className="suggestion-reason">Suggested for you</span>
                            </div>
                        </div>
                        <button 
                            className="suggestion-follow-btn"
                            onClick={() => handleFollowUser(user.userName)}
                        >
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FriendSuggestions;
