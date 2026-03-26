import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { SPRITE_SHEET } from '../sprites';

interface SpriteProps {
  x: number; // X position in sprite sheet
  y: number; // Y position in sprite sheet
  width: number; // Width of the sprite
  height: number; // Height of the sprite
  style?: any; // Additional styles for positioning
  scale?: number; // Scale factor (default 1)
}

/**
 * Component that renders a specific sprite from the sprite sheet
 * by cropping it using overflow and negative margins
 */
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
          width: 1233 * scale, // Full sprite sheet width
          height: 68 * scale, // Full sprite sheet height
          left: -x * scale,
          top: -y * scale,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
