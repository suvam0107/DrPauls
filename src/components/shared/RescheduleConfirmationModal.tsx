import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { formatDateShort, formatTime } from '../../utils/dateUtils';
import { playConfirmationSound, playClickSound } from '../../utils/feedback';

import { usePredictiveBack } from '../../hooks/usePredictiveBack';
import PredictiveBackWrapper from './PredictiveBackWrapper';

export interface RescheduleConfirmationModalProps {
  visible: boolean;
  patientName: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  doctorName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Theme-aligned Reschedule Confirmation Popup Modal matching Dr. Paul's Clinic design system */
export default function RescheduleConfirmationModal({
  visible,
  patientName,
  fromDate,
  fromTime,
  toDate,
  toTime,
  doctorName,
  onCancel,
  onConfirm,
}: RescheduleConfirmationModalProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      playConfirmationSound();
    }
  }, [visible]);

  const handleCancel = () => {
    playClickSound();
    onCancel();
  };

  const handleConfirm = () => {
    playClickSound();
    onConfirm();
  };

  usePredictiveBack({
    priority: 9,
    transition: 'scale-fade',
    enabled: visible,
    onCommit: handleCancel,
  });

  if (!visible) return null;

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

        <PredictiveBackWrapper transition="scale-fade" isActive={visible}>
          <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Title & Patient Subtitle */}
          <Text style={[styles.title, { color: colors.text }]}>Confirm Reschedule</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            Reschedule appointment for <Text style={{ fontWeight: '700', color: colors.text }}>{patientName}</Text>?
          </Text>

          {/* Schedule Changes Breakdown Box */}
          <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>From:</Text>
              <Text style={[styles.detailValue, { color: colors.danger }]}>
                {formatDateShort(fromDate)} at {formatTime(fromTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>To:</Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                {formatDateShort(toDate)} at {formatTime(toTime)}
              </Text>
            </View>

            {doctorName ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Doctor:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{doctorName}</Text>
              </View>
            ) : null}
          </View>

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
              style={[styles.btn, styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={14} color="white" />
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </PredictiveBackWrapper>
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
    zIndex: 1000,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
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
  confirmBtn: {},
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
