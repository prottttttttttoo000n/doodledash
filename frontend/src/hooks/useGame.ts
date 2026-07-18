'use client';

import { useState, useCallback } from 'react';
import { useAgent } from 'agents/react';
import type {
  Player,
  DrawStroke,
  RoomSettings,
  GameRoomState,
} from '@/types';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface UseGameReturn {
  // State
  room: {
    code: string;
    players: Player[];
    hostId: string;
    settings: RoomSettings;
    state: string;
  } | null;
  playerId: string | null;
  players: Player[];
  gameState: string | null;
  currentRound: number;
  totalRounds: number;
  doodlerId: string | null;
  secretWord: string | null;
  wordCategory: string | null;
  wordLength: number;
  secondsLeft: number;
  strokes: DrawStroke[];
  leaderboard: (Player & { rank: number })[] | null;
  roundScores: { playerId: string; score: number }[] | null;
  revealedWord: string | null;
  error: string | null;
  isHost: boolean;
  isDoodler: boolean;
  currentPlayer: Player | null;
  isConnected: boolean;
  messages: ChatMessage[];

  // Actions
  createRoom: (nickname: string, settings?: Partial<RoomSettings>) => Promise<void>;
  joinRoom: (nickname: string) => Promise<void>;
  startGame: () => Promise<void>;
  makeGuess: (word: string) => Promise<void>;
  drawStroke: (stroke: DrawStroke) => Promise<void>;
  undoStroke: () => Promise<void>;
  clearCanvas: () => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export function useGame(roomCode: string): UseGameReturn {
  const [state, setState] = useState<GameRoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const agent = useAgent({
    agent: 'GameRoom',
    name: roomCode,
    onStateUpdate: (newState: GameRoomState) => {
      setState(newState);
      setIsConnected(true);
    },
    onError: (err) => {
      console.error('Agent connection error:', err);
      setIsConnected(false);
    },
    onIdentity: (_name: string, _agentType: string) => {
      setIsConnected(true);
    },
  });

  const callMethod = useCallback(
    (method: string, ...args: unknown[]) => {
      return (agent.stub as Record<string, (...args: unknown[]) => Promise<unknown>>)[method](...args);
    },
    [agent],
  );

  const createRoom = useCallback(
    async (nickname: string, settings?: Partial<RoomSettings>) => {
      try {
        const result = await callMethod('createRoom', nickname, settings);
        if (result && typeof result === 'object' && 'playerId' in result) {
          setPlayerId((result as { playerId: string }).playerId);
        }
      } catch (err) {
        console.error('createRoom error:', err);
      }
    },
    [callMethod],
  );

  const joinRoom = useCallback(
    async (nickname: string) => {
      try {
        const result = await callMethod('joinRoom', nickname);
        if (result && typeof result === 'object' && 'playerId' in result) {
          setPlayerId((result as { playerId: string }).playerId);
        }
      } catch (err) {
        console.error('joinRoom error:', err);
      }
    },
    [callMethod],
  );

  const startGame = useCallback(async () => {
    try {
      await callMethod('startGame');
    } catch (err) {
      console.error('startGame error:', err);
    }
  }, [callMethod]);

  const makeGuess = useCallback(
    async (word: string) => {
      try {
        await callMethod('makeGuess', word);
      } catch (err) {
        console.error('makeGuess error:', err);
      }
    },
    [callMethod],
  );

  const drawStroke = useCallback(
    async (stroke: DrawStroke) => {
      try {
        await callMethod('drawStroke', stroke);
      } catch (err) {
        console.error('drawStroke error:', err);
      }
    },
    [callMethod],
  );

  const undoStroke = useCallback(async () => {
    try {
      await callMethod('undoStroke');
    } catch (err) {
      console.error('undoStroke error:', err);
    }
  }, [callMethod]);

  const clearCanvas = useCallback(async () => {
    try {
      await callMethod('clearCanvas');
    } catch (err) {
      console.error('clearCanvas error:', err);
    }
  }, [callMethod]);

  const leaveRoom = useCallback(async () => {
    try {
      await callMethod('leaveRoom');
    } catch (err) {
      console.error('leaveRoom error:', err);
    }
  }, [callMethod]);

  // Derive computed values from state
  const isHost = playerId ? state?.hostId === playerId : false;
  const isDoodler = playerId ? state?.doodlerId === playerId : false;
  const currentPlayer = state?.players.find((p) => p.id === playerId) ?? null;

  return {
    // State
    room: state
      ? {
          code: state.roomCode,
          players: state.players,
          hostId: state.hostId,
          settings: state.settings,
          state: state.phase,
        }
      : null,
    playerId,
    players: state?.players ?? [],
    gameState: state?.phase ?? null,
    currentRound: state?.currentRound ?? 0,
    totalRounds: state?.totalRounds ?? 0,
    doodlerId: state?.doodlerId ?? null,
    secretWord: state?.secretWord ?? null,
    wordCategory: state?.wordCategory ?? null,
    wordLength: state?.wordLength ?? 0,
    secondsLeft: state?.drawTime ?? 0,
    strokes: state?.strokes ?? [],
    leaderboard: state?.leaderboard ?? null,
    roundScores: state?.roundScores ?? null,
    revealedWord: state?.revealedWord ?? null,
    error: state?.error ?? null,
    isHost,
    isDoodler,
    currentPlayer,
    isConnected,

    // Messages for chat (derived from state or added via chat system)
    messages: [] as ChatMessage[],

    // Actions
    createRoom,
    joinRoom,
    startGame,
    makeGuess,
    drawStroke,
    undoStroke,
    clearCanvas,
    leaveRoom,
  };
}

export type { ChatMessage };
