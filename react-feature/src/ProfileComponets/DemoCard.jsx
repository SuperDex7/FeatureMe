import { useState, useRef } from 'react';
import Icon from '../Components/ui/Icon';
import '../Styling/Demos.css';

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
      const newTime = parseFloat(e.target.value);
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

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <article className="fm-demo">
      <div className="fm-demo__head">
        <div className="fm-demo__titles">
          <h3 className="fm-demo__title">{demo.title}</h3>
          {demo.features && demo.features.length > 0 && (
            <p className="fm-demo__features">feat. {demo.features.join(', ')}</p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            className="fm-icon-btn fm-demo__delete"
            onClick={() => onDelete && onDelete(demo.id)}
            aria-label={`Delete demo ${demo.title}`}
          >
            <Icon name="trash" size={18} />
          </button>
        )}
      </div>

      <div className="fm-demo__player">
        <button
          type="button"
          className="fm-demo__play"
          onClick={togglePlay}
          aria-label={isPlaying ? `Pause ${demo.title}` : `Play ${demo.title}`}
        >
          <Icon name={isPlaying ? 'pause' : 'play'} size={18} />
        </button>
        <div className="fm-demo__track">
          <input
            type="range"
            className="fm-player__seek"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek"
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            style={{ '--fm-fill': `${progress}%` }}
          />
          <span className="fm-demo__time">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <button
          type="button"
          className="fm-icon-btn fm-demo__mute"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <Icon name={isMuted ? 'volumeOff' : 'volume'} size={18} />
        </button>
        <input
          type="range"
          className="fm-player__volume-slider fm-demo__volume"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          aria-label="Volume"
          style={{ '--fm-fill': `${(isMuted ? 0 : volume) * 100}%` }}
        />
      </div>

      <audio
        ref={audioRef}
        src={demo.songUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    </article>
  );
}

export default DemoCard;
