'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface RoundScore {
  playerId: string;
  nickname: string;
  score: number;
  roundScore: number;
}

interface RoundTransitionProps {
  word: string;
  scores: RoundScore[];
  nextDoodlerNickname: string;
  secondsUntilNext: number;
}

export function RoundTransition({
  word,
  scores,
  nextDoodlerNickname,
  secondsUntilNext,
}: RoundTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...scores].sort((a, b) => b.roundScore - a.roundScore);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-bg-primary/95 backdrop-blur-sm',
        'transition-opacity duration-500',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {/* Round Over */}
        <h2
          className={clsx(
            'text-3xl font-heading font-bold text-gradient',
            'transition-all duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          Round Over!
        </h2>

        {/* Word Reveal */}
        <div
          className={clsx(
            'transition-all delay-150 duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <p className="mb-1 text-sm text-text-secondary">The word was</p>
          <p className="animate-fadeIn text-4xl font-heading font-bold tracking-[0.15em] text-accent">
            {word.split('').map((letter, idx) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: static letter sequence, never reordered
                key={idx}
                className="inline-block animate-fadeIn"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {letter}
              </span>
            ))}
          </p>
        </div>

        {/* Round Scores */}
        <div
          className={clsx(
            'space-y-2',
            'transition-all delay-300 duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Round Scores
          </h3>

          {sorted.length === 0 && (
            <p className="py-4 text-sm text-text-secondary">
              No one guessed correctly this round.
            </p>
          )}

          {sorted.map((entry) => (
            <div
              key={entry.playerId}
              className={clsx(
                'flex items-center justify-between rounded-lg px-4 py-2.5',
                entry.roundScore > 0
                  ? 'bg-success/10 border border-success/20'
                  : 'bg-bg-surface/50',
              )}
            >
              <span className="text-sm font-medium text-text-primary">
                {entry.nickname}
              </span>
              <span
                className={clsx(
                  'font-mono text-sm font-bold tabular-nums',
                  entry.roundScore > 0 ? 'text-success' : 'text-text-secondary',
                )}
              >
                {entry.roundScore > 0 ? `+${entry.roundScore}` : '0'}
              </span>
            </div>
          ))}
        </div>

        {/* Next doodler */}
        <div
          className={clsx(
            'transition-all delay-500 duration-500',
            visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <p className="text-sm text-text-secondary">
            Next doodler:{' '}
            <span className="font-semibold text-text-primary">
              {nextDoodlerNickname}
            </span>
          </p>
        </div>

        {/* Countdown */}
        <div
          className={clsx(
            'transition-all delay-700 duration-500',
            visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
          )}
        >
          <p className="text-5xl font-heading font-bold text-accent">
            {secondsUntilNext}
          </p>
          <p className="text-sm text-text-secondary">
            Next round starting...
          </p>
        </div>
      </div>
    </div>
  );
}
