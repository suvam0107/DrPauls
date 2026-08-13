import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { STATUS_COLORS, APPOINTMENT_STATUS } from '../../constants';
import { formatTime } from '../../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Appointment } from '../../types';
import { playClickSound } from '../../utils/feedback';

export interface AppointmentChipProps {
  appointment: Appointment;
  onPress?: (appointment: Appointment) => void;
  isCompact?: boolean;
  isDraggable?: boolean;
}

/** Renders appointment card inside the calendar slot with solid background card protection & clean margins */
export default function AppointmentChip({
  appointment,
  onPress,
  isCompact = false,
  isDraggable = false,
}: AppointmentChipProps) {
  const { colors, isDark } = useTheme();
  const status = appointment.status;
  const rawColor = STATUS_COLORS[status] || '#2563EB';

  const titleColor = rawColor;
  const subtextColor = isDark ? colors.textMuted : '#4B5563';
  const timeTextColor = isDark ? colors.text : '#374151';
  const chipBgColor = isDark ? rawColor + '35' : rawColor + '1F';

  const isCancelled = status === APPOINTMENT_STATUS.CANCELLED;

  const handlePress = () => {
    playClickSound();
    if (onPress) onPress(appointment);
  };

  if (isCompact) {
    return (
      <View style={[styles.compactSolidWrapper, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.compactChip,
            { backgroundColor: chipBgColor, borderColor: rawColor },
            isCancelled && styles.cancelledChip,
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.topRow}>
            <Text
              style={[styles.compactPatientName, { color: titleColor }, isCancelled && styles.cancelledText]}
              numberOfLines={1}
            >
              {appointment.patientName}
            </Text>
            {appointment.visitType === 'Home' && (
              <Ionicons name="home" size={8} color={isDark ? '#2DD4BF' : '#0D9488'} />
            )}
          </View>

          {/* Display End Time in compact week view */}
          <Text style={[styles.compactTime, { color: timeTextColor }]} numberOfLines={1}>
            Till {formatTime(appointment.endTime)}
          </Text>

          <Text style={[styles.compactDetails, { color: subtextColor }]} numberOfLines={1}>
            {appointment.serviceType}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.solidWrapper, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[
          styles.chip,
          { backgroundColor: chipBgColor, borderColor: rawColor },
          isCancelled && styles.cancelledChip,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.topRow}>
          <Text
            style={[styles.patientName, { color: titleColor }, isCancelled && styles.cancelledText]}
            numberOfLines={1}
          >
            {appointment.patientName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {appointment.visitType === 'Home' && (
              <View style={[styles.badge, { backgroundColor: isDark ? '#14B8A6' : '#0D9488' }]}>
                <Ionicons name="home-outline" size={10} color="#FFFFFF" />
              </View>
            )}
            {isDraggable && (
              <Text style={[styles.dragHandle, { color: subtextColor }]}>⋮⋮</Text>
            )}
          </View>
        </View>

        <Text style={[styles.details, { color: subtextColor }]} numberOfLines={1}>
          {appointment.serviceType} • {appointment.doctorName}
        </Text>

        <Text style={[styles.time, { color: timeTextColor }]} numberOfLines={1}>
          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  solidWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  compactSolidWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    flex: 1,
    marginVertical: 1,
    marginHorizontal: 2,
  },
  chip: {
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    flex: 1,
  },
  compactChip: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'center',
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  compactPatientName: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  details: {
    fontSize: 11,
    marginTop: 2,
  },
  compactDetails: {
    fontSize: 9,
  },
  time: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  compactTime: {
    fontSize: 9,
    fontWeight: '700',
  },
  cancelledChip: {
    opacity: 0.6,
  },
  cancelledText: {
    textDecorationLine: 'line-through',
  },
  dragHandle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -1,
    opacity: 0.6,
  },
});
