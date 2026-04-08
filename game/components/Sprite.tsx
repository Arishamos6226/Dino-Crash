import React, { useMemo } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { SPRITE_SHEET, SPRITE_SHEET_DIMENSIONS } from '../sprites';

interface SpriteProps {
  x: number;
  y: number;
  width: number;
  height: number;
  style?: ViewStyle;
}

export const Sprite = React.memo(function Sprite({ x, y, width, height, style }: SpriteProps) {
  const containerStyle = useMemo(() => [
    {
      width,
      height,
      overflow: 'hidden' as const,
      position: 'absolute' as const,
    },
    style,
  ], [width, height, style]);

  const imageStyle = useMemo(() => ({
    position: 'absolute' as const,
    width: SPRITE_SHEET_DIMENSIONS.WIDTH,
    height: SPRITE_SHEET_DIMENSIONS.HEIGHT,
    left: -x,
    top: -y,
  }), [x, y]);

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
