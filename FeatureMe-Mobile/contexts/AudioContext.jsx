import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const positionUpdateInterval = useRef(null);
  const audioPlayerInstance = useRef(null);

  const audioPlayer = useAudioPlayer();

  useEffect(() => {
    if (audioPlayer) {
      audioPlayerInstance.current = audioPlayer;
    }
  }, [audioPlayer]);

  useEffect(() => {
    if (audioPlayer) {
      audioPlayer.loop = false;
      audioPlayer.volume = volume;
    }
  }, [audioPlayer, volume]);

  // Update position periodically
  useEffect(() => {
    if (isPlaying && audioPlayer) {
      positionUpdateInterval.current = setInterval(() => {
        if (audioPlayer.currentTime !== null) {
          setPosition(audioPlayer.currentTime);
          
          // Update duration if available and different
          if (audioPlayer.duration && audioPlayer.duration > 0) {
            setDuration(prevDuration => {
              // Only update if the new duration is significantly different (more than 0.1 seconds)
              if (Math.abs(prevDuration - audioPlayer.duration) > 0.1) {
                return audioPlayer.duration;
              }
              return prevDuration;
            });
          }
          
          if (audioPlayer.duration && audioPlayer.currentTime >= audioPlayer.duration) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      }, 100);
    } else {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    }

    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [isPlaying, audioPlayer]);

  const playTrack = useCallback(async (track) => {
    try {
      setIsLoading(true);
      
      // If same track is already playing, just toggle play/pause
      if (currentTrack && currentTrack.id === track.id && audioPlayer) {
        if (isPlaying) {
          await pauseTrack();
        } else {
          await resumeTrack();
        }
        setIsPlayerVisible(true);
        setIsLoading(false);
        return Promise.resolve();
      }

      if (!track.music || !audioPlayer) {
        setIsLoading(false);
        return Promise.reject(new Error('No audio URL or player available'));
      }

      // Load new track
      audioPlayer.replace(track.music);
      await audioPlayer.play();
      
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsPlayerVisible(true);
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error playing track:', error);
      setIsLoading(false);
      throw error;
    }
  }, [currentTrack, isPlaying, audioPlayer, pauseTrack, resumeTrack]);

  const pauseTrack = useCallback(async () => {
    if (audioPlayer && isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    }
  }, [audioPlayer, isPlaying]);

  const resumeTrack = useCallback(async () => {
    if (audioPlayer && !isPlaying) {
      audioPlayer.play();
      setIsPlaying(true);
      setIsPlayerVisible(true);
    }
  }, [audioPlayer, isPlaying]);

  const stopTrack = useCallback(async () => {
    if (audioPlayer) {
      audioPlayer.pause();
      setIsPlaying(false);
      setPosition(0);
      setCurrentTrack(null);
    }
  }, [audioPlayer]);

  const seekTo = useCallback(async (timeInSeconds) => {
    if (audioPlayer && duration > 0) {
      console.log('Seeking to:', timeInSeconds, 'seconds');
      setIsSeeking(true);
      
      try {
        audioPlayer.seekTo(timeInSeconds);
        setPosition(timeInSeconds);
        console.log('Actual position after seek:', timeInSeconds);
      } catch (error) {
        console.error('Error seeking:', error);
      } finally {
        setTimeout(() => {
          setIsSeeking(false);
        }, 500);
      }
    }
  }, [audioPlayer, duration]);

  const setVolumeLevel = useCallback(async (newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    
    if (audioPlayer) {
      audioPlayer.volume = clampedVolume;
    }
  }, [audioPlayer]);

  const hidePlayer = useCallback(async () => {
    // Pause and reset state when hiding player
    if (audioPlayer) {
      audioPlayer.pause();
      setIsPlaying(false);
      setPosition(0);
    }
    setIsPlayerVisible(false);
  }, [audioPlayer]);

  const showPlayer = useCallback(() => {
    if (currentTrack) {
      setIsPlayerVisible(true);
    }
  }, [currentTrack]);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pauseTrack();
    } else {
      await resumeTrack();
    }
  }, [isPlaying, pauseTrack, resumeTrack]);

  const value = {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    isPlayerVisible,
    isLoading,
    
    playTrack,
    pauseTrack,
    resumeTrack,
    stopTrack,
    seekTo,
    setVolumeLevel,
    hidePlayer,
    showPlayer,
    togglePlayPause,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
