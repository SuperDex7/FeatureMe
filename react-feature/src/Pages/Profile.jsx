import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from "../Components/Header";
import Footer from "../Components/Footer";
import "../Styling/Profile.css";
import { getUserInfo, UserRelationsService } from "../services/UserService";
import api, { getCurrentUser } from "../services/AuthService";
import BadgeService from "../services/BadgeService";
import { getPostById } from "../services/PostsService";
import ProfilePosts from "../Components/ProfilePosts";
import ProfilePosts2 from "../Components/ProfilePosts2";
import ShowFollow from "../Components/ShowFollow";

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  const { username } = useParams();
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [featuredOn, setFeatureOn] = useState([]);
  const [count, setCount] = useState(null)
  const [co, setCo] = useState(0)
  const [co2, setCo2] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFollow, setShowFollow] = useState(false)
  const [followPopupType, setFollowPopupType] = useState('followers')
  const [relationshipSummary, setRelationshipSummary] = useState(null)

  const [size, setSize] = useState(6)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [featSize, setFeatSize] = useState(6)
    const [featPage, setFeatPage] = useState(0)
    const [featTotalPages, setFeatTotalPages] = useState(0)
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const currentUserData = await getCurrentUser();
        setCurrentUser(currentUserData);
        
        const response = await api.get(`/user/get/${username}`);
        setUser(response.data);
        console.log(response.data);
        setCount(response.data.posts.length);
        
        // Get relationship summary using new endpoint
        const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
        setRelationshipSummary(relationshipResponse.data);
        setIsFollowing(relationshipResponse.data.isFollowing);
        console.log('Relationship summary:', relationshipResponse.data);
        
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [username]);

  // Note: isFollowing is now set directly from relationship summary

  const nextPage = () =>{
    setPage(page+1)
  }
  const prevPage = () =>{
    setPage(page-1)
  }
  const nextFeatPage = () =>{
    setFeatPage(featPage+1)
  }
  const prevFeatPage = () =>{
    setFeatPage(featPage-1)
  }
  // Load posts when activeTab changes
  useEffect(() => {
    if (activeTab === "posts" && user && co === 0) {
      api.get(`posts/get/all/id/${user.posts}?page=${page}&size=${size}`).then(res => {
        setTotalPages(res.data.page.totalPages)
        setPosts(res.data.content)
        console.log(res.data)
        setCo(co + 1)
      })
    }
  }, [activeTab, user, co]);

  // Load featuredOn when activeTab changes
  useEffect(() => {
    if (activeTab === "friends" && user && co2 === 0) {
      api.get(`posts/get/all/featuredOn/${user.featuredOn}?page=${featPage}&size=${featSize}`).then(res => {
        setFeatTotalPages(res.data.page.totalPages)
        setFeatureOn(res.data.content)
        console.log(res.data)
        setCo2(co2 + 1)
      })
    }
  }, [activeTab, user, co2]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }
  const showTheFollow = (type) => {
    setFollowPopupType(type)
    setShowFollow(true)
  }

  const closeFollowPopup = () => {
    setShowFollow(false)
  }

  const follow = async () => {
    if (!currentUser) return;
    
    try {
      const response = await UserRelationsService.toggleFollow(username);
      console.log('Follow response:', response.data);
      
      // Toggle the following state
      setIsFollowing(!isFollowing);
      
      // Refresh relationship summary to get updated counts
      const relationshipResponse = await UserRelationsService.getRelationshipSummary(username);
      setRelationshipSummary(relationshipResponse.data);
      
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
    }
  };
  
  return (
    <div className="profile-glass-root">
      <Header />
      <div className="profile-glass-banner-wrap taller">
        <img className="profile-glass-banner" src={user.banner} alt="Profile Banner" />
        
        <div className="profile-glass-avatar-wrap overlap-half">
          <img className="profile-glass-avatar" src={user.profilePic} alt="User Avatar" />
        </div>
      </div>
      <div className="profile-glass-info-card overlap-margin">
        {currentUser?.userName === username ? (
          <button className="profile-glass-edit">Edit Profile</button>
        ) : (
          <button 
            className={`profile-glass-edit ${isFollowing ? 'following' : ''}`} 
            onClick={follow}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        )}
        <h2 className="profile-glass-username">{user.userName}</h2>
                 <div className="profile-glass-badges-row">
           {user?.badges?.map((badge, i) => {
             const badgeInfo = BadgeService.getBadgeInfo(badge);
             return (
               <span
                 key={i}
                 className="profile-glass-badge"
                 style={{ background: badgeInfo.color }}
                 title={badgeInfo.description}
               >
                 {badgeInfo.icon}
               </span>
             );
           })}
         </div>
        <p className="profile-glass-bio">{user.bio}</p>
        <p className="profile-glass-location">{user.location}</p>
        <div className="profile-glass-stats">
          <div className="profile-glass-stat"><span className="stat-icon">📝</span><span className="stat-value">{user?.posts?.length || 0}</span><span className="stat-label">Posts</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">👥</span><span className="stat-value">{relationshipSummary?.followersCount || 0}</span><span className="stat-label clickable" onClick={() => showTheFollow('followers')}>Followers</span></div>
          <div className="profile-glass-stat"><span className="stat-icon">➡️</span><span className="stat-value">{relationshipSummary?.followingCount || 0}</span><span className="stat-label clickable" onClick={() => showTheFollow('following')}>Following</span></div>
        </div>
        
        <ShowFollow 
          userName={username}
          isOpen={showFollow}
          onClose={closeFollowPopup}
          type={followPopupType}
        />
        
      </div>
      
      <div className="profile-glass-tabs">
        <button className={`profile-glass-tab${activeTab === "posts" ? " active" : ""}`} onClick={() => setActiveTab("posts")}>Posts</button>
        <button className={`profile-glass-tab${activeTab === "about" ? " active" : ""}`} onClick={() => setActiveTab("about")}>About</button>
        <button className={`profile-glass-tab${activeTab === "friends" ? " active" : ""}`} onClick={() => setActiveTab("friends")}>Features</button>
      </div>
      <div className="profile-glass-content">
        {activeTab === "posts" && (
          <div>
            <h3>Your Recent Posts</h3>
             <div className="profilePosts">
            
           {posts.map((item) => (
             <ProfilePosts2 key={item.id} {...item} />
           ))}
         </div>
         <div id="pageButtons">
        <button className="section-more-btn" onClick={prevPage} hidden={totalPages < 2 ? true:false} disabled={page == 0 || page == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextPage} hidden={totalPages < 2 ? true:false}  disabled={page == totalPages-1 || page == null? true: false}>Next Page</button>
        </div>
          </div>
        )}
        {activeTab === "about" && (
          <div>
            <h3>About You</h3>
            <p>{user?.about || "All the personal details, bio, interests, etc. go here."} </p>
          </div>
        )}
        {activeTab === "friends" && (
          <div>
          <h3>Featured On</h3>
           <div className="profilePosts">
            
           {featuredOn.map((item) => (
             <ProfilePosts key={item.id} {...item} />
           ))}
         </div>
         <div id="pageButtons">
        <button className="section-more-btn" onClick={prevFeatPage} hidden={featTotalPages < 2 ? true:false} disabled={featPage == 0 || featPage == null? true: false}>Previous Page</button>
        <button className="section-more-btn" onClick={nextFeatPage} hidden={featTotalPages < 2 ? true:false}  disabled={featPage == featTotalPages-1 || featPage == null? true: false}>Next Page</button>
        </div>
         </div>
          /*
          <div>
            
            {featuredOn.length > 0 && 
            <h4>{Array.from(new Map(featuredOn.map(featuredOn => [featuredOn.id, featuredOn])).values())?.map((featuredOn, i) => (
              <div key={featuredOn.id}>
                <h3>{featuredOn.title}</h3>
                <p>{featuredOn.description}</p>
              </div>
            ))} </h4>
            || "List or grid of featured on posts go here."}
          </div>
          */
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
