import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { CloudState } from '../types';

interface CloudSpriteProps {
  cloud: CloudState;
}

function CloudSpriteInner({ cloud }: CloudSpriteProps) {
  const sprite = SPRITES.CLOUD;

  return (
    <Sprite
      x={sprite.x}
      y={sprite.y}
      width={sprite.width}
      height={sprite.height}
      style={{
        left: cloud.x,
        top: cloud.y,
      }}
    />
  );
}

export const CloudSprite = React.memo(CloudSpriteInner, (prev, next) =>
  prev.cloud.x === next.cloud.x &&
  prev.cloud.y === next.cloud.y
);
