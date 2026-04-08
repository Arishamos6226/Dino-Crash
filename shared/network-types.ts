export enum GameMode {
  SOLO = 'SOLO',
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
  player1Bet?: number;
  player2Bet?: number;
}

export interface PlaceBetPayload {
  roomId: string;
  playerId: 'player1' | 'player2';
  betAmount: number;
}

export interface BetChallengePayload {
  betAmount: number;
}

export interface BetResponsePayload {
  roomId: string;
  accepted: boolean;
}

export interface BothPlayersReadyPayload {
  betAmount: number;
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
  score: number;
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

export interface PlayerStatePayload {
  roomId: string;
  playerId: 'player1' | 'player2';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
}
