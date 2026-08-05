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
  onViewSessionDetails?: (appointment: Appointment) => void;
}

export default function PackageSessionCard({
  sessionNumber,
  totalSessions,
  appointment,
  onMarkAttended,
  onCancel,
  onReschedule,
  onViewSessionDetails,
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
  const isOverdue = isPast && !isPaid && !isCancelled;

  // Show action buttons only for future/today sessions that aren't settled
  const showActions = !isCancelled && !isPaid && !isPast;

  const dotColor = isCancelled
    ? colors.danger
    : isPaid
    ? colors.success
    : isToday
    ? colors.primary
    : isOverdue
    ? colors.danger
    : colors.textMuted;

  const handleCardPress = () => {
    if (onViewSessionDetails) {
      playClickSound();
      onViewSessionDetails(appointment);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        isToday && { borderColor: colors.primary, borderWidth: 1.5 },
        isCancelled && { opacity: 0.55 },
        isOverdue && { opacity: 0.75 },
      ]}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        disabled={!onViewSessionDetails}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.sessionPill}>
            <Ionicons name="ellipse" size={8} color={dotColor} />
            <Text style={[styles.sessionTitle, { color: isOverdue ? colors.textMuted : colors.text }]}>
              Session {sessionNumber} of {totalSessions}
            </Text>
            {isToday && (
              <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <StatusChip status={appointment.status} date={appointment.date} small />
            {onViewSessionDetails && (
              <Ionicons name="chevron-forward" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.infoCol}>
            <View style={styles.iconText}>
              <Ionicons name="calendar-outline" size={14} color={isToday ? colors.primary : colors.textMuted} />
              <Text
                style={[
                  styles.infoText,
                  { color: colors.text },
                  isCancelled && styles.strikethrough,
                  isPast && !isPaid && { color: colors.textMuted },
                ]}
              >
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
                {/* body-outline used for therapist — sparkles-outline not in Ionicons v5 */}
                <Ionicons name="body-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  {appointment.therapistName}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {showActions && (
        <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
            onPress={() => {
              playClickSound();
              onMarkAttended(appointment.id);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Attended</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              playClickSound();
              onReschedule(appointment);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Reschedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.danger }]}
            onPress={() => {
              playClickSound();
              onCancel(appointment.id);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={16} color="#FFF" />
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  todayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  unScheduledText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
  },
  infoCol: {
    gap: 6,
  },
  iconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
