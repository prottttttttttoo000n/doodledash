// Player states
export interface Player {
  id: string;
  nickname: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
}

// Room settings
export interface RoomSettings {
  maxPlayers: number;
  roundsPerPlayer: number;
  drawTime: number; // seconds
  wordCategories: string[];
}

// Room state
export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  settings: RoomSettings;
  state: GameState;
}

// Game state enum
export enum GameState {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  ROUND_END = 'round_end',
  GAME_OVER = 'game_over',
}

// Round state
export interface RoundState {
  roundNumber: number;
  doodlerId: string;
  secretWord: string;
  wordCategory: string;
  wordLength: number;
  startTime: number;
  endTime: number;
  guesses: PlayerGuess[];
}

export interface PlayerGuess {
  playerId: string;
  word: string;
  isCorrect: boolean;
  timestamp: number;
}

// Drawing stroke
export interface DrawPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  size: number;
}

// Socket event payloads
export interface ServerEvents {
  room_created: { roomCode: string; playerId: string };
  room_joined: { room: Room; playerId: string };
  player_joined: { player: Player };
  player_left: { playerId: string };
  room_destroyed: {};
  game_started: { players: Player[]; rounds: number };
  round_started: { doodlerId: string; wordLength: number; category: string; roundNumber: number };
  secret_word: { word: string };
  draw_stroke: { stroke: DrawStroke };
  undo_stroke: {};
  clear_canvas: {};
  correct_guess: { playerId: string; nickname: string; score: number; totalScore: number };
  round_ended: { word: string; scores: { playerId: string; score: number }[] };
  game_ended: { leaderboard: (Player & { rank: number })[] };
  timer_tick: { secondsLeft: number };
  error: { message: string };
}

export interface ClientEvents {
  create_room: { nickname: string; settings?: Partial<RoomSettings> };
  join_room: { roomCode: string; nickname: string };
  start_game: {};
  draw_stroke: { stroke: DrawStroke };
  undo_stroke: {};
  clear_canvas: {};
  make_guess: { word: string };
  leave_room: {};
}

// Response types
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  roundsPerPlayer: 2,
  drawTime: 60,
  wordCategories: ['animals', 'objects', 'food', 'actions', 'places'],
};
