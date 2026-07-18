'use client';

import clsx from 'clsx';
import type { Player } from '@/types';

interface PlayerListProps {
  players: Player[];
  currentDoodlerId: string | null;
  playerId: string;
}

const AVATAR_COLORS = [
  'bg-accent',
  'bg-secondary',
  'bg-success',
  'bg-warning',
  'bg-danger',
  'bg-blue-500',
  'bg-teal-500',
  'bg-pink-500',
];

function getAvatarColor(nickname: string): string {
  const idx =
    nickname.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export function PlayerList({
  players,
  currentDoodlerId,
  playerId,
}: PlayerListProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="rounded-xl border border-white/10 bg-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          Scoreboard
        </h3>
        <span className="text-xs text-text-secondary">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Player rows */}
      <div className="flex flex-col gap-1 p-2">
        {sorted.length === 0 && (
          <p className="py-6 text-center text-sm text-text-secondary">
            No players yet.
          </p>
        )}

        {sorted.map((player, idx) => {
          const isDoodler = player.id === currentDoodlerId;
          const isMe = player.id === playerId;

          return (
            <div
              key={player.id}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200',
                isDoodler && 'border border-accent/30 bg-accent/5',
                isMe && !isDoodler && 'bg-white/5',
                !isDoodler && !isMe && 'bg-transparent',
              )}
            >
              {/* Rank */}
              <span className="w-5 text-center text-xs font-bold text-text-secondary">
                {idx + 1}
              </span>

              {/* Avatar */}
              <div
                className={clsx(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                  getAvatarColor(player.nickname),
                )}
                aria-hidden="true"
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>

              {/* Name + badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={clsx(
                      'truncate text-sm font-medium',
                      isMe ? 'text-accent' : 'text-text-primary',
                    )}
                  >
                    {player.nickname}
                  </span>
                  {isMe && (
                    <span className="text-[10px] text-accent">(you)</span>
                  )}
                  {player.isHost && (
                    <svg
                      className="h-3.5 w-3.5 flex-shrink-0 text-warning"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-label="Host"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {isDoodler && (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      Drawing
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <span className="font-mono text-sm font-bold tabular-nums text-text-primary">
                {player.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
