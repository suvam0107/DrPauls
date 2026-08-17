import React, { useEffect, useState } from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
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
  duration = 1400,
}: SkeletonBoxProps) {
  const { colors: themeColors } = useTheme();
  const [layoutWidth, setLayoutWidth] = useState(300);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.bezier(0.35, 0, 0.25, 1),
      }),
      -1,
      false
    );
  }, [duration, progress]);

  // Beam width spans the full element width (minimum 120px for small circles/badges)
  const beamWidth = Math.max(layoutWidth, 120);

  const animatedStyle = useAnimatedStyle(() => {
    // Start strictly outside the left bound (-beamWidth) and finish strictly outside the right bound (+layoutWidth)
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-beamWidth, layoutWidth]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const baseRadius =
    radius === 'round'
      ? typeof height === 'number'
        ? height / 2
        : 9999
      : typeof radius === 'number'
      ? radius
      : borderRadius;

  const baseBg = themeColors.dark ? '#1A2133' : '#E2E8F0';

  // Transparent feathering on edges so the beam seamlessly enters and leaves the container
  const gradientColors = themeColors.dark
    ? ([
        'rgba(255, 255, 255, 0)',
        'rgba(255, 255, 255, 0.04)',
        'rgba(255, 255, 255, 0.14)',
        'rgba(255, 255, 255, 0.04)',
        'rgba(255, 255, 255, 0)',
      ] as const)
    : ([
        'rgba(255, 255, 255, 0)',
        'rgba(255, 255, 255, 0.4)',
        'rgba(255, 255, 255, 0.95)',
        'rgba(255, 255, 255, 0.4)',
        'rgba(255, 255, 255, 0)',
      ] as const);

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - layoutWidth) > 1) {
          setLayoutWidth(w);
        }
      }}
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius: baseRadius,
          overflow: 'hidden',
          backgroundColor: baseBg,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: beamWidth,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}
