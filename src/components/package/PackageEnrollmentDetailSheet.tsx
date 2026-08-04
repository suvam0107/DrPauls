import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import BottomSheet from '../shared/BottomSheet';
import SessionProgressRing from './SessionProgressRing';
import PackageSessionCard from './PackageSessionCard';
import RescheduleModal from '../calendar/RescheduleModal';
import { useTheme } from '../../theme/ThemeContext';
import usePackageStore from '../../store/usePackageStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import { PackageEnrollment, Appointment } from '../../types';
import { formatDateShort } from '../../utils/dateUtils';
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
}

export default function PackageEnrollmentDetailSheet({
  visible,
  enrollmentId,
  onClose,
}: PackageEnrollmentDetailSheetProps) {
  const { colors } = useTheme();
  const enrollment = usePackageStore((s) =>
    enrollmentId ? s.getEnrollmentById(enrollmentId) : undefined
  );
  const appointments = useAppointmentStore((s) => s.appointments);

  const markSessionCompleted = usePackageStore((s) => s.markSessionCompleted);
  const cancelSession = usePackageStore((s) => s.cancelSession);
  const pauseEnrollment = usePackageStore((s) => s.pauseEnrollment);
  const resumeEnrollment = usePackageStore((s) => s.resumeEnrollment);

  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState<{ visible: boolean; sessionId: string }>({
    visible: false,
    sessionId: '',
  });

  if (!enrollment) {
    return (
      <BottomSheet visible={visible} onClose={onClose} snapHeight={300}>
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textMuted }}>Package enrollment details unavailable.</Text>
        </View>
      </BottomSheet>
    );
  }

  const enrollmentAppts = appointments.filter((a) => enrollment.sessionIds.includes(a.id));

  const handleMarkAttended = (sessionId: string) => {
    markSessionCompleted(enrollment.enrollmentId, sessionId);
    playSessionMarkedSound();
    Toast.show({
      type: 'success',
      text1: 'Session Marked Attended',
      text2: `Session payment & attendance logged for ${enrollment.patientName}`,
      position: 'bottom',
    });
  };

  const handleCancelConfirm = (shiftRemaining: boolean) => {
    if (!showCancelPrompt.sessionId) return;
    cancelSession(enrollment.enrollmentId, showCancelPrompt.sessionId, shiftRemaining);
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

  const handlePause = () => {
    pauseEnrollment(enrollment.enrollmentId);
    playClickSound();
    Toast.show({
      type: 'info',
      text1: 'Enrollment Paused',
      text2: `Future sessions for ${enrollment.patientName} set to Pending.`,
      position: 'bottom',
    });
  };

  const handleResume = () => {
    resumeEnrollment(enrollment.enrollmentId, enrollment.startDate);
    playClickSound();
    Toast.show({
      type: 'success',
      text1: 'Enrollment Resumed',
      text2: `Sessions reactivated starting from ${formatDateShort(enrollment.startDate)}.`,
      position: 'bottom',
    });
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} snapHeight={620}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                    style={[styles.idTag, { backgroundColor: colors.surface }]}
                    onPress={() => copyToClipboard(enrollment.enrollmentId, 'Enrollment ID')}
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
              />
            </View>

            {/* Patient & Doctor details */}
            <View style={[styles.metaGrid, { borderTopColor: colors.border }]}>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.text }]}>
                  {enrollment.patientName} ({enrollment.patientMobile})
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons name="medkit-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {enrollment.doctorName}
                </Text>
              </View>

              {enrollment.therapistName ? (
                <View style={styles.metaItem}>
                  <Ionicons name="sparkles-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {enrollment.therapistName}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Controls Bar */}
            <View style={[styles.controlsRow, { borderTopColor: colors.border }]}>
              {enrollment.status === 'Active' ? (
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: colors.warningBg || '#FEF3C7' }]}
                  onPress={handlePause}
                >
                  <Ionicons name="pause-circle-outline" size={16} color={colors.warning || '#D97706'} />
                  <Text style={[styles.controlBtnText, { color: colors.warning || '#D97706' }]}>
                    Pause Enrollment
                  </Text>
                </TouchableOpacity>
              ) : enrollment.status === 'Paused' ? (
                <TouchableOpacity
                  style={[styles.controlBtn, { backgroundColor: colors.success + '20' }]}
                  onPress={handleResume}
                >
                  <Ionicons name="play-circle-outline" size={16} color={colors.success} />
                  <Text style={[styles.controlBtnText, { color: colors.success }]}>
                    Resume Enrollment
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Session Timeline Title */}
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Session Timeline & ERP History</Text>
          </View>

          {/* Session Cards List */}
          {enrollment.sessionIds.map((sId, idx) => {
            const appt = enrollmentAppts.find((a) => a.id === sId);
            return (
              <PackageSessionCard
                key={sId}
                sessionNumber={idx + 1}
                totalSessions={enrollment.totalSessions}
                appointment={appt}
                onMarkAttended={handleMarkAttended}
                onCancel={(sessionId) => setShowCancelPrompt({ visible: true, sessionId })}
                onReschedule={(appointment) => setRescheduleTargetAppt(appointment)}
              />
            );
          })}
        </ScrollView>
      </BottomSheet>

      {/* Reschedule Modal */}
      {rescheduleTargetAppt && (
        <RescheduleModal
          visible={!!rescheduleTargetAppt}
          appointment={rescheduleTargetAppt}
          onClose={() => setRescheduleTargetAppt(null)}
        />
      )}

      {/* Cancel Prompt Dialog Modal */}
      <Modal
        visible={showCancelPrompt.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelPrompt({ visible: false, sessionId: '' })}
      >
        <TouchableOpacity
          style={styles.cancelModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCancelPrompt({ visible: false, sessionId: '' })}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.cancelModalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cancelModalHeader}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
                <Text style={[styles.cancelModalTitle, { color: colors.text }]}>Cancel Package Session</Text>
              </View>

              <Text style={[styles.cancelModalMessage, { color: colors.textMuted }]}>
                Do you want to shift subsequent remaining package sessions forward by {enrollment.sessionInterval} days?
              </Text>

              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={[styles.cancelChoiceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => handleCancelConfirm(false)}
                >
                  <Text style={[styles.cancelChoiceText, { color: colors.text }]}>Keep Dates As-Is</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelChoiceBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleCancelConfirm(true)}
                >
                  <Text style={[styles.cancelChoiceText, { color: '#FFF' }]}>Shift Subsequent (+{enrollment.sessionInterval}d)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
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
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  controlsRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  controlBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cancelModalBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cancelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelModalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cancelModalMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  cancelModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  cancelChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelChoiceText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
