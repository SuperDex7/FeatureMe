import Spotlight from "./Spotlight";
import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import "./AudioPlayer.css"

function SpotlightItem({ author, description, time, title, features, genre, music, comments, likes = []}) {
  const { userName } = author ?? {};
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Handler for play button (shows player)
  const handlePlayClick = (e) => {
    e.stopPropagation();
    setShowAudioPlayer(true);
  };

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
      <div id="spotlight-playsection" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0.5rem 0 0.2rem 0' }}>
        {!showAudioPlayer ? (
          <button className="audio-play-btn" onClick={handlePlayClick} title="Play">
            <span>&#9654;</span>
          </button>
        ) : (
          <AudioPlayer src={music} onClose={() => setShowAudioPlayer(false)} />
        )}
        <h4 id="spotlight-songname" style={{ margin: 0 }}>{title}</h4>
      </div>
      <div id="spotlight-stats">
        <p>Likes: {likes.length}</p>
        <p>Comments: {comments == null ? 0 : comments.length}</p>
      </div>
    </div>
  );
}

export default SpotlightItem;
