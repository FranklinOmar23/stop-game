import { useRef, useCallback } from 'react';

export const useSound = (soundUrl, options = {}) => {
  const audioRef = useRef(null);
  const { volume = 1.0, playbackRate = 1.0 } = options;

  const play = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }, [soundUrl, volume, playbackRate]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return [play, { stop }];
};