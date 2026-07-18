'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { RoomSettings } from '@/types';

interface CreateRoomProps {
  onCreateRoom: (nickname: string, settings?: Partial<RoomSettings>) => void;
}

export function CreateRoom({ onCreateRoom }: CreateRoomProps) {
  const [nickname, setNickname] = useState('');
  const [drawTime, setDrawTime] = useState(60);
  const [rounds, setRounds] = useState(2);
  const [showSettings, setShowSettings] = useState(false);
  const [errors, setErrors] = useState<{ nickname?: string }>({});

  const validate = useCallback((): boolean => {
    const next: { nickname?: string } = {};
    const trimmed = nickname.trim();
    if (!trimmed) {
      next.nickname = 'Nickname is required';
    } else if (trimmed.length < 2) {
      next.nickname = 'Nickname must be at least 2 characters';
    } else if (trimmed.length > 15) {
      next.nickname = 'Nickname must be 15 characters or less';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [nickname]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      onCreateRoom(nickname.trim(), {
        drawTime,
        roundsPerPlayer: rounds,
      });
    },
    [nickname, drawTime, rounds, validate, onCreateRoom],
  );

  return (
    <div className="animate-slideUp w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-heading font-bold text-gradient">
          DoodleDash
        </h1>
        <p className="mt-2 text-text-secondary text-sm">
          Draw, guess, and have fun!
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/5 bg-bg-surface p-6 shadow-xl"
      >
        <h2 className="mb-6 text-lg font-semibold text-text-primary">
          Create a Room
        </h2>

        <Input
          label="Your Nickname"
          placeholder="Enter your nickname..."
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          error={errors.nickname}
          maxLength={15}
          autoFocus
        />

        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          className="mt-4 flex w-full items-center justify-between rounded-lg bg-bg-secondary/50 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          aria-expanded={showSettings}
        >
          <span>Game Settings</span>
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showSettings && (
          <div className="mt-4 animate-fadeIn space-y-4 rounded-lg bg-bg-secondary/30 p-4">
            <div>
              <label
                htmlFor="draw-time"
                className="mb-1.5 block text-sm text-text-secondary"
              >
                Draw Time: <span className="font-semibold text-accent">{drawTime}s</span>
              </label>
              <input
                id="draw-time"
                type="range"
                min={30}
                max={120}
                step={10}
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-secondary/60">
                <span>30s</span>
                <span>120s</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="rounds"
                className="mb-1.5 block text-sm text-text-secondary"
              >
                Rounds per Player:{' '}
                <span className="font-semibold text-accent">{rounds}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRounds(n)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                      rounds === n
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-bg-secondary text-text-secondary hover:bg-white/10'
                    }`}
                    aria-pressed={rounds === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
        >
          Create Room
        </Button>
      </form>
    </div>
  );
}
