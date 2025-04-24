import React from "react";
import Spotlight from "./Spotlight";


function SpotlightItem({ author, description, time, title, features, genre, comments, likes = []}) {
  const { userName, profilePic, banner } = author ?? {};
  return (
    <div className="spotlight-item">
      <div className="feed-spotlight__header">
        <span className="feed-spotlight__author">{userName}</span>
        <span className="feed-spotlight__timestamp">{time}</span>
      </div>
      {features.length > 1 && (
        <div id="spotlight-features">
          <p>(<strong>Feat</strong>:</p>
          <ul id="features-list">
            {features.map((feature, index) => (
              <li key={index}>
                {feature}
                {index !== features.length - 1 && features[index + 1] !== null ? "," : ")"}
              </li>
            ))}
            
          </ul>
        </div>
      )}
      <div className="spotlight-item__content">{description}</div>
      <div id="spotlight-playsection">
        <img id="spotlight-playbutton" src="play-button.png" alt="PlayButton" />
        <h4 id="spotlight-songname">{title}</h4>
      </div>
      <div id="spotlight-stats">
        <p>Likes: {likes.length}</p>
        <p>Comments: {comments.length}</p>
      </div>
    </div>
  );
}

export default SpotlightItem;
