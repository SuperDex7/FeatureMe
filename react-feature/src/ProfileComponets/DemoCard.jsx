import React, { useState, useRef } from 'react';
import './DemoCard.css';

function DemoCard({ demo, onDelete, canDelete = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="demo-card">
      <div className="demo-card-header">
        <div className="demo-title-section">
          <h4 className="demo-title">{demo.title}</h4>
          {canDelete && (
            <button 
              className="demo-delete-btn"
              onClick={() => onDelete && onDelete(demo.id)}
              title="Delete demo"
            >
              🗑️
            </button>
          )}
        </div>
        {demo.features && demo.features.length > 0 && (
          <div className="featured-artists">
            <span className="feat-label">feat.</span>
            <span className="artists-list">
              {demo.features.join(', ')}
            </span>
          </div>
        )}
      </div>
      
      <div className="demo-player">
        <button 
          className={`play-button ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="audio-controls">
          <div className="progress-container" onClick={handleSeek}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
          
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="duration">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={demo.songUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );
}

export default DemoCard;
