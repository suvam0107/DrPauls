import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Custom themed Toast component for Dr. Paul's Clinic.
 * Dynamically binds background color, text color, and border styling to the application's active theme (Light/Dark).
 * Positioned cleanly above the bottom navigation bar with safe area inset protection.
 */
export default function AppToast() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Bottom offset calculated to sit cleanly above bottom navigation bar
  const bottomOffset = Math.max(insets.bottom + 74, 84);

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

  return <Toast config={toastConfig} bottomOffset={bottomOffset} />;
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
