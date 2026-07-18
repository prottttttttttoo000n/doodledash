'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import {
  Room,
  Player,
  DrawStroke,
  RoomSettings,
  GameState,
} from '@/types';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

interface GameClientState {
  room: Room | null;
  playerId: string | null;
  players: Player[];
  gameState: GameState;
  currentRound: number;
  totalRounds: number;
  doodlerId: string | null;
  secretWord: string | null;
  wordCategory: string | null;
  wordLength: number;
  secondsLeft: number;
  strokes: DrawStroke[];
  leaderboard: (Player & { rank: number })[] | null;
  roundScores: { playerId: string; score: number }[];
  revealedWord: string | null;
  error: string | null;
  isHost: boolean;
  messages: ChatMessage[];
  settings: RoomSettings | null;
}

type GameAction =
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ROOM_CREATED'; room: Room; playerId: string; settings: RoomSettings }
  | { type: 'ROOM_JOINED'; room: Room; playerId: string }
  | { type: 'PLAYER_JOINED'; players: Player[] }
  | { type: 'PLAYER_LEFT'; players: Player[] }
  | { type: 'ROOM_UPDATED'; room: Room }
  | { type: 'GAME_STARTING'; players: Player[]; doodlerId: string; totalRounds: number }
  | { type: 'ROUND_START'; round: number; doodlerId: string; wordCategory: string; wordLength: number; secondsLeft: number }
  | { type: 'ROUND_END'; revealedWord: string; roundScores: { playerId: string; score: number }[] }
  | { type: 'GAME_OVER'; leaderboard: (Player & { rank: number })[] }
  | { type: 'TIMER_TICK'; secondsLeft: number }
  | { type: 'STROKE_ADDED'; stroke: DrawStroke }
  | { type: 'STROKE_UNDONE' }
  | { type: 'CANVAS_CLEARED' }
  | { type: 'WORD_REVEALED'; word: string }
  | { type: 'STROKES_REPLAY'; strokes: DrawStroke[] }
  | { type: 'PLAYER_CORRECT_GUESS'; playerId: string }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'SETTINGS_UPDATED'; settings: RoomSettings }
  | { type: 'RESET' };

const initialState: GameClientState = {
  room: null,
  playerId: null,
  players: [],
  gameState: GameState.IDLE,
  currentRound: 0,
  totalRounds: 0,
  doodlerId: null,
  secretWord: null,
  wordCategory: null,
  wordLength: 0,
  secondsLeft: 0,
  strokes: [],
  leaderboard: null,
  roundScores: [],
  revealedWord: null,
  error: null,
  isHost: false,
  messages: [],
  settings: null,
};

function gameReducer(
  state: GameClientState,
  action: GameAction,
): GameClientState {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ROOM_CREATED':
      return {
        ...state,
        room: action.room,
        playerId: action.playerId,
        settings: action.settings,
        isHost: true,
        gameState: GameState.LOBBY,
        error: null,
        players: action.room.players ?? [],
      };

    case 'ROOM_JOINED':
      return {
        ...state,
        room: action.room,
        playerId: action.playerId,
        settings: action.room.settings ?? null,
        isHost: action.room.hostId === action.playerId,
        gameState: GameState.LOBBY,
        error: null,
        players: action.room.players ?? [],
      };

    case 'PLAYER_JOINED':
      return { ...state, players: action.players };

    case 'PLAYER_LEFT':
      return { ...state, players: action.players };

    case 'ROOM_UPDATED':
      return {
        ...state,
        room: action.room,
        players: action.room.players ?? state.players,
        settings: action.room.settings ?? state.settings,
      };

    case 'GAME_STARTING':
      return {
        ...state,
        gameState: GameState.PLAYING,
        players: action.players,
        doodlerId: action.doodlerId,
        totalRounds: action.totalRounds,
        currentRound: 1,
        strokes: [],
        messages: [],
        revealedWord: null,
        roundScores: [],
      };

    case 'ROUND_START':
      return {
        ...state,
        gameState: GameState.PLAYING,
        currentRound: action.round,
        doodlerId: action.doodlerId,
        wordCategory: action.wordCategory,
        wordLength: action.wordLength,
        secondsLeft: action.secondsLeft,
        secretWord:
          state.playerId === action.doodlerId ? state.secretWord : null,
        strokes: [],
        revealedWord: null,
      };

    case 'ROUND_END':
      return {
        ...state,
        gameState: GameState.ROUND_END,
        revealedWord: action.revealedWord,
        roundScores: action.roundScores,
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameState: GameState.GAME_OVER,
        leaderboard: action.leaderboard,
      };

    case 'TIMER_TICK':
      return { ...state, secondsLeft: action.secondsLeft };

    case 'STROKE_ADDED':
      return { ...state, strokes: [...state.strokes, action.stroke] };

    case 'STROKE_UNDONE': {
      const newStrokes = state.strokes.slice(0, -1);
      return { ...state, strokes: newStrokes };
    }

    case 'CANVAS_CLEARED':
      return { ...state, strokes: [] };

    case 'WORD_REVEALED':
      return { ...state, secretWord: action.word };

    case 'STROKES_REPLAY':
      return { ...state, strokes: action.strokes };

    case 'PLAYER_CORRECT_GUESS':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.playerId === action.playerId ? { ...m, isCorrect: true } : m,
        ),
      };

    case 'CHAT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.message],
      };

    case 'SETTINGS_UPDATED':
      return { ...state, settings: action.settings };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export interface UseGameReturn {
  // State
  room: Room | null;
  playerId: string | null;
  players: Player[];
  gameState: GameState;
  currentRound: number;
  totalRounds: number;
  doodlerId: string | null;
  secretWord: string | null;
  wordCategory: string | null;
  wordLength: number;
  secondsLeft: number;
  strokes: DrawStroke[];
  leaderboard: (Player & { rank: number })[] | null;
  roundScores: { playerId: string; score: number }[];
  revealedWord: string | null;
  error: string | null;
  isHost: boolean;
  messages: ChatMessage[];
  settings: RoomSettings | null;

  // Actions
  createRoom: (nickname: string, settings?: Partial<RoomSettings>) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  startGame: () => void;
  makeGuess: (word: string) => void;
  drawStroke: (stroke: DrawStroke) => void;
  undoStroke: () => void;
  clearCanvas: () => void;
  leaveRoom: () => void;
  sendChat: (text: string) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
}

export function useGame(socket: Socket | null): UseGameReturn {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Register all server event listeners
  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room:created', (data: { room: Room; playerId: string }) => {
      const settings = data.room.settings ?? {
        drawTime: 60,
        roundsPerPlayer: 2,
        maxPlayers: 8,
      };
      dispatch({
        type: 'ROOM_CREATED',
        room: data.room,
        playerId: data.playerId,
        settings,
      });
    });

    socket.on('room:joined', (data: { room: Room; playerId: string }) => {
      dispatch({
        type: 'ROOM_JOINED',
        room: data.room,
        playerId: data.playerId,
      });
    });

    socket.on('room:error', (data: { message: string }) => {
      dispatch({ type: 'SET_ERROR', error: data.message });
    });

    socket.on(
      'player:joined',
      (data: { players: Player[] }) => {
        dispatch({ type: 'PLAYER_JOINED', players: data.players });
      },
    );

    socket.on(
      'player:left',
      (data: { players: Player[] }) => {
        dispatch({ type: 'PLAYER_LEFT', players: data.players });
      },
    );

    socket.on('room:updated', (data: { room: Room }) => {
      dispatch({ type: 'ROOM_UPDATED', room: data.room });
    });

    // Game events
    socket.on(
      'game:starting',
      (data: { players: Player[]; doodlerId: string; totalRounds: number }) => {
        dispatch({
          type: 'GAME_STARTING',
          players: data.players,
          doodlerId: data.doodlerId,
          totalRounds: data.totalRounds,
        });
      },
    );

    socket.on(
      'round:start',
      (data: {
        round: number;
        doodlerId: string;
        wordCategory: string;
        wordLength: number;
        secondsLeft: number;
        secretWord?: string;
      }) => {
        dispatch({
          type: 'ROUND_START',
          round: data.round,
          doodlerId: data.doodlerId,
          wordCategory: data.wordCategory,
          wordLength: data.wordLength,
          secondsLeft: data.secondsLeft,
        });
        // If this player is the doodler, store the secret word
        if (data.secretWord && state.playerId === data.doodlerId) {
          dispatch({ type: 'WORD_REVEALED', word: data.secretWord });
        }
      },
    );

    socket.on(
      'round:end',
      (data: {
        revealedWord: string;
        scores: { playerId: string; score: number }[];
      }) => {
        dispatch({
          type: 'ROUND_END',
          revealedWord: data.revealedWord,
          roundScores: data.scores,
        });
      },
    );

    socket.on(
      'game:over',
      (data: { leaderboard: (Player & { rank: number })[] }) => {
        dispatch({ type: 'GAME_OVER', leaderboard: data.leaderboard });
      },
    );

    socket.on(
      'timer:tick',
      (data: { secondsLeft: number }) => {
        dispatch({ type: 'TIMER_TICK', secondsLeft: data.secondsLeft });
      },
    );

    // Drawing events
    socket.on(
      'draw:stroke',
      (data: { stroke: DrawStroke }) => {
        dispatch({ type: 'STROKE_ADDED', stroke: data.stroke });
      },
    );

    socket.on('draw:undo', () => {
      dispatch({ type: 'STROKE_UNDONE' });
    });

    socket.on('draw:clear', () => {
      dispatch({ type: 'CANVAS_CLEARED' });
    });

    socket.on(
      'draw:replay',
      (data: { strokes: DrawStroke[] }) => {
        dispatch({ type: 'STROKES_REPLAY', strokes: data.strokes });
      },
    );

    // Guess events
    socket.on(
      'guess:correct',
      (data: { playerId: string }) => {
        dispatch({ type: 'PLAYER_CORRECT_GUESS', playerId: data.playerId });
      },
    );

    // Chat events
    socket.on(
      'chat:message',
      (data: { message: ChatMessage }) => {
        dispatch({ type: 'CHAT_MESSAGE', message: data.message });
      },
    );

    // Settings
    socket.on(
      'settings:updated',
      (data: { settings: RoomSettings }) => {
        dispatch({ type: 'SETTINGS_UPDATED', settings: data.settings });
      },
    );

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('player:joined');
      socket.off('player:left');
      socket.off('room:updated');
      socket.off('game:starting');
      socket.off('round:start');
      socket.off('round:end');
      socket.off('game:over');
      socket.off('timer:tick');
      socket.off('draw:stroke');
      socket.off('draw:undo');
      socket.off('draw:clear');
      socket.off('draw:replay');
      socket.off('guess:correct');
      socket.off('chat:message');
      socket.off('settings:updated');
    };
  }, [socket, state.playerId]);

  const createRoom = useCallback(
    (nickname: string, settings?: Partial<RoomSettings>) => {
      if (!socket) return;
      socket.emit('room:create', { nickname, settings });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname: string) => {
      if (!socket) return;
      socket.emit('room:join', { roomCode, nickname });
    },
    [socket],
  );

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('game:start');
  }, [socket]);

  const makeGuess = useCallback(
    (word: string) => {
      if (!socket) return;
      socket.emit('guess:submit', { word });
    },
    [socket],
  );

  const drawStroke = useCallback(
    (stroke: DrawStroke) => {
      if (!socket) return;
      socket.emit('draw:stroke', { stroke });
      // Optimistically add to local state
      dispatch({ type: 'STROKE_ADDED', stroke });
    },
    [socket],
  );

  const undoStroke = useCallback(() => {
    if (!socket) return;
    socket.emit('draw:undo');
    dispatch({ type: 'STROKE_UNDONE' });
  }, [socket]);

  const clearCanvas = useCallback(() => {
    if (!socket) return;
    socket.emit('draw:clear');
    dispatch({ type: 'CANVAS_CLEARED' });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;
    socket.emit('room:leave');
    dispatch({ type: 'RESET' });
  }, [socket]);

  const sendChat = useCallback(
    (text: string) => {
      if (!socket) return;
      socket.emit('chat:send', { text });
    },
    [socket],
  );

  const updateSettings = useCallback(
    (settings: Partial<RoomSettings>) => {
      if (!socket) return;
      socket.emit('settings:update', { settings });
    },
    [socket],
  );

  return {
    room: state.room,
    playerId: state.playerId,
    players: state.players,
    gameState: state.gameState,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    doodlerId: state.doodlerId,
    secretWord: state.secretWord,
    wordCategory: state.wordCategory,
    wordLength: state.wordLength,
    secondsLeft: state.secondsLeft,
    strokes: state.strokes,
    leaderboard: state.leaderboard,
    roundScores: state.roundScores,
    revealedWord: state.revealedWord,
    error: state.error,
    isHost: state.isHost,
    messages: state.messages,
    settings: state.settings,
    createRoom,
    joinRoom,
    startGame,
    makeGuess,
    drawStroke,
    undoStroke,
    clearCanvas,
    leaveRoom,
    sendChat,
    updateSettings,
  };
}

export type { ChatMessage };
