import { Agent, callable, getCurrentAgent } from 'agents';
import type { Connection, ConnectionContext } from 'agents';
import {
  Player,
  RoomSettings,
  DrawStroke,
  DEFAULT_ROOM_SETTINGS,
} from '@doodledash/shared';
import { GameRoomState, ConnectedPlayer, Env } from './types';
import { getRandomWord } from './wordService';
import { calculateGuessScore, calculateDoodlerScore } from './scoring';

/**
 * GameRoom Agent — one instance per game room.
 *
 * The agent instance name (this.ctx.id.name) IS the room code.
 * Clients connect via WebSocket to /agents/GameRoom/{roomCode}
 * and then invoke @callable() methods over the WS connection.
 *
 * Design decisions:
 * - secretWord is stored PRIVATELY (class field) not in state, so
 *   setState() never broadcasts it to non-doodler clients.
 * - Round timers use this.schedule() which wraps DO alarms.
 * - Connection → playerId mapping is in-memory only; on DO eviction
 *   the room is effectively lost (acceptable for a casual game).
 */
export class GameRoom extends Agent<Env, GameRoomState> {
  // ── Private (non-synced) state ──────────────────────────────

  /** The secret word for the current round — NEVER in synced state. */
  #secretWord: string | null = null;

  /** Timestamp (ms) when the current round started, for score calculation. */
  #roundStartTime: number = 0;

  /** Maps WebSocket connection.id → playerId. */
  #connToPlayer = new Map<string, string>();

  /** Maps playerId → connection.id. */
  #playerToConn = new Map<string, string>();

  // ── Synced state (broadcast to all clients on every setState) ─

  readonly initialState: GameRoomState = {
    phase: 'lobby',
    players: [],
    hostId: '',
    settings: { ...DEFAULT_ROOM_SETTINGS },
    currentRound: 0,
    totalRounds: 0,
    doodlerId: null,
    wordCategory: null,
    wordLength: 0,
    drawTime: 60,
    strokes: [],
    guessedPlayerIds: [],
    roundScores: [],
    leaderboard: null,
    revealedWord: null,
    error: null,
    roomCode: '',
    playerIdCounter: 0,
  };

  // ═══════════════════════════════════════════════════════════════
  // CONNECTION LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  onConnect(connection: Connection, _ctx: ConnectionContext): void {
    // Connection is established. The client will identify via
    // createRoom() or joinRoom() shortly after connecting.
  }

  onClose(connection: Connection, _code: number, _reason: string, _wasClean: boolean): void {
    this.#handleDisconnect(connection);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE VALIDATION
  // ═══════════════════════════════════════════════════════════════

  validateStateChange(_nextState: GameRoomState, _source: Connection | 'server'): void {
    // No generic cross-cutting rules needed. Each @callable method validates
    // its own preconditions before calling setState.
  }

  // ═══════════════════════════════════════════════════════════════
  // CALLABLE RPC METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Throws if getCurrentAgent() does not provide a connection.
   * All @callable() methods must call this first.
   */
  #getCaller(): Connection {
    const { connection } = getCurrentAgent();
    if (!connection) {
      throw new Error('No WebSocket connection context');
    }
    return connection;
  }

  /**
   * Create a new room. The caller becomes the host.
   * Room must be empty (no players yet) — enforced server-side.
   */
  @callable()
  async createRoom(nickname: string, settings?: Partial<RoomSettings>): Promise<{ playerId: string }> {
    const connection = this.#getCaller();

    if (this.state.players.length > 0) {
      throw new Error('Room already exists');
    }

    const playerId = crypto.randomUUID();
    const mergedSettings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS, ...settings };

    const player: ConnectedPlayer = {
      id: playerId,
      nickname,
      score: 0,
      isHost: true,
      isConnected: true,
      connectionId: connection.id,
    };

    this.#connToPlayer.set(connection.id, playerId);
    this.#playerToConn.set(playerId, connection.id);

    this.setState({
      ...this.state,
      phase: 'lobby',
      players: [player],
      hostId: playerId,
      settings: mergedSettings,
      roomCode: this.ctx.id.name ?? '',
      currentRound: 0,
      totalRounds: mergedSettings.roundsPerPlayer,
      playerIdCounter: 1,
    });

    return { playerId };
  }

  /**
   * Join an existing room that is in the lobby phase.
   */
  @callable()
  async joinRoom(nickname: string): Promise<{ playerId: string }> {
    const connection = this.#getCaller();

    if (this.state.phase !== 'lobby') {
      throw new Error('Game already in progress');
    }
    if (this.state.players.length >= this.state.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = crypto.randomUUID();

    const player: ConnectedPlayer = {
      id: playerId,
      nickname,
      score: 0,
      isHost: false,
      isConnected: true,
      connectionId: connection.id,
    };

    this.#connToPlayer.set(connection.id, playerId);
    this.#playerToConn.set(playerId, connection.id);

    const updatedPlayers = [...this.state.players, player];

    this.setState({
      ...this.state,
      players: updatedPlayers,
      totalRounds: updatedPlayers.length * this.state.settings.roundsPerPlayer,
      playerIdCounter: this.state.playerIdCounter + 1,
    });

    return { playerId };
  }

  /**
   * Leave the room. If host leaves, reassign. If room empties, reset.
   */
  @callable()
  async leaveRoom(): Promise<void> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);
    if (!playerId) return;

    this.#removePlayer(playerId, connection.id);
  }

  /**
   * Start the game (host only). Must be lobby phase with ≥2 players.
   */
  @callable()
  async startGame(): Promise<void> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (this.state.hostId !== playerId) {
      throw new Error('Only the host can start the game');
    }
    if (this.state.phase !== 'lobby') {
      throw new Error('Game can only be started from the lobby');
    }
    if (this.state.players.length < 2) {
      throw new Error('Need at least 2 players to start');
    }

    // Reset all scores
    const resetPlayers = this.state.players.map((p) => ({ ...p, score: 0 }));

    this.setState({
      ...this.state,
      players: resetPlayers,
      currentRound: 0,
      totalRounds: resetPlayers.length * this.state.settings.roundsPerPlayer,
      strokes: [],
    });

    await this.startRound();
  }

  /**
   * Make a guess. Only non-doodlers in playing phase.
   */
  @callable()
  async makeGuess(word: string): Promise<{ correct: boolean; score?: number }> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (this.state.phase !== 'playing') {
      return { correct: false };
    }
    if (!playerId || playerId === this.state.doodlerId) {
      return { correct: false };
    }
    if (this.state.guessedPlayerIds.includes(playerId)) {
      return { correct: false };
    }

    const secret = this.#secretWord?.toLowerCase() ?? '';
    const guessed = word.toLowerCase().trim();

    if (guessed !== secret) {
      return { correct: false };
    }

    // ── Correct guess ────────────────────────────────────────
    const elapsed = (Date.now() - this.#roundStartTime) / 1000;
    const timeRemaining = Math.max(0, this.state.settings.drawTime - elapsed);
    const score = calculateGuessScore(timeRemaining, this.state.settings.drawTime);

    const updatedGuessed = [...this.state.guessedPlayerIds, playerId];
    const updatedPlayers = this.state.players.map((p) =>
      p.id === playerId ? { ...p, score: p.score + score } : p,
    );

    const nonDoodlerCount = this.state.players.filter(
      (p) => p.id !== this.state.doodlerId,
    ).length;
    const allGuessed = updatedGuessed.length >= nonDoodlerCount;

    this.setState({
      ...this.state,
      players: updatedPlayers,
      guessedPlayerIds: updatedGuessed,
    });

    // If everyone has guessed, end the round after a brief delay
    // so the last guesser sees their confirmation.
    if (allGuessed) {
      await this.schedule(1, 'endRound');
    }

    return { correct: true, score };
  }

  /**
   * Doodler appends a completed stroke to the canvas state.
   */
  @callable()
  async drawStroke(stroke: DrawStroke): Promise<void> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (playerId !== this.state.doodlerId) {
      throw new Error('Only the doodler can draw');
    }
    if (this.state.phase !== 'playing') {
      return;
    }

    this.setState({
      ...this.state,
      strokes: [...this.state.strokes, stroke],
    });
  }

  /**
   * Doodler removes the last stroke.
   */
  @callable()
  async undoStroke(): Promise<void> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (playerId !== this.state.doodlerId) {
      throw new Error('Only the doodler can undo');
    }

    this.setState({
      ...this.state,
      strokes: this.state.strokes.slice(0, -1),
    });
  }

  /**
   * Doodler clears all strokes.
   */
  @callable()
  async clearCanvas(): Promise<void> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (playerId !== this.state.doodlerId) {
      throw new Error('Only the doodler can clear');
    }

    this.setState({
      ...this.state,
      strokes: [],
    });
  }

  /**
   * Retrieve the secret word (doodler only).
   */
  @callable()
  async getSecretWord(): Promise<string | null> {
    const connection = this.#getCaller();
    const playerId = this.#connToPlayer.get(connection.id);

    if (playerId !== this.state.doodlerId) {
      throw new Error('Only the doodler can see the secret word');
    }

    return this.#secretWord;
  }

  // ═══════════════════════════════════════════════════════════════
  // SCHEDULE HANDLERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Called by the DO alarm when a scheduled task fires.
   * The Agents SDK maps schedule(N, "methodName") → this.methodName().
   */
  async endRound(): Promise<void> {
    // Idempotency guard — only end a round that is still live.
    if (this.state.phase !== 'playing') return;

    const { doodlerId, players, guessedPlayerIds } = this.state;

    let updatedPlayers = [...players];

    // Award doodler score based on how many guessers got it right
    if (doodlerId) {
      const totalGuessers = players.filter((p) => p.id !== doodlerId).length;
      const correctCount = guessedPlayerIds.length;
      const doodlerScore = calculateDoodlerScore(correctCount, totalGuessers);

      updatedPlayers = updatedPlayers.map((p) =>
        p.id === doodlerId ? { ...p, score: p.score + doodlerScore } : p,
      );
    }

    const scores = updatedPlayers.map((p) => ({
      playerId: p.id,
      score: p.score,
    }));

    this.setState({
      ...this.state,
      phase: 'round_end',
      players: updatedPlayers,
      roundScores: scores,
      revealedWord: this.#secretWord ?? '',
    });

    // Clear secret word so stale getSecretWord() calls fail closed
    this.#secretWord = null;

    // Decide what happens next
    const maxRounds = players.length * this.state.settings.roundsPerPlayer;
    if (this.state.currentRound >= maxRounds) {
      await this.schedule(5, 'endGame');
    } else {
      await this.schedule(5, 'startRound');
    }
  }

  /**
   * Called via schedule(…) to start the next round.
   * Also called directly from startGame() for the first round.
   */
  async startRound(): Promise<void> {
    // Pick the doodler via round-robin over ALL currently-connected players
    const connected = this.state.players.filter((p) => p.isConnected);
    if (connected.length === 0) return;

    const nextRound = this.state.currentRound + 1;
    const doodlerIndex = (nextRound - 1) % connected.length;
    const doodler = connected[doodlerIndex];

    const { word, category } = getRandomWord();

    // Store secret privately
    this.#secretWord = word;
    this.#roundStartTime = Date.now();

    this.setState({
      ...this.state,
      phase: 'playing',
      currentRound: nextRound,
      doodlerId: doodler.id,
      wordCategory: category,
      wordLength: word.length,
      drawTime: this.state.settings.drawTime,
      strokes: [],
      guessedPlayerIds: [],
      roundScores: [],
      revealedWord: null,
    });

    // Schedule the round timer
    await this.schedule(this.state.settings.drawTime, 'endRound');
  }

  /**
   * Called via schedule(…) when the game is over.
   */
  async endGame(): Promise<void> {
    const leaderboard = [...this.state.players]
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

    this.#secretWord = null;

    this.setState({
      ...this.state,
      phase: 'game_over',
      doodlerId: null,
      strokes: [],
      leaderboard,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Handle WebSocket disconnection.
   * - In lobby: remove the player entirely.
   * - During game: mark as disconnected but keep in game.
   */
  #handleDisconnect(connection: Connection): void {
    const playerId = this.#connToPlayer.get(connection.id);
    if (!playerId) return;

    this.#connToPlayer.delete(connection.id);
    this.#playerToConn.delete(playerId);

    if (this.state.phase === 'lobby') {
      this.#removePlayer(playerId, connection.id);
    } else {
      // Mark as disconnected — they can rejoin (reconnect logic elsewhere)
      const updatedPlayers = this.state.players.map((p) =>
        p.id === playerId ? { ...p, isConnected: false } : p,
      );
      this.setState({ ...this.state, players: updatedPlayers });
    }
  }

  /**
   * Remove a player from the room entirely.
   * Reassigns host if needed. Destroys the room if empty.
   */
  #removePlayer(playerId: string, connectionId: string): void {
    const updatedPlayers = this.state.players.filter((p) => p.id !== playerId);
    this.#connToPlayer.delete(connectionId);
    this.#playerToConn.delete(playerId);

    // Reassign host
    let hostId = this.state.hostId;
    if (hostId === playerId && updatedPlayers.length > 0) {
      updatedPlayers[0] = { ...updatedPlayers[0], isHost: true };
      hostId = updatedPlayers[0].id;
    }

    this.setState({
      ...this.state,
      players: updatedPlayers,
      hostId,
      totalRounds: updatedPlayers.length * this.state.settings.roundsPerPlayer,
    });

    // If the room is now empty the DO will sit idle and eventually
    // be evicted by the runtime; no explicit delete needed.
  }
}
