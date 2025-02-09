import React, { useState } from "react";


function ProfileTabs({ activeTab, onTabChange }) {

  return (
    <div className="profile-tabs">
      <button
        className={`tab ${activeTab === "posts" ? "tab-active" : ""}`}
        onClick={() => onTabChange("posts")}
      >
        Posts
      </button>
      <button
        className={`tab ${activeTab === "about" ? "tab-active" : ""}`}
        onClick={() => onTabChange("about")}
      >
        About
      </button>
      <button
        className={`tab ${activeTab === "friends" ? "tab-active" : ""}`}
        onClick={() => onTabChange("friends")}
      >
        Friends
      </button>
    </div>
  );
}

export default ProfileTabs;
