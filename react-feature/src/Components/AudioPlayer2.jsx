import React, { useEffect, useRef } from "react";
import "./AudioPlayer.css";

function AudioPlayer2({ src, onClose }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) =>
        console.error("Auto-play error:", err)
      );
    }
  }, []);

  return (
    <div className="audio-player-modal">
      <div className="audio-player-card">
        <button className="close-btn" onClick={onClose}>
          X
        </button>
        <audio
          ref={audioRef}
          controls
          controlsList="nodownload"
          src={src}
          style={{ width: "100%" }}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}

export default AudioPlayer2;