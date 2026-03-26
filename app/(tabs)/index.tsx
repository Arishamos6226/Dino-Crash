import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GameEngine } from '../../game/GameEngine';
import { GAME } from '../../game/constants';
import type { RenderState } from '../../game/types';
import { DinoSprite } from '../../game/components/DinoSprite';
import { ObstacleSprite } from '../../game/components/ObstacleSprite';
import { CloudSprite } from '../../game/components/CloudSprite';

export default function HomeScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const engineRef = useRef<GameEngine>(new GameEngine());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [renderState, setRenderState] = useState<RenderState>(
    engineRef.current.getState()
  );

  // Calculate responsive game dimensions (mobile-first)
  // Use most of the screen width with padding, maintain aspect ratio
  const aspectRatio = GAME.WIDTH / GAME.HEIGHT;
  const maxGameWidth = Math.min(windowWidth - 32, 800); // Max 800px or screen width - padding
  const maxGameHeight = windowHeight * 0.4; // Use 40% of screen height

  // Calculate actual dimensions maintaining aspect ratio
  let gameWidth = maxGameWidth;
  let gameHeight = gameWidth / aspectRatio;

  // If height is too large, recalculate based on height
  if (gameHeight > maxGameHeight) {
    gameHeight = maxGameHeight;
    gameWidth = gameHeight * aspectRatio;
  }

  // Calculate scale factor for positioning elements
  const scale = gameWidth / GAME.WIDTH;

  const handleJump = useCallback(() => {
    engineRef.current.jump();
  }, []);

  const handleDuck = useCallback((isDucking: boolean) => {
    engineRef.current.duck(isDucking);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        handleJump();
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        handleDuck(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        handleDuck(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    }
  }, [handleJump, handleDuck]);

  // Game loop - using requestAnimationFrame for better performance
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

  // Calculate dino position (convert from game coordinates to screen coordinates)
  // In game coordinates, y=0 means on the ground
  // In React Native, bottom property is distance from bottom of container
  // Ground is GAME.GROUND_HEIGHT pixels from bottom, so dino sits on top of it
  const dinoBottom = GAME.GROUND_HEIGHT + dino.y;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Dino-Crash</Text>
      <Text style={styles.subtitle}>Tap to Jump • Swipe Down to Duck</Text>

      <Pressable
        onPress={handleJump}
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
              backgroundColor: `rgba(32, 32, 32, ${nightModeFade})`,
            },
          ]}
        />
        <View
          style={[
            styles.ground,
            {
              height: GAME.GROUND_HEIGHT * scale,
              borderTopWidth: 2 * scale,
            }
          ]}
        />

        {/* Clouds */}
        {clouds.map((cloud) => (
          <CloudSprite key={cloud.id} cloud={cloud} scale={scale} />
        ))}

        {/* Dino */}
        <DinoSprite dino={dino} bottom={dinoBottom} scale={scale} />

        {/* Obstacles */}
        {obstacles.map((obstacle) => {
          // obstacle.y is height above ground in game coordinates
          // Convert to React Native bottom positioning
          const obstacleBottom = GAME.GROUND_HEIGHT + obstacle.y;
          return <ObstacleSprite key={obstacle.id} obstacle={obstacle} bottom={obstacleBottom} scale={scale} />;
        })}

        {/* Score */}
        <View style={[styles.scoreBox, { top: 4 * scale, right: 4 * scale, gap: 8 * scale }]}>
          <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>HI {String(highScore).padStart(5, '0')}</Text>
          <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>{String(score).padStart(5, '0')}</Text>
        </View>

        {/* Game Over Overlay */}
        {gameState === 'CRASHED' && (
          <View style={styles.overlay}>
            <Text style={[styles.gameOver, { fontSize: 24 * Math.min(scale, 1.5) }]}>G A M E  O V E R</Text>
            <Text style={[styles.restart, { fontSize: 12 * Math.min(scale, 1.5) }]}>Tap to Restart</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    textAlign: 'center',
  },
  gameArea: {
    // width and height set dynamically via inline styles
    borderWidth: 2,
    borderColor: '#535353',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f7f7f7',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // height and borderTopWidth set dynamically
    borderTopColor: '#535353',
    backgroundColor: '#f7f7f7',
  },
  scoreBox: {
    position: 'absolute',
    // top, right, gap set dynamically
    flexDirection: 'row',
  },
  scoreText: {
    // fontSize set dynamically
    fontWeight: '600',
    color: '#535353',
    fontFamily: 'monospace',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 247, 247, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gameOver: {
    // fontSize set dynamically
    fontWeight: '700',
    color: '#535353',
    letterSpacing: 2,
  },
  restart: {
    // fontSize set dynamically
    color: '#535353',
  },
});
