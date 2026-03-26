// Sprite positions in the 100-offline-sprite.png sheet
// Based on actual Chrome source coordinates
// The sprite sheet is 1233x68 pixels and contains all game sprites

export const SPRITE_SHEET = require('../assets/images/sprites/sprite.png');

// Sprite definitions: { x, y, width, height } in the sprite sheet
// Y coordinates from Chrome source - most sprites start at y=2
export const SPRITES = {
  DINO: {
    STANDING: { x: 76, y: 2, width: 44, height: 47 },
    RUNNING_1: { x: 936, y: 2, width: 44, height: 47 },
    RUNNING_2: { x: 980, y: 2, width: 44, height: 47 },
    JUMPING: { x: 76, y: 2, width: 44, height: 47 }, // Same as standing
    DUCKING_1: { x: 1112, y: 19, width: 59, height: 30 },
    DUCKING_2: { x: 1171, y: 19, width: 59, height: 30 },
    CRASHED: { x: 1024, y: 2, width: 44, height: 47 },
  },
  CACTUS: {
    SMALL_1: { x: 228, y: 2, width: 17, height: 35 },
    SMALL_2: { x: 245, y: 2, width: 34, height: 35 },
    SMALL_3: { x: 279, y: 2, width: 51, height: 35 },
    LARGE_1: { x: 332, y: 2, width: 25, height: 50 },
    LARGE_2: { x: 357, y: 2, width: 50, height: 50 },
    LARGE_3: { x: 407, y: 2, width: 75, height: 50 },
  },
  PTERODACTYL: {
    FLYING_1: { x: 134, y: 2, width: 46, height: 40 },
    FLYING_2: { x: 180, y: 2, width: 46, height: 40 },
  },
  CLOUD: { x: 86, y: 2, width: 46, height: 14 },
  HORIZON: { x: 2, y: 54, width: 1200, height: 12 },
  RESTART: { x: 2, y: 2, width: 36, height: 32 },
  TEXT_SPRITE: { x: 655, y: 2, width: 191, height: 11 }, // "GAME OVER" text
} as const;
