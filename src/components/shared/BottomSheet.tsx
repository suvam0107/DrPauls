import React, { useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  PanResponder,
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
  isExpanded: boolean;
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  expandSheet: () => {},
  isExpanded: false,
});

export const useBottomSheet = () => useContext(BottomSheetContext);

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number;
}

/**
 * Ultra-fast smooth bottom sheet with full safe area inset protection, instant drag-to-maximize & scroll auto-expansion.
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
  const isExpandedRef = useRef(false);

  const expandSheet = () => {
    if (!isExpandedRef.current) {
      isExpandedRef.current = true;
      heightValue.value = withTiming(fullHeight, { duration: 90, easing: Easing.out(Easing.quad) });
    }
  };

  const collapseSheet = () => {
    if (isExpandedRef.current) {
      isExpandedRef.current = false;
      heightValue.value = withTiming(snapHeight, { duration: 90, easing: Easing.out(Easing.quad) });
    }
  };

  useEffect(() => {
    if (visible) {
      isExpandedRef.current = false;
      heightValue.value = snapHeight;
      opacity.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = withTiming(0, { duration: 90 });
      translateY.value = withTiming(snapHeight, { duration: 100 });
    }
  }, [visible, snapHeight]);

  const handleDismiss = () => {
    translateY.value = withTiming(snapHeight, { duration: 100, easing: Easing.in(Easing.quad) });
    opacity.value = withTiming(0, { duration: 80 }, () => {
      runOnJS(onClose)();
    });
  };

  // Instant drag handle pan responder for drag to maximize (up) and drag to minimize/close (down)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 2 || Math.abs(gestureState.vy) > 0.1,
      onPanResponderMove: (_, gestureState) => {
        // Instant drag UP to maximize
        if (gestureState.dy < -6 || gestureState.vy < -0.1) {
          runOnJS(expandSheet)();
          translateY.value = withTiming(0, { duration: 60 });
          return;
        }

        // Drag down translation when not expanded
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

        // Dragged DOWN when expanded -> collapse to initial snap height
        if (gestureState.dy > 15 && isExpandedRef.current) {
          runOnJS(collapseSheet)();
          translateY.value = withTiming(0, { duration: 80 });
          return;
        }

        // Dragged DOWN when not expanded -> close modal
        if (gestureState.dy > 50 || gestureState.vy > 0.35) {
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

  if (!visible) return null;

  return (
    <BottomSheetContext.Provider value={{ expandSheet, isExpanded: isExpandedRef.current }}>
      <Modal
        visible={visible}
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
