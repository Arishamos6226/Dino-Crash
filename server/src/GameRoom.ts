import { Server, Socket } from 'socket.io';
import { PlayerInput, GameStartPayload, PlayerInputPayload, GameOverPayload, OpponentInputPayload, PlayerCrashPayload, PlaceBetPayload, BetResponsePayload } from '../../shared/network-types';

type GameState = 'WAITING' | 'RUNNING' | 'FINISHED';

export class GameRoom {
  private roomId: string;
  private player1: Socket;
  private player2: Socket;
  private seed: number;
  private gameState: GameState = 'WAITING';
  private player1Alive: boolean = true;
  private player2Alive: boolean = true;
  private player1Score: number = 0;
  private player2Score: number = 0;
  private player1Bet: number = 0;
  private player2Bet: number = 0;
  private player1BetPlaced: boolean = false;
  private player2BetPlaced: boolean = false;
  private player1GameReady: boolean = false;
  private player2GameReady: boolean = false;
  private io: Server;

  constructor(io: Server, player1: Socket, player2: Socket) {
    this.io = io;
    this.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.player1 = player1;
    this.player2 = player2;
    this.seed = Math.floor(Math.random() * 1000000);

    // Join room
    player1.join(this.roomId);
    player2.join(this.roomId);

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Player1 = challenger (sets the bet)
    this.player1.on('place_bet', (payload: PlaceBetPayload) => {
      this.player1Bet = payload.betAmount;
      this.player1BetPlaced = true;
      // Send challenge to player2
      this.player2.emit('bet_challenge', { betAmount: payload.betAmount });
    });

    // Player2 = challenged (accepts or declines)
    this.player2.on('bet_response', (payload: BetResponsePayload) => {
      if (!payload.accepted) {
        this.io.to(this.roomId).emit('bet_declined');
        return;
      }
      this.player2Bet = this.player1Bet;
      this.player2BetPlaced = true;
      this.io.to(this.roomId).emit('both_players_ready', { betAmount: this.player1Bet });
      this.start();
    });

    this.player1.on('player_state', (payload: { state: unknown }) => {
      this.player2.emit('opponent_state', { state: payload.state });
    });

    this.player2.on('player_state', (payload: { state: unknown }) => {
      this.player1.emit('opponent_state', { state: payload.state });
    });

    // Both clients send 'player_game_ready' once they've mounted the game screen.
    // Only when BOTH are ready do we emit 'game_start_now' — this guarantees both
    // engines start at the same wall-clock moment regardless of clock skew or
    // navigation time differences.
    this.player1.on('player_game_ready', () => {
      this.player1GameReady = true;
      if (this.player2GameReady) {
        this.io.to(this.roomId).emit('game_start_now');
      }
    });

    this.player2.on('player_game_ready', () => {
      this.player2GameReady = true;
      if (this.player1GameReady) {
        this.io.to(this.roomId).emit('game_start_now');
      }
    });

    this.player1.on('player_input', (payload: PlayerInputPayload) => {
      this.handleInput('player1', payload.input);
    });

    this.player1.on('player_crash', (payload: PlayerCrashPayload) => {
      this.handleCrash('player1', payload.timestamp, payload.score);
    });

    this.player1.on('disconnect', () => {
      this.handleDisconnect('player1');
    });

    this.player2.on('player_input', (payload: PlayerInputPayload) => {
      this.handleInput('player2', payload.input);
    });

    this.player2.on('player_crash', (payload: PlayerCrashPayload) => {
      this.handleCrash('player2', payload.timestamp, payload.score);
    });

    this.player2.on('disconnect', () => {
      this.handleDisconnect('player2');
    });
  }

  start() {
    this.gameState = 'RUNNING';

    const payload1: GameStartPayload = {
      roomId: this.roomId,
      seed: this.seed,
      playerId: 'player1',
      opponentId: 'player2',
      player1Bet: this.player1Bet,
      player2Bet: this.player2Bet
    };
    this.player1.emit('game_start', payload1);

    const payload2: GameStartPayload = {
      roomId: this.roomId,
      seed: this.seed,
      playerId: 'player2',
      opponentId: 'player1',
      player1Bet: this.player1Bet,
      player2Bet: this.player2Bet
    };
    this.player2.emit('game_start', payload2);
  }

  private handleInput(playerId: 'player1' | 'player2', input: PlayerInput) {
    if (this.gameState !== 'RUNNING') return;

    // Broadcast to opponent
    const opponentPayload: OpponentInputPayload = {
      input,
      timestamp: Date.now()
    };

    if (playerId === 'player1') {
      this.player2.emit('opponent_input', opponentPayload);
    } else if (playerId === 'player2') {
      this.player1.emit('opponent_input', opponentPayload);
    }
  }

  private handleCrash(playerId: 'player1' | 'player2', timestamp: number, score: number) {
    if (this.gameState !== 'RUNNING') return;

    if (playerId === 'player1') {
      this.player1Alive = false;
      this.player1Score = score;
    } else {
      this.player2Alive = false;
      this.player2Score = score;
    }

    if (!this.player1Alive && !this.player2Alive) {
      this.endGame('CRASH');
    }
  }

  private handleDisconnect(playerId: 'player1' | 'player2') {
    if (this.gameState === 'FINISHED') return;

    if (playerId === 'player1') {
      this.player1Alive = false;
    } else {
      this.player2Alive = false;
    }

    this.endGame('DISCONNECT');
  }

  private endGame(reason: 'CRASH' | 'DISCONNECT') {
    this.gameState = 'FINISHED';

    const winnerId = this.determineWinner();
    const gameOverPayload: GameOverPayload = {
      winnerId,
      player1Score: this.player1Score,
      player2Score: this.player2Score,
      reason
    };

    this.io.to(this.roomId).emit('game_over', gameOverPayload);

    setTimeout(() => this.cleanup(), 5000);
  }

  private determineWinner(): 'player1' | 'player2' {
    if (!this.player1Alive && !this.player2Alive) {
      return this.player1Score >= this.player2Score ? 'player1' : 'player2';
    }
    return !this.player1Alive ? 'player2' : 'player1';
  }

  cleanup() {
    // Remove all listeners
    this.player1.removeAllListeners('place_bet');
    this.player1.removeAllListeners('player_game_ready');
    this.player1.removeAllListeners('player_state');
    this.player1.removeAllListeners('player_input');
    this.player1.removeAllListeners('player_crash');
    this.player1.removeAllListeners('disconnect');

    this.player2.removeAllListeners('bet_response');
    this.player2.removeAllListeners('player_game_ready');
    this.player2.removeAllListeners('player_state');
    this.player2.removeAllListeners('player_input');
    this.player2.removeAllListeners('player_crash');
    this.player2.removeAllListeners('disconnect');

    // Leave room
    this.player1.leave(this.roomId);
    this.player2.leave(this.roomId);
  }

  getRoomId(): string {
    return this.roomId;
  }

  getGameState(): GameState {
    return this.gameState;
  }
}
