'use client';

import clsx from 'clsx';
import { Button } from '@/components/ui/Button';

interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  rank: number;
}

interface GameOverProps {
  leaderboard: LeaderboardEntry[];
  playerId: string;
  onPlayAgain: () => void;
  onLeave: () => void;
}

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: static confetti particles, never reordered
          key={i}
          className="absolute animate-fadeIn"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${-Math.random() * 20}%`,
            width: `${6 + Math.random() * 6}px`,
            height: `${6 + Math.random() * 6}px`,
            backgroundColor: ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#e17055'][
              Math.floor(Math.random() * 5)
            ],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${2 + Math.random() * 3}s ease-out ${Math.random() * 2}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

const PODIUM_COLORS = [
  { bg: 'bg-warning/20', border: 'border-warning', text: 'text-warning', rank: '1st', medal: '🥇' },
  { bg: 'bg-gray-400/10', border: 'border-gray-400', text: 'text-gray-400', rank: '2nd', medal: '🥈' },
  { bg: 'bg-accent/20', border: 'border-accent', text: 'text-accent', rank: '3rd', medal: '🥉' },
];

export function GameOver({
  leaderboard,
  playerId,
  onPlayAgain,
  onLeave,
}: GameOverProps) {
  const topThree = leaderboard.slice(0, 3);
  const winner = leaderboard[0];

  return (
    <div className="relative mx-auto w-full max-w-lg animate-fadeIn px-4">
      {/* Confetti for winner */}
      {winner?.id === playerId && <Confetti />}

      <div className="relative rounded-2xl border border-white/10 bg-bg-secondary p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          {winner?.id === playerId && (
            <p className="mb-2 text-4xl" role="img" aria-label="Winner">
              🎉
            </p>
          )}
          <h1 className="mb-1 text-4xl font-heading font-bold text-gradient">
            Game Over!
          </h1>
          <p className="text-sm text-text-secondary">
            {winner?.id === playerId
              ? 'Congratulations, you won!'
              : `${winner?.nickname ?? 'Someone'} won the game!`}
          </p>
        </div>

        {/* Podium */}
        {topThree.length > 0 && (
          <div
            className="mb-8 flex items-end justify-center gap-4"
            style={{ animation: 'slideUp 0.4s ease-out 0.1s both' }}
          >
            {/* 2nd place */}
            {topThree[1] && (
              <div className="animate-slideUp text-center" style={{ animationDelay: '0.2s' }}>
                <div
                  className={clsx(
                    'mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-bg-surface',
                    PODIUM_COLORS[1].border,
                  )}
                >
                  <span className="text-2xl font-bold">🥈</span>
                </div>
                <p className="max-w-[100px] truncate text-sm font-medium text-text-primary">
                  {topThree[1].nickname}
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {topThree[1].score} pts
                </p>
              </div>
            )}

            {/* 1st place */}
            {topThree[0] && (
              <div
                className="animate-slideUp text-center"
                style={{ animationDelay: '0.1s' }}
              >
                <div
                  className={clsx(
                    'mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-lg',
                    PODIUM_COLORS[0].bg,
                    PODIUM_COLORS[0].border,
                  )}
                >
                  <span className="text-3xl font-bold">🥇</span>
                </div>
                <p className="max-w-[120px] truncate text-base font-semibold text-text-primary">
                  {topThree[0].nickname}
                </p>
                <p className="font-mono text-sm font-bold text-warning">
                  {topThree[0].score} pts
                </p>
              </div>
            )}

            {/* 3rd place */}
            {topThree[2] && (
              <div className="animate-slideUp text-center" style={{ animationDelay: '0.3s' }}>
                <div
                  className={clsx(
                    'mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-bg-surface',
                    PODIUM_COLORS[2].border,
                  )}
                >
                  <span className="text-2xl font-bold">🥉</span>
                </div>
                <p className="max-w-[100px] truncate text-sm font-medium text-text-primary">
                  {topThree[2].nickname}
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {topThree[2].score} pts
                </p>
              </div>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <div
          className="mb-8 space-y-2"
          style={{ animation: 'slideUp 0.4s ease-out 0.4s both' }}
        >
          {leaderboard.map((entry, idx) => {
            const isMe = entry.id === playerId;
            const isPodium = idx < 3;

            return (
              <div
                key={entry.id}
                className={clsx(
                  'flex items-center justify-between rounded-xl px-4 py-3 transition-all',
                  isPodium && idx === 0
                    ? 'border border-warning/30 bg-warning/10'
                    : isPodium
                      ? 'bg-bg-surface'
                      : 'bg-bg-surface/50',
                  isMe && !isPodium && 'border border-accent/20 bg-accent/5',
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'w-6 text-center text-sm font-bold',
                      idx === 0
                        ? 'text-warning'
                        : idx === 1
                          ? 'text-gray-400'
                          : idx === 2
                            ? 'text-accent'
                            : 'text-text-secondary',
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div
                    className={clsx(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
                      [
                        'bg-accent',
                        'bg-secondary',
                        'bg-success',
                        'bg-warning',
                        'bg-danger',
                        'bg-blue-500',
                        'bg-teal-500',
                        'bg-pink-500',
                      ][
                        entry.nickname
                          .split('')
                          .reduce((a, c) => a + c.charCodeAt(0), 0) % 8
                      ],
                    )}
                    aria-hidden="true"
                  >
                    {entry.nickname.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <span className="text-sm font-medium text-text-primary">
                      {entry.nickname}
                    </span>
                    {isMe && (
                      <span className="ml-1.5 text-xs text-accent">(you)</span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-sm font-bold tabular-nums text-text-primary">
                  {entry.score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div
          className="flex gap-3"
          style={{ animation: 'slideUp 0.4s ease-out 0.6s both' }}
        >
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={onPlayAgain}
          >
            Play Again
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={onLeave}
          >
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
}
