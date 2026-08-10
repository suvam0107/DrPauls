import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import usePatientStore from '../store/usePatientStore';
import useUIStore from '../store/useUIStore';
import StatusChip from '../components/shared/StatusChip';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import RescheduleModal from '../components/calendar/RescheduleModal';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import { todayISO, formatDateShort, formatTime } from '../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../constants';
import { Appointment } from '../types';
import { playClickSound } from '../utils/feedback';
import useDoctorStore from '../store/useDoctorStore';
import { useRefresh } from '../utils/useRefresh';

import UpcomingSessionsWidget from '../components/package/UpcomingSessionsWidget';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import HomeScreenSkeleton from '../components/skeletons/HomeScreenSkeleton';

import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { usePatientsQuery } from '../hooks/queries/usePatientsQuery';
import { useDoctorsQuery } from '../hooks/queries/useDoctorsQuery';

export interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { colors } = useTheme();
  const { refreshing, onRefresh } = useRefresh();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: patients = [] } = usePatientsQuery();
  const { data: doctors = [] } = useDoctorsQuery();
  const patientCount = patients.length;
  const doctorCount = doctors.length;
  const activeCenterId = useUIStore((s) => s.activeCenterId);

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  // Lifted modal states for package session actions — flat sibling stack
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  const today = todayISO();
  // Filter appointments for active center and today's date
  const centerAppts = appointments.filter((a) => !a.centerId || a.centerId === activeCenterId);
  const todayAppts = centerAppts.filter(
    (a) => a.date === today && a.status !== APPOINTMENT_STATUS.CANCELLED
  );

  const confirmedCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length;
  const pendingCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length;
  const paidCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;

  if (refreshing) {
    return <HomeScreenSkeleton />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Date Banner */}
      <View style={[styles.bannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.bannerTextCol}>
          <View style={styles.bannerBadgeRow}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
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
          <Ionicons name="calendar" size={16} color="#FFF" />
          <Text style={styles.calendarQuickText}>Full Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* 2x2 Stats Cards Grid */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>
          <View style={styles.statCardTop}>
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.statNum, { color: colors.primary }]}>{todayAppts.length}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Appts</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.success }]}>
          <View style={styles.statCardTop}>
            <View style={[styles.iconBadge, { backgroundColor: colors.successBg }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            </View>
            <Text style={[styles.statNum, { color: colors.success }]}>{confirmedCount}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Confirmed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.warning }]}>
          <View style={styles.statCardTop}>
            <View style={[styles.iconBadge, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="time-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.statNum, { color: colors.warning }]}>{pendingCount}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.purple }]}>
          <View style={styles.statCardTop}>
            <View style={[styles.iconBadge, { backgroundColor: colors.purpleBg }]}>
              <Ionicons name="card-outline" size={18} color={colors.purple} />
            </View>
            <Text style={[styles.statNum, { color: colors.purple }]}>{paidCount}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Paid</Text>
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
            <Text style={[styles.quickNavSubText, { color: colors.textMuted }]}>{doctorCount} on duty</Text>
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
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 16 },
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
});
