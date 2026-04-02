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

export default function MultiplayerScreen() {
  const params = useLocalSearchParams<{
    seed: string;
    playerId: string;
    isBot: string;
    mode?: string;
  }>();

  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const seed = Number(params.seed) || Date.now();
  const playerId = (params.playerId as 'player1' | 'player2') || 'player1';
  const isBot = params.isBot === 'true' || params.mode === 'bot';

  const engineRef = useRef<MultiplayerGameEngine>(
    new MultiplayerGameEngine(seed, playerId, isBot)
  );

  const [renderState, setRenderState] = useState<MultiplayerRenderState>(
    engineRef.current.getRenderState()
  );

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player1' | 'player2' | null>(null);

  const networkManager = NetworkManager.getInstance();

  // Setup network listeners for online mode
  useEffect(() => {
    if (!isBot) {
      // Listen for opponent inputs
      networkManager.onOpponentInput((payload) => {
        const opponentId = playerId === 'player1' ? 'player2' : 'player1';
        engineRef.current.applyInput(opponentId, payload.input);
      });

      // Listen for game over
      networkManager.onGameOver((payload) => {
        console.log('Game over:', payload);
        setWinner(payload.winnerId);
        setGameOver(true);
      });
    }

    return () => {
      // Cleanup
    };
  }, [isBot, playerId]);

  // Game loop
  useEffect(() => {
    let lastTime = Date.now();
    let animationFrameId: number;

    // Start the game
    engineRef.current.start();

    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      engineRef.current.update(deltaTime);
      const newRenderState = engineRef.current.getRenderState();
      setRenderState(newRenderState);

      // Check for winner (local check)
      if (!gameOver) {
        const localWinner = engineRef.current.getWinner();
        if (localWinner) {
          setWinner(localWinner);
          setGameOver(true);

          // Send crash notification if playing online
          if (!isBot && engineRef.current.getLocalPlayerId() === playerId) {
            const localState = playerId === 'player1' ? newRenderState.player1 : newRenderState.player2;
            if (localState.gameState === 'CRASHED') {
              networkManager.sendCrash();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, isBot, playerId]);

  const [isDucking, setIsDucking] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const HOLD_DURATION = 200; // ms to distinguish tap from hold

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameOver) return;
    engineRef.current.applyInput(playerId, PlayerInput.JUMP);
    if (!isBot) {
      networkManager.sendInput(PlayerInput.JUMP);
    }
  }, [isBot, playerId, gameOver]);

  // Handle duck start
  const handleDuckStart = useCallback(() => {
    if (gameOver) return;
    setIsDucking(true);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_START);
    if (!isBot) {
      networkManager.sendInput(PlayerInput.DUCK_START);
    }
  }, [isBot, playerId, gameOver]);

  // Handle duck end
  const handleDuckEnd = useCallback(() => {
    setIsDucking(false);
    engineRef.current.applyInput(playerId, PlayerInput.DUCK_END);
    if (!isBot) {
      networkManager.sendInput(PlayerInput.DUCK_END);
    }
  }, [isBot, playerId]);

  // Touch handlers for mobile (tap = jump, hold = duck)
  const handleTouchStart = useCallback(() => {
    if (gameOver) return;
    pressStartTimeRef.current = Date.now();

    // Set timer for hold detection
    pressTimerRef.current = setTimeout(() => {
      // Held long enough - start ducking
      handleDuckStart();
    }, HOLD_DURATION);
  }, [gameOver, handleDuckStart]);

  const handleTouchEnd = useCallback(() => {
    const pressDuration = Date.now() - pressStartTimeRef.current;

    // Clear timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isDucking) {
      // Was ducking, stop ducking
      handleDuckEnd();
    } else if (pressDuration < HOLD_DURATION) {
      // Quick tap - jump
      handleJump();
    }
  }, [isDucking, handleDuckEnd, handleJump]);

  const handleRestart = useCallback(() => {
    router.back();
  }, [router]);

  // Keyboard controls for desktop
  useEffect(() => {
    // Only add keyboard listeners on web platform
    if (Platform.OS !== 'web') {
      return;
    }

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

  // Calculate layout - vertical stacking for mobile
  const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
  const maxGameWidth = Math.min(windowWidth - 32, 600);

  // Each lane gets half the available height minus padding and button space
  const availableHeight = windowHeight - 200; // Reserve space for title, buttons, etc.
  const laneHeight = availableHeight / 2 - 40; // 40px for spacing and divider

  let gameWidth = maxGameWidth;
  let gameHeight = laneHeight;

  // Maintain aspect ratio
  const calculatedWidth = gameHeight * aspectRatio;
  if (calculatedWidth < gameWidth) {
    gameWidth = calculatedWidth;
  } else {
    gameHeight = gameWidth / aspectRatio;
  }

  const scale = gameWidth / GAME.WIDTH;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Multiplayer Mode</Text>

      <View style={styles.gameContainer}>
        {/* Player 1 Section */}
        <View style={styles.playerSection}>
          <Pressable
            onPressIn={playerId === 'player1' ? handleTouchStart : undefined}
            onPressOut={playerId === 'player1' ? handleTouchEnd : undefined}
            disabled={gameOver || playerId !== 'player1'}
            style={[
              styles.laneWrapper,
              {
                width: gameWidth,
                height: gameHeight,
                borderWidth: 2,
                borderColor: playerId === 'player1' ? '#4CAF50' : Colors.game.borderColor,
              }
            ]}
          >
            <PlayerLane
              renderState={renderState.player1}
              scale={scale}
              label="PLAYER 1"
              isLocal={playerId === 'player1'}
            />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Player 2 Section */}
        <View style={styles.playerSection}>
          <Pressable
            onPressIn={playerId === 'player2' ? handleTouchStart : undefined}
            onPressOut={playerId === 'player2' ? handleTouchEnd : undefined}
            disabled={gameOver || playerId !== 'player2'}
            style={[
              styles.laneWrapper,
              {
                width: gameWidth,
                height: gameHeight,
                borderWidth: 2,
                borderColor: playerId === 'player2' ? '#4CAF50' : Colors.game.borderColor,
              }
            ]}
          >
            <PlayerLane
              renderState={renderState.player2}
              scale={scale}
              label={isBot ? 'BOT' : 'PLAYER 2'}
              isLocal={playerId === 'player2'}
            />
          </Pressable>
        </View>
      </View>

      {/* Game Over Overlay */}
      {gameOver && winner && (
        <View style={styles.overlay}>
          <Text style={styles.gameOver}>GAME OVER</Text>
          <Text style={styles.winner}>
            {winner === playerId ? 'YOU WIN!' :
             winner === 'player1' ? 'PLAYER 1 WINS!' :
             isBot ? 'BOT WINS!' : 'PLAYER 2 WINS!'}
          </Text>
          <Text style={styles.scores}>
            Player 1: {renderState.player1.score} | {isBot ? 'Bot' : 'Player 2'}: {renderState.player2.score}
          </Text>
          <Pressable style={styles.restartButton} onPress={handleRestart}>
            <Text style={styles.restartText}>Back to Menu</Text>
          </Pressable>
        </View>
      )}
    </View>
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
    color: '#4CAF50',
    letterSpacing: 1,
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
    backgroundColor: Colors.game.borderColor,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.game.textColor,
  },
  restartText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.game.textColor,
  },
});
