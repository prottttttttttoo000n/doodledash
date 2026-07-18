'use client';

import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useGame } from '@/hooks/useGame';
import { GameState } from '@/types';
import { RoomLobby } from '@/components/lobby/RoomLobby';
import { GameCanvas } from '@/components/game/GameCanvas';
import { CanvasToolbar } from '@/components/game/CanvasToolbar';
import { Chat } from '@/components/game/Chat';
import { Timer } from '@/components/game/Timer';
import { WordPrompt } from '@/components/game/WordPrompt';
import { PlayerList } from '@/components/game/PlayerList';
import { GameOver } from '@/components/game/GameOver';

const DEFAULT_COLOR = '#6c5ce7';
const DEFAULT_BRUSH_SIZE = 4;

export default function RoomPage(): JSX.Element {
  const params = useParams();
  const roomCode = (params?.id as string) ?? '';
  const { socket, isConnected } = useSocket();
  const game = useGame(socket);

  if (!isConnected) {
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

  /* ---------- LOBBY ---------- */
  if (game.gameState === GameState.LOBBY || game.gameState === GameState.IDLE) {
    const room = {
      code: roomCode,
      id: game.room?.id ?? roomCode,
      hostId: game.players.find((p) => p.isHost)?.id ?? game.playerId ?? '',
      players: game.players,
      settings: game.settings ?? {
        drawTime: 60,
        roundsPerPlayer: 2,
        maxPlayers: 8,
      },
    };

    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <RoomLobby
          room={room}
          playerId={game.playerId ?? ''}
          onStartGame={game.startGame}
          onLeaveRoom={game.leaveRoom}
        />
      </div>
    );
  }

  /* ---------- GAME OVER ---------- */
  if (game.gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <GameOver
          leaderboard={game.leaderboard ?? []}
          playerId={game.playerId ?? ''}
          onPlayAgain={game.startGame}
          onLeave={game.leaveRoom}
        />
      </div>
    );
  }

  /* ---------- PLAYING / ROUND_END ---------- */
  const isDoodler = game.doodlerId === game.playerId;
  const totalSeconds = game.settings?.drawTime ?? 60;

  // Build the word string for WordPrompt
  const wordDisplay =
    isDoodler && game.secretWord ? game.secretWord : '';

  // Map messages for Chat component
  const chatMessages = game.messages.map((m) => ({
    playerId: m.playerId,
    nickname: m.playerName,
    text: m.text,
    isCorrect: m.isCorrect,
    timestamp: m.timestamp,
  }));

  return (
    <div className="min-h-screen p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="text-text-secondary hover:text-white transition-colors text-sm"
          >
            &larr; Leave
          </a>
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
          {/* Word prompt */}
          <WordPrompt
            word={wordDisplay}
            wordLength={game.wordLength}
            category={game.wordCategory ?? ''}
            isDoodler={isDoodler}
          />

          {/* Canvas */}
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
                onUndo={game.undoStroke}
                onClear={game.clearCanvas}
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
