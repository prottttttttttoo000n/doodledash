'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  onComplete?: () => void;
  onTick?: (secondsLeft: number) => void;
}

interface UseTimerReturn {
  secondsLeft: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimer({
  initialSeconds,
  onComplete,
  onTick,
}: UseTimerOptions): UseTimerReturn {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const initialRef = useRef(initialSeconds);

  // Keep callback refs up to date
  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setSecondsLeft(initialRef.current);
    setIsRunning(false);
  }, [clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    setSecondsLeft(initialRef.current);
    setIsRunning(true);
  }, [clearTimer]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;

        if (onTickRef.current) {
          onTickRef.current(next);
        }

        if (next <= 0) {
          clearTimer();
          setIsRunning(false);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return { secondsLeft, isRunning, start, stop, reset };
}
