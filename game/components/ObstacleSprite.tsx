import React from 'react';
import { View } from 'react-native';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { ObstacleState } from '../types';

// Temporary: Render as colored boxes for debugging
const DEBUG_MODE = false;

interface ObstacleSpriteProps {
  obstacle: ObstacleState;
  bottom: number;
  scale?: number;
}

export function ObstacleSprite({ obstacle, bottom, scale = 1 }: ObstacleSpriteProps) {
  let sprite: { x: number; y: number; width: number; height: number };

  if (obstacle.type === 'CACTUS_SMALL') {
    switch (obstacle.variant) {
      case 1:
        sprite = SPRITES.CACTUS.SMALL_1;
        break;
      case 2:
        sprite = SPRITES.CACTUS.SMALL_2;
        break;
      case 3:
      default:
        sprite = SPRITES.CACTUS.SMALL_3;
        break;
    }
  } else if (obstacle.type === 'CACTUS_LARGE') {
    switch (obstacle.variant) {
      case 1:
        sprite = SPRITES.CACTUS.LARGE_1;
        break;
      case 2:
        sprite = SPRITES.CACTUS.LARGE_2;
        break;
      case 3:
      default:
        sprite = SPRITES.CACTUS.LARGE_3;
        break;
    }
  } else if (obstacle.type === 'PTERODACTYL') {
    sprite = obstacle.currentFrame === 0 ? SPRITES.PTERODACTYL.FLYING_1 : SPRITES.PTERODACTYL.FLYING_2;
  } else {
    return null;
  }

  if (DEBUG_MODE) {
    // Render as colored box for debugging
    return (
      <View
        style={{
          position: 'absolute',
          left: obstacle.x * scale,
          bottom: bottom * scale,
          width: sprite.width * scale,
          height: sprite.height * scale,
          backgroundColor: obstacle.type === 'PTERODACTYL' ? '#8B4513' : '#2c8b3f',
          borderWidth: 1,
          borderColor: 'red',
        }}
      />
    );
  }

  return (
    <Sprite
      x={sprite.x}
      y={sprite.y}
      width={sprite.width}
      height={sprite.height}
      scale={scale}
      style={{
        left: obstacle.x * scale,
        bottom: bottom * scale,
      }}
    />
  );
}
