import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import StatusChip from '../shared/StatusChip';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../constants';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Ionicons } from '@expo/vector-icons';

function ModalContent({ appointment, onClose }) {
  const { colors } = useTheme();
  const { expandSheet } = useBottomSheet();

  const handleStatusChange = (status) => {
    useAppointmentStore.getState().updateStatus(appointment.id, status);
    onClose();
  };

  const handleCancel = () => {
    useAppointmentStore.getState().cancelAppointment(appointment.id);
    onClose();
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={(e) => {
        if (e.nativeEvent.contentOffset.y > 4) {
          expandSheet();
        }
      }}
      scrollEventThrottle={16}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{appointment.patientName}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {appointment.patientMobile} • ID: {appointment.patientId}
          </Text>
        </View>
        <StatusChip status={appointment.status} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Doctor</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.doctorName}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Date & Time</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>
            {formatDate(appointment.date)}, {formatTime(appointment.startTime)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Service</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.serviceType}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Visit Type</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.visitType} Visit</Text>
        </View>
        {appointment.therapistName && (
          <View style={styles.gridItem}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Therapist</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.therapistName}</Text>
          </View>
        )}
        {appointment.prePaymentRequired && (
          <View style={styles.gridItem}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Pre-payment</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              ₹{appointment.prePaymentAmount}
            </Text>
          </View>
        )}
      </View>

      {appointment.remark ? (
        <View style={styles.remarkBox}>
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Remark</Text>
          <Text style={[styles.remarkText, { color: colors.text }]}>{appointment.remark}</Text>
        </View>
      ) : null}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Action Buttons */}
      <View style={styles.actions}>
        {appointment.status !== APPOINTMENT_STATUS.CONFIRMED && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.successBg }]}
            onPress={() => handleStatusChange(APPOINTMENT_STATUS.CONFIRMED)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.actionBtnText, { color: colors.success }]}>Confirm</Text>
          </TouchableOpacity>
        )}

        {appointment.status !== APPOINTMENT_STATUS.PAID && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.purpleBg }]}
            onPress={() => handleStatusChange(APPOINTMENT_STATUS.PAID)}
          >
            <Ionicons name="cash-outline" size={18} color={colors.purple} />
            <Text style={[styles.actionBtnText, { color: colors.purple }]}>Mark Paid</Text>
          </TouchableOpacity>
        )}

        {appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.dangerBg }]}
            onPress={handleCancel}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const AppointmentDetailModal = memo(function AppointmentDetailModal({ visible, appointment, onClose }) {
  if (!appointment || !visible) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={440}>
      <ModalContent appointment={appointment} onClose={onClose} />
    </BottomSheet>
  );
});

export default AppointmentDetailModal;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '46%',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  remarkBox: {
    marginTop: 12,
  },
  remarkText: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
