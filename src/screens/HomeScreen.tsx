import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import useUIStore from '../store/useUIStore';
import StatusChip from '../components/shared/StatusChip';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import RescheduleModal from '../components/calendar/RescheduleModal';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import { todayISO, formatDateShort, formatTime } from '../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../constants';
import { Appointment } from '../types';
import { playClickSound } from '../utils/feedback';
import { useRefresh } from '../utils/useRefresh';

import UpcomingSessionsWidget from '../components/package/UpcomingSessionsWidget';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import HomeScreenSkeleton from '../components/skeletons/HomeScreenSkeleton';

import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { usePatientsQuery } from '../hooks/queries/usePatientsQuery';
import { useDoctorsQuery } from '../hooks/queries/useDoctorsQuery';
import { useScrollNavbar } from '../hooks/useScrollNavbar';

export interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const { refreshing, onRefresh } = useRefresh();
  const { handleScroll } = useScrollNavbar();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: patients = [] } = usePatientsQuery();
  const { data: doctors = [] } = useDoctorsQuery();
  const patientCount = patients.length;
  const doctorCount = doctors.length;

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  const today = todayISO();
  const centerAppts = appointments.filter((a) => !a.centerId || a.centerId === activeCenterId);
  const todayAppts = centerAppts.filter(
    (a) => a.date === today && a.status !== APPOINTMENT_STATUS.CANCELLED
  );

  const allTodayAppts = centerAppts.filter((a) => a.date === today);

  const confirmedCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length;
  const pendingCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length;
  const paidCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;
  const scheduledCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.SCHEDULED).length;
  const rescheduledCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.RESCHEDULED).length;
  const cancelledCount = allTodayAppts.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length;

  // Overdue detection: appointments scheduled for today that are still Pending
  const overdueAppts = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING);
  const overdueCount = overdueAppts.length;

  // Next up appointment
  const nextAppt = todayAppts
    .filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.PENDING)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // Animated live pulse dot
  const pulseOpacity = useSharedValue(1);
  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (refreshing) {
    return <HomeScreenSkeleton />;
  }

  const completionPct = todayAppts.length > 0 ? Math.round((paidCount / todayAppts.length) * 100) : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: 88 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Date Banner with Pulsing Live Dot */}
      <View style={[styles.bannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.bannerTextCol}>
          <View style={styles.bannerBadgeRow}>
            <Animated.View style={[styles.liveDot, { backgroundColor: colors.success }, pulseStyle]} />
            <Text style={[styles.bannerTitle, { color: colors.text }]}>Today's Overview</Text>
          </View>
          <Text style={[styles.bannerSub, { color: colors.textMuted }]}>{formatDateShort(today)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.calendarQuickBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            playClickSound();
            onNavigate('calendar');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={16} color="#FFF" />
          <Text style={styles.calendarQuickText}>Full Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* Overdue Alert Banner if overdueCount > 0 */}
      {overdueCount > 0 && (
        <TouchableOpacity
          style={[styles.overdueBanner, { backgroundColor: colors.dangerBg, borderColor: colors.danger }]}
          onPress={() => onNavigate('appointments')}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle" size={20} color={colors.danger} />
          <Text style={[styles.overdueText, { color: colors.danger }]}>
            {overdueCount} {overdueCount === 1 ? 'appointment requires' : 'appointments require'} receptionist action (Pending)
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.danger} />
        </TouchableOpacity>
      )}

      {/* Hero "Next Up" Spotlight Card */}
      {nextAppt && (
        <View style={[styles.nextUpCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={styles.nextUpHeader}>
            <View style={styles.nextUpTitleRow}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[styles.nextUpTitle, { color: colors.primary }]}>Next Appointment Spotlight</Text>
            </View>
            <Text style={[styles.nextUpTime, { color: colors.primary }]}>{formatTime(nextAppt.startTime)}</Text>
          </View>
          <View style={styles.nextUpBody}>
            <Text style={[styles.nextUpPatient, { color: colors.text }]}>{nextAppt.patientName}</Text>
            <Text style={[styles.nextUpMeta, { color: colors.textMuted }]}>
              {nextAppt.serviceType} • {nextAppt.doctorName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.nextUpActionBtn, { backgroundColor: colors.primaryLight }]}
            onPress={() => {
              playClickSound();
              setSelectedAppt(nextAppt);
            }}
          >
            <Text style={[styles.nextUpActionText, { color: colors.primary }]}>View Details & Manage</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Operational Progress Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryHeader}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Schedule Completion</Text>
          <Text style={[styles.summaryPct, { color: colors.primary }]}>{completionPct}% Paid</Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.primary, width: `${Math.min(100, completionPct)}%` },
            ]}
          />
        </View>
        <View style={styles.summaryBadgeRow}>
          <View style={[styles.summaryChip, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.summaryChipText, { color: colors.primary }]}>{todayAppts.length} Total</Text>
          </View>
          {confirmedCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={[styles.summaryChipText, { color: colors.success }]}>{confirmedCount} Confirmed</Text>
            </View>
          )}
          {paidCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.purpleBg }]}>
              <Ionicons name="card-outline" size={14} color={colors.purple} />
              <Text style={[styles.summaryChipText, { color: colors.purple }]}>{paidCount} Paid</Text>
            </View>
          )}
          {pendingCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="time-outline" size={14} color={colors.warning} />
              <Text style={[styles.summaryChipText, { color: colors.warning }]}>{pendingCount} Pending</Text>
            </View>
          )}
          {scheduledCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-number-outline" size={14} color={colors.primary} />
              <Text style={[styles.summaryChipText, { color: colors.primary }]}>{scheduledCount} Scheduled</Text>
            </View>
          )}
          {rescheduledCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.cyanBg }]}>
              <Ionicons name="refresh-outline" size={14} color={colors.cyan} />
              <Text style={[styles.summaryChipText, { color: colors.cyan }]}>{rescheduledCount} Rescheduled</Text>
            </View>
          )}
          {cancelledCount > 0 && (
            <View style={[styles.summaryChip, { backgroundColor: colors.dangerBg }]}>
              <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
              <Text style={[styles.summaryChipText, { color: colors.danger }]}>{cancelledCount} Cancelled</Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Nav Bar */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}
          onPress={() => {
            playClickSound();
            onNavigate('patients');
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quickNavText, { color: colors.text }]}>Patients Directory</Text>
            <Text style={[styles.quickNavSubText, { color: colors.textMuted }]}>{patientCount} registered</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}
          onPress={() => {
            playClickSound();
            onNavigate('doctors');
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.quickNavIconBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="medical-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.quickNavText, { color: colors.text }]}>Doctors Duty</Text>
            <Text style={[styles.quickNavSubText, { color: colors.textMuted }]}>{doctorCount} consultants</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Upcoming Packaged Sessions Widget */}
      <UpcomingSessionsWidget onSelectEnrollment={(id) => setSelectedEnrollmentId(id)} />

      {/* Today's Appointments List */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Schedule</Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{todayAppts.length} sessions</Text>
      </View>

      {todayAppts.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="calendar-clear-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No appointments scheduled for today.</Text>
        </View>
      ) : (
        todayAppts.map((appt) => (
          <TouchableOpacity
            key={appt.id}
            style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              playClickSound();
              setSelectedAppt(appt);
            }}
          >
            <View style={styles.apptTimeCol}>
              <Text style={[styles.timeText, { color: colors.primary }]}>{formatTime(appt.startTime)}</Text>
              <Text style={[styles.durationText, { color: colors.textMuted }]}>30 mins</Text>
            </View>

            <View style={styles.apptInfoCol}>
              <Text style={[styles.patientName, { color: colors.text }]}>{appt.patientName}</Text>
              <Text style={[styles.apptMeta, { color: colors.textMuted }]}>
                {appt.serviceType} • {appt.doctorName}
              </Text>
            </View>

            <StatusChip status={appt.status} date={appt.date} small />
          </TouchableOpacity>
        ))
      )}

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onOpenEnrollmentTimeline={(enrollmentId) => {
          setSelectedAppt(null);
          setSelectedEnrollmentId(enrollmentId);
        }}
      />

      {/* Create Appointment Sheet */}
      <CreateAppointmentSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />

      {/* Package Enrollment Detail Sheet — callbacks lifted */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTextCol: {
    gap: 4,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bannerTitle: { fontSize: 18, fontWeight: '700' },
  bannerSub: { fontSize: 12, fontWeight: '500' },
  calendarQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  calendarQuickText: { color: '#FFF', fontWeight: '600', fontSize: 12 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 8,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickNavCard: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 10,
  },
  quickNavIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavText: { fontSize: 12, fontWeight: '700' },
  quickNavSubText: { fontSize: 10, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionCount: { fontSize: 12 },
  emptyBox: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 13 },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  apptTimeCol: { width: 68, alignItems: 'flex-start' },
  timeText: { fontSize: 13, fontWeight: '700' },
  durationText: { fontSize: 10, marginTop: 2 },
  apptInfoCol: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700' },
  apptMeta: { fontSize: 12, marginTop: 2 },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  overdueText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  nextUpCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    gap: 10,
  },
  nextUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextUpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextUpTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextUpTime: {
    fontSize: 14,
    fontWeight: '800',
  },
  nextUpBody: {
    gap: 2,
  },
  nextUpPatient: {
    fontSize: 16,
    fontWeight: '800',
  },
  nextUpMeta: {
    fontSize: 13,
  },
  nextUpActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  nextUpActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
