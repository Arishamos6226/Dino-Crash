import React from 'react';
import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import { SPRITE_SHEET, SPRITE_SHEET_DIMENSIONS } from '../sprites';

interface SpriteProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ViewStyle;
  scale?: number;
}

export function Sprite({ x, y, width, height, style, scale = 1 }: SpriteProps) {
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <View
      style={[
        {
          width: scaledWidth,
          height: scaledHeight,
          overflow: 'hidden',
          position: 'absolute',
        },
        style,
      ]}
    >
      <Image
        source={SPRITE_SHEET}
        style={{
          position: 'absolute',
          width: SPRITE_SHEET_DIMENSIONS.WIDTH * scale,
          height: SPRITE_SHEET_DIMENSIONS.HEIGHT * scale,
          left: -x * scale,
          top: -y * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
