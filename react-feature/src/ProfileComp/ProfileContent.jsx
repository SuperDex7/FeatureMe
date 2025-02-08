import React from "react";


function ProfileContent() {
  // Here, you'd use the active tab from context or props to conditionally render content
  // For demonstration, we’ll just show placeholder text
  return (
    <div className="profile-content">
      <h3>Profile Content</h3>
      <p>
        This is where the main content of the profile would appear based on the
        selected tab (e.g., a list of posts, "about" info, or friends list).
      </p>
    </div>
  );
}

export default ProfileContent;
