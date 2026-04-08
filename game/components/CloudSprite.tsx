import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { CloudState } from '../types';

interface CloudSpriteProps {
  cloud: CloudState;
  scale?: number;
}

function CloudSpriteInner({ cloud, scale = 1 }: CloudSpriteProps) {
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

export const CloudSprite = React.memo(CloudSpriteInner, (prev, next) =>
  prev.cloud.x === next.cloud.x &&
  prev.cloud.y === next.cloud.y &&
  prev.scale === next.scale
);
