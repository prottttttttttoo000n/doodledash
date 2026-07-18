'use client';

import { useState, useCallback } from 'react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Room } from '@/types';

interface RoomLobbyProps {
  room: Room;
  playerId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

function PlayerAvatar({ nickname, size = 'md' }: { nickname: string; size?: 'sm' | 'md' | 'lg' }) {
  const initial = nickname.charAt(0).toUpperCase();
  const colors = [
    'bg-accent',
    'bg-secondary',
    'bg-success',
    'bg-warning',
    'bg-danger',
    'bg-blue-500',
    'bg-teal-500',
    'bg-pink-500',
  ];
  const colorIndex =
    nickname.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;
  const color = colors[colorIndex];

  const sizeMap = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full font-bold text-white',
        sizeMap[size],
        color,
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-flex" role="status" aria-label="Waiting">
      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
    </span>
  );
}

export function RoomLobby({ room, playerId, onStartGame, onLeaveRoom }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  const canStart = isHost && room.players.length >= 2;

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(room.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // Fallback: select the text manually
        setCopied(false);
      },
    );
  }, [room.code]);

  const sortedPlayers = [...room.players].sort((a, b) => {
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    return 0;
  });

  return (
    <div className="mx-auto w-full max-w-2xl animate-fadeIn">
      {/* Room Code */}
      <Card className="mb-6 text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-text-secondary">
          Room Code
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="select-all text-3xl font-bold tracking-[0.25em] text-accent">
            {room.code}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
            aria-label={copied ? 'Copied!' : 'Copy room code'}
            title={copied ? 'Copied!' : 'Copy room code'}
          >
            {copied ? (
              <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <title>Copied</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <title>Copy</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          Share this code with your friends!
        </p>
      </Card>

      {/* Settings Summary */}
      <div className="mb-6 flex items-center justify-center gap-6 text-sm text-text-secondary">
        <span>
          Draw time:{' '}
          <span className="font-semibold text-text-primary">
            {room.settings.drawTime}s
          </span>
        </span>
        <span className="text-white/10">|</span>
        <span>
          Rounds:{' '}
          <span className="font-semibold text-text-primary">
            {room.settings.roundsPerPlayer}
          </span>
        </span>
        <span className="text-white/10">|</span>
        <span>
          Players:{' '}
          <span className="font-semibold text-text-primary">
            {room.players.length}/{room.settings.maxPlayers}
          </span>
        </span>
      </div>

      {/* Player List */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Players ({room.players.length})
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={clsx(
                'flex items-center gap-3 rounded-lg border p-3 transition-all duration-200',
                player.id === playerId
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-white/5 bg-bg-secondary/50',
              )}
            >
              <PlayerAvatar nickname={player.nickname} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {player.nickname}
                    {player.id === playerId && (
                      <span className="ml-1 text-xs text-accent">(you)</span>
                    )}
                  </span>
                  {player.isHost && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning"
                      title="Host"
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Host
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-secondary">
                  Score: {player.score}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Waiting message */}
        {room.players.length < 2 && (
          <p className="mt-4 text-center text-sm text-text-secondary">
            Waiting for players
            <AnimatedDots />
          </p>
        )}

        {room.players.length >= 2 && (
          <p className="mt-4 text-center text-sm text-success">
            Enough players to start!
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {isHost ? (
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              disabled={!canStart}
              onClick={onStartGame}
              aria-label={
                canStart
                  ? 'Start game'
                  : 'Need at least 2 players to start'
              }
            >
              Start Game
            </Button>
          ) : (
            <div className="flex-1 rounded-lg bg-bg-secondary/50 px-4 py-3 text-center text-sm text-text-secondary">
              Waiting for host to start the game
              <AnimatedDots />
            </div>
          )}

          <Button
            variant="ghost"
            size="lg"
            onClick={onLeaveRoom}
            className="sm:w-auto"
          >
            Leave Room
          </Button>
        </div>
      </Card>
    </div>
  );
}
