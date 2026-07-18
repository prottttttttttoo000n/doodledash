import { Server } from 'socket.io';
import {
  GameState,
  Player,
  DrawStroke,
} from '@doodledash/shared';
import { GameRoom } from './types';
import { getRandomWord } from './wordService';
import { calculateGuessScore, calculateDoodlerScore } from './scoring';

export class GameManager {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  startGame(room: GameRoom): void {
    if (room.state !== GameState.LOBBY) {
      throw new Error('Game can only be started from lobby state');
    }

    room.state = GameState.PLAYING;
    room.currentRound = 0;
    room.totalRounds = room.players.size * room.settings.roundsPerPlayer;
    room.strokes = [];

    // Reset all player scores
    for (const player of room.players.values()) {
      player.score = 0;
    }

    const players: Player[] = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      score: p.score,
      isHost: p.isHost,
      isConnected: p.isConnected,
    }));

    this.io.to(room.code).emit('game_started', {
      players,
      rounds: room.totalRounds,
    });

    this.startRound(room);
  }

  startRound(room: GameRoom): void {
    room.currentRound++;
    room.strokes = [];
    room.guessedPlayers = new Set();

    // Select doodler in round-robin fashion
    const playerArray = Array.from(room.players.values());
    const doodlerIndex = (room.currentRound - 1) % playerArray.length;
    const doodler = playerArray[doodlerIndex];
    room.doodlerId = doodler.id;

    // Pick a random word
    const { word, category } = getRandomWord();
    room.secretWord = word;
    room.wordCategory = category;
    room.roundStartTime = Date.now();

    const drawTimeMs = room.settings.drawTime * 1000;

    // Notify all players of the new round
    this.io.to(room.code).emit('round_started', {
      doodlerId: doodler.id,
      wordLength: word.length,
      category,
      roundNumber: room.currentRound,
    });

    // Send the secret word only to the doodler
    const doodlerSocket = doodler.socketId;
    this.io.to(doodlerSocket).emit('secret_word', { word });

    // Start timer ticks
    let secondsLeft = room.settings.drawTime;
    const tickInterval = setInterval(() => {
      secondsLeft--;
      this.io.to(room.code).emit('timer_tick', { secondsLeft });

      if (secondsLeft <= 0) {
        clearInterval(tickInterval);
      }
    }, 1000);

    // End round after draw time
    room.timer = setTimeout(() => {
      clearInterval(tickInterval);
      this.endRound(room);
    }, drawTimeMs);

    // Store interval reference for cleanup
    room.tickInterval = tickInterval;
  }

  handleGuess(
    room: GameRoom,
    playerId: string,
    word: string
  ): { correct: boolean; score?: number } {
    if (room.state !== GameState.PLAYING) {
      return { correct: false };
    }

    // Doodler cannot guess
    if (playerId === room.doodlerId) {
      return { correct: false };
    }

    // Already guessed correctly
    if (room.guessedPlayers.has(playerId)) {
      return { correct: false };
    }

    const secretWord = room.secretWord?.toLowerCase() ?? '';
    const guessedWord = word.toLowerCase().trim();

    if (guessedWord === secretWord) {
      room.guessedPlayers.add(playerId);

      const timeRemaining = room.roundStartTime
        ? Math.max(0, room.settings.drawTime - (Date.now() - room.roundStartTime) / 1000)
        : 0;

      const score = calculateGuessScore(timeRemaining, room.settings.drawTime);

      const player = room.players.get(playerId);
      if (player) {
        player.score += score;
      }

      // Check if all non-doodler players have guessed
      const guesserCount = room.players.size - 1; // excludes doodler
      if (room.guessedPlayers.size >= guesserCount) {
        // Everyone guessed, end round early
        if (room.timer) {
          clearTimeout(room.timer);
          room.timer = null;
        }
        if (room.tickInterval) {
          clearInterval(room.tickInterval);
          room.tickInterval = null;
        }
        // End round after short delay to let last guess process
        setTimeout(() => {
          if (room.state === GameState.PLAYING) {
            this.endRound(room);
          }
        }, 1000);
      }

      return {
        correct: true,
        score,
      };
    }

    return { correct: false };
  }

  endRound(room: GameRoom): void {
    room.state = GameState.ROUND_END;

    // Clear any existing timer
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    if (room.tickInterval) {
      clearInterval(room.tickInterval);
      room.tickInterval = null;
    }

    // Award doodler points
    if (room.doodlerId) {
      const totalGuessers = room.players.size - 1;
      const doodler = room.players.get(room.doodlerId);
      if (doodler) {
        const doodlerScore = calculateDoodlerScore(
          room.guessedPlayers.size,
          totalGuessers
        );
        doodler.score += doodlerScore;
      }
    }

    // Build scores list
    const scores = Array.from(room.players.values()).map((p) => ({
      playerId: p.id,
      score: p.score,
    }));

    this.io.to(room.code).emit('round_ended', {
      word: room.secretWord ?? '',
      scores,
    });

    // Check if there are more rounds
    const playerCount = room.players.size;
    const maxRounds = playerCount * room.settings.roundsPerPlayer;

    if (room.currentRound >= maxRounds) {
      // Wait 5 seconds then end game
      setTimeout(() => {
        this.endGame(room);
      }, 5000);
    } else {
      // Wait 5 seconds then start next round
      setTimeout(() => {
        if (room.players.size > 0) {
          room.state = GameState.PLAYING;
          this.startRound(room);
        }
      }, 5000);
    }
  }

  endGame(room: GameRoom): void {
    room.state = GameState.GAME_OVER;

    // Clear any running timer
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = null;
    }
    if (room.tickInterval) {
      clearInterval(room.tickInterval);
      room.tickInterval = null;
    }

    // Build leaderboard sorted by score descending
    const leaderboard = Array.from(room.players.values())
      .map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        isHost: p.isHost,
        isConnected: p.isConnected,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    this.io.to(room.code).emit('game_ended', { leaderboard });
  }

  addStroke(room: GameRoom, stroke: DrawStroke): void {
    room.strokes.push(stroke);
  }

  undoStroke(room: GameRoom): void {
    room.strokes.pop();
  }

  clearCanvas(room: GameRoom): void {
    room.strokes = [];
  }

  getPlayerOrder(room: GameRoom): string[] {
    return Array.from(room.players.keys());
  }
}
