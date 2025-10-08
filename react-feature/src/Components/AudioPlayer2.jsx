import React, { useEffect, useRef, useState } from "react";
import { downloadPost, trackDownload } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";
import "../Styling/AudioPlayer2.css";

function formatTime(secs) {
  if (!secs || isNaN(secs)) return "0:00";
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function AudioPlayer2({ src, onClose, title, postId, freeDownload = false }) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setFadeIn(true);
    setIsLoading(true);
    
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleLoadStart = () => setIsLoading(true);
      const handleCanPlay = () => setIsLoading(false);
      const handleLoadError = () => setIsLoading(false);
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const setAudioDuration = () => {
        setDuration(audio.duration);
        setIsLoading(false);
      };

      audio.addEventListener("loadstart", handleLoadStart);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleLoadError);
      audio.addEventListener("timeupdate", updateTime);
      audio.addEventListener("loadedmetadata", setAudioDuration);

      // Auto-play when ready
      const playAudio = () => {
        audio.play().then(() => {
          setPlaying(true);
        }).catch((err) => {
          console.error("Playback error:", err);
          setIsLoading(false);
        });
      };

      if (audio.readyState >= 3) {
        // Audio is already loaded
        playAudio();
      } else {
        audio.addEventListener("canplay", playAudio, { once: true });
      }

      return () => {
        audio.pause();
        audio.removeEventListener("loadstart", handleLoadStart);
        audio.removeEventListener("canplay", handleCanPlay);
        audio.removeEventListener("error", handleLoadError);
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
      setPlaying(false);
    } else {
      audio.play().catch((err) => console.error(err));
      setPlaying(true);
    }
  };

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value);
    audioRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(false);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = previousVolume;
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
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
    }, 300);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please log in to download this track');
      return;
    }

    if (!postId) {
      alert('Track ID not available for download');
      return;
    }

    setIsDownloading(true);

    try {
      const response = await downloadPost(postId);
      const postData = response.data;
      
      if (postData.music) {
        const url = new URL(postData.music);
        const pathname = url.pathname;
        const fileExtension = pathname.split('.').pop() || 'mp3';
        
        try {
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
          
          window.URL.revokeObjectURL(blobUrl);
          
        } catch (fetchError) {
          console.error('Error downloading file:', fetchError);
          alert('Failed to download file. Please try again.');
          return;
        }
        
        try {
          await trackDownload(postId);
        } catch (trackError) {
          console.error('Error tracking download:', trackError);
        }
      } else {
        alert('No audio file available for download');
      }
    } catch (error) {
      console.error('Error downloading post:', error);
      alert('Failed to download track. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.3) return '🔉';
    if (volume < 0.7) return '🔊';
    return '🔊';
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`posts-audio-player ${fadeIn ? 'posts-fade-in' : ''}${fadeOut ? 'posts-fade-out' : ''}`}>
      <div className="posts-audio-container">
        {/* Header */}
        <div className="posts-audio-header">
          <div className="posts-audio-track-info">
            <h3 className="posts-audio-title">{title}</h3>
            <div className="posts-audio-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="posts-audio-actions">
            {freeDownload && (
              <button 
                className={`posts-download-btn ${isDownloading ? 'posts-loading' : ''}`}
                onClick={handleDownload} 
                disabled={isDownloading}
                title="Download track"
              >
                {isDownloading ? (
                  <span className="posts-download-spinner"></span>
                ) : (
                  <span className="posts-download-icon">⬇</span>
                )}
              </button>
            )}
            <button className="posts-close-btn" onClick={handleClose} title="Close player">
              <span className="posts-close-icon">×</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="posts-audio-progress-container">
          <div className="posts-progress-track">
            <div 
              className="posts-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="posts-progress-input"
            disabled={isLoading}
          />
        </div>

         {/* Controls */}
         <div className="posts-audio-controls">
           <div className="posts-main-controls">
             <button 
               className="posts-play-btn" 
               onClick={togglePlay} 
               disabled={isLoading}
               title={playing ? "Pause" : "Play"}
             >
               {isLoading ? (
                 <span className="posts-loading-spinner"></span>
               ) : playing ? (
                 <span className="posts-pause-icon">⏸</span>
               ) : (
                 <span className="posts-play-icon">▶</span>
               )}
             </button>
           </div>

           {/* Volume Control Section */}
           <div className="posts-volume-section">
             <div className="posts-volume-controls">
               <button 
                 className="posts-volume-btn" 
                 onClick={toggleMute}
                 title={isMuted ? "Unmute" : "Mute"}
               >
                 <span className="posts-volume-icon">{getVolumeIcon()}</span>
               </button>
               
               {/* Always Visible Volume Slider */}
               <div className="posts-volume-slider-always-visible">
                 <input
                   type="range"
                   min="0"
                   max="1"
                   step="0.01"
                   value={volume}
                   onChange={handleVolumeChange}
                   className="posts-volume-slider-main"
                   title="Adjust volume"
                 />
               </div>
             </div>
             
             {/* Hidden Volume Slider for Hover Effect */}
             <div 
               className={`posts-volume-slider-container ${showVolumeSlider ? 'posts-show' : ''}`}
               onMouseEnter={() => setShowVolumeSlider(true)}
               onMouseLeave={() => setShowVolumeSlider(false)}
             >
               <input
                 type="range"
                 min="0"
                 max="1"
                 step="0.01"
                 value={volume}
                 onChange={handleVolumeChange}
                 className="posts-volume-slider"
                 title="Adjust volume"
               />
             </div>
           </div>
         </div>

        {/* Waveform Visualization */}
        <div className="posts-audio-waveform">
          <div className="posts-waveform-bars">
            {Array.from({ length: 20 }, (_, i) => (
              <div 
                key={i} 
                className={`posts-wave-bar ${playing ? 'posts-animate' : ''}`}
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  height: `${Math.random() * 60 + 20}%`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer2;
