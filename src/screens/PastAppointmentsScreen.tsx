import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import useUIStore from '../store/useUIStore';
import StatusChip from '../components/shared/StatusChip';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import { todayISO, formatDateShort, formatTime } from '../utils/dateUtils';
import { APPOINTMENT_STATUS, STATUS_COLORS } from '../constants';
import { Appointment } from '../types';
import { playClickSound } from '../utils/feedback';

const STATUS_FILTERS: string[] = Object.values(APPOINTMENT_STATUS);

export default function PastAppointmentsScreen() {
  const { colors, isDark } = useTheme();
  const appointments = useAppointmentStore((s) => s.appointments);
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const activeStatusFilters = useUIStore((s) => s.activeStatusFilters);
  const toggleStatusFilter = useUIStore((s) => s.toggleStatusFilter);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  const today = todayISO();
  const now = new Date();
  const currentHHMM =
    String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Filter all preceding/past appointments for the active center
  const pastAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const isCenterMatch = !a.centerId || a.centerId === activeCenterId;
        if (!isCenterMatch) return false;

        const isPast = a.date < today || (a.date === today && a.startTime <= currentHHMM);
        if (!isPast) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchPatient = a.patientName?.toLowerCase().includes(q);
          const matchDoctor = a.doctorName?.toLowerCase().includes(q);
          const matchService = a.serviceType?.toLowerCase().includes(q);
          const matchPhone = a.patientMobile?.includes(q);
          if (!matchPatient && !matchDoctor && !matchService && !matchPhone) return false;
        }

        // Multi-select status filter chips
        if (activeStatusFilters.length > 0) {
          if (!activeStatusFilters.includes(a.status)) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [appointments, activeCenterId, today, currentHHMM, searchQuery, activeStatusFilters]);

  const handleFilterPress = (status: string) => {
    playClickSound();
    toggleStatusFilter(status);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title & Count Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Past Appointments</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Complete historical log of preceding clinical sessions
            </Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>
              {pastAppointments.length} History
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search patient, doctor, service..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Chips (Calendar-style) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          {STATUS_FILTERS.map((s) => {
            const active = activeStatusFilters.includes(s);
            const c = STATUS_COLORS[s] || '#2563EB';
            const activeBg = isDark ? c + '45' : c + '25';
            return (
              <TouchableOpacity
                key={s}
                onPress={() => handleFilterPress(s)}
                style={[
                  styles.filterChip,
                  { borderColor: c, backgroundColor: active ? activeBg : 'transparent' },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, { color: active && isDark ? '#FFFFFF' : c }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Past Appointments List */}
        {pastAppointments.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Past Appointments Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              No preceding appointment history matches your search or filter parameters.
            </Text>
          </View>
        ) : (
          pastAppointments.map((appt) => (
            <TouchableOpacity
              key={appt.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                playClickSound();
                setSelectedAppt(appt);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.dateTimeBadge}>
                  <Ionicons name="calendar-outline" size={13} color={colors.primary} />
                  <Text style={[styles.dateText, { color: colors.primary }]}>
                    {formatDateShort(appt.date)} • {formatTime(appt.startTime)}
                  </Text>
                </View>
                <StatusChip status={appt.status} small />
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.patientName, { color: colors.text }]}>{appt.patientName}</Text>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {appt.serviceType} • Dr. {appt.doctorName}
                </Text>

                {appt.patientMobile ? (
                  <View style={styles.mobileRow}>
                    <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                    <Text style={[styles.mobileText, { color: colors.textMuted }]}>
                      +91 {appt.patientMobile}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Appointment Detail Modal for reviewing past appointment details */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  tabScroll: { marginBottom: 16 },
  tabContainer: { gap: 6, paddingRight: 16 },
  filterChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  filterText: { fontSize: 11, fontWeight: '600' },
  emptyBox: {
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center' },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: { fontSize: 12, fontWeight: '700' },
  cardBody: { gap: 2 },
  patientName: { fontSize: 15, fontWeight: '700' },
  metaText: { fontSize: 12 },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  mobileText: { fontSize: 12 },
});
