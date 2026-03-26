import { DINO, PHYSICS, type DinoStatus } from '../constants';
import type { DinoState, CollisionBox } from '../types';

export class Dino {
  x: number;
  y: number;
  velocityY: number;
  status: DinoStatus;
  isDucking: boolean;
  isJumping: boolean;
  currentFrame: number;
  private frameTimer: number;
  private blinkTimer: number;
  private blinkCount: number;

  constructor() {
    this.x = DINO.START_X_POS;
    this.y = 0;
    this.velocityY = 0;
    this.status = 'WAITING';
    this.isDucking = false;
    this.isJumping = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.blinkTimer = 0;
    this.blinkCount = 0;
  }

  update(deltaTime: number) {
    // Update animation frame for running
    if (this.status === 'RUNNING' || this.status === 'DUCKING') {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= 1000 / 8) { // 8 FPS for running animation
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.frameTimer = 0;
      }
    }

    // Handle blinking when waiting
    if (this.status === 'WAITING') {
      this.blinkTimer += deltaTime;
      if (this.blinkTimer >= 3000) { // Blink every 3 seconds
        this.blinkCount = (this.blinkCount + 1) % 2;
        this.blinkTimer = 0;
      }
    }

    // Update jumping status
    if (this.y > 0) {
      this.isJumping = true;
      this.status = 'JUMPING';
    } else if (!this.isDucking) {
      this.isJumping = false;
      if (this.status !== 'CRASHED' && this.status !== 'WAITING') {
        this.status = 'RUNNING';
      }
    }
  }

  jump() {
    if (this.y <= 0 && !this.isDucking) {
      this.velocityY = PHYSICS.INITIAL_JUMP_VELOCITY;
      this.isJumping = true;
      this.status = 'JUMPING';
      return true;
    }
    return false;
  }

  setDucking(isDucking: boolean) {
    if (isDucking && !this.isJumping) {
      this.isDucking = true;
      this.status = 'DUCKING';
    } else if (!isDucking && this.isDucking) {
      this.isDucking = false;
      if (this.y <= 0) {
        this.status = 'RUNNING';
      }
    }
  }

  crash() {
    this.status = 'CRASHED';
  }

  reset() {
    this.y = 0;
    this.velocityY = 0;
    this.status = 'WAITING';
    this.isDucking = false;
    this.isJumping = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.blinkTimer = 0;
    this.blinkCount = 0;
  }

  getCollisionBoxes(): CollisionBox[] {
    if (this.isDucking) {
      return [
        {
          x: this.x + DINO.COLLISION_BOX_DUCKING.OFFSET_X,
          y: this.y + DINO.COLLISION_BOX_DUCKING.OFFSET_Y,
          width: DINO.COLLISION_BOX_DUCKING.WIDTH,
          height: DINO.COLLISION_BOX_DUCKING.HEIGHT,
        },
      ];
    }

    return [
      {
        x: this.x + DINO.COLLISION_BOX.OFFSET_X,
        y: this.y + DINO.COLLISION_BOX.OFFSET_Y,
        width: DINO.COLLISION_BOX.WIDTH,
        height: DINO.COLLISION_BOX.HEIGHT,
      },
    ];
  }

  getState(): DinoState {
    return {
      x: this.x,
      y: this.y,
      velocityY: this.velocityY,
      status: this.status,
      isDucking: this.isDucking,
      isJumping: this.isJumping,
      currentFrame: this.currentFrame,
    };
  }
}
