// Game physics constants (matching original Chrome T-Rex game)
export const PHYSICS = {
  GRAVITY: 0.6,
  INITIAL_JUMP_VELOCITY: -12,
  INITIAL_SPEED: 4, // Reduced from 6 for slower start
  MAX_SPEED: 13,
  ACCELERATION: 0.0008, // Adjusted for better progression
  FPS: 60,
  DROP_VELOCITY: -5, // For ducking
} as const;

// Game dimensions
export const GAME = {
  WIDTH: 600,
  HEIGHT: 150,
  GROUND_HEIGHT: 12,
  FPS: 60,
  CLEAR_TIME: 3000,
} as const;

// Dino character constants
export const DINO = {
  WIDTH: 44,
  HEIGHT: 47,
  WIDTH_DUCK: 59,
  HEIGHT_DUCK: 25,
  START_X_POS: 50,
  INIITAL_JUMP_VELOCITY: -10,
  MAX_JUMP_HEIGHT: 30,
  MIN_JUMP_HEIGHT: 30,
  GROUND_Y_POS: 93, // Position on ground
  SPRITE_WIDTH: 262, // Total sprite sheet width for dino
  COLLISION_BOX: {
    WIDTH: 34,
    HEIGHT: 47,
    OFFSET_X: 5,
    OFFSET_Y: 0,
  },
  COLLISION_BOX_DUCKING: {
    WIDTH: 50,
    HEIGHT: 25,
    OFFSET_X: 5,
    OFFSET_Y: 22,
  },
} as const;

// Obstacle types and constants
export const OBSTACLE = {
  CACTUS_SMALL: {
    WIDTH: 17,
    HEIGHT: 35,
    Y_POS: 103, // Position from bottom (150 - 12 ground - 35 height)
    MULTIPLE_SPEED: 4,
    MIN_GAP: 120,
    MIN_SPEED: 0,
    COLLISION_BOXES: [
      { x: 0, y: 7, width: 3, height: 27 },
      { x: 4, y: 0, width: 6, height: 34 },
      { x: 10, y: 4, width: 7, height: 14 },
    ],
  },
  CACTUS_LARGE: {
    WIDTH: 25,
    HEIGHT: 50,
    Y_POS: 88, // Position from bottom (150 - 12 ground - 50 height)
    MULTIPLE_SPEED: 7,
    MIN_GAP: 120,
    MIN_SPEED: 0,
    COLLISION_BOXES: [
      { x: 0, y: 12, width: 7, height: 38 },
      { x: 8, y: 0, width: 7, height: 49 },
      { x: 13, y: 10, width: 10, height: 38 },
    ],
  },
  PTERODACTYL: {
    WIDTH: 46,
    HEIGHT: 40,
    Y_POS: [100, 75, 50], // Three different flying heights from bottom
    Y_POS_OFFSET: [0, 25, 50],
    MULTIPLE_SPEED: 999,
    MIN_GAP: 200,
    MIN_SPEED: 7.0, // Birds appear earlier in the game (was 9.0)
    NUM_FRAMES: 2,
    FRAME_RATE: 1000 / 6, // 6 FPS wing flapping
    COLLISION_BOXES: [
      { x: 15, y: 15, width: 16, height: 5 },
      { x: 18, y: 21, width: 24, height: 6 },
      { x: 2, y: 25, width: 14, height: 8 },
      { x: 6, y: 31, width: 12, height: 4 },
    ],
  },
  MAX_OBSTACLE_LENGTH: 3, // Maximum obstacles that can appear consecutively
  MAX_GAP_COEFFICIENT: 1.5,
  MIN_GAP_COEFFICIENT: 0.6,
  GAP_COEFFICIENT: 0.6,
} as const;

// Cloud constants
export const CLOUD = {
  WIDTH: 46,
  HEIGHT: 14,
  MIN_CLOUD_GAP: 100,
  MAX_CLOUD_GAP: 400,
  MIN_SKY_LEVEL: 71,
  MAX_SKY_LEVEL: 30,
  MAX_CLOUDS: 6,
  BG_CLOUD_SPEED: 0.2,
} as const;

// Horizon constants
export const HORIZON = {
  HEIGHT: 12,
  BUMPY_THRESHOLD: 0.3,
} as const;

// Scoring constants
export const SCORE = {
  INITIAL: 0,
  MAX: 99999,
  DISTANCE_MULTIPLIER: 0.025,
  ACHIEVEMENT_DISTANCE: 100,
  FLASH_DURATION: 250,
} as const;

// Night mode constants
export const NIGHT_MODE = {
  FADE_SPEED: 0.035,
  INVERT_DISTANCE: 700,
  INVERT_FADE_DURATION: 12000, // 12 seconds
} as const;

// Speeds
export const SPEED = {
  DROP_VELOCITY: -5,
} as const;

// Game states
export type GameState = 'WAITING' | 'RUNNING' | 'CRASHED';

// Obstacle types
export type ObstacleType = 'CACTUS_SMALL' | 'CACTUS_LARGE' | 'PTERODACTYL';

// Dino status
export type DinoStatus = 'WAITING' | 'RUNNING' | 'JUMPING' | 'DUCKING' | 'CRASHED';
