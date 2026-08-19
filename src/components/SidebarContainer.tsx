import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { playClickSound } from '../utils/feedback';

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

const SPRING_CONFIG = { damping: 24, stiffness: 240, mass: 0.7 };

export default function SidebarContainer({
  children,
  open,
  onClose,
  onOpen,
  edgeSwipeEnabled = true,
}: SidebarContainerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Shared animation values (stable object references — safe to close over in useMemo)
  const translateX = useSharedValue(open ? 0 : -SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(open ? 1 : 0);
  const startTranslateX = useSharedValue(-SIDEBAR_WIDTH);

  // ── Stable JS-thread callback refs ──────────────────────────────────────────
  // Using refs means useMemo gestures can safely use [] deps — the ref is always
  // current without invalidating the memoized gesture instance.
  const onCloseRef = useRef(onClose);
  const onOpenRef = useRef(onOpen);
  // Sync refs on every render (no effect needed — this is synchronous)
  onCloseRef.current = onClose;
  onOpenRef.current = onOpen;

  const handleFinishClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  const handleFinishOpen = useCallback(() => {
    onOpenRef.current?.();
  }, []);

  // Animate sidebar panel when the `open` prop changes from parent
  useEffect(() => {
    if (open) {
      translateX.value = withSpring(0, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, { duration: 160 });
    }
  }, [open]);

  // ── Shared gesture logic (reused in both gesture instances below) ────────────
  // Both gestures do identical work — they must be SEPARATE Gesture.Pan() objects
  // because RNGH v2 allows a gesture instance to be registered to exactly ONE
  // GestureDetector. Sharing an instance between two detectors silently breaks both.
  const makeGestureHandlers = () => ({
    onBegin: () => {
      'worklet';
      startTranslateX.value = translateX.value;
    },
    onUpdate: (event: { translationX: number }) => {
      'worklet';
      const clamped = Math.max(
        -SIDEBAR_WIDTH,
        Math.min(0, startTranslateX.value + event.translationX)
      );
      translateX.value = clamped;
      backdropOpacity.value = 1 + clamped / SIDEBAR_WIDTH;
    },
    onEnd: (event: { velocityX: number }) => {
      'worklet';
      const shouldOpen =
        event.velocityX > 300
          ? true
          : event.velocityX < -300
          ? false
          : translateX.value > -SIDEBAR_WIDTH * 0.5;

      if (shouldOpen) {
        translateX.value = withSpring(0, SPRING_CONFIG, (finished) => {
          if (finished) runOnJS(handleFinishOpen)();
        });
        backdropOpacity.value = withTiming(1, { duration: 200 });
      } else {
        backdropOpacity.value = withTiming(0, { duration: 160 });
        translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG, (finished) => {
          if (finished) runOnJS(handleFinishClose)();
        });
      }
    },
  });

  /**
   * OPEN gesture — attached to the 36px invisible edge strip (only when closed).
   * Only activates on a clear rightward swipe (translationX ≥ +12) so it doesn't
   * compete with vertical scrolls or system back gestures.
   */
  const openGesture = useMemo(() => {
    const h = makeGestureHandlers();
    return Gesture.Pan()
      .activeOffsetX(12)         // activate only on rightward swipe
      .failOffsetY([-25, 25])    // fail if vertical before horizontal (lets scroll views work)
      .onBegin(h.onBegin)
      .onUpdate(h.onUpdate)
      .onEnd(h.onEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFinishOpen, handleFinishClose]);

  /**
   * CLOSE gesture — attached to the visible sidebar panel (always rendered).
   * Activates on either direction so you can also re-open if you drag too far left.
   * failOffsetY keeps vertical scrolls inside the sidebar from triggering it.
   */
  const closeGesture = useMemo(() => {
    const h = makeGestureHandlers();
    return Gesture.Pan()
      .activeOffsetX([-12, 12])
      .failOffsetY([-30, 30])
      .onBegin(h.onBegin)
      .onUpdate(h.onUpdate)
      .onEnd(h.onEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFinishOpen, handleFinishClose]);

  // ── Animated styles ──────────────────────────────────────────────────────────
  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Edge strip starts below the header & sub-header region so interactive navigation buttons are never blocked
  const headerOffset = insets.top + 120;

  return (
    // box-none: this wrapper passes all touches through to children
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>

      {/* ── Backdrop (tap to close) ── */}
      <AnimatedPressable
        pointerEvents={open ? 'auto' : 'none'}
        onPress={() => {
          backdropOpacity.value = withTiming(0, { duration: 160 });
          translateX.value = withSpring(-SIDEBAR_WIDTH, SPRING_CONFIG, (finished) => {
            if (finished) runOnJS(handleFinishClose)();
          });
        }}
        style={[styles.backdrop, backdropStyle]}
      />

      {/* ── Edge swipe strip (open gesture, drawer closed) ── */}
      {edgeSwipeEnabled && !open && (
        <GestureDetector gesture={openGesture}>
          <View
            style={[styles.edgeTouchArea, { top: headerOffset }]}
            collapsable={false}
          />
        </GestureDetector>
      )}

      {/* ── Sidebar drawer panel (close gesture) ── */}
      <GestureDetector gesture={closeGesture}>
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
          collapsable={false}
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
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  edgeTouchArea: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 36,
    zIndex: 90,
    backgroundColor: 'transparent',
  },
});
