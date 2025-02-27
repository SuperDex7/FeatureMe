import React from "react";


function FeedItem({ author, content, timestamp, songname, features, genre, comments, likes }) {
  return (
    <div className="feed-item">
      <div className="feed-item__header">
        <span className="feed-item__author">{author}</span>
        <span className="feed-item__timestamp">{timestamp}</span>
      </div>
      {features && features.length > 0 && (
        <div id="features-section">
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
      <div id="play-section">
        <img id="play-button" src="play-button.png" alt="PlayButton" />
        <h4 id="song-name">{songname}</h4>
      </div>
      <div id="stats">
        <p>Likes: {likes.length}</p>
        <p>Comments: {comments.length}</p>
      </div>
    </div>
  );
}

export default FeedItem;
