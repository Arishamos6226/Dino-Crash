import { Server, Socket } from 'socket.io';
import { PlayerInput, GameStartPayload, PlayerInputPayload, GameOverPayload, OpponentInputPayload, PlayerCrashPayload } from '../../shared/network-types';
import { BotAI } from './BotAI';

type GameState = 'WAITING' | 'RUNNING' | 'FINISHED';

export class GameRoom {
  private roomId: string;
  private player1: Socket;
  private player2: Socket | null;
  private isBot: boolean;
  private bot: BotAI | null = null;
  private botInterval: NodeJS.Timeout | null = null;
  private seed: number;
  private gameState: GameState = 'WAITING';
  private player1Alive: boolean = true;
  private player2Alive: boolean = true;
  private player1Score: number = 0;
  private player2Score: number = 0;
  private io: Server;

  constructor(io: Server, player1: Socket, player2: Socket | null = null) {
    this.io = io;
    this.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.player1 = player1;
    this.player2 = player2;
    this.isBot = player2 === null;
    this.seed = Math.floor(Math.random() * 1000000);

    if (this.isBot) {
      this.bot = new BotAI();
    }

    // Join room
    player1.join(this.roomId);
    if (player2) {
      player2.join(this.roomId);
    }

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Player 1 handlers
    this.player1.on('player_input', (payload: PlayerInputPayload) => {
      this.handleInput('player1', payload.input);
    });

    this.player1.on('player_crash', (payload: PlayerCrashPayload) => {
      this.handleCrash('player1', payload.timestamp);
    });

    this.player1.on('disconnect', () => {
      this.handleDisconnect('player1');
    });

    // Player 2 handlers (if not bot)
    if (this.player2) {
      this.player2.on('player_input', (payload: PlayerInputPayload) => {
        this.handleInput('player2', payload.input);
      });

      this.player2.on('player_crash', (payload: PlayerCrashPayload) => {
        this.handleCrash('player2', payload.timestamp);
      });

      this.player2.on('disconnect', () => {
        this.handleDisconnect('player2');
      });
    }
  }

  start() {
    this.gameState = 'RUNNING';

    // Send game start to player 1
    const payload1: GameStartPayload = {
      roomId: this.roomId,
      seed: this.seed,
      playerId: 'player1',
      opponentId: this.isBot ? 'BOT' : 'player2',
      isBot: this.isBot
    };
    this.player1.emit('game_start', payload1);

    // Send game start to player 2 (if not bot)
    if (this.player2) {
      const payload2: GameStartPayload = {
        roomId: this.roomId,
        seed: this.seed,
        playerId: 'player2',
        opponentId: 'player1',
        isBot: false
      };
      this.player2.emit('game_start', payload2);
    }

    // Start bot AI if bot mode
    if (this.isBot && this.bot) {
      this.startBotAI();
    }
  }

  private startBotAI() {
    if (!this.bot) return;

    // Bot makes decisions every 200-400ms
    const interval = 200 + Math.random() * 200;
    this.botInterval = setInterval(() => {
      if (this.gameState !== 'RUNNING' || !this.player2Alive) {
        if (this.botInterval) {
          clearInterval(this.botInterval);
        }
        return;
      }

      const action = this.bot!.generateAction();
      if (action) {
        // Simulate bot input with delay
        setTimeout(() => {
          this.handleInput('player2', action);
        }, this.bot!.getReactionDelay());
      }
    }, interval);
  }

  private handleInput(playerId: 'player1' | 'player2', input: PlayerInput) {
    if (this.gameState !== 'RUNNING') return;

    // Broadcast to opponent
    const opponentPayload: OpponentInputPayload = {
      input,
      timestamp: Date.now()
    };

    if (playerId === 'player1' && this.player2) {
      this.player2.emit('opponent_input', opponentPayload);
    } else if (playerId === 'player2') {
      this.player1.emit('opponent_input', opponentPayload);
    }
  }

  private handleCrash(playerId: 'player1' | 'player2', timestamp: number) {
    if (this.gameState !== 'RUNNING') return;

    if (playerId === 'player1') {
      this.player1Alive = false;
    } else {
      this.player2Alive = false;
    }

    // Check if game is over (at least one player crashed)
    if (!this.player1Alive || !this.player2Alive) {
      this.endGame('CRASH');
    }
  }

  private handleDisconnect(playerId: 'player1' | 'player2') {
    if (this.gameState === 'FINISHED') return;

    // Disconnect means automatic loss
    if (playerId === 'player1') {
      this.player1Alive = false;
    } else {
      this.player2Alive = false;
    }

    this.endGame('DISCONNECT');
  }

  private endGame(reason: 'CRASH' | 'DISCONNECT') {
    this.gameState = 'FINISHED';

    // Stop bot AI
    if (this.botInterval) {
      clearInterval(this.botInterval);
    }

    // Determine winner
    let winnerId: 'player1' | 'player2';

    if (!this.player1Alive && !this.player2Alive) {
      // Both crashed - higher score wins (or draw)
      winnerId = this.player1Score >= this.player2Score ? 'player1' : 'player2';
    } else if (!this.player1Alive) {
      winnerId = 'player2';
    } else {
      winnerId = 'player1';
    }

    const gameOverPayload: GameOverPayload = {
      winnerId,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      reason
    };

    // Broadcast to all players in room
    this.io.to(this.roomId).emit('game_over', gameOverPayload);

    // Clean up after 5 seconds
    setTimeout(() => {
      this.cleanup();
    }, 5000);
  }

  cleanup() {
    // Remove all listeners
    this.player1.removeAllListeners('player_input');
    this.player1.removeAllListeners('player_crash');
    this.player1.removeAllListeners('disconnect');

    if (this.player2) {
      this.player2.removeAllListeners('player_input');
      this.player2.removeAllListeners('player_crash');
      this.player2.removeAllListeners('disconnect');
    }

    // Leave room
    this.player1.leave(this.roomId);
    if (this.player2) {
      this.player2.leave(this.roomId);
    }

    if (this.botInterval) {
      clearInterval(this.botInterval);
    }
  }

  getRoomId(): string {
    return this.roomId;
  }

  getGameState(): GameState {
    return this.gameState;
  }
}
