/**
 * Shared types for client-server communication
 */

export enum GameMode {
  SOLO = 'SOLO',
  VS_BOT = 'VS_BOT',
  VS_ONLINE = 'VS_ONLINE'
}

export enum PlayerInput {
  JUMP = 'JUMP',
  DUCK_START = 'DUCK_START',
  DUCK_END = 'DUCK_END'
}

export interface FindMatchPayload {
  gameMode: GameMode;
}

export interface GameStartPayload {
  roomId: string;
  seed: number;
  playerId: 'player1' | 'player2';
  opponentId: string;
  isBot: boolean;
}

export interface PlayerInputPayload {
  roomId: string;
  playerId: 'player1' | 'player2';
  input: PlayerInput;
  timestamp: number;
}

export interface PlayerCrashPayload {
  roomId: string;
  playerId: 'player1' | 'player2';
  timestamp: number;
}

export interface GameOverPayload {
  winnerId: 'player1' | 'player2';
  player1Score: number;
  player2Score: number;
  reason: 'CRASH' | 'DISCONNECT';
}

export interface OpponentInputPayload {
  input: PlayerInput;
  timestamp: number;
}
