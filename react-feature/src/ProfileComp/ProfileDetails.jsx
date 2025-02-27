import React from "react";
import "./ProfileDetails.css";

function ProfileDetails() {
  return (
    <section className="profile-details">
      <div className="profile-details__avatar-container">
        <img
          className="profile-details__avatar"
          src="dpp.jpg"
          alt="User Avatar"
        />
      </div>
      <button id="edit-button">Edit Profile</button>
      <div className="profile-details__info">
        <h2 className="profile-details__name">SuperDex</h2>
        <p className="profile-details__bio">
          FL Studio Producer | Musician | Content Creator
        </p>
        <div className="profile-details__stats">
          <div className="profile-details__stat">
            <span className="stat-value">256</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="profile-details__stat">
            <span className="stat-value">1.2k</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="profile-details__stat">
            <span className="stat-value">300</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileDetails;
