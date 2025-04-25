import React, { useEffect, useRef, useState } from "react";
import "./AudioPlayer.css";

function AudioPlayer({ src, onClose }) {
  const audioRef = useRef(new Audio(src));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
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

  return (
    <div className="audio-player-modal">
      <div className="audio-player-card">
        <button className="close-btn" onClick={onClose}>X</button>
        <button onClick={togglePlay}>{playing ? "Pause" : "Play"}</button>
        <div className="progress-container">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
          />
          <span>{Math.floor(currentTime)} / {Math.floor(duration)} sec</span>
        </div>
        <div className="volume-container">
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;