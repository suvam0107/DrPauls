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
  colors?: string[];
  duration?: number;
  backgroundSize?: number;
}

export default function SkeletonBox({
  width = '100%',
  height = 20,
  borderRadius = 8,
  radius,
  style,
  colors: customColors,
  duration = 1200,
  backgroundSize = 3,
}: SkeletonBoxProps) {
  const { colors: themeColors } = useTheme();

  const colorMode = themeColors.dark ? 'dark' : 'light';

  // High-contrast shimmer color stops [base, highlight, base]
  const defaultColors = themeColors.dark
    ? ['#0E131F', '#2C3A59', '#0E131F']
    : ['#E4E4E7', '#FFFFFF', '#E4E4E7'];

  const skeletonColors = customColors ?? defaultColors;

  const skeleton = (
    <Skeleton
      colorMode={colorMode}
      colors={skeletonColors}
      width={width as any}
      height={height as any}
      radius={radius ?? borderRadius}
      backgroundSize={backgroundSize}
      transition={{
        translateX: {
          type: 'timing',
          duration,
        },
      }}
    />
  );

  if (style) {
    return <View style={style}>{skeleton}</View>;
  }

  return skeleton;
}

