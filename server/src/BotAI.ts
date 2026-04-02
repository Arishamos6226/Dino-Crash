import { PlayerInput } from '../../shared/network-types';

export class BotAI {
  private difficulty: 'EASY' = 'EASY';
  private reactionDelay: number;
  private mistakeChance: number = 0.15; // 15% chance to make a mistake
  private lastActionTime: number = 0;

  constructor() {
    // Random reaction delay between 300-600ms
    this.reactionDelay = 300 + Math.random() * 300;
  }

  /**
   * Simulates bot decision making
   * Returns a random action with occasional mistakes
   */
  generateAction(): PlayerInput | null {
    const now = Date.now();

    // Don't send inputs too frequently (at least 500ms apart)
    if (now - this.lastActionTime < 500) {
      return null;
    }

    // 15% chance to make a mistake (don't react)
    if (Math.random() < this.mistakeChance) {
      return null;
    }

    // Randomly choose between JUMP and DUCK
    // 70% jump, 30% duck (jumping is safer)
    const action = Math.random() < 0.7 ? PlayerInput.JUMP : PlayerInput.DUCK_START;

    this.lastActionTime = now;
    return action;
  }

  /**
   * Simulates delayed reaction time
   */
  getReactionDelay(): number {
    return this.reactionDelay;
  }
}
