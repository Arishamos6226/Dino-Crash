import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { CloudState } from '../types';

interface CloudSpriteProps {
  cloud: CloudState;
  scale?: number;
}

export function CloudSprite({ cloud, scale = 1 }: CloudSpriteProps) {
  const sprite = SPRITES.CLOUD;

  return (
    <Sprite
      x={sprite.x}
      y={sprite.y}
      width={sprite.width}
      height={sprite.height}
      scale={scale}
      style={{
        left: cloud.x * scale,
        top: cloud.y * scale,
      }}
    />
  );
}
