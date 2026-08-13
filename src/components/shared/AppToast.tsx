import { View, Text, StyleSheet, Modal } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Custom themed Toast component for Dr. Paul's Clinic.
 * Dynamically binds background color, text color, and border styling to the application's active theme (Light/Dark).
 * Rendered inside a transparent Modal layer with pointerEvents="box-none" to display above all native modals & bottom nav.
 */
export interface AppToastProps {
  position?: 'top' | 'bottom';
  bottomOffset?: number;
  topOffset?: number;
}

export default function AppToast({ position = 'bottom', bottomOffset: customBottomOffset, topOffset }: AppToastProps = {}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const defaultBottomOffset = Math.max(insets.bottom + 74, 84);
  const effectiveBottomOffset = customBottomOffset ?? defaultBottomOffset;

  const toastConfig: ToastConfig = {
    success: (props: ToastConfigParams<any>) => (
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: colors.success,
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={22} color={colors.success} style={styles.icon} />
        <View style={styles.textContainer}>
          {props.text1 ? <Text style={[styles.text1, { color: colors.text }]}>{props.text1}</Text> : null}
          {props.text2 ? <Text style={[styles.text2, { color: colors.textMuted }]}>{props.text2}</Text> : null}
        </View>
      </View>
    ),
    error: (props: ToastConfigParams<any>) => (
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: colors.danger,
          },
        ]}
      >
        <Ionicons name="alert-circle" size={22} color={colors.danger} style={styles.icon} />
        <View style={styles.textContainer}>
          {props.text1 ? <Text style={[styles.text1, { color: colors.text }]}>{props.text1}</Text> : null}
          {props.text2 ? <Text style={[styles.text2, { color: colors.textMuted }]}>{props.text2}</Text> : null}
        </View>
      </View>
    ),
    info: (props: ToastConfigParams<any>) => (
      <View
        style={[
          styles.toastCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <Ionicons name="information-circle" size={22} color={colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          {props.text1 ? <Text style={[styles.text1, { color: colors.text }]}>{props.text1}</Text> : null}
          {props.text2 ? <Text style={[styles.text2, { color: colors.textMuted }]}>{props.text2}</Text> : null}
        </View>
      </View>
    ),
  };

  return (
    <Toast
      config={toastConfig}
      position={position}
      bottomOffset={effectiveBottomOffset}
      topOffset={topOffset || Math.max(insets.top + 10, 40)}
    />
  );
}

const styles = StyleSheet.create({
  toastCard: {
    width: '90%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 999999,
    zIndex: 999999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    fontSize: 14,
    fontWeight: '700',
  },
  text2: {
    fontSize: 12,
    marginTop: 2,
  },
});
