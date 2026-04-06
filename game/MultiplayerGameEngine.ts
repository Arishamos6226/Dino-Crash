import { GameEngine } from './GameEngine';
import { PlayerInput } from '../shared/network-types';
import type { RenderState } from './types';

export interface MultiplayerRenderState {
  player1: RenderState;
  player2: RenderState;
}

export class MultiplayerGameEngine {
  private player1Engine: GameEngine;
  private player2Engine: GameEngine;
  private localPlayerId: 'player1' | 'player2';

  constructor(seed: number, localPlayerId: 'player1' | 'player2') {
    console.log('MultiplayerGameEngine constructor:', { seed, localPlayerId });

    // Both engines use the same seed for deterministic obstacle generation
    this.player1Engine = new GameEngine(seed);
    this.player2Engine = new GameEngine(seed);
    this.localPlayerId = localPlayerId;
  }

  update(deltaTime: number) {
    this.player1Engine.update(deltaTime);
    this.player2Engine.update(deltaTime);
  }

  applyInput(playerId: 'player1' | 'player2', input: PlayerInput) {
    const engine = playerId === 'player1' ? this.player1Engine : this.player2Engine;

    switch (input) {
      case PlayerInput.JUMP:
        engine.jump();
        break;
      case PlayerInput.DUCK_START:
        engine.duck(true);
        break;
      case PlayerInput.DUCK_END:
        engine.duck(false);
        break;
    }
  }

  start() {
    this.player1Engine.start();
    this.player2Engine.start();
  }

  getWinner(): 'player1' | 'player2' | null {
    const p1State = this.player1Engine.getState().gameState;
    const p2State = this.player2Engine.getState().gameState;

    // Game only ends when at least one player crashes
    if (p1State !== 'CRASHED' && p2State !== 'CRASHED') {
      return null;
    }

    // If both crashed, compare scores
    if (p1State === 'CRASHED' && p2State === 'CRASHED') {
      const p1Score = this.player1Engine.getState().score;
      const p2Score = this.player2Engine.getState().score;
      return p1Score > p2Score ? 'player1' : 'player2';
    }

    // One player crashed
    if (p1State === 'CRASHED') return 'player2';
    return 'player1';
  }

  getRenderState(): MultiplayerRenderState {
    return {
      player1: this.player1Engine.getState(),
      player2: this.player2Engine.getState(),
    };
  }

  getLocalPlayerId(): 'player1' | 'player2' {
    return this.localPlayerId;
  }

  isLocalPlayerAlive(): boolean {
    const localEngine = this.localPlayerId === 'player1' ? this.player1Engine : this.player2Engine;
    return localEngine.getState().gameState !== 'CRASHED';
  }
}
