import React, { useEffect, useRef, useState } from "react";
import { downloadPost, trackDownload } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";
import "./AudioPlayer.css";

function formatTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function AudioPlayer({ src, onClose, title, postId, freeDownload = false }) {
  const audioRef = useRef(new Audio(src));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);

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

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
    };
    fetchUser();
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
    setIsMuted(false); // Unmute when volume is changed manually
  };

  const handleSeek = (e) => {
    const time = e.target.value;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      // Unmute: restore previous volume
      audio.volume = previousVolume;
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      // Mute: store current volume and set to 0
      setPreviousVolume(volume);
      audio.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setFadeOut(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please log in to download this post');
      return;
    }

    if (!postId) {
      alert('Post ID not available for download');
      return;
    }

    try {
      // Get the post data to access the music file
      const response = await downloadPost(postId);
      const postData = response.data;
      
      if (postData.music) {
        // Extract file extension from the URL
        const url = new URL(postData.music);
        const pathname = url.pathname;
        const fileExtension = pathname.split('.').pop() || 'mp3';
        
        try {
          // Fetch as blob to force download
          const fileResponse = await fetch(postData.music);
          if (!fileResponse.ok) {
            throw new Error('Failed to fetch file');
          }
          
          const blob = await fileResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${postData.title}.${fileExtension}`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(blobUrl);
          
        } catch (fetchError) {
          console.error('Error downloading file:', fetchError);
          alert('Failed to download file. Please try again.');
          return;
        }
        
        // Track the download and notify the author
        try {
          await trackDownload(postId);
          console.log('Download tracked and notification sent');
        } catch (trackError) {
          console.error('Error tracking download:', trackError);
          // Don't show error to user as download was successful
        }
      } else {
        alert('No music file available for download');
      }
    } catch (error) {
      console.error('Error downloading post:', error);
      alert('Failed to download post. Please try again.');
    }
  };

  return (
    <div className={`audio-player-card glassy${fadeIn ? ' audio-fade-in' : ''}${fadeOut ? ' audio-fade-out' : ''}`}>
      {/* Compact Header Row */}
      <div className="audio-player-top-row">
        <div className="audio-player-left">
          <button className="audio-play-btn" onClick={togglePlay} title={playing ? "Pause" : "Play"}>
            {playing ? <span className="pause-icon">⏸</span> : <span className="play-icon">▶</span>}
          </button>
          <div className="audio-info">
            <span className="audio-song-title">{title}</span>
            <div className="audio-time-compact">{formatTime(currentTime)} / {formatTime(duration)}</div>
          </div>
        </div>
        <div className="audio-player-right">
          {freeDownload && (
            <button 
              className="audio-download-btn" 
              onClick={handleDownload} 
              title="Download this track"
            >
              📥
            </button>
          )}
          <button className="audio-close-btn" onClick={handleClose} title="Close">×</button>
        </div>
      </div>
      
      {/* Compact Controls Row */}
      <div className="audio-player-bottom-row">
        <div className="audio-progress-compact">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="audio-progress-bar"
            title="Seek to position"
          />
        </div>
        <div className="audio-volume-compact">
          <span 
            className="volume-icon" 
            role="img" 
            aria-label={isMuted ? "Unmute" : "Mute"}
            onClick={toggleMute}
            title={isMuted ? "Click to unmute" : "Click to mute"}
          >
            {isMuted ? '🔇' : volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="audio-volume-bar"
            title="Adjust volume"
          />
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;