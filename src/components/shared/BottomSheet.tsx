import React, {
  useRef,
  useMemo,
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { StyleSheet, Dimensions, Modal, Keyboard, StatusBar, Platform } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Context (preserved for backward compat with existing consumers)
// ---------------------------------------------------------------------------
export interface BottomSheetContextValue {
  expandSheet: () => void;
  collapseSheet: () => void;
  isExpanded: boolean;
  handleScroll: (e: any) => void;
}

export const BottomSheetContext = createContext<BottomSheetContextValue>({
  expandSheet: () => { },
  collapseSheet: () => { },
  isExpanded: false,
  handleScroll: () => { },
});

export const useBottomSheet = () => useContext(BottomSheetContext);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  snapHeight?: number;
  keyboardBlurBehavior?: 'restore' | 'none';
}

// ---------------------------------------------------------------------------
// Inner sheet — rendered fresh on every open via Modal key reset
// ---------------------------------------------------------------------------
function InnerSheet({
  onClose,
  children,
  snapHeight,
  keyboardBlurBehavior = 'none',
}: Omit<BottomSheetProps, 'visible'> & { snapHeight: number }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxPct = useMemo(() => {
    const statusBarH = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : (insets.top || 44);
    const safeTop = Math.max(insets.top || 0, statusBarH);
    const topSpace = safeTop + 28;
    const pct = Math.round(((SCREEN_H - topSpace) / SCREEN_H) * 100);
    return Math.min(80, Math.max(45, pct));
  }, [insets.top]);

  const snapPoints = useMemo(() => {
    const minPct = Math.min(maxPct - 5, Math.max(35, Math.round((snapHeight / SCREEN_H) * 100)));
    return [`${minPct}%`, `${maxPct}%`];
  }, [snapHeight, maxPct]);

  // Handle keyboard hide restoration if keyboardBlurBehavior === 'restore'
  useEffect(() => {
    if (keyboardBlurBehavior === 'restore') {
      const sub = Keyboard.addListener('keyboardDidHide', () => {
        sheetRef.current?.snapToIndex(0);
      });
      return () => sub.remove();
    }
  }, [keyboardBlurBehavior]);

  // Close the sheet from outside (e.g. hardware back button)
  const dismiss = useCallback(() => {
    sheetRef.current?.close();
  }, []);

  const handleChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      if (index === -1) {
        // Sheet has fully closed via gesture — notify parent
        onClose();
      }
    },
    [onClose]
  );

  const expandSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(1);
  }, []);

  const collapseSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(0);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    // GestureHandlerRootView is REQUIRED inside React Native Modal —
    // Modal creates a new native view tree that doesn't inherit the
    // GestureHandlerRootView at the app root.
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <BottomSheetContext.Provider
        value={{
          expandSheet,
          collapseSheet,
          isExpanded: currentIndex === 1,
          handleScroll: () => { },
        }}
      >
        <GorhomBottomSheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          onChange={handleChange}
          backdropComponent={renderBackdrop}
          // ── Theming ──────────────────────────────────────────────────────
          backgroundStyle={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            // Subtle top border to separate sheet from backdrop
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.border,
          }}
          handleIndicatorStyle={{
            backgroundColor: colors.border,
            width: 44,
            height: 5,
          }}
          // ── Gesture / motion ─────────────────────────────────────────────
          enablePanDownToClose
          enableOverDrag={false}
          keyboardBehavior="extend"
          keyboardBlurBehavior={keyboardBlurBehavior}
          android_keyboardInputMode="adjustResize"
          overDragResistanceFactor={10}
        >
          {children}
        </GorhomBottomSheet>
      </BottomSheetContext.Provider>
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Public component — mounts/unmounts InnerSheet via Modal for reliable reopen
// ---------------------------------------------------------------------------
export default function BottomSheet({
  visible,
  onClose,
  children,
  snapHeight = SCREEN_H * 0.6,
  keyboardBlurBehavior = 'none',
}: BottomSheetProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <InnerSheet
        onClose={onClose}
        snapHeight={snapHeight}
        keyboardBlurBehavior={keyboardBlurBehavior}
      >
        {children}
      </InnerSheet>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
