import { useEffect, useRef, useState } from "react";
import { downloadPost, trackDownload } from "../services/PostsService";
import { getCurrentUser } from "../services/AuthService";
import Icon from "./ui/Icon";
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

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercentage = (isMuted ? 0 : volume) * 100;

  return (
    <div
      className={`fm-player${fadeIn ? ' is-in' : ''}${fadeOut ? ' is-out' : ''}`}
      role="group"
      aria-label={`Player: ${title}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="fm-player__play"
        onClick={togglePlay}
        disabled={isLoading}
        aria-label={isLoading ? "Loading" : playing ? `Pause ${title}` : `Play ${title}`}
      >
        {isLoading ? (
          <span className="fm-player__spinner" aria-hidden="true" />
        ) : (
          <Icon name={playing ? "pause" : "play"} size={18} />
        )}
      </button>

      <div className="fm-player__track">
        <div className="fm-player__meta">
          <span className="fm-player__title">{title}</span>
          <span className="fm-player__time">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <input
          type="range"
          className="fm-player__seek"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          disabled={isLoading}
          aria-label="Seek"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          style={{ "--fm-fill": `${progressPercentage}%` }}
        />
      </div>

      <div className="fm-player__volume">
        <button
          type="button"
          className="fm-player__icon-btn"
          onClick={toggleMute}
          aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
        >
          <Icon name={isMuted || volume === 0 ? "volumeOff" : "volume"} size={18} />
        </button>
        <input
          type="range"
          className="fm-player__volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          style={{ "--fm-fill": `${volumePercentage}%` }}
        />
      </div>

      {freeDownload && (
        <button
          type="button"
          className="fm-player__icon-btn"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label={isDownloading ? "Downloading" : `Download ${title}`}
        >
          {isDownloading ? <span className="fm-player__spinner" aria-hidden="true" /> : <Icon name="download" size={18} />}
        </button>
      )}

      <button type="button" className="fm-player__icon-btn" onClick={handleClose} aria-label="Close player">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

export default AudioPlayer2;
