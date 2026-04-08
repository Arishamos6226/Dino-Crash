import React, { useMemo } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { SPRITE_SHEET, SPRITE_SHEET_DIMENSIONS } from '../sprites';

interface SpriteProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ViewStyle;
  scale?: number;
}

export const Sprite = React.memo(function Sprite({ x, y, width, height, style, scale = 1 }: SpriteProps) {
  const containerStyle = useMemo(() => [
    {
      width: width * scale,
      height: height * scale,
      overflow: 'hidden' as const,
      position: 'absolute' as const,
    },
    style,
  ], [width, height, scale, style]);

  const imageStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: SPRITE_SHEET_DIMENSIONS.WIDTH * scale,
    height: SPRITE_SHEET_DIMENSIONS.HEIGHT * scale,
    left: -x * scale,
    top: -y * scale,
  }), [x, y, scale]);

  return (
    <View style={containerStyle}>
      <Image
        source={SPRITE_SHEET}
        style={imageStyle}
        resizeMode="stretch"
      />
    </View>
  );
});
