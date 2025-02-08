import React, { useState } from "react";


function ProfileTabs() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="profile-tabs">
      <button
        className={activeTab === "posts" ? "tab tab-active" : "tab"}
        onClick={() => setActiveTab("posts")}
      >
        Posts
      </button>
      <button
        className={activeTab === "about" ? "tab tab-active" : "tab"}
        onClick={() => setActiveTab("about")}
      >
        About
      </button>
      <button
        className={activeTab === "friends" ? "tab tab-active" : "tab"}
        onClick={() => setActiveTab("friends")}
      >
        Friends
      </button>
    </div>
  );
}

export default ProfileTabs;
