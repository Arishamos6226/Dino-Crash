import React from 'react';
import { View } from 'react-native';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { ObstacleState } from '../types';

const DEBUG_MODE = false;

interface ObstacleSpriteProps {
  obstacle: ObstacleState;
  bottom: number;
  scale?: number;
}

const SPRITE_MAP = {
  CACTUS_SMALL: [SPRITES.CACTUS.SMALL_1, SPRITES.CACTUS.SMALL_2, SPRITES.CACTUS.SMALL_3],
  CACTUS_LARGE: [SPRITES.CACTUS.LARGE_1, SPRITES.CACTUS.LARGE_2, SPRITES.CACTUS.LARGE_3],
  PTERODACTYL: [SPRITES.PTERODACTYL.FLYING_1, SPRITES.PTERODACTYL.FLYING_2],
} as const;

export function ObstacleSprite({ obstacle, bottom, scale = 1 }: ObstacleSpriteProps) {
  const sprites = SPRITE_MAP[obstacle.type];
  if (!sprites) return null;

  const sprite = obstacle.type === 'PTERODACTYL'
    ? sprites[obstacle.currentFrame]
    : sprites[obstacle.variant - 1] || sprites[0];

  if (DEBUG_MODE) {
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
