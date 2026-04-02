import { View, Text, StyleSheet } from 'react-native';
import { GAME } from '../constants';
import type { RenderState } from '../types';
import { DinoSprite } from './DinoSprite';
import { ObstacleSprite } from './ObstacleSprite';
import { CloudSprite } from './CloudSprite';
import { Colors, GameUI } from '../../constants/theme';

interface PlayerLaneProps {
  renderState: RenderState;
  scale: number;
  label: string;
  isLocal: boolean;
}

export function PlayerLane({ renderState, scale, label, isLocal }: PlayerLaneProps) {
  const { dino, obstacles, clouds, score, gameState, nightModeFade } = renderState;
  const dinoBottom = GAME.GROUND_HEIGHT + dino.y;

  return (
    <View style={styles.laneContainer}>
      {/* Sky */}
      <View
        style={[
          styles.sky,
          nightModeFade > 0 && {
            backgroundColor: `${Colors.game.nightModeBase}${nightModeFade})`,
          },
        ]}
      />

      {/* Ground */}
      <View
        style={[
          styles.ground,
          {
            height: GAME.GROUND_HEIGHT * scale,
            borderTopWidth: GameUI.borderWidth * scale,
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
        const obstacleBottom = GAME.GROUND_HEIGHT + obstacle.y;
        return (
          <ObstacleSprite
            key={obstacle.id}
            obstacle={obstacle}
            bottom={obstacleBottom}
            scale={scale}
          />
        );
      })}

      {/* Player Label */}
      <View style={[styles.labelContainer, { top: GameUI.scoreOffset * scale }]}>
        <Text style={[styles.label, { fontSize: 10 * scale }]}>
          {label} {isLocal && '(YOU)'}
        </Text>
      </View>

      {/* Score */}
      <View style={[styles.scoreContainer, { top: GameUI.scoreOffset * scale, right: GameUI.scoreOffset * scale }]}>
        <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>
          {String(score).padStart(5, '0')}
        </Text>
      </View>

      {/* Crashed Overlay */}
      {gameState === 'CRASHED' && (
        <View style={styles.crashedOverlay}>
          <Text style={[styles.crashedText, { fontSize: 16 * scale }]}>
            CRASHED
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  laneContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
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
  labelContainer: {
    position: 'absolute',
    left: 10,
  },
  label: {
    fontWeight: '700',
    color: Colors.game.textColor,
    fontFamily: 'monospace',
    opacity: 0.7,
  },
  scoreContainer: {
    position: 'absolute',
  },
  scoreText: {
    fontWeight: '600',
    color: Colors.game.textColor,
    fontFamily: 'monospace',
  },
  crashedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashedText: {
    fontWeight: '700',
    color: '#FF0000',
    letterSpacing: 1,
  },
});
