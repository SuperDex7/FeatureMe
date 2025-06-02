import React from "react";


function ProfileContent2({ activeTab, about }) {
  // 4. Conditionally render based on activeTab
  let content;
  switch (activeTab) {
    case "posts":
      content = (
        <div>
          <h3>Your Recent Posts</h3>
          <p>List or grid of user posts goes here.</p>
        </div>
      );
      break;

    case "about":
      content = (
        <div>
          <h3>About You</h3>
          <p>{about}</p>
        </div>
      );
      break;

    case "friends":
      content = (
        <div>
          <h3>Your Friends</h3>
          <p>List of friends or followers goes here.</p>
        </div>
      );
      break;

    default:
      content = (
        <div>
          <h3>Welcome!</h3>
          <p>Select a tab to see more information.</p>
        </div>
      );
      break;
  }

  return <div className="profile-content">{content}</div>;
}

export default ProfileContent2;