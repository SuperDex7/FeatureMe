import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/AuthService"
import "./ShowFollow.css"

function ShowFollow({ followers, following, isOpen, onClose, type }) {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("")
    
    const handleUserClick = (username) => {
        navigate(`/profile/${username}`)
        onClose()
    }
    
    const dataToShow = type === 'followers' ? followers : following
    const title = type === 'followers' ? 'Followers' : 'Following'
    
    // Filter data based on search term
    const filteredData = dataToShow?.filter(user => 
        user.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
    
    // Reset search when popup closes or type changes
    useEffect(() => {
        setSearchTerm("")
    }, [isOpen, type])
    
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
                    {dataToShow && dataToShow.length > 0 ? (
                        filteredData.length > 0 ? (
                            <ul className="follow-list">
                                {filteredData.map((user, index) => (
                                    <li 
                                        key={index} 
                                        className="follow-item"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <span className="follow-username">{user}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-results">No {title.toLowerCase()} found matching "{searchTerm}"</p>
                        )
                    ) : (
                        <p className="no-follows">No {title.toLowerCase()} yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ShowFollow