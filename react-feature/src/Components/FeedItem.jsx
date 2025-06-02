import React, { useState, useRef } from "react";
import AudioPlayer from "./AudioPlayer";
import AudioPlayer2 from "./AudioPlayer2";


function FeedItem({ author, description, time, title, features, genre, music, comments=[] , likes =[] }) {
  const { userName, profilePic, banner } = author ?? {};
  const [comment, showComment] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  function showComments() {
    showComment((prevComment) => {
      return !prevComment;
    });
  }
  const openAudioPlayer = () => {
    setShowAudioPlayer(true);
  };
  
  
  return (
    <div className="feed-item">
      <div className="feed-item__header">
        <span className="feed-item__title"> {title}</span>
        <span className="feed-item__timestamp">{time}</span>
      </div>
      <h2 id="feed-item__author">{userName}</h2>
      {features && features.length > 1 && (
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
      <div className="feed-item__content">{description}</div>
      <div id="play-section">
  <img id="play-button" src="play-button.png" alt="PlayButton" onClick={openAudioPlayer} />
  <h4 id="song-name">{title}</h4>
  
</div>
{showAudioPlayer && <AudioPlayer2 src={music} onClose={() => setShowAudioPlayer(false)} />}
      <div id="stats">
        <p>Likes: {likes.length}</p>
        <p id="commentButton" onClick={showComments}>Comments: {comments.length}</p>
      </div>
      {comment &&
      
      <div id="commentSection">
        <p id="commentsHeader">Comments:</p>
         {comments.map((comments, index)=> (
          <li key={index}>
            {comments}
          </li>
        ))}
      </div> }
      
    </div>
  );
}

export default FeedItem;
