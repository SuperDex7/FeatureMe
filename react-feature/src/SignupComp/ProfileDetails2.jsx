import React, { useState } from "react";
import "../ProfileComp/ProfileDetails.css";
import "./SignupPage.css"
import { useRef } from "react";
function ProfileDetails2(props) {

  const [hover, setHover] = useState(false)
  const [profilePic, setPic] = useState("dpp.jpg")
  const fileInputRef = useRef(null);
  
  function displayText(){
    setHover(!hover);
  }
const handleFileChange = (e) => {
  e.preventDefault();
  const file = e.target.files[0];
  if (file) {
     const picUrl = URL.createObjectURL(file)
     setPic(picUrl);
     props.onProfilePicChange(picUrl)
  }
  
}
  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  return (
    <section className="profile-details">
      <div onMouseEnter={displayText} onMouseLeave={displayText} 
      className="profile-details__avatar-container-signup" onClick={handleContainerClick}>
        {hover && <div><p id="cpp">Change Profile Picture</p> 
        <input type="file" onChange={handleFileChange} ref={fileInputRef} style={{display:"none"}}/>
          </div>} 
        <img
          className="profile-details__avatar"
          src={profilePic}
          alt="User Avatar"
          
        />
        
      </div>
      <div className="profile-details__info">
        <h2 className="profile-details__name">{props.username}</h2>
        <p className="profile-details__bio">
          {props.bio}
        </p>
        <div className="profile-details__stats">
          <div className="profile-details__stat">
            <span className="stat-value">0</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="profile-details__stat">
            <span className="stat-value">0</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="profile-details__stat">
            <span className="stat-value">0</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>
      
    </section>
  );
}

export default ProfileDetails2;
