import io, { Socket } from 'socket.io-client';
import {
  GameMode,
  PlayerInput,
  GameStartPayload,
  GameOverPayload,
  OpponentInputPayload,
  FindMatchPayload,
  PlayerCrashPayload,
  PlaceBetPayload
} from '../../shared/network-types';

class NetworkManager {
  private static instance: NetworkManager;
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private connected: boolean = false;

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected && this.socket) {
        resolve();
        return;
      }

      this.socket = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
      });
    });
  }

  findMatch(gameMode: GameMode, onGameStart: (payload: GameStartPayload) => void) {
    if (!this.socket) {
      throw new Error('Not connected to server');
    }

    const payload: FindMatchPayload = { gameMode };
    this.socket.emit('find_match', payload);

    this.socket.once('game_start', (payload: GameStartPayload) => {
      this.roomId = payload.roomId;
      onGameStart(payload);
    });
  }

  sendInput(input: PlayerInput) {
    if (!this.socket || !this.roomId) return;

    this.socket.emit('player_input', {
      roomId: this.roomId,
      input,
      timestamp: Date.now()
    });
  }

  sendCrash(score: number) {
    if (!this.socket || !this.roomId) return;

    const payload: PlayerCrashPayload = {
      roomId: this.roomId,
      playerId: 'player1',
      timestamp: Date.now(),
      score
    };

    this.socket.emit('player_crash', payload);
  }

  onOpponentInput(callback: (payload: OpponentInputPayload) => void) {
    if (!this.socket) return;
    this.socket.on('opponent_input', callback);
  }

  onGameOver(callback: (payload: GameOverPayload) => void) {
    if (!this.socket) return;
    this.socket.on('game_over', callback);
  }

  onMatchmakingStatus(callback: (status: { status: string }) => void) {
    if (!this.socket) return;
    this.socket.on('matchmaking_status', callback);
  }

  placeBet(roomId: string, betAmount: number) {
    if (!this.socket) return;

    const payload: PlaceBetPayload = {
      roomId,
      playerId: 'player1',
      betAmount
    };

    this.socket.emit('place_bet', payload);
  }

  onBothPlayersReady(callback: () => void) {
    if (!this.socket) return;
    this.socket.once('both_players_ready', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export default NetworkManager;
