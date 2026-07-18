'use client';

import { Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateRoom } from '@/components/lobby/CreateRoom';
import { JoinRoom } from '@/components/lobby/JoinRoom';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameCanvas } from '@/components/game/GameCanvas';
import { CanvasToolbar } from '@/components/game/CanvasToolbar';
import { Chat } from '@/components/game/Chat';
import { Timer } from '@/components/game/Timer';
import { WordPrompt } from '@/components/game/WordPrompt';
import { PlayerList } from '@/components/game/PlayerList';
import { GameOver } from '@/components/game/GameOver';
import { useGame } from '@/hooks/useGame';
import type { RoomSettings } from '@/types';
import { GameState } from '@/types';

type AppView = 'home' | 'connecting' | 'game';

type PendingAction =
  | { type: 'create'; nickname: string; settings?: Partial<RoomSettings> }
  | { type: 'join'; nickname: string };

const DEFAULT_COLOR = '#6c5ce7';
const DEFAULT_BRUSH_SIZE = 4;

/**
 * Home screen — create or join a room.
 */
function HomeView({
  onCreateRoom,
  onJoinRoom,
}: {
  onCreateRoom: (nickname: string, settings?: Partial<RoomSettings>) => void;
  onJoinRoom: (code: string, nickname: string) => void;
}) {
  const [showCreate, setShowCreate] = useState(true);

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

        {/* Tab toggle */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              showCreate
                ? 'bg-accent text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface/80'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              !showCreate
                ? 'bg-accent text-white'
                : 'bg-bg-surface text-text-secondary hover:bg-bg-surface/80'
            }`}
          >
            Join Room
          </button>
        </div>

        <div className="flex justify-center">
          {showCreate ? (
            <CreateRoom onCreateRoom={onCreateRoom} />
          ) : (
            <JoinRoom onJoinRoom={onJoinRoom} />
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Game view — lobby, playing, round_end, game_over.
 * Connected to a GameRoom agent via the Agents SDK.
 */
function GameView({
  roomCode,
  pendingAction,
}: {
  roomCode: string;
  pendingAction: PendingAction | null;
}) {
  const actionSent = useRef(false);
  const game = useGame(roomCode);

  // Send the initial action (create or join) once the WebSocket connects.
  // Must NOT use setTimeout + cleanup — a mid-flight re-render (from
  // onStateUpdate) would cancel the timer and the action is silently lost.
  useEffect(() => {
    if (!pendingAction || actionSent.current) return;
    if (!game.isConnected) return;

    actionSent.current = true;
    if (pendingAction.type === 'create') {
      game.createRoom(pendingAction.nickname, pendingAction.settings);
    } else {
      game.joinRoom(pendingAction.nickname);
    }
  }, [pendingAction, game.isConnected, game]);

  // ── Connecting / error states ──────────────────────────────
  if (!game.isConnected && !game.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (game.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="bg-bg-secondary rounded-2xl p-8 border border-danger/30 text-center max-w-md">
          <p className="text-danger text-lg font-semibold mb-2">Error</p>
          <p className="text-text-secondary mb-4">{game.error}</p>
          <a
            href="/"
            className="inline-block py-2 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // ── LOBBY ─────────────────────────────────────────────────
  if (game.gameState === 'lobby' || game.gameState === null) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <RoomLobby
          room={{
            code: game.room?.code ?? roomCode,
            players: game.players,
            hostId: game.room?.hostId ?? '',
            settings: game.room?.settings ?? {
              maxPlayers: 8,
              roundsPerPlayer: 2,
              drawTime: 60,
              wordCategories: [],
            },
            state: GameState.LOBBY,
          }}
          playerId={game.playerId ?? ''}
          onStartGame={game.startGame}
          onLeaveRoom={() => {
            game.leaveRoom();
            window.location.href = '/';
          }}
        />
      </div>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────
  if (game.gameState === 'game_over') {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <GameOver
          leaderboard={game.leaderboard ?? []}
          playerId={game.playerId ?? ''}
          onPlayAgain={game.startGame}
          onLeave={() => {
            game.leaveRoom();
            window.location.href = '/';
          }}
        />
      </div>
    );
  }

  // ── ROUND END overlay ─────────────────────────────────────
  const showRoundEnd = game.gameState === 'round_end';

  // ── PLAYING ───────────────────────────────────────────────
  const isDoodler = game.doodlerId === game.playerId;
  const totalSeconds = game.room?.settings?.drawTime ?? 60;
  const wordDisplay = isDoodler && game.secretWord ? game.secretWord : '';

  const chatMessages = game.messages.map((m) => ({
    playerId: m.playerId,
    nickname: m.playerName,
    text: m.text,
    isCorrect: m.isCorrect,
    timestamp: m.timestamp,
  }));

  return (
    <div className="min-h-screen p-4 relative">
      {/* Round end overlay */}
      {showRoundEnd && (
        <div className="fixed inset-0 z-40 bg-bg-primary/90 backdrop-blur-sm flex items-center justify-center" />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              game.leaveRoom();
              window.location.href = '/';
            }}
            className="text-text-secondary hover:text-white transition-colors text-sm"
          >
            &larr; Leave
          </button>
          <span className="text-text-secondary text-sm">
            Room: <span className="font-mono text-accent">{roomCode}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Timer
            secondsLeft={game.secondsLeft}
            totalSeconds={totalSeconds}
            compact
          />
          <span className="text-text-secondary text-sm">
            Round {game.currentRound}/{game.totalRounds}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[calc(100vh-100px)]">
        {/* Game area */}
        <div className="flex flex-col gap-4">
          <WordPrompt
            word={wordDisplay}
            wordLength={game.wordLength}
            category={game.wordCategory ?? ''}
            isDoodler={isDoodler}
          />

          <div className="flex-1 flex flex-col">
            <GameCanvas
              strokes={game.strokes}
              onDraw={game.drawStroke}
              isDrawingEnabled={isDoodler}
              color={DEFAULT_COLOR}
              brushSize={DEFAULT_BRUSH_SIZE}
            />
            {isDoodler && (
              <CanvasToolbar
                color={DEFAULT_COLOR}
                onColorChange={() => {}}
                brushSize={DEFAULT_BRUSH_SIZE}
                onBrushSizeChange={() => {}}
                onUndo={game.undoStroke}
                onClear={game.clearCanvas}
                disabled={false}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <PlayerList
            players={game.players}
            currentDoodlerId={game.doodlerId}
            playerId={game.playerId ?? ''}
          />
          <Chat
            messages={chatMessages}
            onSendGuess={game.makeGuess}
            isGuessingEnabled={!isDoodler}
          />
        </div>
      </div>
    </div>
  );
}

// ── Root page (inner, uses useSearchParams) ───────────────
function AppContent(): JSX.Element {
  const searchParams = useSearchParams();
  const [view, setView] = useState<AppView>('home');
  const [roomCode, setRoomCode] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const initialized = useRef(false);

  // Check URL for ?room=CODE on initial load
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const code = searchParams?.get('room');
    if (code) {
      setRoomCode(code);
      setView('game');
      // No pending action — user will need to join manually
      // or reconnection logic will handle it
    }
  }, [searchParams]);

  const navigateToGame = useCallback((code: string, action: PendingAction | null) => {
    setRoomCode(code);
    setPendingAction(action);
    setView('game');
    // Update URL for shareability
    window.history.replaceState(null, '', `/?room=${code}`);
  }, []);

  const handleCreateRoom = useCallback(
    async (nickname: string, settings?: Partial<RoomSettings>) => {
      try {
        const agentUrl =
          process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787';
        const res = await fetch(`${agentUrl}/api/generate-code`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to generate room code');
        const data = await res.json();
        navigateToGame(data.roomCode, {
          type: 'create',
          nickname,
          settings,
        });
      } catch (err) {
        console.error('Failed to create room:', err);
        // Fallback: generate a random 6-char code client-side
        const fallback = Array.from({ length: 6 }, () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[
            Math.floor(Math.random() * 36)
          ],
        ).join('');
        navigateToGame(fallback, { type: 'create', nickname, settings });
      }
    },
    [navigateToGame],
  );

  const handleJoinRoom = useCallback(
    (code: string, nickname: string) => {
      navigateToGame(code, { type: 'join', nickname });
    },
    [navigateToGame],
  );

  if (view === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Creating room...</p>
        </div>
      </div>
    );
  }

  if (view === 'game') {
    return <GameView roomCode={roomCode} pendingAction={pendingAction} />;
  }

  return <HomeView onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
}

// ── Root page (wraps useSearchParams in Suspense for static export) ─
export default function HomePage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
