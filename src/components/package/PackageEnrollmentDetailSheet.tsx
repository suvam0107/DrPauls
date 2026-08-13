import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import BottomSheet from '../shared/BottomSheet';
import AppToast from '../shared/AppToast';
import SessionProgressRing from './SessionProgressRing';
import PackageSessionCard from './PackageSessionCard';
import { useTheme } from '../../theme/ThemeContext';
import usePackageStore from '../../store/usePackageStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import { PackageEnrollment, Appointment } from '../../types';
import { formatDateShort, addDays } from '../../utils/dateUtils';
import { copyToClipboard } from '../../utils/clipboardUtils';
import {
  playClickSound,
  playSessionMarkedSound,
  playSessionCancelledSound,
} from '../../utils/feedback';

interface PackageEnrollmentDetailSheetProps {
  visible: boolean;
  enrollmentId: string | null;
  onClose: () => void;
  /** Lifted to parent screen — avoid nesting RescheduleModal inside this BottomSheet */
  onRescheduleSession?: (appointment: Appointment) => void;
  /** Lifted to parent screen — avoid nesting AppointmentDetailModal inside this BottomSheet */
  onViewSessionDetails?: (appointment: Appointment) => void;
}

import { useEnrollmentsQuery } from '../../hooks/queries/usePackagesQuery';
import { useAppointmentsQuery } from '../../hooks/queries/useAppointmentsQuery';
import {
  useMarkSessionCompletedMutation,
  useCancelSessionMutation,
  usePauseEnrollmentMutation,
  useResumeEnrollmentMutation,
} from '../../hooks/mutations/usePackageMutations';

interface PackageEnrollmentDetailSheetProps {
  visible: boolean;
  enrollmentId: string | null;
  onClose: () => void;
  /** Lifted to parent screen — avoid nesting RescheduleModal inside this BottomSheet */
  onRescheduleSession?: (appointment: Appointment) => void;
  /** Lifted to parent screen — avoid nesting AppointmentDetailModal inside this BottomSheet */
  onViewSessionDetails?: (appointment: Appointment) => void;
}

export default function PackageEnrollmentDetailSheet({
  visible,
  enrollmentId,
  onClose,
  onRescheduleSession,
  onViewSessionDetails,
}: PackageEnrollmentDetailSheetProps) {
  const { colors } = useTheme();
  const { data: enrollments = [] } = useEnrollmentsQuery();
  const enrollment = enrollmentId ? enrollments.find((e) => e.enrollmentId === enrollmentId) : undefined;
  const { data: appointments = [] } = useAppointmentsQuery();

  const markSessionCompletedMutation = useMarkSessionCompletedMutation();
  const cancelSessionMutation = useCancelSessionMutation();
  const pauseEnrollmentMutation = usePauseEnrollmentMutation();
  const resumeEnrollmentMutation = useResumeEnrollmentMutation();

  // Confirmation dialogs — local to this sheet only (no child sheets)
  const [confirmPauseResume, setConfirmPauseResume] = useState<'pause' | 'resume' | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState<{ visible: boolean; sessionId: string }>({
    visible: false,
    sessionId: '',
  });

  // Construct complete sessions list from 1 to enrollment.totalSessions
  const sessionsList = useMemo(() => {
    if (!enrollment) return [];

    const list: { sessionNumber: number; appointment: Appointment }[] = [];

    for (let sNum = 1; sNum <= enrollment.totalSessions; sNum++) {
      // 1. Try finding by enrollmentId and sessionNumber
      let appt = appointments.find(
        (a) => a.enrollmentId === enrollment.enrollmentId && a.sessionNumber === sNum
      );

      // 2. Try finding by matching sessionIds[sNum - 1]
      if (!appt && enrollment.sessionIds && enrollment.sessionIds[sNum - 1]) {
        const sId = enrollment.sessionIds[sNum - 1];
        appt = appointments.find((a) => a.id === sId);
      }

      // 3. Fallback: Generate dynamic Appointment object for this session if not in store
      if (!appt) {
        const isCompleted = sNum <= enrollment.completedSessions;
        const sessionDate = addDays(enrollment.startDate, (sNum - 1) * enrollment.sessionInterval);

        const status = isCompleted
          ? 'Paid'
          : enrollment.status === 'Paused'
            ? 'Pending'
            : sNum === enrollment.completedSessions + 1
              ? 'Scheduled'
              : 'Confirmed';

        const nowISO = new Date().toISOString();
        appt = {
          id: `${enrollment.enrollmentId}-S${sNum}`,
          centerId: enrollment.centerId || 'CC-001',
          patientId: enrollment.patientId,
          patientName: enrollment.patientName,
          patientMobile: enrollment.patientMobile,
          doctorId: enrollment.doctorId,
          doctorName: enrollment.doctorName,
          therapistId: enrollment.therapistId,
          therapistName: enrollment.therapistName,
          date: sessionDate,
          startTime: '10:30',
          endTime: '11:00',
          appointmentType: 'Package Session',
          serviceType: enrollment.serviceType,
          visitType: 'Clinic',
          isPackage: true,
          packageId: enrollment.packageId,
          enrollmentId: enrollment.enrollmentId,
          sessionNumber: sNum,
          prePaymentRequired: false,
          prePaymentAmount: 0,
          status: status,
          leadStatus: 'Registered',
          remark: `Session ${sNum} of ${enrollment.totalSessions} (${enrollment.packageName})`,
          createdAt: nowISO,
          updatedAt: nowISO,
        };
      }

      list.push({ sessionNumber: sNum, appointment: appt });
    }

    return list;
  }, [enrollment, appointments]);

  if (!enrollment) {
    return (
      <BottomSheet visible={visible} onClose={onClose} snapHeight={300}>
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textMuted }}>Package enrollment details unavailable.</Text>
        </View>
      </BottomSheet>
    );
  }

  const handleMarkAttended = async (sessionId: string) => {
    await markSessionCompletedMutation.mutateAsync({ enrollmentId: enrollment.enrollmentId, sessionId });
    playSessionMarkedSound();
    Toast.show({
      type: 'success',
      text1: 'Session Marked Attended',
      text2: `Session payment & attendance logged for ${enrollment.patientName}`,
      position: 'bottom',
    });
  };

  const handleCancelConfirm = async (shiftRemaining: boolean) => {
    if (!showCancelPrompt.sessionId) return;
    await cancelSessionMutation.mutateAsync({
      enrollmentId: enrollment.enrollmentId,
      sessionId: showCancelPrompt.sessionId,
      shiftRemaining,
    });
    playSessionCancelledSound();
    setShowCancelPrompt({ visible: false, sessionId: '' });
    Toast.show({
      type: 'info',
      text1: 'Session Cancelled',
      text2: shiftRemaining
        ? 'Session cancelled & subsequent sessions shifted forward.'
        : 'Session cancelled.',
      position: 'bottom',
    });
  };

  const handleConfirmPauseResume = async () => {
    if (!enrollment || !confirmPauseResume) return;
    if (confirmPauseResume === 'pause') {
      await pauseEnrollmentMutation.mutateAsync(enrollment.enrollmentId);
      playClickSound();
      Toast.show({
        type: 'info',
        text1: 'Enrollment Paused',
        text2: `Future sessions for ${enrollment.patientName} set to Pending.`,
        position: 'bottom',
      });
    } else {
      await resumeEnrollmentMutation.mutateAsync({
        enrollmentId: enrollment.enrollmentId,
        newStartDate: enrollment.startDate,
      });
      playClickSound();
      Toast.show({
        type: 'success',
        text1: 'Enrollment Resumed',
        text2: `Sessions reactivated starting from ${formatDateShort(enrollment.startDate)}.`,
        position: 'bottom',
      });
    }
    setConfirmPauseResume(null);
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} snapHeight={620}>
        <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Card */}
          <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.tagRow}>
                  <View style={[styles.serviceTag, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.serviceTagText, { color: colors.primary }]}>
                      {enrollment.serviceType}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.idTag, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => copyToClipboard(enrollment.enrollmentId, 'Enrollment ID')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.idTagText, { color: colors.textMuted }]}>
                      {enrollment.enrollmentId}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.pkgName, { color: colors.text }]}>{enrollment.packageName}</Text>
              </View>

              <SessionProgressRing
                total={enrollment.totalSessions}
                completed={enrollment.completedSessions}
                size={58}
                strokeWidth={5}
              />
            </View>

            {/* Patient & Doctor details grid */}
            <View style={[styles.metaGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {enrollment.patientName} ({enrollment.patientMobile})
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="medkit-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  Doctor: {enrollment.doctorName}
                </Text>
              </View>

              {enrollment.therapistName ? (
                <View style={styles.metaItem}>
                  <Ionicons name="body-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    Therapist: {enrollment.therapistName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Controls Bar */}
            <View style={[styles.controlsRow, { borderTopColor: colors.border }]}>
              <View style={styles.statusGroup}>
                <Text style={[styles.statusLabel, { color: colors.textMuted }]}>Status:</Text>
                <Text
                  style={[
                    styles.statusValue,
                    {
                      color:
                        enrollment.status === 'Active'
                          ? colors.success
                          : enrollment.status === 'Paused'
                            ? colors.warning
                            : colors.textMuted,
                    },
                  ]}
                >
                  {enrollment.status}
                </Text>
              </View>

              {enrollment.status === 'Active' ? (
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: colors.warning }]}
                  onPress={() => {
                    playClickSound();
                    setConfirmPauseResume('pause');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pause-circle-outline" size={16} color="#FFF" />
                  <Text style={[styles.controlBtnText, { color: '#FFF' }]}>
                    Pause Enrollment
                  </Text>
                </TouchableOpacity>
              ) : enrollment.status === 'Paused' ? (
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: colors.success }]}
                  onPress={() => {
                    playClickSound();
                    setConfirmPauseResume('resume');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle-outline" size={16} color="#FFF" />
                  <Text style={[styles.controlBtnText, { color: '#FFF' }]}>
                    Resume Enrollment
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Session Timeline Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="layers-outline" size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Session Timeline</Text>
            </View>
            <View style={[styles.timelineBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.timelineBadgeText, { color: colors.primary }]}>
                {enrollment.completedSessions}/{enrollment.totalSessions} Sessions
              </Text>
            </View>
          </View>

          {/* Session Cards List — renders complete sessions list from 1 to totalSessions */}
          {sessionsList.map(({ sessionNumber, appointment }) => (
            <PackageSessionCard
              key={appointment.id}
              sessionNumber={sessionNumber}
              totalSessions={enrollment.totalSessions}
              appointment={appointment}
              onMarkAttended={handleMarkAttended}
              onCancel={(sessionId) => setShowCancelPrompt({ visible: true, sessionId })}
              onReschedule={(appt) => onRescheduleSession && onRescheduleSession(appt)}
              onViewSessionDetails={onViewSessionDetails ? (appt) => onViewSessionDetails(appt) : undefined}
            />
          ))}
        </BottomSheetScrollView>
        <AppToast />
      </BottomSheet>

      {/* ── Pause / Resume Confirmation Modal ──────────────────────────────────
          Follows the shared dialog template: overlay > backdrop + card with icon badge.
          statusBarTranslucent ensures the overlay covers the Android status bar.   */}
      <Modal
        visible={!!confirmPauseResume}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmPauseResume(null)}
      >
        <View style={styles.dialogOverlay}>
          <TouchableWithoutFeedback onPress={() => setConfirmPauseResume(null)}>
            <View style={styles.dialogBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dialogTitle, { color: colors.text }]}>
              {confirmPauseResume === 'pause' ? 'Pause Package Enrollment?' : 'Resume Package Enrollment?'}
            </Text>

            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              {confirmPauseResume === 'pause'
                ? `Pause this enrollment for ${enrollment.patientName}? Future sessions will be set to Pending.`
                : `Reactivate package sessions for ${enrollment.patientName}?`}
            </Text>

            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                style={[styles.dialogBtn, { backgroundColor: '#52525B' }]}
                onPress={() => setConfirmPauseResume(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={15} color="#FFF" />
                <Text style={[styles.dialogBtnText, { color: '#FFF' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dialogBtn,
                  {
                    backgroundColor: confirmPauseResume === 'pause' ? colors.warning : colors.primary,
                    borderColor: confirmPauseResume === 'pause' ? colors.warning : colors.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleConfirmPauseResume}
                activeOpacity={0.8}
              >
                <Ionicons name={confirmPauseResume === 'pause' ? 'pause' : 'play'} size={14} color="white" />
                <Text style={[styles.dialogBtnText, { color: '#FFF' }]}>
                  {confirmPauseResume === 'pause' ? 'Confirm Pause' : 'Confirm Resume'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Cancel Session Prompt Modal ────────────────────────────────────────
          Presents the "Keep Dates" vs "Shift Subsequent" choice.
          Also follows the shared dialog template with icon badge.              */}
      <Modal
        visible={showCancelPrompt.visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowCancelPrompt({ visible: false, sessionId: '' })}
      >
        <View style={styles.dialogOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowCancelPrompt({ visible: false, sessionId: '' })}>
            <View style={styles.dialogBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.dialogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Icon Badge */}
            <View style={[styles.dialogIconBadge, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="alert-circle" size={28} color={colors.danger} />
            </View>

            <Text style={[styles.dialogTitle, { color: colors.text }]}>Cancel Package Session</Text>

            <Text style={[styles.dialogMessage, { color: colors.textMuted }]}>
              Do you want to shift all subsequent remaining sessions forward by{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>{enrollment.sessionInterval} days</Text>?
            </Text>

            {/* Info box for keep dates choice */}
            <View style={[styles.cancelInfoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cancelInfoRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.cancelInfoText, { color: colors.textMuted }]}>
                  Keep Dates — only this session is cancelled
                </Text>
              </View>
              <View style={styles.cancelInfoRow}>
                <Ionicons name="arrow-forward-circle-outline" size={14} color={colors.primary} />
                <Text style={[styles.cancelInfoText, { color: colors.primary }]}>
                  Shift All — future sessions pushed +{enrollment.sessionInterval}d
                </Text>
              </View>
            </View>

            <View style={styles.dialogButtonRow}>
              <TouchableOpacity
                style={[styles.dialogBtn, { backgroundColor: '#52525B' }]}
                onPress={() => handleCancelConfirm(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={15} color="#FFF" />
                <Text style={[styles.dialogBtnText, { color: '#FFF' }]}>Keep Dates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogBtn, { backgroundColor: colors.primary, borderColor: colors.primary, borderWidth: 1 }]}
                onPress={() => handleCancelConfirm(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFF' }]}>
                  Shift +{enrollment.sessionInterval}d
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  idTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pkgName: {
    fontSize: 17,
    fontWeight: '800',
  },
  metaGrid: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  controlsRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  timelineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timelineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Shared Dialog Styles (Pause/Resume + Cancel Session) ─────────────────
  dialogOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 6,
    alignItems: 'center',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  dialogIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 4,
  },
  cancelInfoBox: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    marginBottom: 4,
  },
  cancelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelInfoText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    width: '100%',
  },
  dialogBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dialogBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
