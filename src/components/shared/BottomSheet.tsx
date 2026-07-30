import React, { useEffect, useRef, useState, createContext, useContext, ReactNode } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  PanResponder,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');

export interface BottomSheetContextValue {
  expandSheet: () => void;
  collapseSheet: () => void;
  isExpanded: boolean;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  expandSheet: () => {},
  collapseSheet: () => {},
  isExpanded: false,
  handleScroll: () => {},
});

export const useBottomSheet = () => useContext(BottomSheetContext);

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number;
}

/**
 * Ultra-fast smooth bottom sheet with safe area inset protection,
 * instant drag-to-maximize/close, zero-lag exit transition, and scroll-to-dismiss.
 */
export default function BottomSheet({
  visible,
  onClose,
  children,
  snapHeight = SCREEN_H * 0.6,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 16);
  const topMargin = Math.max(insets.top + 12, 44);
  const fullHeight = SCREEN_H - topMargin;

  const heightValue = useSharedValue(snapHeight);
  const translateY = useSharedValue(snapHeight);
  const opacity = useSharedValue(0);

  const [isMounted, setIsMounted] = useState(visible);
  const isExpandedRef = useRef(false);
  const isClosingRef = useRef(false);

  const expandSheet = () => {
    if (!isExpandedRef.current && !isClosingRef.current) {
      isExpandedRef.current = true;
      heightValue.value = withTiming(fullHeight, { duration: 110, easing: Easing.out(Easing.quad) });
    }
  };

  const collapseSheet = () => {
    if (isExpandedRef.current && !isClosingRef.current) {
      isExpandedRef.current = false;
      heightValue.value = withTiming(snapHeight, { duration: 110, easing: Easing.out(Easing.quad) });
    }
  };

  const finishClose = () => {
    isClosingRef.current = false;
    setIsMounted(false);
    onClose();
  };

  const animateDismiss = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    translateY.value = withTiming(snapHeight + 50, { duration: 120, easing: Easing.in(Easing.quad) });
    opacity.value = withTiming(0, { duration: 100 }, () => {
      runOnJS(finishClose)();
    });
  };

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsMounted(true);
      isExpandedRef.current = false;
      heightValue.value = snapHeight;
      opacity.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
    } else if (isMounted && !isClosingRef.current) {
      animateDismiss();
    }
  }, [visible, snapHeight]);

  const handleDismiss = () => {
    animateDismiss();
  };

  // Handle child scroll events: when scrolling DOWN while at top of scroll view, minimize/close sheet
  const lastScrollY = useRef(0);
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 4) {
      expandSheet();
    } else if (y < -15 || (y <= 0 && lastScrollY.current > 5)) {
      if (isExpandedRef.current) {
        collapseSheet();
      } else {
        handleDismiss();
      }
    }
    lastScrollY.current = y;
  };

  // Drag handle pan responder for drag up (maximize) and drag down (minimize/close)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2 || Math.abs(gestureState.vy) > 0.1,
      onPanResponderMove: (_, gestureState) => {
        // Drag UP to maximize
        if (gestureState.dy < -6 || gestureState.vy < -0.1) {
          runOnJS(expandSheet)();
          translateY.value = withTiming(0, { duration: 60 });
          return;
        }

        // Drag down translation
        if (gestureState.dy > 0 && !isExpandedRef.current) {
          translateY.value = gestureState.dy;
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Dragged UP to maximize
        if (gestureState.dy < -10 || gestureState.vy < -0.15) {
          runOnJS(expandSheet)();
          translateY.value = withTiming(0, { duration: 80 });
          return;
        }

        // Dragged DOWN when expanded -> collapse
        if (gestureState.dy > 15 && isExpandedRef.current) {
          runOnJS(collapseSheet)();
          translateY.value = withTiming(0, { duration: 80 });
          return;
        }

        // Dragged DOWN when not expanded -> close modal
        if (gestureState.dy > 40 || gestureState.vy > 0.3) {
          runOnJS(handleDismiss)();
        } else {
          translateY.value = withTiming(0, { duration: 80, easing: Easing.out(Easing.quad) });
        }
      },
    })
  ).current;

  const animatedHeightStyle = useAnimatedStyle(() => ({
    height: heightValue.value,
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!isMounted) return null;

  return (
    <BottomSheetContext.Provider
      value={{
        expandSheet,
        collapseSheet,
        isExpanded: isExpandedRef.current,
        handleScroll,
      }}
    >
      <Modal
        visible={isMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleDismiss}>
            <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />
          </TouchableWithoutFeedback>

          {/* Sheet container */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kvWrapper}
            pointerEvents="box-none"
          >
            <Animated.View style={[animatedHeightStyle]}>
              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    paddingBottom: bottomPadding,
                  },
                ]}
              >
                {/* Drag Handle Bar */}
                <View style={styles.handleContainer} {...panResponder.panHandlers}>
                  <View style={[styles.handle, { backgroundColor: colors.border }]} />
                </View>
                {children}
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </BottomSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  kvWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    flex: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  handleContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
});
