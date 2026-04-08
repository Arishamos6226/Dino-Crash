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

      <View style={[styles.labelContainer, { top: GameUI.scoreOffset * scale }]}>
        <Text style={[
          styles.label,
          { fontSize: 10 * scale },
          isLocal && styles.labelLocal,
        ]}>
          {label}
        </Text>
      </View>

      <View style={[styles.scoreContainer, { top: GameUI.scoreOffset * scale, right: GameUI.scoreOffset * scale }]}>
        <Text style={[styles.scoreText, { fontSize: 12 * scale }]}>
          {String(score).padStart(5, '0')}
        </Text>
      </View>

      {gameState === 'CRASHED' && (
        <View style={styles.crashedOverlay}>
          <Text style={[styles.lostText, { fontSize: 20 * scale }]}>
            LOST
          </Text>
          <Text style={[styles.finalScoreText, { fontSize: 14 * scale }]}>
            Score: {String(score).padStart(5, '0')}
          </Text>
        </View>
      )}

      <DinoSprite dino={dino} bottom={dinoBottom} scale={scale} />
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
  labelLocal: {
    color: Colors.game.playerHighlight,
    opacity: 1,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lostText: {
    fontWeight: '700',
    color: Colors.game.casinoRed,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  finalScoreText: {
    fontWeight: '700',
    color: Colors.game.accentGold,
    fontFamily: 'monospace',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
