import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager';
import { GameManager } from './gameManager';
import { RoomSettings, Player } from '@doodledash/shared';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const roomManager = new RoomManager();
const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`[connect] Socket ${socket.id} connected`);

  // ── create_room ──────────────────────────────────────────────
  socket.on('create_room', (data: { nickname: string; settings?: Partial<RoomSettings> }) => {
    try {
      const nickname = data.nickname?.trim();
      if (!nickname || nickname.length < 1 || nickname.length > 20) {
        socket.emit('error', { message: 'Nickname must be between 1 and 20 characters' });
        return;
      }

      const room = roomManager.createRoom(socket.id, nickname, data.settings);
      socket.join(room.code);

      socket.emit('room_created', {
        roomCode: room.code,
        playerId: room.hostId,
      });

      const players: Player[] = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
        isConnected: p.isConnected,
      }));

      socket.emit('room_joined', {
        room: {
          code: room.code,
          players,
          hostId: room.hostId,
          settings: room.settings,
          state: room.state,
        },
        playerId: room.hostId,
      });

      console.log(`[create_room] Room ${room.code} created by ${nickname}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create room';
      socket.emit('error', { message });
    }
  });

  // ── join_room ────────────────────────────────────────────────
  socket.on('join_room', (data: { roomCode: string; nickname: string }) => {
    try {
      const roomCode = data.roomCode?.toUpperCase().trim();
      const nickname = data.nickname?.trim();

      if (!roomCode || roomCode.length !== 6) {
        socket.emit('error', { message: 'Invalid room code' });
        return;
      }

      if (!nickname || nickname.length < 1 || nickname.length > 20) {
        socket.emit('error', { message: 'Nickname must be between 1 and 20 characters' });
        return;
      }

      const room = roomManager.joinRoom(roomCode, socket.id, nickname);
      socket.join(roomCode);

      // Find the newly added player
      let joinedPlayer: { id: string; nickname: string; score: number; isHost: boolean; isConnected: boolean } | undefined;
      for (const [id, p] of room.players) {
        if (p.socketId === socket.id) {
          joinedPlayer = {
            id: p.id,
            nickname: p.nickname,
            score: p.score,
            isHost: p.isHost,
            isConnected: p.isConnected,
          };
          break;
        }
      }

      if (!joinedPlayer) {
        socket.emit('error', { message: 'Failed to join room' });
        return;
      }

      const players: Player[] = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
        isConnected: p.isConnected,
      }));

      socket.emit('room_joined', {
        room: {
          code: room.code,
          players,
          hostId: room.hostId,
          settings: room.settings,
          state: room.state,
        },
        playerId: joinedPlayer.id,
      });

      // Broadcast to other players in room
      socket.to(roomCode).emit('player_joined', {
        player: joinedPlayer,
      });

      console.log(`[join_room] ${nickname} joined room ${roomCode}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      socket.emit('error', { message });
    }
  });

  // ── start_game ───────────────────────────────────────────────
  socket.on('start_game', () => {
    try {
      const result = roomManager.getPlayerBySocket(socket.id);
      if (!result) {
        socket.emit('error', { message: 'You are not in a room' });
        return;
      }

      const { room, player } = result;

      if (player.id !== room.hostId) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      if (room.players.size < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      gameManager.startGame(room);
      console.log(`[start_game] Game started in room ${room.code}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start game';
      socket.emit('error', { message });
    }
  });

  // ── draw_stroke ──────────────────────────────────────────────
  socket.on(
    'draw_stroke',
    (data: { stroke: { points: { x: number; y: number; pressure?: number }[]; color: string; size: number } }) => {
      try {
        const result = roomManager.getPlayerBySocket(socket.id);
        if (!result) return;

        const { room, player } = result;

        // Only the doodler can draw
        if (player.id !== room.doodlerId) return;
        if (room.state !== 'playing') return;

        const stroke = {
          points: data.stroke.points,
          color: data.stroke.color,
          size: data.stroke.size,
        };

        gameManager.addStroke(room, stroke);

        // Broadcast to everyone except the doodler
        socket.to(room.code).emit('draw_stroke', { stroke });
      } catch {
        // Silently fail for drawing errors
      }
    }
  );

  // ── undo_stroke ──────────────────────────────────────────────
  socket.on('undo_stroke', () => {
    try {
      const result = roomManager.getPlayerBySocket(socket.id);
      if (!result) return;

      const { room, player } = result;

      if (player.id !== room.doodlerId) return;
      if (room.state !== 'playing') return;

      gameManager.undoStroke(room);
      socket.to(room.code).emit('undo_stroke', {});
    } catch {
      // Silently fail
    }
  });

  // ── clear_canvas ─────────────────────────────────────────────
  socket.on('clear_canvas', () => {
    try {
      const result = roomManager.getPlayerBySocket(socket.id);
      if (!result) return;

      const { room, player } = result;

      if (player.id !== room.doodlerId) return;
      if (room.state !== 'playing') return;

      gameManager.clearCanvas(room);
      socket.to(room.code).emit('clear_canvas', {});
    } catch {
      // Silently fail
    }
  });

  // ── make_guess ───────────────────────────────────────────────
  socket.on('make_guess', (data: { word: string }) => {
    try {
      const result = roomManager.getPlayerBySocket(socket.id);
      if (!result) {
        socket.emit('error', { message: 'You are not in a room' });
        return;
      }

      const { room, player } = result;

      if (!data.word || data.word.trim().length === 0) {
        socket.emit('error', { message: 'Guess cannot be empty' });
        return;
      }

      const guessResult = gameManager.handleGuess(room, player.id, data.word);

      if (guessResult.correct && guessResult.score !== undefined) {
        // Emit correct guess to entire room (so everyone sees who got it)
        socket.to(room.code).emit('correct_guess', {
          playerId: player.id,
          nickname: player.nickname,
          score: guessResult.score,
          totalScore: player.score,
        });

        // Also tell the guesser they were correct
        socket.emit('correct_guess', {
          playerId: player.id,
          nickname: player.nickname,
          score: guessResult.score,
          totalScore: player.score,
        });
      }
    } catch {
      socket.emit('error', { message: 'Failed to process guess' });
    }
  });

  // ── leave_room ───────────────────────────────────────────────
  socket.on('leave_room', () => {
    handleDisconnect(socket);
  });

  // ── disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    handleDisconnect(socket);
  });
});

function handleDisconnect(socket: Socket): void {
  const result = roomManager.getPlayerBySocket(socket.id);
  if (!result) return;

  const { room, player } = result;
  const roomCode = room.code;
  const playerId = player.id;

  console.log(`[disconnect] ${player.nickname} (${socket.id}) leaving room ${roomCode}`);

  // Check if game is in progress and the disconnecting player is the doodler
  const wasDoodler = room.doodlerId === playerId;
  const wasPlaying = room.state === 'playing';

  roomManager.leaveRoom(roomCode, playerId);
  socket.leave(roomCode);

  // Broadcast to remaining players
  socket.to(roomCode).emit('player_left', { playerId });

  // If the room still exists, check if we need to handle doodler disconnect
  const updatedRoom = roomManager.getRoom(roomCode);
  if (updatedRoom && wasDoodler && wasPlaying) {
    // End the round early since the doodler left
    gameManager.endRound(updatedRoom);
  }

  // If room was destroyed
  if (!updatedRoom) {
    io.to(roomCode).emit('room_destroyed', {});
    console.log(`[disconnect] Room ${roomCode} destroyed (no players left)`);
  }
}

httpServer.listen(PORT, () => {
  console.log(`🎨 DoodleDash server running on http://localhost:${PORT}`);
  console.log(`   WebSocket server ready for connections`);
});
