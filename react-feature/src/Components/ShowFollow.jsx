import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { UserRelationsService } from "../services/UserService"
import "./ShowFollow.css"

function ShowFollow({ userName, isOpen, onClose, type }) {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("")
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [totalPages, setTotalPages] = useState(0)
    
    const title = type === 'followers' ? 'Followers' : 'Following'
    const size = 20 // Items per page
    
    const handleUserClick = (username) => {
        navigate(`/profile/${username}`)
        onClose()
    }
    
    // Load users when popup opens or type changes
    useEffect(() => {
        if (isOpen && userName) {
            loadUsers(0) // Start from page 0
        }
    }, [isOpen, type, userName])
    
    // Reset when popup closes or type changes
    useEffect(() => {
        if (!isOpen) {
            setUsers([])
            setPage(0)
            setHasMore(true)
            setSearchTerm("")
        }
    }, [isOpen, type])
    
    const loadUsers = async (pageNum) => {
        if (loading) return
        
        setLoading(true)
        try {
            const response = type === 'followers' 
                ? await UserRelationsService.getFollowers(userName, pageNum, size)
                : await UserRelationsService.getFollowing(userName, pageNum, size)
            
            // Handle both Page and PagedModel structures
            const pageData = response.data.page || response.data;
            const newUsers = pageData.content || response.data.content;
            const totalPages = pageData.totalPages || response.data.totalPages;
            
            setTotalPages(totalPages)
            
            if (pageNum === 0) {
                setUsers(newUsers)
            } else {
                setUsers(prev => [...prev, ...newUsers])
            }
            
            setHasMore(pageNum < totalPages - 1)
            setPage(pageNum)
            
        } catch (error) {
            console.error(`Error loading ${type}:`, error)
        } finally {
            setLoading(false)
        }
    }
    
    const loadMore = () => {
        if (hasMore && !loading) {
            loadUsers(page + 1)
        }
    }
    
    // Filter users based on search term
    const filteredUsers = users.filter(user => 
        user.userName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (!isOpen) return null
    
    return (
        <div className="follow-popup-overlay" onClick={onClose}>
            <div className="follow-popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="follow-popup-header">
                    <h3>{title}</h3>
                    <button className="follow-popup-close" onClick={onClose}>×</button>
                </div>
                
                <div className="follow-popup-search">
                    <input
                        type="text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="follow-search-input"
                    />
                </div>
                
                <div className="follow-popup-body">
                    {loading && users.length === 0 ? (
                        <p className="loading">Loading {title.toLowerCase()}...</p>
                    ) : users.length > 0 ? (
                        <>
                            <ul className="follow-list">
                                {filteredUsers.map((user) => (
                                    <li 
                                        key={user.id} 
                                        className="follow-item"
                                        onClick={() => handleUserClick(user.userName)}
                                    >
                                        <div className="follow-user-info">
                                            <img 
                                                src={user.profilePic || '/dpp.jpg'} 
                                                alt={user.userName}
                                                className="follow-user-avatar"
                                                onError={(e) => {
                                                    e.target.src = '/dpp.jpg'
                                                }}
                                            />
                                            <div className="follow-user-details">
                                                <span className="follow-username">{user.userName}</span>
                                                <span className="follow-date">
                                                    {type === 'followers' ? 'Followed' : 'Following'} {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            
                            {searchTerm === '' && hasMore && (
                                <div className="load-more-container">
                                    <button 
                                        className="load-more-btn"
                                        onClick={loadMore}
                                        disabled={loading}
                                    >
                                        {loading ? 'Loading...' : 'Load More'}
                                    </button>
                                </div>
                            )}
                            
                            {searchTerm !== '' && filteredUsers.length === 0 && (
                                <p className="no-results">No {title.toLowerCase()} found matching "{searchTerm}"</p>
                            )}
                        </>
                    ) : (
                        <p className="no-follows">No {title.toLowerCase()} yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ShowFollow