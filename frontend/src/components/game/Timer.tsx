'use client';

import { useMemo } from 'react';
import clsx from 'clsx';

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
  compact?: boolean;
}

export function Timer({
  secondsLeft,
  totalSeconds,
  compact = false,
}: TimerProps) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const circumference = compact ? 2 * Math.PI * 36 : 2 * Math.PI * 54;
  const offset = circumference * (1 - progress);

  const color = useMemo(() => {
    if (secondsLeft <= 5) return '#e17055'; // danger
    if (secondsLeft <= 10) return '#fdcb6e'; // warning
    return '#00b894'; // success
  }, [secondsLeft]);

  const isLow = secondsLeft <= 10 && secondsLeft > 0;

  const size = compact ? 80 : 120;
  const strokeWidth = compact ? 5 : 6;
  const radius = compact ? 36 : 54;
  const fontSize = compact ? 'text-2xl' : 'text-4xl';

  return (
    <div
      className={clsx(
        'inline-flex flex-col items-center gap-1',
        isLow && 'animate-pulse-slow',
      )}
      role="timer"
      aria-label={`${secondsLeft} seconds remaining`}
      aria-live="polite"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* SVG Circular Progress */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={clsx(
              'font-mono font-bold tabular-nums',
              fontSize,
            )}
            style={{ color }}
          >
            {secondsLeft}
          </span>
        </div>
      </div>

      <span className="text-xs font-medium text-text-secondary">
        Time left
      </span>
    </div>
  );
}
