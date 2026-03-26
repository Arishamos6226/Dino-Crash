import { PHYSICS, NIGHT_MODE, type GameState } from './constants';
import { Dino } from './entities/Dino';
import { Cloud } from './entities/Cloud';
import type { Obstacle } from './entities/Obstacle';
import { CollisionSystem } from './systems/CollisionSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { SpawnSystem } from './systems/SpawnSystem';
import type { RenderState } from './types';

export class GameEngine {
  private dino: Dino;
  private obstacles: Obstacle[];
  private clouds: Cloud[];
  private collisionSystem: CollisionSystem;
  private physicsSystem: PhysicsSystem;
  private scoreSystem: ScoreSystem;
  private spawnSystem: SpawnSystem;

  private currentSpeed: number;
  private gameState: GameState;
  private nightModeFade: number;
  private lastInvertDistance: number;
  private timeSinceStart: number; // Track time since game started

  constructor() {
    this.dino = new Dino();
    this.obstacles = []; // Start with no obstacles
    this.clouds = [];

    this.collisionSystem = new CollisionSystem();
    this.physicsSystem = new PhysicsSystem();
    this.scoreSystem = new ScoreSystem();
    this.spawnSystem = new SpawnSystem();

    this.currentSpeed = PHYSICS.INITIAL_SPEED;
    this.gameState = 'WAITING';
    this.nightModeFade = 0;
    this.lastInvertDistance = 0;
    this.timeSinceStart = 0;
  }

  update(deltaTime: number) {
    if (this.gameState !== 'RUNNING') {
      return;
    }

    // Track time since start
    this.timeSinceStart += deltaTime;

    // Update speed (accelerate)
    this.currentSpeed = Math.min(
      PHYSICS.MAX_SPEED,
      this.currentSpeed + PHYSICS.ACCELERATION
    );

    // Update dino
    this.dino.update(deltaTime);
    this.physicsSystem.applyGravity(this.dino);

    // Update obstacles
    this.obstacles.forEach((obstacle) => obstacle.update(this.currentSpeed, deltaTime));

    // Update clouds
    this.clouds.forEach((cloud) => cloud.update(deltaTime));

    // Spawn new obstacles (but wait 1 second after starting)
    if (this.timeSinceStart > 1000) {
      const newObstacle = this.spawnSystem.maybeSpawnObstacle(
        this.obstacles,
        this.currentSpeed,
        this.timeSinceStart
      );
      if (newObstacle) {
        this.obstacles.push(newObstacle);
      }
    }

    // Spawn new clouds
    const newCloud = this.spawnSystem.maybeSpawnCloud(this.clouds);
    if (newCloud) {
      this.clouds.push(newCloud);
    }

    // Remove off-screen obstacles and clouds
    this.obstacles = this.obstacles.filter((obs) => !obs.isOffScreen());
    this.clouds = this.clouds.filter((cloud) => !cloud.isOffScreen());

    // Check collision
    if (this.collisionSystem.checkCollision(this.dino, this.obstacles)) {
      this.crash();
    }

    // Update score
    const milestoneReached = this.scoreSystem.update(this.currentSpeed, deltaTime);
    if (milestoneReached) {
      // TODO: Play milestone sound
    }

    // Update night mode
    this.updateNightMode();
  }

  private updateNightMode() {
    const distance = this.scoreSystem.getDistance();
    const cycleDistance = NIGHT_MODE.INVERT_DISTANCE * 2;
    const positionInCycle = distance % cycleDistance;

    // Determine if we should be in night mode
    const shouldBeNight = positionInCycle < NIGHT_MODE.INVERT_DISTANCE;

    // Gradually fade in/out
    if (shouldBeNight && this.nightModeFade < 1) {
      this.nightModeFade = Math.min(1, this.nightModeFade + NIGHT_MODE.FADE_SPEED);
    } else if (!shouldBeNight && this.nightModeFade > 0) {
      this.nightModeFade = Math.max(0, this.nightModeFade - NIGHT_MODE.FADE_SPEED);
    }
  }

  start() {
    if (this.gameState === 'WAITING') {
      this.gameState = 'RUNNING';
      this.dino.status = 'RUNNING';
      this.timeSinceStart = 0; // Reset timer when starting
    }
  }

  jump() {
    if (this.gameState === 'CRASHED') {
      this.restart();
      return;
    }

    if (this.gameState === 'WAITING') {
      this.start();
    }

    const jumped = this.dino.jump();
    if (jumped) {
      // TODO: Play jump sound
    }
  }

  duck(isDucking: boolean) {
    this.dino.setDucking(isDucking);
  }

  crash() {
    this.gameState = 'CRASHED';
    this.dino.crash();
    this.scoreSystem.updateHighScore();
    // TODO: Play crash sound
  }

  restart() {
    this.obstacles = [];
    this.clouds = [];
    this.dino.reset();
    this.currentSpeed = PHYSICS.INITIAL_SPEED;
    this.gameState = 'WAITING';
    this.nightModeFade = 0;
    this.lastInvertDistance = 0;
    this.timeSinceStart = 0;
    this.scoreSystem.reset();
    this.spawnSystem.reset();
  }

  setHighScore(score: number) {
    this.scoreSystem.setHighScore(score);
  }

  getState(): RenderState {
    return {
      gameState: this.gameState,
      dino: this.dino.getState(),
      obstacles: this.obstacles.map((obs) => obs.getState()),
      clouds: this.clouds.map((cloud) => cloud.getState()),
      score: this.scoreSystem.getCurrentScore(),
      highScore: this.scoreSystem.getHighScore(),
      distance: this.scoreSystem.getDistance(),
      isNightMode: this.nightModeFade > 0.5,
      nightModeFade: this.nightModeFade,
    };
  }
}
