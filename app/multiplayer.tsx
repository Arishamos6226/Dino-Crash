import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MultiplayerGameEngine } from '../game/MultiplayerGameEngine';
import type { MultiplayerRenderState } from '../game/MultiplayerGameEngine';
import { PlayerLane } from '../game/components/PlayerLane';
import { GAME } from '../game/constants';
import { PlayerInput } from '../shared/network-types';
import NetworkManager from '../game/network/NetworkManager';
import { Colors, GameUI } from '../constants/theme';

const HOLD_DURATION_MS = 200;
const RESERVED_UI_HEIGHT = 80;
const LANE_SPACING = 12;

export default function MultiplayerScreen() {
  const params = useLocalSearchParams<{
    seed: string;
    playerId: string;
    betAmount: string;
  }>();

  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [seed] = useState(() => Number(params.seed) || Date.now());
  const playerId = (params.playerId as 'player1' | 'player2') || 'player1';
  const betAmount = Number(params.betAmount) || 0;

  const engineRef = useRef<MultiplayerGameEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new MultiplayerGameEngine(seed, playerId);
  }

  const [renderState, setRenderState] = useState<MultiplayerRenderState>(() => {
    if (engineRef.current) {
      return engineRef.current.getRenderState();
    }
    // Dummy initial state
    return {
      player1: {} as any,
      player2: {} as any,
    };
  });

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);
  const [finalScores, setFinalScores] = useState<{ player1: number; player2: number } | null>(null);
  const crashSentRef = useRef(false);
  const opponentCrashScoreRef = useRef<number | null>(null);

  const networkManager = NetworkManager.getInstance();

  useEffect(() => {
    const handleOpponentInput = (payload: { input: any }) => {
      if (!engineRef.current) return;
      const opponentId = playerId === 'player1' ? 'player2' : 'player1';
      engineRef.current.applyInput(opponentId, payload.input);
    };

    const handleGameOver = (payload: { winnerId: 'player1' | 'player2'; player1Score: number; player2Score: number }) => {
      setWinner(payload.winnerId);
      setFinalScores({
        player1: payload.player1Score,
        player2: payload.player2Score
      });
      setGameOver(true);
    };

    networkManager.onOpponentInput(handleOpponentInput);
    networkManager.onGameOver(handleGameOver);

    return () => {
      networkManager.offOpponentInput(handleOpponentInput);
      networkManager.offGameOver(handleGameOver);
    };
  }, [playerId]);

  useEffect(() => {
    if (!engineRef.current) return;

    let lastTime = Date.now();
    let animationFrameId: number;

    engineRef.current.start();

    const gameLoop = () => {
      if (!engineRef.current) return;

      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      engineRef.current.update(deltaTime);
      const newRenderState = engineRef.current.getRenderState();
      setRenderState(newRenderState);

      if (!gameOver) {
        const localState = playerId === 'player1' ? newRenderState.player1 : newRenderState.player2;

        if (localState.gameState === 'CRASHED' && !crashSentRef.current) {
          crashSentRef.current = true;
          networkManager.sendCrash(localState.score);
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, playerId]);

  const [isDucking, setIsDucking] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  const handleJump = useCallback(() => {
    if (!engineRef.current) return;
    const localState = playerId === 'player1' ? engineRef.current.getRenderState().player1 : engineRef.current.getRenderState().player2;
    if (localState.gameState === 'CRASHED') return;

    engineRef.current.applyInput(playerId, PlayerInput.JUMP);
    networkManager.sendInput(PlayerInput.JUMP);
  }, [playerId]);

  const handleDuckStart = useCallback(() => {
    if (!engineRef.current) return;
    const localState = playerId === 'player1' ? engineRef.current.getRenderState().player1 : engineRef.current.getRenderState().player2;
    if (localState.gameState === 'CRASHED') return;

    setIsDucking(true);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_START);
    networkManager.sendInput(PlayerInput.DUCK_START);
  }, [playerId]);

  const handleDuckEnd = useCallback(() => {
    if (!engineRef.current) return;
    setIsDucking(false);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_END);
    networkManager.sendInput(PlayerInput.DUCK_END);
  }, [playerId]);

  const handleTouchStart = useCallback(() => {
    pressStartTimeRef.current = Date.now();

    pressTimerRef.current = setTimeout(() => {
      handleDuckStart();
    }, HOLD_DURATION_MS);
  }, [handleDuckStart]);

  const handleTouchEnd = useCallback(() => {
    const pressDuration = Date.now() - pressStartTimeRef.current;

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isDucking) {
      handleDuckEnd();
    } else if (pressDuration < HOLD_DURATION_MS) {
      handleJump();
    }
  }, [isDucking, handleDuckEnd, handleJump]);

  const handleRestart = useCallback(() => {
    networkManager.disconnect();
    router.replace('/(tabs)/lobby');
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        handleJump();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        handleDuckStart();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        handleDuckEnd();
      }
    };

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  }, [handleJump, handleDuckStart, handleDuckEnd]);

  const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
  const maxGameWidth = Math.min(windowWidth - 16, 1000);
  const availableHeight = windowHeight - RESERVED_UI_HEIGHT;
  const laneHeight = availableHeight / 2 - LANE_SPACING;

  const calculatedWidth = laneHeight * aspectRatio;
  const gameWidth = Math.min(calculatedWidth, maxGameWidth);
  const gameHeight = calculatedWidth < maxGameWidth ? laneHeight : maxGameWidth / aspectRatio;
  const scale = gameWidth / GAME.WIDTH;

  const localState = playerId === 'player1' ? renderState.player1 : renderState.player2;
  const opponentState = playerId === 'player1' ? renderState.player2 : renderState.player1;
  const isLocalCrashed = localState.gameState === 'CRASHED';
  const isOpponentCrashed = opponentState.gameState === 'CRASHED';
  const isSweating = isLocalCrashed && !isOpponentCrashed && !gameOver;
  const isLocalWinning = isOpponentCrashed && !isLocalCrashed && !gameOver;

  // Capture opponent's score the moment they crash
  if (isOpponentCrashed && opponentCrashScoreRef.current === null) {
    opponentCrashScoreRef.current = opponentState.score;
  }

  // Live bonus: every 500 score above opponent's crash score earns betAmount Fr.
  const opponentCrashScore = opponentCrashScoreRef.current ?? opponentState.score;
  const liveBonus = isLocalWinning
    ? Math.max(0, Math.floor((localState.score - opponentCrashScore) / 500)) * betAmount
    : 0;
  const livePotential = betAmount * 2 + liveBonus;

  // Final winnings at game over
  const myFinalScore = finalScores ? (playerId === 'player1' ? finalScores.player1 : finalScores.player2) : 0;
  const oppFinalScore = finalScores ? (playerId === 'player1' ? finalScores.player2 : finalScores.player1) : 0;
  const finalBonus = (winner === playerId && finalScores)
    ? Math.max(0, Math.floor((myFinalScore - oppFinalScore) / 500)) * betAmount
    : 0;
  const totalWinnings = betAmount * 2 + finalBonus;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Pressable
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        disabled={isLocalCrashed}
        style={styles.page}
      >
        {/* Header: pot left, title right */}
        <View style={styles.header}>
          {isSweating ? (
            <View style={styles.sweatingBanner}>
              <Text style={styles.sweatingTitle}>😰 SCHWITZEN!</Text>
            </View>
          ) : isLocalWinning ? (
            <View style={styles.winningBanner}>
              <Text style={styles.winningTitle}>🏆 +{liveBonus} Fr. Bonus</Text>
              <Text style={styles.winningSubtext}>Pot: {livePotential} Fr. • alle 500 Pkt. +{betAmount} Fr.</Text>
            </View>
          ) : (
            <View style={styles.potContainer}>
              <Text style={styles.potLabel}>💰 POT</Text>
              <Text style={styles.potAmount}>{betAmount * 2} Fr.</Text>
            </View>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.titleMain}>MULTIPLAYER</Text>
            <Text style={styles.titleSub}>Franken wetten</Text>
          </View>
        </View>

        <View style={styles.gameContainer}>
          {/* Player 1 Lane */}
          <View style={styles.playerSection}>
            <View
              style={[
                styles.laneWrapper,
                {
                  width: gameWidth,
                  height: gameHeight,
                  borderColor: playerId === 'player1' ? Colors.game.casinoGold : Colors.game.borderColor,
                }
              ]}
            >
              <PlayerLane
                renderState={renderState.player1}
                scale={scale}
                label="PLAYER 1"
                isLocal={playerId === 'player1'}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Player 2 Lane */}
          <View style={styles.playerSection}>
            <View
              style={[
                styles.laneWrapper,
                {
                  width: gameWidth,
                  height: gameHeight,
                  borderColor: playerId === 'player2' ? Colors.game.casinoGold : Colors.game.borderColor,
                }
              ]}
            >
              <PlayerLane
                renderState={renderState.player2}
                scale={scale}
                label="PLAYER 2"
                isLocal={playerId === 'player2'}
              />
            </View>
          </View>
        </View>

        {/* Game Over Overlay */}
        {gameOver && winner && finalScores && (
          <View style={styles.overlay}>
            <Text style={styles.gameOver}>GAME OVER</Text>
            <Text style={[styles.winner, winner !== playerId && styles.loser]}>
              {winner === playerId ? '🎉 YOU WIN! 🎉' : '💀 YOU LOST! 💀'}
            </Text>
            {winner === playerId && (
              <View style={styles.winningsContainer}>
                <Text style={styles.winningsLabel}>Gewinn:</Text>
                <Text style={styles.winningsAmount}>+{totalWinnings} Fr.</Text>
                {finalBonus > 0 && (
                  <Text style={styles.winningsBonus}>inkl. {finalBonus} Fr. Bonus</Text>
                )}
              </View>
            )}
            {winner !== playerId && (
              <View style={styles.lossContainer}>
                <Text style={styles.lossLabel}>Verlust:</Text>
                <Text style={styles.lossAmount}>-{betAmount} Fr.</Text>
              </View>
            )}
            <Text style={styles.scores}>
              Your Score: {playerId === 'player1' ? finalScores.player1 : finalScores.player2}
            </Text>
            <Text style={styles.scores}>
              Opponent: {playerId === 'player1' ? finalScores.player2 : finalScores.player1}
            </Text>
            <Pressable style={styles.restartButton} onPress={handleRestart}>
              <Text style={styles.restartText}>Back to Menu</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: GameUI.pagePadding,
  },

  /* ── Header ── */
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 4,
  },
  potContainer: {
    backgroundColor: Colors.game.gameBackground,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
    alignItems: 'center',
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  potLabel: {
    fontSize: 10,
    color: Colors.game.subtitleText,
    fontWeight: '700',
    letterSpacing: 1,
  },
  potAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  sweatingBanner: {
    backgroundColor: Colors.game.casinoRed,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.casinoRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  sweatingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  winningBanner: {
    backgroundColor: 'rgba(0,180,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  winningTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  winningSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    marginTop: 2,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  titleMain: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleSub: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    marginTop: 1,
  },

  /* ── Game ── */
  gameContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  playerSection: {
    alignItems: 'center',
  },
  laneWrapper: {
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 3,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  divider: {
    height: 2,
    width: '60%',
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 100,
    paddingHorizontal: 20,
  },
  gameOver: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  winner: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  loser: {
    color: Colors.game.casinoRed,
  },
  winningsContainer: {
    backgroundColor: Colors.game.gameBackground,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    borderWidth: 4,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  winningsLabel: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    fontWeight: '700',
    letterSpacing: 1,
  },
  winningsAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  winningsBonus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.game.subtitleText,
    marginTop: 2,
  },
  lossContainer: {
    backgroundColor: Colors.game.gameBackground,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    borderWidth: 4,
    borderColor: Colors.game.casinoRed,
    shadowColor: Colors.game.casinoRed,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  lossLabel: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    fontWeight: '700',
    letterSpacing: 1,
  },
  lossAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.game.casinoRed,
    letterSpacing: 1,
  },
  scores: {
    fontSize: 18,
    color: Colors.game.accentGold,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  restartButton: {
    marginTop: 20,
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.game.accentGold,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  restartText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
});
