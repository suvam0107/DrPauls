import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';
import { copyToClipboard } from '../../utils/clipboardUtils';

export interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const { colors } = useTheme();

  if (!visible) return null;

  const adminEmail = 'admin@drpauls.com';

  const handleCopyEmail = () => {
    playClickSound();
    copyToClipboard(adminEmail, 'Admin Email');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="key-outline" size={24} color={colors.primary} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
              <Text style={[styles.description, { color: colors.textMuted }]}>
                To reset your clinic account credentials, please contact the IT Administrator or Clinic Manager:
              </Text>

              <View style={[styles.emailBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="mail" size={16} color={colors.primary} />
                <Text style={[styles.emailText, { color: colors.text }]}>{adminEmail}</Text>
                <TouchableOpacity onPress={handleCopyEmail} style={styles.copyBtn} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  playClickSound();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.closeBtnText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginVertical: 4,
  },
  emailText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  copyBtn: {
    padding: 4,
  },
  closeBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
