import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GAME } from '../constants';

interface HorizonLineProps {
  speed: number;
}

/**
 * Scrolling horizon line at the bottom of the game
 * Creates infinite scroll effect by using two lines
 */
export function HorizonLine({ speed }: HorizonLineProps) {
  const xPos1 = useRef(0);
  const xPos2 = useRef(GAME.WIDTH);

  return (
    <View style={styles.container}>
      {/* Simple ground line - we'll use the border for now */}
      {/* In the future, this can be replaced with the horizon sprite */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: GAME.GROUND_HEIGHT,
    borderTopWidth: 2,
    borderTopColor: '#535353',
    backgroundColor: '#f7f7f7',
  },
});
