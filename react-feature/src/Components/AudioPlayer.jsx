import React, { useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function AudioPlayer({ src, onClose, title }) {
  const audioRef = useRef(new Audio(src));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setFadeIn(true);
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.play().then(() => {
        setPlaying(true);
      }).catch((err) => console.error("Playback error:", err));
      const updateTime = () => setCurrentTime(audio.currentTime);
      const setAudioDuration = () => setDuration(audio.duration);

      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", setAudioDuration);

      return () => {
        audio.pause();
        audio.removeEventListener("timeupdate", updateTime);
        audio.removeEventListener("loadedmetadata", setAudioDuration);
      };
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch((err) => console.error(err));
    }
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    const vol = e.target.value;
    audioRef.current.volume = vol;
    setVolume(vol);
  };

  const handleSeek = (e) => {
    const time = e.target.value;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleClose = (e) => {
    e.stopPropagation(); // Prevent bubbling to parent
    setFadeOut(true);
    setTimeout(() => {
      onClose();
    }, 350); // match CSS animation duration
  };

  return (
    <div className={`audio-player-card glassy${fadeIn ? ' audio-fade-in' : ''}${fadeOut ? ' audio-fade-out' : ''}`}>
      <div className="audio-player-top-row">
        <button className="audio-play-btn" onClick={togglePlay} title={playing ? "Pause" : "Play"}>
          {playing ? <span>&#10073;&#10073;</span> : <span>&#9654;</span>}
        </button>
        <span className="audio-song-title">{title}</span>
        <button className="audio-close-btn" onClick={handleClose} title="Close">×</button>
      </div>
      <div className="audio-player-bottom-row">
        <div className="audio-player-progress">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="audio-progress-bar"
          />
          <span className="audio-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="audio-player-volume">
          <span role="img" aria-label="Volume">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="audio-volume-bar"
          />
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;