import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import usePackageStore from '../../store/usePackageStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import { formatDateShort, formatTime, todayISO } from '../../utils/dateUtils';
import { playClickSound } from '../../utils/feedback';

interface UpcomingSessionsWidgetProps {
  onSelectEnrollment: (enrollmentId: string) => void;
}

export default function UpcomingSessionsWidget({ onSelectEnrollment }: UpcomingSessionsWidgetProps) {
  const { colors } = useTheme();
  const enrollments = usePackageStore((s) => s.enrollments);
  const appointments = useAppointmentStore((s) => s.appointments);

  const today = todayISO();
  const activeEnrollments = enrollments.filter((e) => e.status === 'Active' || e.status === 'Paused');

  // Find active enrollments that have upcoming or today's sessions
  const items = activeEnrollments
    .map((enrollment) => {
      const enrollmentAppts = appointments.filter(
        (a) => enrollment.sessionIds.includes(a.id) && a.status !== 'Cancelled'
      );
      const upcoming = enrollmentAppts
        .filter((a) => a.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0];

      return {
        enrollment,
        nextSession: upcoming,
      };
    })
    .filter((item) => item.nextSession !== undefined);

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="layers-outline" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Upcoming Packaged Sessions</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.countBadgeText, { color: colors.primary }]}>{items.length} Active</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {items.map(({ enrollment, nextSession }) => (
          <TouchableOpacity
            key={enrollment.enrollmentId}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              playClickSound();
              onSelectEnrollment(enrollment.enrollmentId);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.itemHeader}>
              <Text style={[styles.pkgName, { color: colors.text }]} numberOfLines={1}>
                {enrollment.packageName}
              </Text>
              <Text style={[styles.sessionBadge, { color: colors.primary }]}>
                Session {nextSession?.sessionNumber || enrollment.completedSessions + 1}/{enrollment.totalSessions}
              </Text>
            </View>

            <View style={styles.patientRow}>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
                {enrollment.patientName}
              </Text>
            </View>

            <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatDateShort(nextSession!.date)} • {formatTime(nextSession!.startTime)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 10,
  },
  itemCard: {
    width: 210,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pkgName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  sessionBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientName: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
