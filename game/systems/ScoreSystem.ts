import { SCORE } from '../constants';

export class ScoreSystem {
  private distance: number;
  private highScore: number;
  private lastMilestone: number;

  constructor() {
    this.distance = SCORE.INITIAL;
    this.highScore = 0;
    this.lastMilestone = 0;
  }

  update(speed: number, deltaTime: number): boolean {
    this.distance += speed * deltaTime * SCORE.DISTANCE_MULTIPLIER;

    const currentMilestone = Math.floor(this.distance / SCORE.ACHIEVEMENT_DISTANCE);
    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;
      return true;
    }

    return false;
  }

  reset() {
    this.distance = SCORE.INITIAL;
    this.lastMilestone = 0;
  }

  setHighScore(score: number) {
    this.highScore = Math.max(this.highScore, score);
  }

  updateHighScore() {
    if (this.distance > this.highScore) {
      this.highScore = this.distance;
    }
  }

  getCurrentScore(): number {
    return Math.min(Math.floor(this.distance), SCORE.MAX);
  }

  getHighScore(): number {
    return Math.min(Math.floor(this.highScore), SCORE.MAX);
  }

  getDistance(): number {
    return this.distance;
  }
}
