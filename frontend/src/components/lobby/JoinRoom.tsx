'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface JoinRoomProps {
  onJoinRoom: (roomCode: string, nickname: string) => void;
}

export function JoinRoom({ onJoinRoom }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<{ roomCode?: string; nickname?: string }>({});

  const validate = useCallback((): boolean => {
    const next: typeof errors = {};
    const trimmedCode = roomCode.trim();
    if (!trimmedCode) {
      next.roomCode = 'Room code is required';
    } else if (trimmedCode.length !== 6) {
      next.roomCode = 'Room code must be 6 characters';
    } else if (!/^[A-Z0-9]+$/.test(trimmedCode)) {
      next.roomCode = 'Room code contains invalid characters';
    }

    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      next.nickname = 'Nickname is required';
    } else if (trimmedNick.length < 2) {
      next.nickname = 'Nickname must be at least 2 characters';
    } else if (trimmedNick.length > 15) {
      next.nickname = 'Nickname must be 15 characters or less';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [roomCode, nickname]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), nickname.trim());
    },
    [roomCode, nickname, validate, onJoinRoom],
  );

  const handleRoomCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (val.length <= 6) {
        setRoomCode(val);
      }
    },
    [],
  );

  return (
    <div className="animate-slideUp w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/5 bg-bg-surface p-6 shadow-xl"
      >
        <h2 className="mb-6 text-lg font-semibold text-text-primary">
          Join a Room
        </h2>

        <div className="space-y-4">
          <Input
            label="Room Code"
            placeholder="e.g. ABC123"
            value={roomCode}
            onChange={handleRoomCodeChange}
            error={errors.roomCode}
            maxLength={6}
            className="text-center text-lg font-bold tracking-[0.3em] uppercase"
            autoFocus
          />

          <Input
            label="Your Nickname"
            placeholder="Enter your nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={errors.nickname}
            maxLength={15}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
        >
          Join Room
        </Button>
      </form>
    </div>
  );
}
