import type {
  Player,
  RoomSettings,
  DrawStroke,
} from '@doodledash/shared';
export { DEFAULT_ROOM_SETTINGS } from '@doodledash/shared';
export type { Player, RoomSettings, DrawStroke };

export interface ConnectedPlayer extends Player {
  connectionId: string;
}

/**
 * The synced game state broadcast to all connected clients via setState().
 * secretWord is intentionally NOT included here — it's stored as a private
 * field and delivered only to the doodler via a @callable() method.
 */
export interface GameRoomState {
  phase: 'lobby' | 'playing' | 'round_end' | 'game_over';
  players: ConnectedPlayer[];
  hostId: string;
  settings: RoomSettings;
  currentRound: number;
  totalRounds: number;
  doodlerId: string | null;
  wordCategory: string | null;
  wordLength: number;
  drawTime: number;
  strokes: DrawStroke[];
  guessedPlayerIds: string[];
  roundScores: { playerId: string; score: number }[];
  leaderboard: (Player & { rank: number })[] | null;
  revealedWord: string | null;
  error: string | null;
  roomCode: string;
  playerIdCounter: number;
}

export interface Env {
  GameRoom: DurableObjectNamespace;
}
