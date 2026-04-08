import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { ObstacleState } from '../types';

const SPRITE_MAP = {
  CACTUS_SMALL: [SPRITES.CACTUS.SMALL_1, SPRITES.CACTUS.SMALL_2, SPRITES.CACTUS.SMALL_3],
  CACTUS_LARGE: [SPRITES.CACTUS.LARGE_1, SPRITES.CACTUS.LARGE_2, SPRITES.CACTUS.LARGE_3],
  PTERODACTYL: [SPRITES.PTERODACTYL.FLYING_1, SPRITES.PTERODACTYL.FLYING_2],
} as const;

interface ObstacleSpriteProps {
  obstacle: ObstacleState;
  bottom: number;
}

function ObstacleSpriteInner({ obstacle, bottom }: ObstacleSpriteProps) {
  const sprites = SPRITE_MAP[obstacle.type];
  if (!sprites) return null;

  const sprite = obstacle.type === 'PTERODACTYL'
    ? sprites[obstacle.currentFrame]
    : sprites[obstacle.variant - 1] || sprites[0];

  return (
    <Sprite
      x={sprite.x}
      y={sprite.y}
      width={sprite.width}
      height={sprite.height}
      style={{
        left: obstacle.x,
        bottom,
      }}
    />
  );
}

export const ObstacleSprite = React.memo(ObstacleSpriteInner, (prev, next) =>
  prev.obstacle.x === next.obstacle.x &&
  prev.obstacle.y === next.obstacle.y &&
  prev.obstacle.currentFrame === next.obstacle.currentFrame &&
  prev.obstacle.type === next.obstacle.type &&
  prev.obstacle.variant === next.obstacle.variant &&
  prev.bottom === next.bottom
);
