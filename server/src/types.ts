import { Player, DrawStroke, RoomSettings, GameState } from '@doodledash/shared';
import { Server, Socket } from 'socket.io';

export interface ConnectedPlayer extends Player {
  socketId: string;
}

export interface GameRoom {
  code: string;
  players: Map<string, ConnectedPlayer>;
  hostId: string;
  settings: RoomSettings;
  state: GameState;
  currentRound: number;
  totalRounds: number;
  doodlerId: string | null;
  secretWord: string | null;
  wordCategory: string | null;
  roundStartTime: number | null;
  timer: NodeJS.Timeout | null;
  tickInterval: NodeJS.Timeout | null;
  strokes: DrawStroke[];
  guessedPlayers: Set<string>;
}
