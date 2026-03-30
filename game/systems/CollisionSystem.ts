import type { Dino } from '../entities/Dino';
import type { Obstacle } from '../entities/Obstacle';
import type { CollisionBox } from '../types';

export class CollisionSystem {
  private boxCompare(box1: CollisionBox, box2: CollisionBox): boolean {
    // AABB (Axis-Aligned Bounding Box) collision detection
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }

  checkCollision(dino: Dino, obstacles: Obstacle[]): boolean {
    const dinoBoxes = dino.getCollisionBoxes();

    // Only check nearby obstacles for performance
    const nearbyObstacles = obstacles.filter(
      (obs) => Math.abs(obs.x - dino.x) < 100
    );

    for (const obstacle of nearbyObstacles) {
      const obstacleBoxes = obstacle.getCollisionBoxes();

      for (const dinoBox of dinoBoxes) {
        for (const obstacleBox of obstacleBoxes) {
          if (this.boxCompare(dinoBox, obstacleBox)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
