import React from "react";
import Spotlight from "./Spotlight";


function SpotlightItem({ author, content, timestamp, songname, features, genre, comments, likes }) {
  return (
    <div className="spotlight-item">
      <div className="feed-spotlight__header">
        <span className="feed-spotlight__author">{author}</span>
        <span className="feed-spotlight__timestamp">{timestamp}</span>
      </div>
      {features && features.length > 0 && (
        <div id="spotlight-features">
          <p>( <strong>Feat</strong>:</p>
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
      <div className="feed-item__content">{content}</div>
      <div id="spotlight-playsection">
        <img id="spotlight-playbutton" src="play-button.png" alt="PlayButton" />
        <h4 id="spotlight-songname">{songname}</h4>
      </div>
      <div id="spotlight-stats">
        <p>Likes: {likes.length}</p>
        <p>Comments: {comments.length}</p>
      </div>
    </div>
  );
}

export default SpotlightItem;
