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
  constructor(id: number, x: number, variant: number = 1) {
    super(id, 'CACTUS_SMALL', x, variant);
    this.width = OBSTACLE.CACTUS_SMALL.WIDTH;
    this.height = OBSTACLE.CACTUS_SMALL.HEIGHT;
    this.y = 0; // Cacti sit on the ground (y=0 in game coordinates)
  }

  getCollisionBoxes(): CollisionBox[] {
    return OBSTACLE.CACTUS_SMALL.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }
}

export class CactusLarge extends Obstacle {
  constructor(id: number, x: number, variant: number = 1) {
    super(id, 'CACTUS_LARGE', x, variant);
    this.width = OBSTACLE.CACTUS_LARGE.WIDTH;
    this.height = OBSTACLE.CACTUS_LARGE.HEIGHT;
    this.y = 0; // Cacti sit on the ground (y=0 in game coordinates)
  }

  getCollisionBoxes(): CollisionBox[] {
    return OBSTACLE.CACTUS_LARGE.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }
}

export class Pterodactyl extends Obstacle {
  private heightIndex: number;

  constructor(id: number, x: number, heightIndex: number = 0) {
    super(id, 'PTERODACTYL', x, 1);
    this.width = OBSTACLE.PTERODACTYL.WIDTH;
    this.height = OBSTACLE.PTERODACTYL.HEIGHT;
    this.heightIndex = Math.min(heightIndex, OBSTACLE.PTERODACTYL.Y_POS.length - 1);
    // Pterodactyl flies at different heights above ground
    // Y_POS_OFFSET gives the height above ground level
    this.y = OBSTACLE.PTERODACTYL.Y_POS_OFFSET[this.heightIndex];
  }

  update(speed: number, deltaTime: number) {
    super.update(speed, deltaTime);

    // Animate wing flapping
    this.frameTimer += deltaTime;
    if (this.frameTimer >= OBSTACLE.PTERODACTYL.FRAME_RATE) {
      this.currentFrame = (this.currentFrame + 1) % OBSTACLE.PTERODACTYL.NUM_FRAMES;
      this.frameTimer = 0;
    }
  }

  getCollisionBoxes(): CollisionBox[] {
    return OBSTACLE.PTERODACTYL.COLLISION_BOXES.map((box) => ({
      x: this.x + box.x,
      y: this.y + box.y,
      width: box.width,
      height: box.height,
    }));
  }
}
