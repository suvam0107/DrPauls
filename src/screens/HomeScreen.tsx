import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import usePatientStore from '../store/usePatientStore';
import StatusChip from '../components/shared/StatusChip';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import { todayISO, formatDateShort, formatTime } from '../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../constants';
import { Appointment } from '../types';

export interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { colors } = useTheme();
  const appointments = useAppointmentStore((s) => s.appointments);
  const patientCount = usePatientStore((s) => s.count());

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const today = todayISO();
  const todayAppts = appointments.filter(
    (a) => a.date === today && a.status !== APPOINTMENT_STATUS.CANCELLED
  );

  const confirmedCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length;
  const pendingCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PENDING).length;
  const paidCount = todayAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Date Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Today's Overview</Text>
          <Text style={[styles.bannerSub, { color: colors.textMuted }]}>{formatDateShort(today)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.calendarQuickBtn, { backgroundColor: colors.primary }]}
          onPress={() => onNavigate('calendar')}
        >
          <Ionicons name="calendar-outline" size={18} color="#FFF" />
          <Text style={styles.calendarQuickText}>Full Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* 2x2 Stats Cards Grid */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{todayAppts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Appointments (Today)</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.success }]}>{confirmedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Confirmed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.warning }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statNum, { color: colors.purple }]}>{paidCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Paid</Text>
        </View>
      </View>

      {/* Quick Nav Bar */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: colors.primaryLight }]}
          onPress={() => setShowCreate(true)}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={[styles.quickNavText, { color: colors.primary }]}>New Appt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: colors.surface }]}
          onPress={() => onNavigate('patients')}
        >
          <Ionicons name="people-outline" size={24} color={colors.text} />
          <Text style={[styles.quickNavText, { color: colors.text }]}>{patientCount} Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickNavCard, { backgroundColor: colors.surface }]}
          onPress={() => onNavigate('calendar')}
        >
          <Ionicons name="time-outline" size={24} color={colors.text} />
          <Text style={[styles.quickNavText, { color: colors.text }]}>Schedule Grid</Text>
        </TouchableOpacity>
      </View>

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
            onPress={() => setSelectedAppt(appt)}
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

            <StatusChip status={appt.status} small />
          </TouchableOpacity>
        ))
      )}

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
      />

      {/* Create Appointment Sheet */}
      <CreateAppointmentSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 20, fontWeight: '700' },
  bannerSub: { fontSize: 13, marginTop: 2 },
  calendarQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  calendarQuickText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 4, textAlign: 'center' },
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  quickNavCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickNavText: { fontSize: 12, fontWeight: '600' },
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
});
