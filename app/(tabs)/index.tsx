import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 220;
const GROUND_HEIGHT = 36;

const DINO_X = 40;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 44;
const DINO_HITBOX_WIDTH = 30;
const DINO_HITBOX_HEIGHT = 34;
const DINO_HITBOX_OFFSET_X = 8;
const CACTUS_WIDTH = 18;
const CACTUS_HEIGHT = 42;

const GRAVITY = 0.85;
const JUMP_VELOCITY = -13;
const INITIAL_SPEED = 5;
const MAX_SPEED = 11;

type Obstacle = {
  id: number;
  x: number;
};

export default function HomeScreen() {
  const [dinoY, setDinoY] = useState(0);
  const [dinoVelocity, setDinoVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([{ id: 1, x: GAME_WIDTH + 120 }]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const nextObstacleIdRef = useRef(2);

  const dinoTop = GAME_HEIGHT - GROUND_HEIGHT - DINO_HEIGHT - dinoY;
  const dinoBottom = GAME_HEIGHT - GROUND_HEIGHT - dinoY;

  const jump = useCallback(() => {
    if (gameOver) {
      setDinoY(0);
      setDinoVelocity(0);
      setObstacles([{ id: 1, x: GAME_WIDTH + 120 }]);
      nextObstacleIdRef.current = 2;
      setScore(0);
      setSpeed(INITIAL_SPEED);
      setGameOver(false);
      return;
    }

    if (dinoY <= 0.01) {
      setDinoVelocity(JUMP_VELOCITY);
    }
  }, [dinoY, gameOver]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [jump]);

  useEffect(() => {
    if (gameOver) return;

    const tick = setInterval(() => {
      setDinoVelocity((currentVelocity) => {
        const nextVelocity = currentVelocity + GRAVITY;
        setDinoY((currentY) => {
          const nextY = currentY - nextVelocity;
          if (nextY <= 0) {
            setDinoVelocity(0);
            return 0;
          }
          return nextY;
        });
        return nextVelocity;
      });

      setObstacles((currentObstacles) => {
        const moved = currentObstacles
          .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed }))
          .filter((obstacle) => obstacle.x + CACTUS_WIDTH > -8);

        const lastObstacle = moved[moved.length - 1];
        const shouldSpawn = !lastObstacle || lastObstacle.x < GAME_WIDTH - (140 + Math.random() * 120);

        if (shouldSpawn) {
          moved.push({ id: nextObstacleIdRef.current, x: GAME_WIDTH + 20 });
          nextObstacleIdRef.current += 1;
        }

        return moved;
      });

      setSpeed((current) => Math.min(MAX_SPEED, current + 0.0035));
      setScore((current) => current + 1);
    }, 16);

    return () => clearInterval(tick);
  }, [gameOver, speed]);

  useEffect(() => {
    if (gameOver) return;

    const dinoLeft = DINO_X + DINO_HITBOX_OFFSET_X;
    const dinoRight = dinoLeft + DINO_HITBOX_WIDTH;
    const dinoHitboxTop = dinoBottom - DINO_HITBOX_HEIGHT;
    const cactusTop = GAME_HEIGHT - GROUND_HEIGHT - CACTUS_HEIGHT;
    const cactusBottom = GAME_HEIGHT - GROUND_HEIGHT;

    const hit = obstacles.some((obstacle) => {
      const cactusLeft = obstacle.x;
      const cactusRight = obstacle.x + CACTUS_WIDTH;
      const overlapX = dinoRight > cactusLeft && dinoLeft < cactusRight;
      const overlapY = dinoBottom > cactusTop && dinoHitboxTop < cactusBottom;
      return overlapX && overlapY;
    });

    if (hit) {
      setGameOver(true);
      setHighScore((current) => Math.max(current, score));
    }
  }, [dinoBottom, gameOver, obstacles, score]);

  const shownScore = useMemo(() => Math.floor(score / 6), [score]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Dino Offline</Text>
      <Text style={styles.subtitle}>Tippe oder druecke Space zum Springen</Text>

      <Pressable onPress={jump} style={styles.gameArea}>
        <View style={styles.sky} />
        <View style={styles.ground} />

        <Image
          source={require('../../assets/images/chrome-dino-transparent.png')}
          style={[styles.dinoImage, { left: DINO_X, top: dinoTop }]}
        />

        {obstacles.map((obstacle) => (
          <View key={obstacle.id} style={[styles.cactus, { left: obstacle.x }]} />
        ))}

        <View style={styles.scoreBox}>
          <Text style={styles.scoreText}>Score: {shownScore}</Text>
          <Text style={styles.scoreText}>Best: {Math.floor(highScore / 6)}</Text>
        </View>

        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.gameOver}>Game Over</Text>
            <Text style={styles.restart}>Tippe zum Neustarten</Text>
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
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#121212',
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  gameArea: {
    width: GAME_WIDTH,
    maxWidth: '100%',
    height: GAME_HEIGHT,
    borderWidth: 2,
    borderColor: '#1c1c1c',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    position: 'relative',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fefefe',
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: GROUND_HEIGHT,
    borderTopWidth: 2,
    borderTopColor: '#1c1c1c',
    backgroundColor: '#f1f1f1',
  },
  dinoImage: {
    position: 'absolute',
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
  },
  cactus: {
    position: 'absolute',
    width: CACTUS_WIDTH,
    height: CACTUS_HEIGHT,
    bottom: GROUND_HEIGHT,
    backgroundColor: '#2c8b3f',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  scoreBox: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gameOver: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  restart: {
    fontSize: 14,
    color: '#222',
  },
});
