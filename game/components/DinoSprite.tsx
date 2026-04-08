import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { DinoState } from '../types';

interface DinoSpriteProps {
  dino: DinoState;
  bottom: number;
}

function DinoSpriteInner({ dino, bottom }: DinoSpriteProps) {
  let sprite: { x: number; y: number; width: number; height: number };

  if (dino.status === 'CRASHED') {
    sprite = SPRITES.DINO.CRASHED;
  } else if (dino.status === 'DUCKING') {
    sprite = dino.currentFrame === 0 ? SPRITES.DINO.DUCKING_1 : SPRITES.DINO.DUCKING_2;
  } else if (dino.status === 'JUMPING') {
    sprite = SPRITES.DINO.JUMPING;
  } else if (dino.status === 'RUNNING') {
    sprite = dino.currentFrame === 0 ? SPRITES.DINO.RUNNING_1 : SPRITES.DINO.RUNNING_2;
  } else {
    sprite = SPRITES.DINO.STANDING;
  }

  return (
    <Sprite
      x={sprite.x}
      y={sprite.y}
      width={sprite.width}
      height={sprite.height}
      style={{
        left: dino.x,
        bottom,
      }}
    />
  );
}

export const DinoSprite = React.memo(DinoSpriteInner, (prev, next) =>
  prev.dino.x === next.dino.x &&
  prev.dino.y === next.dino.y &&
  prev.dino.status === next.dino.status &&
  prev.dino.currentFrame === next.dino.currentFrame &&
  prev.bottom === next.bottom
);
