import React, { useState, useRef } from 'react';
import './DemoCard.css';

function DemoCard({ demo, onDelete, canDelete = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
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

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (!isMuted) {
      audioRef.current.volume = newVolume;
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
      audioRef.current.volume = volume;
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

  const getWaveformAnimation = () => {
    return (
      <div className="waveform">
        <div className={`wave-bar ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`wave-bar ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`wave-bar ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`wave-bar ${isPlaying ? 'playing' : ''}`}></div>
        <div className={`wave-bar ${isPlaying ? 'playing' : ''}`}></div>
      </div>
    );
  };

  return (
    <div className="demo-card-new">
      <div className="demo-card-background">
        <div className="demo-gradient-overlay"></div>
      </div>
      
      <div className="demo-card-content">
        <div className="demo-card-header-new">
          <div className="demo-title-section-new">
            <div className="demo-title-wrapper">
              <h4 className="demo-title-new">{demo.title}</h4>
              <div className="demo-status">
                <div className={`status-indicator ${isPlaying ? 'playing' : 'paused'}`}>
                  <div className="status-dot"></div>
                </div>
                <span className="status-text">
                  {isPlaying ? 'Playing' : 'Ready'}
                </span>
              </div>
            </div>
            {canDelete && (
              <button 
                className="demo-delete-btn-new"
                onClick={() => onDelete && onDelete(demo.id)}
                title="Delete demo"
              >
                <svg className="delete-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          
          {demo.features && demo.features.length > 0 && (
            <div className="featured-artists-new">
              <div className="feat-icon">🎵</div>
              <div className="feat-content">
                <span className="feat-label-new">Featured Artists</span>
                <span className="artists-list-new">
                  {demo.features.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="demo-player-new">
          <div className="play-controls">
            <button 
              className={`play-button-new ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <div className="play-icon">
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                )}
              </div>
            </button>
            
            <div className="waveform-container">
              {getWaveformAnimation()}
            </div>
          </div>
          
          <div className="progress-section">
            <div className="progress-container-new" onClick={handleSeek}>
              <div className="progress-bar-new">
                <div 
                  className="progress-fill-new" 
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                ></div>
                <div className="progress-handle"></div>
              </div>
            </div>
            
            <div className="time-display-new">
              <span className="current-time-new">{formatTime(currentTime)}</span>
              <span className="duration-new">{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="volume-controls">
            <button 
              className={`volume-button ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                {isMuted ? (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-3 3 3 3M17 12l3-3-3-3"/>
                ) : (
                  <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                )}
              </svg>
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
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
