import { OBSTACLE, CLOUD, GAME, type ObstacleType } from '../constants';
import { CactusSmall, CactusLarge, Pterodactyl, type Obstacle } from '../entities/Obstacle';
import { Cloud } from '../entities/Cloud';

export class SpawnSystem {
  private nextObstacleId: number;
  private nextCloudId: number;
  private obstacleHistory: ObstacleType[];

  constructor() {
    this.nextObstacleId = 1;
    this.nextCloudId = 1;
    this.obstacleHistory = [];
  }

  reset() {
    this.nextObstacleId = 1;
    this.nextCloudId = 1;
    this.obstacleHistory = [];
  }

  maybeSpawnObstacle(obstacles: Obstacle[], currentSpeed: number, timeSinceStart: number): Obstacle | null {
    // Don't spawn if we already have too many obstacles
    if (obstacles.length >= 3) {
      return null;
    }

    const lastObstacle = obstacles[obstacles.length - 1];
    const minGap = this.getMinGap(currentSpeed);

    // Check if we should spawn a new obstacle
    if (!lastObstacle || lastObstacle.x < GAME.WIDTH - minGap) {
      const obstacleType = this.chooseObstacleType(currentSpeed, timeSinceStart);
      const obstacle = this.createObstacle(obstacleType, GAME.WIDTH + 100);

      // Update history
      this.obstacleHistory.push(obstacleType);
      if (this.obstacleHistory.length > OBSTACLE.MAX_OBSTACLE_LENGTH) {
        this.obstacleHistory.shift();
      }

      return obstacle;
    }

    return null;
  }

  maybeSpawnCloud(clouds: Cloud[]): Cloud | null {
    // Don't spawn if we already have max clouds
    if (clouds.length >= CLOUD.MAX_CLOUDS) {
      return null;
    }

    const lastCloud = clouds[clouds.length - 1];
    const minGap = CLOUD.MIN_CLOUD_GAP;
    const maxGap = CLOUD.MAX_CLOUD_GAP;
    const randomGap = minGap + Math.random() * (maxGap - minGap);

    if (!lastCloud || lastCloud.x < GAME.WIDTH - randomGap) {
      const y = CLOUD.MAX_SKY_LEVEL + Math.random() * (CLOUD.MIN_SKY_LEVEL - CLOUD.MAX_SKY_LEVEL);
      return new Cloud(this.nextCloudId++, GAME.WIDTH + 50, y);
    }

    return null;
  }

  private chooseObstacleType(currentSpeed: number, timeSinceStart: number): ObstacleType {
    const availableTypes: ObstacleType[] = ['CACTUS_SMALL', 'CACTUS_LARGE'];

    // Pterodactyl appears after 5 seconds
    // 50% chance of pterodactyl when time is reached
    if (timeSinceStart >= 5000 && Math.random() > 0.5) {
      availableTypes.push('PTERODACTYL');
    }

    // Avoid spawning the same obstacle type too many times in a row
    const recentTypes = this.obstacleHistory.slice(-2);
    const filteredTypes = availableTypes.filter(
      (type) => !recentTypes.every((recent) => recent === type)
    );

    const typesToChooseFrom = filteredTypes.length > 0 ? filteredTypes : availableTypes;
    return typesToChooseFrom[Math.floor(Math.random() * typesToChooseFrom.length)];
  }

  private createObstacle(type: ObstacleType, x: number): Obstacle {
    const id = this.nextObstacleId++;

    switch (type) {
      case 'CACTUS_SMALL': {
        const variant = Math.floor(Math.random() * 3) + 1; // 1-3
        return new CactusSmall(id, x, variant);
      }
      case 'CACTUS_LARGE': {
        const variant = Math.floor(Math.random() * 3) + 1; // 1-3
        return new CactusLarge(id, x, variant);
      }
      case 'PTERODACTYL': {
        const heightIndex = Math.floor(Math.random() * OBSTACLE.PTERODACTYL.Y_POS.length);
        return new Pterodactyl(id, x, heightIndex);
      }
    }
  }

  private getMinGap(currentSpeed: number): number {
    // Much larger gaps for better playability, especially at slow speeds
    const baseGap = 500; // Base gap increased
    const minGap = 350; // Minimum gap of 350px

    // At lower speeds (4-6), use much larger gaps
    // As speed increases, gaps get smaller but never below minGap
    const speedFactor = Math.max(0.4, currentSpeed / 10);
    const gap = baseGap / speedFactor;

    // Add random variation (20-80% extra gap)
    const randomGap = gap + Math.random() * gap * 0.8;

    return Math.max(minGap, randomGap);
  }
}
