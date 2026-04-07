import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { GameEngine } from '../../game/GameEngine';
import { GAME } from '../../game/constants';
import type { RenderState } from '../../game/types';
import { DinoSprite } from '../../game/components/DinoSprite';
import { ObstacleSprite } from '../../game/components/ObstacleSprite';
import { CloudSprite } from '../../game/components/CloudSprite';
import { Colors, GameUI } from '../../constants/theme';

const HOLD_DURATION_MS = 200;

export default function HomeScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [renderState, setRenderState] = useState<RenderState>(
    engineRef.current.getState()
  );
  const [isDucking, setIsDucking] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
  const maxGameWidth = Math.min(windowWidth - GameUI.screenPadding, GameUI.maxGameWidth);
  const maxGameHeight = windowHeight * GameUI.screenHeightRatio;

  let gameWidth = maxGameWidth;
  let gameHeight = gameWidth / aspectRatio;

  if (gameHeight > maxGameHeight) {
    gameHeight = maxGameHeight;
    gameWidth = gameHeight * aspectRatio;
  }

  const scale = gameWidth / GAME.WIDTH;

  const handleJump = useCallback(() => {
    engineRef.current.jump();
  }, []);

  const handleDuckStart = useCallback(() => {
    setIsDucking(true);
    engineRef.current.duck(true);
  }, []);

  const handleDuckEnd = useCallback(() => {
    setIsDucking(false);
    engineRef.current.duck(false);
  }, []);

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

  useEffect(() => {
    let lastTime = Date.now();
    let animationFrameId: number;

    const gameLoop = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      engineRef.current.update(deltaTime);
      setRenderState(engineRef.current.getState());

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const { dino, obstacles, clouds, score, highScore, gameState, nightModeFade } = renderState;
  const dinoBottom = GAME.GROUND_HEIGHT + dino.y;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>🦖 DINO CRASH</Text>
        <View style={styles.scoreBoard}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{String(score).padStart(5, '0')}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.scoreValue}>{String(highScore).padStart(5, '0')}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        style={styles.gameCard}
      >
        <View
          style={[
            styles.gameArea,
            {
              width: gameWidth,
              height: gameHeight,
            }
          ]}
        >
        <View
          style={[
            styles.sky,
            nightModeFade > 0 && {
              backgroundColor: `${Colors.game.nightModeBase}${nightModeFade})`,
            },
          ]}
        />
        <View
          style={[
            styles.ground,
            {
              height: GAME.GROUND_HEIGHT * scale,
              borderTopWidth: GameUI.borderWidth * scale,
            }
          ]}
        />

        {clouds.map((cloud) => (
          <CloudSprite key={cloud.id} cloud={cloud} scale={scale} />
        ))}

        <DinoSprite dino={dino} bottom={dinoBottom} scale={scale} />

        {obstacles.map((obstacle) => {
          const obstacleBottom = GAME.GROUND_HEIGHT + obstacle.y;
          return <ObstacleSprite key={obstacle.id} obstacle={obstacle} bottom={obstacleBottom} scale={scale} />;
        })}

        {gameState === 'CRASHED' && (
          <View style={styles.overlay}>
            <Text style={[styles.gameOver, { fontSize: 28 * Math.min(scale, 1.5) }]}>GAME OVER</Text>
            <Text style={[styles.restart, { fontSize: 16 * Math.min(scale, 1.5) }]}>Tap to Restart</Text>
          </View>
        )}
      </View>
      </Pressable>

      <View style={styles.controls}>
        <Text style={styles.controlText}>TAP = JUMP • HOLD = DUCK</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.game.titleText,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    marginBottom: 16,
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.game.borderColor,
    alignItems: 'center',
    gap: 24,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.game.subtitleText,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.game.accentGold,
    fontFamily: 'monospace',
  },
  scoreDivider: {
    width: 2,
    height: 30,
    backgroundColor: Colors.game.borderColor,
  },
  gameCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  gameArea: {
    borderWidth: 4,
    borderColor: Colors.game.borderColor,
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 20,
    shadowColor: Colors.game.accentGold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.game.skyBackground,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopColor: Colors.game.borderColor,
    backgroundColor: Colors.game.groundColor,
  },
  scoreBox: {
    position: 'absolute',
    flexDirection: 'row',
  },
  scoreText: {
    fontWeight: '600',
    color: Colors.game.textColor,
    fontFamily: 'monospace',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.game.overlayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gameOver: {
    fontWeight: '700',
    color: Colors.game.textColor,
    letterSpacing: 2,
  },
  restart: {
    color: Colors.game.textColor,
  },
});
