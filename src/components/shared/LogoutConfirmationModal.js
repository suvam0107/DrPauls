import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

/** Theme-aligned sign out confirmation modal matching Dr. Paul's Clinic design system */
export default function LogoutConfirmationModal({ visible, onCancel, onConfirm }) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onCancel}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Text Content */}
          <Text style={[styles.title, { color: colors.text }]}>Sign Out of Account?</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Are you sure you want to sign out?
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.surface }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.exitBtn, { backgroundColor: colors.danger }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
              <Text style={styles.exitText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 100,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelBtn: {},
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exitBtn: {},
  exitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
