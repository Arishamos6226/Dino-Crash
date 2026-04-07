import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MultiplayerGameEngine } from '../game/MultiplayerGameEngine';
import type { MultiplayerRenderState } from '../game/MultiplayerGameEngine';
import { PlayerLane } from '../game/components/PlayerLane';
import { GAME } from '../game/constants';
import { PlayerInput } from '../shared/network-types';
import NetworkManager from '../game/network/NetworkManager';
import { Colors, GameUI } from '../constants/theme';

const HOLD_DURATION_MS = 200;
const RESERVED_UI_HEIGHT = 200;
const LANE_SPACING = 40;

export default function MultiplayerScreen() {
  const params = useLocalSearchParams<{
    seed: string;
    playerId: string;
  }>();

  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Generate seed only once
  const [seed] = useState(() => Number(params.seed) || Date.now());
  const playerId = (params.playerId as 'player1' | 'player2') || 'player1';

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

  const networkManager = NetworkManager.getInstance();

  useEffect(() => {
    networkManager.onOpponentInput((payload) => {
      if (!engineRef.current) return;
      const opponentId = playerId === 'player1' ? 'player2' : 'player1';
      engineRef.current.applyInput(opponentId, payload.input);
    });

    networkManager.onGameOver((payload) => {
      setWinner(payload.winnerId);
      setFinalScores({
        player1: payload.player1Score,
        player2: payload.player2Score
      });
      setGameOver(true);
    });
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

        const localWinner = engineRef.current.getWinner();
        if (localWinner) {
          setWinner(localWinner);
          setGameOver(true);
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
    if (gameOver || !engineRef.current) return;
    engineRef.current.applyInput(playerId, PlayerInput.JUMP);
    networkManager.sendInput(PlayerInput.JUMP);
  }, [playerId, gameOver]);

  const handleDuckStart = useCallback(() => {
    if (gameOver || !engineRef.current) return;
    setIsDucking(true);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_START);
    networkManager.sendInput(PlayerInput.DUCK_START);
  }, [playerId, gameOver]);

  const handleDuckEnd = useCallback(() => {
    if (!engineRef.current) return;
    setIsDucking(false);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_END);
    networkManager.sendInput(PlayerInput.DUCK_END);
  }, [playerId]);

  const handleTouchStart = useCallback(() => {
    if (gameOver) return;
    pressStartTimeRef.current = Date.now();

    pressTimerRef.current = setTimeout(() => {
      handleDuckStart();
    }, HOLD_DURATION_MS);
  }, [gameOver, handleDuckStart]);

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
    router.back();
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
  const maxGameWidth = Math.min(windowWidth - 32, 600);
  const availableHeight = windowHeight - RESERVED_UI_HEIGHT;
  const laneHeight = availableHeight / 2 - LANE_SPACING;

  const calculatedWidth = laneHeight * aspectRatio;
  const gameWidth = Math.min(calculatedWidth, maxGameWidth);
  const gameHeight = calculatedWidth < maxGameWidth ? laneHeight : maxGameWidth / aspectRatio;
  const scale = gameWidth / GAME.WIDTH;

  return (
    <Pressable
      onPressIn={handleTouchStart}
      onPressOut={handleTouchEnd}
      disabled={gameOver}
      style={styles.page}
    >
      <Text style={styles.title}>Multiplayer Mode</Text>

      <View style={styles.gameContainer}>
        {/* Player 1 Section */}
        <View style={styles.playerSection}>
          <View
            style={[
              styles.laneWrapper,
              {
                width: gameWidth,
                height: gameHeight,
                borderWidth: 3,
                borderColor: playerId === 'player1' ? Colors.game.accentPrimary : Colors.game.borderColor,
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

        {/* Divider */}
        <View style={styles.divider} />

        {/* Player 2 Section */}
        <View style={styles.playerSection}>
          <View
            style={[
              styles.laneWrapper,
              {
                width: gameWidth,
                height: gameHeight,
                borderWidth: 3,
                borderColor: playerId === 'player2' ? Colors.game.accentPrimary : Colors.game.borderColor,
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
            {winner === playerId ? 'YOU WIN!' : 'YOU LOST!'}
          </Text>
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
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: GameUI.pagePadding,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.game.titleText,
    textAlign: 'center',
    marginBottom: 16,
  },
  gameContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  playerSection: {
    alignItems: 'center',
    gap: 12,
  },
  laneWrapper: {
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    borderRadius: 8,
  },
  divider: {
    height: 2,
    width: '80%',
    backgroundColor: Colors.game.borderColor,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 100,
  },
  gameOver: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.game.textColor,
    letterSpacing: 2,
  },
  winner: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.game.accentSecondary,
    letterSpacing: 1,
  },
  loser: {
    color: Colors.game.accentPrimary,
  },
  scores: {
    fontSize: 18,
    color: Colors.game.textColor,
    fontFamily: 'monospace',
  },
  restartButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.game.buttonBackground,
    borderRadius: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  restartText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.game.textColor,
  },
});
