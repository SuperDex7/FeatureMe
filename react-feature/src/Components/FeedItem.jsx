import React from "react";


function FeedItem({ author, content, timestamp, songname, features }) {
  return (
    <div className="feed-item">
      
      <div className="feed-item__header">
        <span className="feed-item__author">{author}</span>
        <span className="feed-item__timestamp">{timestamp}</span>
      </div>
      
      <div className="feed-item__content">{content}</div>
      <div id="play-section">
        <img id="play-button" src="play-button.png" alt="PlayButton" />
        <h4 id="song-name">{songname}</h4>
      </div>
      <div id="features-section">
        <h4>Features:</h4>
        {/*}
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
            
          ))}
          <ul/>
          {*/}
      </div>
    </div>
  );
}

export default FeedItem;
