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
import type { RenderState } from '../game/types';

const HOLD_DURATION_MS = 200;
const RESERVED_UI_HEIGHT = 80;
const LANE_SPACING = 12;
const FIXED_STEP_MS = 1000 / 60; // ~16.67 ms — fixed physics tick for deterministic simulation

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
  const gameOverRef = useRef(false);
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);
  const [finalScores, setFinalScores] = useState<{ player1: number; player2: number } | null>(null);
  const crashSentRef = useRef(false);
  const opponentCrashScoreRef = useRef<number | null>(null);
  const lastMilestoneRef = useRef(0);
  const [liveMilestones, setLiveMilestones] = useState(0);
  const lastStateSendRef = useRef(0);
  const [opponentNetworkState, setOpponentNetworkState] = useState<RenderState | null>(null);
  const latestOpponentNetworkStateRef = useRef<RenderState | null>(null);
  const accumulatorRef = useRef(0);
  const [engineStarted, setEngineStarted] = useState(false);

  const networkManager = NetworkManager.getInstance();

  useEffect(() => {
    const handleOpponentInput = (payload: { input: any }) => {
      if (!engineRef.current) return;
      const opponentId = playerId === 'player1' ? 'player2' : 'player1';
      engineRef.current.applyInput(opponentId, payload.input);
    };

    const handleGameOver = (payload: { winnerId: 'player1' | 'player2'; player1Score: number; player2Score: number }) => {
      gameOverRef.current = true;
      setWinner(payload.winnerId);
      setFinalScores({
        player1: payload.player1Score,
        player2: payload.player2Score
      });
      setGameOver(true);
    };

    networkManager.onOpponentInput(handleOpponentInput);
    networkManager.onGameOver(handleGameOver);
    networkManager.onOpponentState((state) => {
      latestOpponentNetworkStateRef.current = state;
      setOpponentNetworkState(state);
    });
    // Tell server we're ready; it will emit 'game_start_now' once both players confirm.
    networkManager.sendGameReady();
    networkManager.onGameStartNow(() => {
      if (engineRef.current) {
        engineRef.current.start();
      }
      setEngineStarted(true);
    });

    return () => {
      networkManager.offOpponentInput(handleOpponentInput);
      networkManager.offGameOver(handleGameOver);
      networkManager.offOpponentState();
      networkManager.offGameStartNow();
    };
  }, [playerId]);

  useEffect(() => {
    if (!engineStarted || !engineRef.current) return;

    let lastTime = Date.now();
    let animationFrameId: number;

    const gameLoop = () => {
      if (!engineRef.current) return;

      const currentTime = Date.now();
      let elapsed = currentTime - lastTime;
      lastTime = currentTime;

      // Cap to prevent spiral-of-death after tab focus loss etc.
      if (elapsed > 200) elapsed = 200;
      accumulatorRef.current += elapsed;

      while (accumulatorRef.current >= FIXED_STEP_MS) {
        engineRef.current.update(FIXED_STEP_MS);
        accumulatorRef.current -= FIXED_STEP_MS;
      }
      const newRenderState = engineRef.current.getRenderState();
      setRenderState(newRenderState);

      if (!gameOverRef.current) {
        const localState = playerId === 'player1' ? newRenderState.player1 : newRenderState.player2;

        if (localState.gameState === 'CRASHED' && !crashSentRef.current) {
          crashSentRef.current = true;
          networkManager.sendCrash(localState.score);
        }

        // Send authoritative local state to opponent (~20fps)
        if (currentTime - lastStateSendRef.current > 50) {
          lastStateSendRef.current = currentTime;
          networkManager.sendPlayerState(playerId, localState);
        }

        // Track opponent's crash score (once) — use authoritative network state,
        // not the local simulation which can crash prematurely due to input lag.
        const opponentNetState = latestOpponentNetworkStateRef.current;
        const opponentSimState = playerId === 'player1' ? newRenderState.player2 : newRenderState.player1;
        const opponentStateForLogic = opponentNetState ?? opponentSimState;
        if (opponentStateForLogic.gameState === 'CRASHED' && opponentCrashScoreRef.current === null) {
          opponentCrashScoreRef.current = opponentStateForLogic.score;
          lastMilestoneRef.current = 0;
        }

        // Bonus starts only after opponent crashes, counts 500 pts above their crash score
        if (betAmount > 0 && opponentCrashScoreRef.current !== null && localState.gameState !== 'CRASHED') {
          const scoreAbove = Math.max(0, localState.score - opponentCrashScoreRef.current);
          const currentMilestone = Math.floor(scoreAbove / 500);
          if (currentMilestone !== lastMilestoneRef.current) {
            lastMilestoneRef.current = currentMilestone;
            setLiveMilestones(currentMilestone);
          }
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [engineStarted, playerId]);

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
  const localSimOpponentState = playerId === 'player1' ? renderState.player2 : renderState.player1;
  // Use authoritative network state for opponent; fall back to local simulation until first packet
  const opponentState: RenderState = opponentNetworkState ?? localSimOpponentState;
  const isLocalCrashed = localState.gameState === 'CRASHED';
  const isOpponentCrashed = opponentState.gameState === 'CRASHED';
  const isSweating = isLocalCrashed && !isOpponentCrashed && !gameOver;
  const isLocalWinning = isOpponentCrashed && !isLocalCrashed && !gameOver;


  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Pressable
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        disabled={isLocalCrashed}
        style={styles.page}
      >
        {/* Header: pot + status left, title right */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.potContainer}>
              <Text style={styles.potLabel}>POT</Text>
              <Text style={styles.potAmount}>{betAmount * 2} Fr.</Text>
            </View>
            {isLocalWinning && liveMilestones > 0 && (
              <Text style={styles.statusBadgeWinning}>
                +{liveMilestones * betAmount} Fr.
              </Text>
            )}
            {isLocalWinning && liveMilestones === 0 && (
              <Text style={styles.statusBadgeWinning}>Scoring...</Text>
            )}
            {isSweating && (
              <Text style={styles.statusBadgeSweating}>Schwitzen!</Text>
            )}
          </View>
          <Text style={styles.titleMain}>MULTIPLAYER</Text>
        </View>

        <View style={styles.gameContainer}>
          {/* Local player lane always on top */}
          <View style={styles.playerSection}>
            <Text style={[styles.playerTag, styles.playerTagYou]}>YOU</Text>
            <View
              style={[
                styles.laneWrapper,
                styles.laneWrapperLocal,
                { width: gameWidth, height: gameHeight },
              ]}
            >
              <PlayerLane
                renderState={localState}
                scale={scale}
                label={playerId === 'player1' ? 'PLAYER 1' : 'PLAYER 2'}
                isLocal={true}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Opponent lane always on bottom */}
          <View style={styles.playerSection}>
            <Text style={[styles.playerTag, styles.playerTagOpp]}>OPPONENT</Text>
            <View
              style={[
                styles.laneWrapper,
                styles.laneWrapperOpp,
                { width: gameWidth, height: gameHeight },
              ]}
            >
              <PlayerLane
                renderState={opponentState}
                scale={scale}
                label={playerId === 'player1' ? 'PLAYER 2' : 'PLAYER 1'}
                isLocal={false}
              />
            </View>
          </View>
        </View>

        {/* Game Over Overlay */}
        {gameOver && winner && finalScores && (() => {
          const isWinner = winner === playerId;
          const winnerScore = winner === 'player1' ? finalScores.player1 : finalScores.player2;
          const loserScore = winner === 'player1' ? finalScores.player2 : finalScores.player1;
          const myScore = playerId === 'player1' ? finalScores.player1 : finalScores.player2;
          const opScore = playerId === 'player1' ? finalScores.player2 : finalScores.player1;

          // Bonus: +betAmount per 500 pts above loser's crash score (no cap)
          // Pot = base payout, bonus adds on top
          const scoreAbove = Math.max(0, winnerScore - loserScore);
          const milestones = Math.floor(scoreAbove / 500);
          const bonus = milestones * betAmount;
          const pot = betAmount * 2;
          const totalWinnings = pot + bonus; // winner receives: pot + bonus

          return (
            <View style={styles.overlay}>
              <Text style={styles.gameOver}>GAME OVER</Text>
              <Text style={[styles.winner, !isWinner && styles.loser]}>
                {isWinner ? 'YOU WIN!' : 'YOU LOST!'}
              </Text>

              <View style={isWinner ? styles.winningsContainer : styles.lossContainer}>
                <Text style={isWinner ? styles.winningsLabel : styles.lossLabel}>
                  {isWinner ? 'Gewinn' : 'Verlust'}
                </Text>
                <Text style={isWinner ? styles.winningsAmount : styles.lossAmount}>
                  {isWinner ? `+${betAmount + bonus}` : `-${betAmount + bonus}`} Fr.
                </Text>
                {isWinner && betAmount > 0 && (
                  <Text style={styles.milestoneDetail}>
                    Pot {pot} Fr. + {milestones}×{betAmount} Fr. Bonus
                  </Text>
                )}
              </View>

              <Text style={styles.scores}>Dein Score: {myScore}</Text>
              <Text style={styles.scores}>Gegner: {opScore}</Text>
              <Pressable style={styles.restartButton} onPress={handleRestart}>
                <Text style={styles.restartText}>Back to Menu</Text>
              </Pressable>
            </View>
          );
        })()}
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
  headerLeft: {
    gap: 4,
  },
  potContainer: {
    backgroundColor: Colors.game.gameBackground,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.game.accentGold,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  potLabel: {
    fontSize: 10,
    color: Colors.game.subtitleText,
    fontWeight: '700',
    letterSpacing: 1,
  },
  potAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 1,
  },
  statusBadgeSweating: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.game.casinoRed,
    letterSpacing: 0.5,
  },
  statusBadgeWinning: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00ff88',
    letterSpacing: 0.5,
  },
  titleMain: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 3,
    textShadowColor: 'rgba(255,215,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
    gap: 4,
  },
  playerTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playerTagYou: {
    color: Colors.game.playerHighlight,
    textShadowColor: 'rgba(0, 212, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  playerTagOpp: {
    color: 'rgba(255,215,0,0.5)',
  },
  laneWrapper: {
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 3,
  },
  laneWrapperLocal: {
    borderColor: Colors.game.playerHighlight,
    shadowColor: Colors.game.playerHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  laneWrapperOpp: {
    borderColor: 'rgba(255,215,0,0.35)',
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
  milestoneDetail: {
    fontSize: 13,
    color: Colors.game.subtitleText,
    fontWeight: '600',
    letterSpacing: 0.5,
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
