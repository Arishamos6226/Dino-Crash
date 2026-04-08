import { DINO, PHYSICS, type DinoStatus } from '../constants';
import type { DinoState, CollisionBox } from '../types';

export class Dino {
  private static readonly FRAME_INTERVAL = 1000 / 8;

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
  private _collisionBox: CollisionBox;
  private _duckingCollisionBox: CollisionBox;

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
    this._collisionBox = {
      x: this.x + DINO.COLLISION_BOX.OFFSET_X,
      y: this.y + DINO.COLLISION_BOX.OFFSET_Y,
      width: DINO.COLLISION_BOX.WIDTH,
      height: DINO.COLLISION_BOX.HEIGHT,
    };
    this._duckingCollisionBox = {
      x: this.x + DINO.COLLISION_BOX_DUCKING.OFFSET_X,
      y: this.y + DINO.COLLISION_BOX_DUCKING.OFFSET_Y,
      width: DINO.COLLISION_BOX_DUCKING.WIDTH,
      height: DINO.COLLISION_BOX_DUCKING.HEIGHT,
    };
  }

  update(deltaTime: number) {
    if (this.status === 'RUNNING' || this.status === 'DUCKING') {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= Dino.FRAME_INTERVAL) {
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.frameTimer = 0;
      }
    }

    if (this.status === 'WAITING') {
      this.blinkTimer += deltaTime;
      if (this.blinkTimer >= 3000) {
        this.blinkCount = (this.blinkCount + 1) % 2;
        this.blinkTimer = 0;
      }
    }

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
      this._duckingCollisionBox.x = this.x + DINO.COLLISION_BOX_DUCKING.OFFSET_X;
      this._duckingCollisionBox.y = this.y + DINO.COLLISION_BOX_DUCKING.OFFSET_Y;
      return [this._duckingCollisionBox];
    }

    this._collisionBox.x = this.x + DINO.COLLISION_BOX.OFFSET_X;
    this._collisionBox.y = this.y + DINO.COLLISION_BOX.OFFSET_Y;
    return [this._collisionBox];
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
