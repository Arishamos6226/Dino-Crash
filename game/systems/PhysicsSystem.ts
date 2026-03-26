import { PHYSICS } from '../constants';
import type { Dino } from '../entities/Dino';

export class PhysicsSystem {
  applyGravity(dino: Dino) {
    if (dino.y > 0 || dino.velocityY < 0) {
      dino.velocityY += PHYSICS.GRAVITY;
      dino.y -= dino.velocityY;

      // Ground collision
      if (dino.y <= 0) {
        dino.y = 0;
        dino.velocityY = 0;
      }
    }
  }
}
