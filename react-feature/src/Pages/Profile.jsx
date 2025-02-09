import React from "react";
import { useState } from "react";
import Header from "../Components/Header";
import ProfileBanner from "../ProfileComp/ProfileBanner";
import ProfileDetails from "../ProfileComp/ProfileDetails";
import ProfileTabs from "../ProfileComp/ProfileTabs";
import ProfileContent from "../ProfileComp/ProfileContent";
import "../Styling/Profile.css";                      

function Profile() {
  const [activeTab, setActiveTab] = useState("posts");
  return (
    <div className="profile-page">
      <Header />
      <ProfileBanner />
      <div className="profile-main">
        <ProfileDetails />
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <ProfileContent activeTab={activeTab} />
      </div>
    </div>
  );
}

export default Profile;
