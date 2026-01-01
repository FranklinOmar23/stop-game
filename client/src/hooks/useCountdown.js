import { useState, useEffect, useRef, useCallback } from 'react';

export const useCountdown = (initialSeconds, onComplete) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  const start = useCallback(() => {
    setIsActive(true);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setIsActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(initialSeconds);
  }, [initialSeconds, stop]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            stop();
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, onComplete, stop]);

  return {
    seconds,
    isActive,
    start,
    stop,
    reset,
  };
};