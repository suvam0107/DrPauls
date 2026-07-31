import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet from '../shared/BottomSheet';
import StatusChip from '../shared/StatusChip';
import RescheduleModal from './RescheduleModal';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatTime, todayISO } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../constants';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Ionicons } from '@expo/vector-icons';
import { Appointment, Patient } from '../../types';
import { playAppointmentSuccessSound, playClickSound } from '../../utils/feedback';

import PatientDetailModal from '../patient/PatientDetailModal';
import usePatientStore from '../../store/usePatientStore';

export interface ModalContentProps {
  appointment: Appointment;
  onClose: () => void;
  onEditPress: () => void;
  onPatientPress: (patient: Patient) => void;
}

function ModalContent({ appointment, onClose, onEditPress, onPatientPress }: ModalContentProps) {
  const { colors } = useTheme();
  const patients = usePatientStore((s) => s.patients);

  const patientObj: Patient = patients.find((p) => p.id === appointment.patientId || p.name.toLowerCase() === appointment.patientName.toLowerCase()) || {
    id: appointment.patientId || 'PAT-000',
    name: appointment.patientName,
    mobile: appointment.patientMobile || '9000000000',
    gender: 'Male' as const,
    enquirySource: 'Walk-in',
    parentDetails: [],
    therapistDetails: [],
    createdAt: todayISO(),
    updatedAt: todayISO(),
  };

  const today = todayISO();
  const now = new Date();
  const currentHHMM =
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Check if appointment is in the past
  const isPast =
    appointment.date < today ||
    (appointment.date === today && appointment.startTime < currentHHMM);

  const canReschedule =
    !isPast &&
    ([
      APPOINTMENT_STATUS.SCHEDULED,
      APPOINTMENT_STATUS.CONFIRMED,
      APPOINTMENT_STATUS.RESCHEDULED,
      APPOINTMENT_STATUS.PENDING,
    ] as string[]).includes(appointment.status);

  const canConfirm =
    !isPast &&
    appointment.status !== APPOINTMENT_STATUS.CONFIRMED &&
    appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
    appointment.status !== APPOINTMENT_STATUS.PAID;

  const canCancel =
    !isPast &&
    appointment.status !== APPOINTMENT_STATUS.CANCELLED &&
    appointment.status !== APPOINTMENT_STATUS.PAID;

  const canMarkPaid =
    appointment.status !== APPOINTMENT_STATUS.PAID &&
    appointment.status !== APPOINTMENT_STATUS.CANCELLED;

  const handleStatusChange = (status: string) => {
    useAppointmentStore.getState().updateStatus(appointment.id, status);
    playAppointmentSuccessSound();
    onClose();
  };

  const handleCancel = () => {
    useAppointmentStore.getState().cancelAppointment(appointment.id);
    playAppointmentSuccessSound();
    onClose();
  };

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      style={{ paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: 220 }}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          playClickSound();
          onPatientPress(patientObj);
        }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.title, { color: colors.primary }]}>{appointment.patientName}</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {appointment.patientMobile} • ID: {appointment.patientId} (Tap for details)
          </Text>
        </View>
        <StatusChip status={appointment.status} />
      </TouchableOpacity>

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
        {appointment.therapistName ? (
          <View style={styles.gridItem}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Therapist</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.therapistName}</Text>
          </View>
        ) : null}
        {appointment.prePaymentRequired ? (
          <View style={styles.gridItem}>
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Pre-payment</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              ₹{appointment.prePaymentAmount}
            </Text>
          </View>
        ) : null}
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
        {canReschedule && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              playClickSound();
              onEditPress();
            }}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Edit / Reschedule</Text>
          </TouchableOpacity>
        )}

        {canConfirm && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => handleStatusChange(APPOINTMENT_STATUS.CONFIRMED)}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Confirm</Text>
          </TouchableOpacity>
        )}

        {canMarkPaid && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.purple }]}
            onPress={() => handleStatusChange(APPOINTMENT_STATUS.PAID)}
          >
            <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Mark Paid</Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger }]}
            onPress={handleCancel}
          >
            <Ionicons name="close-circle-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheetScrollView>
  );
}

export interface AppointmentDetailModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

const AppointmentDetailModal = memo(function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);

  return (
    <>
      <BottomSheet visible={visible && !!appointment} onClose={onClose} snapHeight={460} keyboardBlurBehavior="none">
        {appointment ? (
          <ModalContent
            appointment={appointment}
            onClose={onClose}
            onEditPress={() => setShowReschedule(true)}
            onPatientPress={(pat) => setSelectedPatientForDetail(pat)}
          />
        ) : null}
      </BottomSheet>

      {/* Reschedule / Edit Modal */}
      <RescheduleModal
        visible={showReschedule}
        appointment={appointment}
        onClose={() => {
          setShowReschedule(false);
        }}
      />

      {/* Patient Detail Modal */}
      <PatientDetailModal
        patient={selectedPatientForDetail}
        visible={!!selectedPatientForDetail}
        onClose={() => setSelectedPatientForDetail(null)}
      />
    </>
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
  pastNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginBottom: 8,
  },
  pastNoticeText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
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
    minWidth: '45%',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
