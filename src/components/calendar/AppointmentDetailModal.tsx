import React, { memo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet from '../shared/BottomSheet';
import StatusChip from '../shared/StatusChip';
import RescheduleModal from './RescheduleModal';
import { useTheme } from '../../theme/ThemeContext';
import { formatDate, formatDateShort, formatTime, todayISO } from '../../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../../constants';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Ionicons } from '@expo/vector-icons';
import { Appointment, Patient } from '../../types';
import { playAppointmentSuccessSound, playClickSound } from '../../utils/feedback';

import PatientDetailModal from '../patient/PatientDetailModal';
import usePatientStore from '../../store/usePatientStore';

import useCenterStore from '../../store/useCenterStore';
import useUIStore from '../../store/useUIStore';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { formatAppointmentText, shareDetails } from '../../utils/shareUtils';

import Toast from 'react-native-toast-message';
import usePackageStore from '../../store/usePackageStore';

export interface ModalContentProps {
  appointment: Appointment;
  onClose: () => void;
  onEditPress: () => void;
  onPatientPress: (patient: Patient) => void;
  onOpenEnrollmentTimeline?: (enrollmentId: string) => void;
  hidePackageTimelineLink?: boolean;
}

function ModalContent({
  appointment,
  onClose,
  onEditPress,
  onPatientPress,
  onOpenEnrollmentTimeline,
  hidePackageTimelineLink,
}: ModalContentProps) {
  const { colors } = useTheme();
  const patients = usePatientStore((s) => s.patients);
  const centers = useCenterStore((s) => s.centers);
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const activeCenter = centers.find((c) => c.id === activeCenterId) || centers[0];
  const enrollments = usePackageStore((s) => s.enrollments);

  const matchedEnrollment = enrollments.find(
    (e) =>
      (appointment.enrollmentId && e.enrollmentId === appointment.enrollmentId) ||
      e.sessionIds.includes(appointment.id) ||
      (e.patientId === appointment.patientId && e.serviceType === appointment.serviceType && e.status !== 'Completed')
  );

  const isPackagedVisit = appointment.isPackage || !!appointment.enrollmentId || !!matchedEnrollment;
  const targetEnrollmentId = appointment.enrollmentId || matchedEnrollment?.enrollmentId;

  const patientObj: Patient = patients.find((p) => p.id === appointment.patientId || p.name.toLowerCase() === appointment.patientName.toLowerCase()) || {
    id: appointment.patientId || 'PAT-000',
    name: appointment.patientName,
    mobile: appointment.patientMobile || '9000000000',
    gender: 'Male' as const,
    email: '',
    address: '',
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

  const formattedDetails = formatAppointmentText(appointment, patientObj, activeCenter);

  const handleCopyDetails = () => {
    copyToClipboard(formattedDetails, 'Appointment Details');
  };

  const handleShareDetails = () => {
    shareDetails('Appointment Details', formattedDetails);
  };

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      style={{ paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: 220 }}
    >
      {/* Header Profile with Patient link & plain Copy/Share icons */}
      <View style={styles.header}>
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => {
            playClickSound();
            onPatientPress(patientObj);
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.title, { color: colors.primary }]}>{appointment.patientName}</Text>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {appointment.patientMobile} • Tap for patient details
          </Text>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <StatusChip status={appointment.status} date={appointment.date} />

          {/* Plain Copy & Share Icons side-by-side */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              onPress={handleCopyDetails}
              activeOpacity={0.7}
              hitSlop={6}
            >
              <Ionicons name="copy-outline" size={19} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareDetails}
              activeOpacity={0.7}
              hitSlop={6}
            >
              <Ionicons name="share-social-outline" size={19} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Grid of Details with individual long-press copy */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridItem}
          onLongPress={() => copyToClipboard(appointment.id, 'Appointment ID')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Appt ID</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>#{appointment.id}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onLongPress={() => copyToClipboard(appointment.doctorName, 'Doctor Name')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Doctor</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.doctorName}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onLongPress={() =>
            copyToClipboard(
              `${formatDate(appointment.date)}, ${formatTime(appointment.startTime)}`,
              'Date & Time'
            )
          }
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Date & Time</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>
            {formatDate(appointment.date)}, {formatTime(appointment.startTime)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onLongPress={() => copyToClipboard(appointment.serviceType, 'Service')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Service</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.serviceType}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          onLongPress={() => copyToClipboard(`${appointment.visitType} Visit`, 'Visit Type')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Visit Type</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.visitType} Visit</Text>
        </TouchableOpacity>

        {appointment.therapistName ? (
          <TouchableOpacity
            style={styles.gridItem}
            onLongPress={() => copyToClipboard(appointment.therapistName || '', 'Therapist')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Therapist</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{appointment.therapistName}</Text>
          </TouchableOpacity>
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

      {/* Package Session Banner — hidden if hidePackageTimelineLink is true */}
      {isPackagedVisit && !hidePackageTimelineLink && (
        <TouchableOpacity
          style={[styles.packageBand, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
          onPress={() => {
            if (targetEnrollmentId && onOpenEnrollmentTimeline) {
              playClickSound();
              onOpenEnrollmentTimeline(targetEnrollmentId);
            } else if (targetEnrollmentId) {
              playClickSound();
              Toast.show({
                type: 'info',
                text1: 'Package Enrollment',
                text2: `Linked to Enrollment ID: ${targetEnrollmentId}`,
                position: 'bottom',
              });
            } else {
              playClickSound();
              Toast.show({
                type: 'info',
                text1: 'Packaged Treatment Visit',
                text2: 'Treatment visit logged under patient ERP package.',
                position: 'bottom',
              });
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.packageBandRow}>
            <View style={[styles.packageIconBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="layers" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.packageBandTitle, { color: colors.primary }]}>
                {matchedEnrollment
                  ? matchedEnrollment.packageName
                  : appointment.sessionNumber
                    ? `Session ${appointment.sessionNumber} (Packaged Visit)`
                    : 'Packaged Treatment Visit'}
              </Text>
              <Text style={[styles.packageBandSub, { color: colors.text }]}>
                {targetEnrollmentId ? `ID: ${targetEnrollmentId} • ` : ''}View Session Timeline
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>
      )}

      {appointment.originalSchedule ? (
        <View style={[styles.originalScheduleBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.originalScheduleTitleRow}>
            <Ionicons name="swap-horizontal-outline" size={15} color="#D97706" />
            <Text style={styles.originalScheduleTitle}>Original Scheduling Details</Text>
          </View>
          <Text style={[styles.originalScheduleText, { color: colors.text }]}>
            Originally scheduled on: {formatDate(appointment.originalSchedule.date)} at {formatTime(appointment.originalSchedule.startTime)}
          </Text>
          {appointment.originalSchedule.doctorName ? (
            <Text style={[styles.originalScheduleText, { color: colors.textMuted }]}>
              Doctor: {appointment.originalSchedule.doctorName}
            </Text>
          ) : null}
          <Text style={[styles.originalScheduleTime, { color: colors.textMuted }]}>
            Rescheduled on {formatDateShort(appointment.originalSchedule.rescheduledAt)}
          </Text>
        </View>
      ) : null}

      {appointment.remark ? (
        <TouchableOpacity
          style={styles.remarkBox}
          onLongPress={() => copyToClipboard(appointment.remark || '', 'Remark')}
          activeOpacity={0.7}
        >
          <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Remark</Text>
          <Text style={[styles.remarkText, { color: colors.text }]}>{appointment.remark}</Text>
        </TouchableOpacity>
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
  /** Called when user taps the package band — parent screen handles the sheet */
  onOpenEnrollmentTimeline?: (enrollmentId: string) => void;
  /** Set to true when opened from PackageEnrollmentDetailSheet to suppress redundant timeline link button */
  hidePackageTimelineLink?: boolean;
}

const AppointmentDetailModal = memo(function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
  onOpenEnrollmentTimeline,
  hidePackageTimelineLink,
}: AppointmentDetailModalProps) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);

  // Reset child modal states when the parent appointment changes
  useEffect(() => {
    setShowReschedule(false);
    setSelectedPatientForDetail(null);
  }, [appointment]);

  return (
    <>
      <BottomSheet visible={visible && !!appointment} onClose={onClose} snapHeight={560} keyboardBlurBehavior="none">
        {appointment ? (
          <ModalContent
            appointment={appointment}
            onClose={onClose}
            onEditPress={() => setShowReschedule(true)}
            onPatientPress={(pat) => setSelectedPatientForDetail(pat)}
            onOpenEnrollmentTimeline={onOpenEnrollmentTimeline}
            hidePackageTimelineLink={hidePackageTimelineLink}
          />
        ) : null}
      </BottomSheet>

      {/* Reschedule / Edit Modal — sibling to parent BottomSheet */}
      <RescheduleModal
        visible={showReschedule}
        appointment={appointment}
        onClose={() => {
          setShowReschedule(false);
        }}
      />

      {/* Patient Detail Modal — sibling */}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 8,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  shareBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  shareBarBtnText: {
    fontSize: 13,
    fontWeight: '600',
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
  originalScheduleBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  packageBand: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  packageBandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  packageIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageBandTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  packageBandSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  originalScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  originalScheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  originalScheduleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  originalScheduleTime: {
    fontSize: 11,
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
