import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playConfirmationSound, playLogoutSound, playClickSound } from '../../utils/feedback';

export interface LogoutConfirmationModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Theme-aligned sign out confirmation modal matching Dr. Paul's Clinic design system */
export default function LogoutConfirmationModal({ visible, onCancel, onConfirm }: LogoutConfirmationModalProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      playConfirmationSound();
    }
  }, [visible]);

  if (!visible) return null;

  const handleCancel = () => {
    playClickSound();
    onCancel();
  };

  const handleConfirm = () => {
    playLogoutSound();
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleCancel}>
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
              style={[styles.btn, styles.cancelBtn, { backgroundColor: '#52525B' }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle-outline" size={16} color="#FFFFFF" />
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.exitBtn, { backgroundColor: colors.danger }]}
              onPress={handleConfirm}
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 100,
    gap: 4,
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
    color: '#FFFFFF',
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
