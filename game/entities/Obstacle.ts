import { OBSTACLE, GAME, type ObstacleType } from '../constants';
import type { ObstacleState, CollisionBox } from '../types';

export abstract class Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number;
  currentFrame: number;
  protected frameTimer: number;

  constructor(id: number, type: ObstacleType, x: number, variant: number = 1) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.variant = variant;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.width = 0;
    this.height = 0;
    this.y = 0;
  }

  abstract getCollisionBoxes(): CollisionBox[];

  update(speed: number, deltaTime: number) {
    this.x -= speed;
  }

  isOffScreen(): boolean {
    return this.x + this.width < -50;
  }

  getState(): ObstacleState {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      variant: this.variant,
      currentFrame: this.currentFrame,
    };
  }
}

export class CactusSmall extends Obstacle {
  private _collisionBoxes: CollisionBox[];

  constructor(id: number, x: number, variant: number = 1) {
    super(id, 'CACTUS_SMALL', x, variant);
    this.width = OBSTACLE.CACTUS_SMALL.WIDTH;
    this.height = OBSTACLE.CACTUS_SMALL.HEIGHT;
    this.y = 0;
    this._collisionBoxes = OBSTACLE.CACTUS_SMALL.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }

  update(speed: number, deltaTime: number) {
    super.update(speed, deltaTime);
    const boxes = OBSTACLE.CACTUS_SMALL.COLLISION_BOXES;
    for (let i = 0; i < this._collisionBoxes.length; i++) {
      this._collisionBoxes[i].x = this.x + boxes[i].x;
    }
  }

  getCollisionBoxes(): CollisionBox[] {
    return this._collisionBoxes;
  }
}

export class CactusLarge extends Obstacle {
  private _collisionBoxes: CollisionBox[];

  constructor(id: number, x: number, variant: number = 1) {
    super(id, 'CACTUS_LARGE', x, variant);
    this.width = OBSTACLE.CACTUS_LARGE.WIDTH;
    this.height = OBSTACLE.CACTUS_LARGE.HEIGHT;
    this.y = 0;
    this._collisionBoxes = OBSTACLE.CACTUS_LARGE.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }

  update(speed: number, deltaTime: number) {
    super.update(speed, deltaTime);
    const boxes = OBSTACLE.CACTUS_LARGE.COLLISION_BOXES;
    for (let i = 0; i < this._collisionBoxes.length; i++) {
      this._collisionBoxes[i].x = this.x + boxes[i].x;
    }
  }

  getCollisionBoxes(): CollisionBox[] {
    return this._collisionBoxes;
  }
}

export class Pterodactyl extends Obstacle {
  private heightIndex: number;
  private _collisionBoxes: CollisionBox[];

  constructor(id: number, x: number, heightIndex: number = 0) {
    super(id, 'PTERODACTYL', x, 1);
    this.width = OBSTACLE.PTERODACTYL.WIDTH;
    this.height = OBSTACLE.PTERODACTYL.HEIGHT;
    this.heightIndex = Math.min(heightIndex, OBSTACLE.PTERODACTYL.Y_POS.length - 1);
    this.y = OBSTACLE.PTERODACTYL.Y_POS_OFFSET[this.heightIndex];
    this._collisionBoxes = OBSTACLE.PTERODACTYL.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }

  update(speed: number, deltaTime: number) {
    super.update(speed, deltaTime);

    this.frameTimer += deltaTime;
    if (this.frameTimer >= OBSTACLE.PTERODACTYL.FRAME_RATE) {
      this.currentFrame = (this.currentFrame + 1) % OBSTACLE.PTERODACTYL.NUM_FRAMES;
      this.frameTimer = 0;
    }

    const boxes = OBSTACLE.PTERODACTYL.COLLISION_BOXES;
    for (let i = 0; i < this._collisionBoxes.length; i++) {
      this._collisionBoxes[i].x = this.x + boxes[i].x;
    }
  }

  getCollisionBoxes(): CollisionBox[] {
    return this._collisionBoxes;
  }
}
