import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '../../theme/ThemeContext';

export interface SkeletonBoxProps {
  width?: number | `${number}%` | 'auto';
  height?: number | `${number}%` | 'auto';
  borderRadius?: number;
  radius?: number | 'round';
  style?: StyleProp<ViewStyle>;
}

export default function SkeletonBox({
  width = '100%',
  height = 20,
  borderRadius = 8,
  radius,
  style,
}: SkeletonBoxProps) {
  const { colors } = useTheme();

  const colorMode = colors.dark ? 'dark' : 'light';
  const skeletonColors = colors.dark
    ? [colors.card, colors.border, colors.card]
    : [colors.surface, colors.border, colors.surface];

  const skeleton = (
    <Skeleton
      colorMode={colorMode}
      colors={skeletonColors}
      width={width as any}
      height={height as any}
      radius={radius ?? borderRadius}
    />
  );

  if (style) {
    return <View style={style}>{skeleton}</View>;
  }

  return skeleton;
}
