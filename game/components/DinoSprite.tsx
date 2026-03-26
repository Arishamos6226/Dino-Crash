import React from 'react';
import { Sprite } from './Sprite';
import { SPRITES } from '../sprites';
import type { DinoState } from '../types';

interface DinoSpriteProps {
  dino: DinoState;
  bottom: number;
  scale?: number;
}

export function DinoSprite({ dino, bottom, scale = 1 }: DinoSpriteProps) {
  // Determine which sprite to show
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
      scale={scale}
      style={{
        left: dino.x * scale,
        bottom: bottom * scale,
      }}
    />
  );
}
