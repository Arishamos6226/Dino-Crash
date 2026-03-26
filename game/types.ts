import type { GameState, ObstacleType, DinoStatus } from './constants';

// Collision box definition
export interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Dino state
export interface DinoState {
  x: number;
  y: number;
  velocityY: number;
  status: DinoStatus;
  isDucking: boolean;
  isJumping: boolean;
  currentFrame: number;
}

// Obstacle state
export interface ObstacleState {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number; // For different sprite variations
  currentFrame: number; // For animated obstacles like pterodactyl
}

// Cloud state
export interface CloudState {
  id: number;
  x: number;
  y: number;
}

// Complete game state for rendering
export interface RenderState {
  gameState: GameState;
  dino: DinoState;
  obstacles: ObstacleState[];
  clouds: CloudState[];
  score: number;
  highScore: number;
  distance: number;
  isNightMode: boolean;
  nightModeFade: number; // 0-1 for fade transition
}
