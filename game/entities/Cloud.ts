import { CLOUD } from '../constants';
import type { CloudState } from '../types';

export class Cloud {
  id: number;
  x: number;
  y: number;
  private speed: number;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.speed = CLOUD.BG_CLOUD_SPEED;
  }

  update(deltaTime: number) {
    this.x -= this.speed;
  }

  isOffScreen(): boolean {
    return this.x + CLOUD.WIDTH < -50;
  }

  getState(): CloudState {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
    };
  }
}
