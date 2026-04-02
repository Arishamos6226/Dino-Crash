import { OBSTACLE, CLOUD, GAME, type ObstacleType } from '../constants';
import { CactusSmall, CactusLarge, Pterodactyl, type Obstacle } from '../entities/Obstacle';
import { Cloud } from '../entities/Cloud';
import seedrandom from 'seedrandom';

export class SpawnSystem {
  private nextObstacleId: number;
  private nextCloudId: number;
  private obstacleHistory: ObstacleType[];
  private rng: () => number;

  constructor(seed?: number) {
    this.nextObstacleId = 1;
    this.nextCloudId = 1;
    this.obstacleHistory = [];
    // Use seeded RNG if seed provided, otherwise use Math.random
    this.rng = seed !== undefined ? seedrandom(seed.toString()) : Math.random;
  }

  reset() {
    this.nextObstacleId = 1;
    this.nextCloudId = 1;
    this.obstacleHistory = [];
  }

  maybeSpawnObstacle(obstacles: Obstacle[], currentSpeed: number, timeSinceStart: number): Obstacle | null {
    if (obstacles.length >= 3) {
      return null;
    }

    const lastObstacle = obstacles[obstacles.length - 1];
    const minGap = this.getMinGap(currentSpeed);

    if (!lastObstacle || lastObstacle.x < GAME.WIDTH - minGap) {
      const obstacleType = this.chooseObstacleType(currentSpeed, timeSinceStart);
      const obstacle = this.createObstacle(obstacleType, GAME.WIDTH + 100);

      this.obstacleHistory.push(obstacleType);
      if (this.obstacleHistory.length > OBSTACLE.MAX_OBSTACLE_LENGTH) {
        this.obstacleHistory.shift();
      }

      return obstacle;
    }

    return null;
  }

  maybeSpawnCloud(clouds: Cloud[]): Cloud | null {
    if (clouds.length >= CLOUD.MAX_CLOUDS) {
      return null;
    }

    const lastCloud = clouds[clouds.length - 1];
    const minGap = CLOUD.MIN_CLOUD_GAP;
    const maxGap = CLOUD.MAX_CLOUD_GAP;
    const randomGap = minGap + this.rng() * (maxGap - minGap);

    if (!lastCloud || lastCloud.x < GAME.WIDTH - randomGap) {
      const y = CLOUD.MAX_SKY_LEVEL + this.rng() * (CLOUD.MIN_SKY_LEVEL - CLOUD.MAX_SKY_LEVEL);
      return new Cloud(this.nextCloudId++, GAME.WIDTH + 50, y);
    }

    return null;
  }

  private chooseObstacleType(currentSpeed: number, timeSinceStart: number): ObstacleType {
    const availableTypes: ObstacleType[] = ['CACTUS_SMALL', 'CACTUS_LARGE'];

    if (timeSinceStart >= OBSTACLE.PTERODACTYL.MIN_SPAWN_TIME && this.rng() > OBSTACLE.PTERODACTYL.SPAWN_CHANCE) {
      availableTypes.push('PTERODACTYL');
    }

    const recentTypes = this.obstacleHistory.slice(-2);
    const filteredTypes = availableTypes.filter(
      (type) => !recentTypes.every((recent) => recent === type)
    );

    const typesToChooseFrom = filteredTypes.length > 0 ? filteredTypes : availableTypes;
    return typesToChooseFrom[Math.floor(this.rng() * typesToChooseFrom.length)];
  }

  private getRandomVariant(): number {
    return Math.floor(this.rng() * 3) + 1;
  }

  private createObstacle(type: ObstacleType, x: number): Obstacle {
    const id = this.nextObstacleId++;

    switch (type) {
      case 'CACTUS_SMALL':
        return new CactusSmall(id, x, this.getRandomVariant());
      case 'CACTUS_LARGE':
        return new CactusLarge(id, x, this.getRandomVariant());
      case 'PTERODACTYL': {
        const heightIndex = Math.floor(this.rng() * OBSTACLE.PTERODACTYL.Y_POS.length);
        return new Pterodactyl(id, x, heightIndex);
      }
    }
  }

  private getMinGap(currentSpeed: number): number {
    const baseGap = 500;
    const minGap = 350;
    const speedFactor = Math.max(0.4, currentSpeed / 10);
    const gap = baseGap / speedFactor;
    const randomGap = gap + this.rng() * gap * 0.8;

    return Math.max(minGap, randomGap);
  }
}
