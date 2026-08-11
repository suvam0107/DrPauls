import React, { ReactNode, useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 360);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SidebarContainerProps = {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  onOpen?: () => void;
  edgeSwipeEnabled?: boolean;
};

const SPRING_CONFIG = {
  damping: 24,
  stiffness: 240,
  mass: 0.7,
};

export default function SidebarContainer({
  children,
  open,
  onClose,
  onOpen,
  edgeSwipeEnabled = true,
}: SidebarContainerProps) {
  const { colors } = useTheme();

  const translateX = useSharedValue(open ? 0 : -SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(open ? 1 : 0);
  const startTranslateX = useSharedValue(open ? 0 : -SIDEBAR_WIDTH);

  const handleFinishClose = () => {
    onClose();
  };

  const handleFinishOpen = () => {
    onOpen?.();
  };

  useEffect(() => {
    if (open) {
      translateX.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 180 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [open]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      'worklet';
      startTranslateX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      const rawX = startTranslateX.value + event.translationX;
      const nextX = Math.max(-SIDEBAR_WIDTH, Math.min(0, rawX));

      translateX.value = nextX;
      backdropOpacity.value = 1 + nextX / SIDEBAR_WIDTH;
    })
    .onEnd((event) => {
      'worklet';
      // Determine open vs close based on flick velocity or drag distance
      const shouldOpen =
        event.velocityX < -400
          ? false
          : event.velocityX > 400
          ? true
          : translateX.value > -SIDEBAR_WIDTH * 0.5;

      if (shouldOpen) {
        translateX.value = withSpring(0, SPRING_CONFIG, (finished) => {
          if (finished && onOpen) {
            runOnJS(handleFinishOpen)();
          }
        });
        backdropOpacity.value = withTiming(1, { duration: 180 });
      } else {
        backdropOpacity.value = withTiming(0, { duration: 150 });
        translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG, (finished) => {
          if (finished) {
            runOnJS(handleFinishClose)();
          }
        });
      }
    });

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
    >
      {/* Backdrop pressable layer */}
      <AnimatedPressable
        pointerEvents={open ? 'auto' : 'none'}
        onPress={() => {
          backdropOpacity.value = withTiming(0, { duration: 150 });
          translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG, (finished) => {
            if (finished) {
              runOnJS(handleFinishClose)();
            }
          });
        }}
        style={[styles.backdrop, backdropStyle]}
      />

      {/* Invisible edge swipe trigger strip on left 32px of screen when closed */}
      {edgeSwipeEnabled && !open && (
        <GestureDetector gesture={panGesture}>
          <View
            style={styles.edgeTouchArea}
            pointerEvents="auto"
          />
        </GestureDetector>
      )}

      {/* Main Sidebar Drawer Panel */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: SIDEBAR_WIDTH,
              backgroundColor: colors.card,
              borderRightColor: colors.border,
            },
            sidebarStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sidebar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
    zIndex: 100,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  edgeTouchArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 90,
    backgroundColor: 'transparent',
  },
});
