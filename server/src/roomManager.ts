import { v4 as uuidv4 } from 'uuid';
import { GameState, DEFAULT_ROOM_SETTINGS, RoomSettings } from '@doodledash/shared';
import { ConnectedPlayer, GameRoom } from './types';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map();

  createRoom(
    hostSocketId: string,
    nickname: string,
    settings?: Partial<RoomSettings>
  ): GameRoom {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const mergedSettings: RoomSettings = {
      ...DEFAULT_ROOM_SETTINGS,
      ...settings,
    };

    const playerId = uuidv4();

    const player: ConnectedPlayer = {
      id: playerId,
      nickname,
      score: 0,
      isHost: true,
      isConnected: true,
      socketId: hostSocketId,
    };

    const players = new Map<string, ConnectedPlayer>();
    players.set(playerId, player);

    const totalRounds = players.size * mergedSettings.roundsPerPlayer;

    const room: GameRoom = {
      code,
      players,
      hostId: playerId,
      settings: mergedSettings,
      state: GameState.LOBBY,
      currentRound: 0,
      totalRounds,
      doodlerId: null,
      secretWord: null,
      wordCategory: null,
      roundStartTime: null,
      timer: null,
      tickInterval: null,
      strokes: [],
      guessedPlayers: new Set(),
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(roomCode: string, socketId: string, nickname: string): GameRoom {
    const room = this.getRoom(roomCode);
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.state !== GameState.LOBBY) {
      throw new Error('Game already in progress');
    }

    if (room.players.size >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = uuidv4();

    const player: ConnectedPlayer = {
      id: playerId,
      nickname,
      score: 0,
      isHost: false,
      isConnected: true,
      socketId,
    };

    room.players.set(playerId, player);
    room.totalRounds = room.players.size * room.settings.roundsPerPlayer;

    return room;
  }

  leaveRoom(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    room.players.delete(playerId);

    // Reassign host if the leaving player was the host
    if (room.hostId === playerId && room.players.size > 0) {
      const firstPlayer = room.players.values().next().value;
      if (firstPlayer) {
        firstPlayer.isHost = true;
        room.hostId = firstPlayer.id;
      }
    }

    // Update total rounds
    room.totalRounds = room.players.size * room.settings.roundsPerPlayer;

    // Destroy room if empty
    if (room.players.size === 0) {
      // Clear any running timer
      if (room.timer) {
        clearTimeout(room.timer);
        room.timer = null;
      }
      this.rooms.delete(roomCode);
    }
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
  }

  getRoomBySocket(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return room;
        }
      }
    }
    return undefined;
  }

  getPlayerInRoom(roomCode: string, playerId: string): ConnectedPlayer | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;
    return room.players.get(playerId);
  }

  getPlayerBySocket(socketId: string): { room: GameRoom; player: ConnectedPlayer } | undefined {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { room, player };
        }
      }
    }
    return undefined;
  }
}
