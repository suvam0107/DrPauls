import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import usePatientStore, { calculatePatientPriority } from '../store/usePatientStore';
import useAppointmentStore from '../store/useAppointmentStore';
import usePackageStore from '../store/usePackageStore';
import StatusChip from '../components/shared/StatusChip';
import { formatDate, formatDateShort, formatTime } from '../utils/dateUtils';
import { playClickSound } from '../utils/feedback';
import { copyToClipboard } from '../utils/clipboardUtils';
import { useRefresh } from '../utils/useRefresh';

import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import RescheduleModal from '../components/calendar/RescheduleModal';
import { Appointment } from '../types';

import PatientRecordsSkeleton from '../components/skeletons/PatientRecordsSkeleton';

import { usePatientsQuery } from '../hooks/queries/usePatientsQuery';
import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { usePackagesQuery, useEnrollmentsQuery } from '../hooks/queries/usePackagesQuery';

export interface PatientRecordsScreenProps {
  patientId?: string;
  onBack?: () => void;
}

export default function PatientRecordsScreen({ patientId, onBack }: PatientRecordsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();

  const { data: patients = [] } = usePatientsQuery();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: packages = [] } = usePackagesQuery();
  const { data: enrollments = [] } = useEnrollmentsQuery();

  const [selectedAppt, setSelectedAppt] = React.useState<Appointment | null>(null);

  // If no patientId passed, pick the first patient or selected one
  const targetPatient = useMemo(() => {
    if (patientId) return patients.find((p) => p.id === patientId);
    return patients[0];
  }, [patients, patientId]);

  const patientAppts = useMemo(() => {
    if (!targetPatient) return [];
    return appointments
      .filter((a) => a.patientId === targetPatient.id || a.patientName === targetPatient.name)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  }, [appointments, targetPatient]);

  const patientEnrollments = useMemo(() => {
    if (!targetPatient) return [];
    return enrollments.filter((e) => e.patientId === targetPatient.id);
  }, [enrollments, targetPatient]);

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  const rescheduleCount = targetPatient?.rescheduleCount || 0;
  const priority = calculatePatientPriority(rescheduleCount);

  const priorityColor =
    priority === 'High' ? '#10B981' : priority === 'Medium' ? '#F59E0B' : '#EF4444';

  const priorityBg =
    priority === 'High' ? '#D1FAE5' : priority === 'Medium' ? '#FEF3C7' : '#FEE2E2';

  if (refreshing) {
    return <PatientRecordsSkeleton />;
  }

  if (!targetPatient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, padding: 20 }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>No Patient Selected</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Patient Past Records</Text>
          <Text style={[styles.screenSub, { color: colors.textMuted }]}>
            Complete medical & appointment history
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Patient Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: priorityColor + '40',
              borderLeftWidth: 5,
              borderLeftColor: priorityColor,
            },
          ]}
        >
          <View style={styles.profileHeaderRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {targetPatient.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.patientName, { color: colors.text }]}>{targetPatient.name}</Text>
              <Text style={[styles.patientMeta, { color: colors.textMuted }]}>
                ID: {targetPatient.id} • {targetPatient.gender} {targetPatient.dob ? `• DOB: ${targetPatient.dob}` : ''} • Reliability: <Text style={{ color: priorityColor, fontWeight: '700' }}>{priority} Reliability</Text>
              </Text>
            </View>
          </View>

          {/* Metrics Pill Grid */}
          <View style={[styles.metricsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: colors.primary }]}>{patientAppts.length}</Text>
              <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Total Visits</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: priorityColor }]}>{rescheduleCount}</Text>
              <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Reschedules</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricCol}>
              <Text style={[styles.metricVal, { color: colors.text }]}>{patientEnrollments.length}</Text>
              <Text style={[styles.metricLbl, { color: colors.textMuted }]}>Packages</Text>
            </View>
          </View>

          {/* Quick Contact Bar */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={[styles.contactPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                playClickSound();
                Linking.openURL(`tel:${targetPatient.mobile}`);
              }}
              onLongPress={() => copyToClipboard(targetPatient.mobile, 'Mobile Number')}
            >
              <Ionicons name="call-outline" size={14} color={colors.primary} />
              <Text style={[styles.contactPillText, { color: colors.text }]}>{targetPatient.mobile}</Text>
            </TouchableOpacity>

            {targetPatient.email ? (
              <TouchableOpacity
                style={[styles.contactPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onLongPress={() => copyToClipboard(targetPatient.email!, 'Email Address')}
              >
                <Ionicons name="mail-outline" size={14} color={colors.primary} />
                <Text style={[styles.contactPillText, { color: colors.text }]} numberOfLines={1}>
                  {targetPatient.email}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Packages Subscriptions Section */}
        {patientEnrollments.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active & Past Package Enrollments</Text>
            {patientEnrollments.map((e) => (
              <TouchableOpacity
                key={e.enrollmentId}
                style={[styles.packageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  playClickSound();
                  setSelectedEnrollmentId(e.enrollmentId);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.packageHeader}>
                  <Text style={[styles.pkgName, { color: colors.text }]}>{e.packageName}</Text>
                  <StatusChip status={e.status} />
                </View>
                <Text style={[styles.pkgSub, { color: colors.textMuted }]}>
                  {e.serviceType} • {e.completedSessions}/{e.totalSessions} Sessions Completed • {e.doctorName}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min(100, (e.completedSessions / e.totalSessions) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                    View Session Timeline →
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Appointment History Timeline */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appointment Timeline ({patientAppts.length})
          </Text>

          {patientAppts.length === 0 ? (
            <Text style={[styles.noRecordsText, { color: colors.textMuted }]}>
              No appointments recorded for this patient.
            </Text>
          ) : (
            patientAppts.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  playClickSound();
                  setSelectedAppt(appt);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.historyTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyDoctor, { color: colors.text }]}>{appt.doctorName}</Text>
                    <Text style={[styles.historyService, { color: colors.textMuted }]}>
                      {appt.serviceType} • {appt.appointmentType} {appt.isPackage ? '(Packaged)' : ''}
                    </Text>
                  </View>
                  <StatusChip status={appt.status} date={appt.date} />
                </View>

                <View style={styles.historyMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>{formatDate(appt.date)}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>
                      {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                    </Text>
                  </View>
                </View>

                {/* Original Schedule Log if Rescheduled */}
                {appt.originalSchedule ? (
                  <View style={[styles.originalScheduleBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.originalScheduleTitleRow}>
                      <Ionicons name="swap-horizontal-outline" size={14} color="#D97706" />
                      <Text style={styles.originalScheduleTitle}>Original Schedule Details</Text>
                    </View>
                    <Text style={[styles.originalScheduleText, { color: colors.text }]}>
                      Rescheduled on {formatDateShort(appt.originalSchedule.rescheduledAt)} from {formatDateShort(appt.originalSchedule.date)} ({formatTime(appt.originalSchedule.startTime)})
                    </Text>
                  </View>
                ) : null}

                {appt.remark ? (
                  <Text style={[styles.remarkText, { color: colors.textMuted }]}>
                    Notes: {appt.remark}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Appointment Details Bottom Sheet Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onOpenEnrollmentTimeline={(enrollmentId) => {
          setSelectedAppt(null);
          setSelectedEnrollmentId(enrollmentId);
        }}
      />

      {/* Package Enrollment Detail Sheet */}
      <PackageEnrollmentDetailSheet
        visible={!!selectedEnrollmentId}
        enrollmentId={selectedEnrollmentId}
        onClose={() => setSelectedEnrollmentId(null)}
        onRescheduleSession={(appt) => setRescheduleTargetAppt(appt)}
        onViewSessionDetails={(appt) => setSelectedSessionAppt(appt)}
      />

      {/* Reschedule Modal — screen-level sibling */}
      <RescheduleModal
        visible={!!rescheduleTargetAppt}
        appointment={rescheduleTargetAppt}
        onClose={() => setRescheduleTargetAppt(null)}
      />

      {/* Session Appointment Detail Modal — opened from timeline, redundant package link hidden */}
      <AppointmentDetailModal
        visible={!!selectedSessionAppt}
        appointment={selectedSessionAppt}
        onClose={() => setSelectedSessionAppt(null)}
        hidePackageTimelineLink
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  screenSub: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  patientMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 11,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  packageCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pkgName: {
    fontSize: 15,
    fontWeight: '700',
  },
  pkgSub: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDoctor: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyService: {
    fontSize: 12,
    marginTop: 2,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  originalScheduleBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  originalScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalScheduleTitle: {
    fontSize: 12,
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
    fontSize: 12,
    fontStyle: 'italic',
  },
  noRecordsText: {
    fontSize: 13,
    paddingVertical: 12,
  },
});
