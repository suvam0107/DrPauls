import React, { ReactNode, useEffect } from 'react';
import { Dimensions, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BackTransitionType } from '../../utils/PredictiveBackContext';
import { usePredictiveBackContext } from '../../utils/PredictiveBackContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PredictiveBackWrapperProps {
  children: ReactNode;
  transition?: BackTransitionType;
  isActive?: boolean;
  slideDistance?: number;
  verticalDistance?: number;
  scaleAmount?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * PredictiveBackWrapper
 *
 * Drives a "commit" animation when the highest-priority back handler fires.
 * The frame-by-frame gesture-progress API (OnBackAnimationCallback) is an
 * Android 14 native API and requires an EAS dev build — it is NOT available
 * in Expo Go. This wrapper instead plays a spring/timing exit animation on
 * commit, which works universally across Expo Go and dev builds.
 */
export default function PredictiveBackWrapper({
  children,
  transition = 'slide',
  isActive = true,
  slideDistance = SCREEN_WIDTH,
  verticalDistance = SCREEN_HEIGHT * 0.3,
  scaleAmount = 0.08,
  style,
}: PredictiveBackWrapperProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const { getActiveHandler } = usePredictiveBackContext();

  // Reset to resting state whenever isActive changes (e.g. screen changed)
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    opacity.value = 1;
    scale.value = 1;
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    if (!isActive || transition === 'none') return {};

    switch (transition) {
      case 'slide':
        return { transform: [{ translateX: translateX.value }] };
      case 'fade':
        return { opacity: opacity.value };
      case 'scale-fade':
        return {
          opacity: opacity.value,
          transform: [{ scale: scale.value }],
        };
      case 'vertical':
        return { transform: [{ translateY: translateY.value }] };
      default:
        return {};
    }
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
