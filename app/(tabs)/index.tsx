import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GameEngine } from '../../game/GameEngine';
import { GAME } from '../../game/constants';
import type { RenderState } from '../../game/types';
import { DinoSprite } from '../../game/components/DinoSprite';
import { ObstacleSprite } from '../../game/components/ObstacleSprite';
import { CloudSprite } from '../../game/components/CloudSprite';
import { Colors, GameUI } from '../../constants/theme';

export default function HomeScreen() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const engineRef = useRef<GameEngine>(new GameEngine());
  const [renderState, setRenderState] = useState<RenderState>(
    engineRef.current.getState()
  );

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

  const handleDuck = useCallback((isDucking: boolean) => {
    engineRef.current.duck(isDucking);
  }, []);

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

        <View style={[styles.scoreBox, { top: GameUI.scoreOffset * scale, right: GameUI.scoreOffset * scale, gap: GameUI.scoreGap * scale }]}>
          <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>HI {String(highScore).padStart(5, '0')}</Text>
          <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>{String(score).padStart(5, '0')}</Text>
        </View>

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
    backgroundColor: Colors.game.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: GameUI.pagePadding,
    gap: GameUI.pageGap,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.game.titleText,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.game.subtitleText,
    marginBottom: 8,
    textAlign: 'center',
  },
  gameArea: {
    borderWidth: GameUI.borderWidth,
    borderColor: Colors.game.borderColor,
    backgroundColor: Colors.game.gameBackground,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
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
