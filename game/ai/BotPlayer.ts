import { GameEngine } from '../GameEngine';
import { PlayerInput } from '../../shared/network-types';
import type { RenderState } from '../types';

interface PendingAction {
  action: PlayerInput;
  executeAt: number;
}

export class BotPlayer {
  private engine: GameEngine;
  private reactionDelay: number = 50; // ms - extremely fast reaction
  private mistakeChance: number = 0; // 0% chance to not react (perfect bot)
  private pendingActions: PendingAction[] = [];
  private lastDecisionTime: number = 0;
  private decisionInterval: number = 30; // Check every 30ms (extremely frequent)
  private isDucking: boolean = false;
  private lastObstacleId: number = -1;
  private processedObstacles: Set<number> = new Set();
  private lastJumpTime: number = 0;

  constructor(engine: GameEngine) {
    this.engine = engine;
    // Random reaction delay between 30-80ms (extremely fast)
    this.reactionDelay = 30 + Math.random() * 50;
  }

  decideAction(): PlayerInput | null {
    const now = Date.now();

    // Execute any pending actions first
    const pendingAction = this.executePendingAction(now);
    if (pendingAction) {
      // If we're executing DUCK_START, remember we're ducking
      if (pendingAction === PlayerInput.DUCK_START) {
        this.isDucking = true;
      } else if (pendingAction === PlayerInput.DUCK_END) {
        this.isDucking = false;
      }
      return pendingAction;
    }

    // Only make decisions at intervals
    if (now - this.lastDecisionTime < this.decisionInterval) {
      return null;
    }

    this.lastDecisionTime = now;

    // Get current game state
    const state = this.engine.getState();

    // Don't make decisions if game is not running
    if (state.gameState !== 'RUNNING') {
      return null;
    }

    // If ducking and dino is on ground, stand up
    if (this.isDucking && state.dino.y === 0) {
      this.isDucking = false;
      return PlayerInput.DUCK_END;
    }

    // Analyze obstacles
    const obstacles = state.obstacles;
    if (obstacles.length === 0) {
      return null;
    }

    // Look at the closest obstacle
    const nextObstacle = obstacles[0];
    const dinoX = state.dino.x;
    const dinoY = state.dino.y;
    const distanceToObstacle = nextObstacle.x - dinoX;

    // React extremely early and reliably
    // Decision range: 200-900 pixels away (extremely early reaction)
    if (distanceToObstacle > 200 && distanceToObstacle < 900) {
      // Check if we've already processed this obstacle
      if (this.processedObstacles.has(nextObstacle.id)) {
        return null;
      }

      // NO mistakes - perfect bot
      if (Math.random() < this.mistakeChance) {
        this.processedObstacles.add(nextObstacle.id);
        return null;
      }

      // Decide action based on obstacle type and height
      const action = this.getActionForObstacle(nextObstacle, state);

      if (action) {
        // Prevent jumping while already in air (unless needed for pterodactyl)
        if (action === PlayerInput.JUMP) {
          // Don't jump if already jumping and not needed
          if (dinoY > 0 && now - this.lastJumpTime < 500) {
            return null;
          }
          this.lastJumpTime = now;
        }

        // Mark this obstacle as processed
        this.processedObstacles.add(nextObstacle.id);

        // Clean up old processed obstacles (keep only last 10)
        if (this.processedObstacles.size > 10) {
          const first = this.processedObstacles.values().next().value;
          this.processedObstacles.delete(first);
        }

        // Schedule action with reaction delay
        this.pendingActions.push({
          action,
          executeAt: now + this.reactionDelay
        });

        // If ducking, schedule DUCK_END after obstacle passes
        if (action === PlayerInput.DUCK_START) {
          // Calculate how long to duck based on obstacle position
          const duckDuration = 500; // Duck for 500ms
          this.pendingActions.push({
            action: PlayerInput.DUCK_END,
            executeAt: now + this.reactionDelay + duckDuration
          });
        }
      }
    }

    // Clean up processed obstacles that are off-screen
    if (obstacles.length > 0) {
      const firstObstacleId = obstacles[0].id;
      this.processedObstacles.forEach(id => {
        if (id < firstObstacleId - 5) {
          this.processedObstacles.delete(id);
        }
      });
    }

    return null;
  }

  private executePendingAction(now: number): PlayerInput | null {
    const actionIndex = this.pendingActions.findIndex(a => a.executeAt <= now);

    if (actionIndex >= 0) {
      const action = this.pendingActions[actionIndex];
      this.pendingActions.splice(actionIndex, 1);
      return action.action;
    }

    return null;
  }

  private getActionForObstacle(obstacle: any, state: RenderState): PlayerInput | null {
    const dinoY = state.dino.y;
    const dinoStatus = state.dino.status;

    // Handle pterodactyls based on their height
    if (obstacle.type === 'PTERODACTYL') {
      // Pterodactyls can fly at different heights
      // y = 0 means on ground level (very low - need to jump)
      // y = 50-75 means medium height (can duck or jump)
      // y = 75+ means high (must duck)

      if (obstacle.y >= 75) {
        // Flying high - duck under it
        return PlayerInput.DUCK_START;
      } else if (obstacle.y >= 50) {
        // Medium height - prefer ducking
        return PlayerInput.DUCK_START;
      } else {
        // Flying low - jump over it
        return PlayerInput.JUMP;
      }
    }

    // Jump for all cacti - these are always on the ground
    if (obstacle.type === 'CACTUS_SMALL' || obstacle.type === 'CACTUS_LARGE') {
      // Always jump for cacti
      return PlayerInput.JUMP;
    }

    return null;
  }
}
