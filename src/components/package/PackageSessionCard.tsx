import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Appointment } from '../../types';
import { formatDateShort, formatTime, todayISO } from '../../utils/dateUtils';
import StatusChip from '../shared/StatusChip';
import { playClickSound } from '../../utils/feedback';

interface PackageSessionCardProps {
  sessionNumber: number;
  totalSessions: number;
  appointment?: Appointment;
  onMarkAttended: (sessionId: string) => void;
  onCancel: (sessionId: string) => void;
  onReschedule: (appointment: Appointment) => void;
}

export default function PackageSessionCard({
  sessionNumber,
  totalSessions,
  appointment,
  onMarkAttended,
  onCancel,
  onReschedule,
}: PackageSessionCardProps) {
  const { colors } = useTheme();

  if (!appointment) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.sessionTitle, { color: colors.textMuted }]}>
            Session {sessionNumber} of {totalSessions}
          </Text>
          <Text style={[styles.unScheduledText, { color: colors.textMuted }]}>Not Scheduled</Text>
        </View>
      </View>
    );
  }

  const isCancelled = appointment.status === 'Cancelled';
  const isPaid = appointment.status === 'Paid';
  const today = todayISO();
  const isToday = appointment.date === today;
  const isPast = appointment.date < today;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        isToday && { borderColor: colors.primary, borderWidth: 1.5 },
        isCancelled && { opacity: 0.6 },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.sessionPill}>
          <Ionicons name="ellipse" size={8} color={isCancelled ? colors.danger : isPaid ? colors.success : colors.primary} />
          <Text style={[styles.sessionTitle, { color: colors.text }]}>
            Session {sessionNumber} of {totalSessions}
          </Text>
        </View>

        <StatusChip status={appointment.status} small />
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.infoCol}>
          <View style={styles.iconText}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }, isCancelled && styles.strikethrough]}>
              {formatDateShort(appointment.date)}
            </Text>
          </View>
          <View style={styles.iconText}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              {formatTime(appointment.startTime)}
            </Text>
          </View>
        </View>

        <View style={styles.infoCol}>
          <View style={styles.iconText}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              {appointment.doctorName}
            </Text>
          </View>
          {appointment.therapistName ? (
            <View style={styles.iconText}>
              <Ionicons name="sparkles-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {appointment.therapistName}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {!isCancelled && !isPaid && (
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}
            onPress={() => {
              playClickSound();
              onMarkAttended(appointment.id);
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
            <Text style={[styles.actionBtnText, { color: colors.success }]}>Mark Attended</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => {
              playClickSound();
              onReschedule(appointment);
            }}
          >
            <Ionicons name="calendar-clear-outline" size={15} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}
            onPress={() => {
              playClickSound();
              onCancel(appointment.id);
            }}
          >
            <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  unScheduledText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCol: {
    gap: 4,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
