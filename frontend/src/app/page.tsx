'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage(): JSX.Element {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [drawTime, setDrawTime] = useState(60);
  const [roundsPerPlayer, setRoundsPerPlayer] = useState(2);

  const handleCreateRoom = useCallback(() => {
    // TODO: Call server to create room, then navigate
    router.push('/room/new');
  }, [router]);

  const handleJoinRoom = useCallback(() => {
    if (roomCode.trim().length < 4) return;
    router.push(`/room/${roomCode.trim().toUpperCase()}`);
  }, [roomCode, router]);

  const handleRoomCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (val.length <= 6) setRoomCode(val);
    },
    [],
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-gradient mb-4">
            DoodleDash
          </h1>
          <p className="text-xl text-text-secondary font-sans">
            Draw, Guess, Party!
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-white/10 animate-slideUp">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Create a Room
            </h2>
            <p className="text-text-secondary mb-6">
              Start a new game and invite your friends
            </p>

            {/* Settings */}
            <div className="space-y-4 mb-8">
              <div>
                <label htmlFor="draw-time-range" className="block text-sm text-text-secondary mb-1">
                  Draw Time: {drawTime}s
                </label>
                <input
                  id="draw-time-range"
                  type="range"
                  min={30}
                  max={120}
                  step={10}
                  value={drawTime}
                  onChange={(e) => setDrawTime(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>30s</span>
                  <span>120s</span>
                </div>
              </div>
              <div>
                <span className="block text-sm text-text-secondary mb-1">
                  Rounds per Player
                </span>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRoundsPerPlayer(n)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        roundsPerPlayer === n
                          ? 'bg-accent text-white'
                          : 'bg-bg-surface text-text-secondary hover:bg-bg-surface/80'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              className="w-full py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold text-lg transition-colors glow"
            >
              Create Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-bg-secondary rounded-2xl p-8 border border-white/10 animate-slideUp">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Join a Room
            </h2>
            <p className="text-text-secondary mb-6">
              Enter the room code to join a game
            </p>

            <div className="mb-8">
              <label htmlFor="room-code-input" className="block text-sm text-text-secondary mb-2">
                Room Code
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="ENTER CODE"
                maxLength={6}
                className="w-full bg-bg-surface border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-white placeholder:text-text-secondary/40 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent uppercase"
              />
            </div>

            <button
              type="button"
              onClick={handleJoinRoom}
              disabled={roomCode.trim().length < 4}
              className="w-full py-3 px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-white font-semibold text-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
