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
import { StyleSheet, Dimensions, Modal } from 'react-native';
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
}

// ---------------------------------------------------------------------------
// Inner sheet — rendered fresh on every open via Modal key reset
// ---------------------------------------------------------------------------
function InnerSheet({
  onClose,
  children,
  snapHeight,
}: Omit<BottomSheetProps, 'visible'> & { snapHeight: number }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const snapPoints = useMemo(() => {
    const pct = Math.min(90, Math.max(35, Math.round((snapHeight / SCREEN_H) * 100)));
    return [`${pct}%`, '95%'];
  }, [snapHeight]);

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

  const bottomPadding = Math.max(insets.bottom, 16);

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
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
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
}: BottomSheetProps) {
  // `isMounted` controls Modal visibility.
  // We delay unmounting so the close animation can play before the Modal
  // disappears from the screen.
  const [isMounted, setIsMounted] = useState(false);

  // Stable key — increments ONLY when a fresh open happens, NOT on every
  // render. This prevents InnerSheet from remounting (and replaying the
  // opening animation) when parent state changes while the sheet is open.
  const openCountRef = useRef(0);

  useEffect(() => {
    if (visible) {
      // New open: give InnerSheet a fresh key so its gorhom state is clean
      openCountRef.current += 1;
      setIsMounted(true);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    // The sheet gesture has completed and the sheet is fully hidden.
    // Wait for animation, then unmount the Modal so the next open
    // renders a completely fresh InnerSheet instance (fixes reopen bug).
    setTimeout(() => setIsMounted(false), 50);
    onClose();
  }, [onClose]);

  if (!isMounted) return null;

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Stable key across re-renders within one open session,
          but changes between opens to give a fresh gorhom instance */}
      <InnerSheet
        key={openCountRef.current}
        onClose={handleClose}
        snapHeight={snapHeight}
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
