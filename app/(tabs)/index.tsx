import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const { scale, gameWidth, gameHeight } = useMemo(() => {
    const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
    const maxGameWidth = Math.min(windowWidth - GameUI.screenPadding, GameUI.maxGameWidth);
    const maxGameHeight = windowHeight * GameUI.screenHeightRatio;
    let gw = maxGameWidth;
    let gh = gw / aspectRatio;
    if (gh > maxGameHeight) {
      gh = maxGameHeight;
      gw = gh * aspectRatio;
    }
    return { scale: gw / GAME.WIDTH, gameWidth: gw, gameHeight: gh };
  }, [windowWidth, windowHeight]);

  const gameAreaStyle = useMemo(() => [styles.gameArea, { width: gameWidth, height: gameHeight }], [gameWidth, gameHeight]);

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
    let lastTime = performance.now();
    let animationFrameId: number;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      engineRef.current.update(deltaTime);
      setRenderState(engineRef.current.getState());

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame((t) => { lastTime = t; animationFrameId = requestAnimationFrame(gameLoop); });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const { dino, obstacles, clouds, score, highScore, gameState, nightModeFade } = renderState;
  const dinoBottom = GAME.GROUND_HEIGHT + dino.y;

  return (
    <SafeAreaView style={styles.page} edges={['top', 'bottom']}>
      <Pressable
        onPressIn={handleTouchStart}
        onPressOut={handleTouchEnd}
        style={styles.pressable}
      >
        <View style={styles.topSection}>
          <Text style={styles.title} numberOfLines={1}>🦖 DINO CRASH</Text>
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

        <View style={styles.gameCard}>
          <View style={gameAreaStyle}>
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
                <Text style={[styles.gameOver, { fontSize: 26 * Math.min(scale, 1.5) }]}>GAME OVER</Text>
                <Text style={[styles.restart, { fontSize: 13 * Math.min(scale, 1.5) }]}>Tippen zum Neustart</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.controlText}>TIPPEN = SPRINGEN  •  HALTEN = DUCKEN</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.game.pageBackground,
  },
  pressable: {
    flex: 1,
    padding: GameUI.pagePadding,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.game.accentGold,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  scoreBoard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.game.gameBackground,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.game.subtitleText,
    letterSpacing: 2,
    opacity: 0.7,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.game.accentGold,
    fontFamily: 'monospace',
  },
  scoreDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  gameCard: {
    alignItems: 'center',
  },
  gameArea: {
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 16,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.game.overlayBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  gameOver: {
    fontWeight: '800',
    color: Colors.game.textColor,
    letterSpacing: 2,
  },
  restart: {
    color: Colors.game.subtitleText,
    opacity: 0.7,
  },
  controlText: {
    fontSize: 11,
    color: Colors.game.subtitleText,
    opacity: 0.5,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 8,
  },
});
