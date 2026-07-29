import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { getMonthGrid, todayISO } from '../../utils/dateUtils';
import { STATUS_COLORS } from '../../constants';
import { Appointment } from '../../types';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface MonthGridProps {
  selectedDate: string;
  appointments?: Appointment[];
  onSelectDate: (date: string) => void;
  onDateDoubleTap?: (date: string) => void;
}

export default function MonthGrid({
  selectedDate,
  appointments = [],
  onSelectDate,
}: MonthGridProps) {
  const { colors } = useTheme();
  const today = todayISO();
  const monthGrid = getMonthGrid(selectedDate);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Week Header */}
      <View style={[styles.weekHeader, { borderBottomColor: colors.border }]}>
        {WEEK_DAYS.map((day) => (
          <View key={day} style={styles.weekHeaderCol}>
            <Text style={[styles.weekHeaderText, { color: colors.textMuted }]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* 7x5 Month Grid Matrix */}
      <View style={styles.gridMatrix}>
        {monthGrid.map((cell) => {
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const dayAppts = appointments.filter((a) => a.date === cell.date);

          // Get unique status colors for dots
          const statusColors = Array.from(
            new Set(dayAppts.map((a) => STATUS_COLORS[a.status] || colors.primary))
          ).slice(0, 3);

          return (
            <TouchableOpacity
              key={cell.date}
              style={[
                styles.cell,
                { borderColor: colors.border },
                !cell.isCurrentMonth && styles.outsideCell,
                isSelected && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => onSelectDate(cell.date)}
              activeOpacity={0.7}
            >
              {/* Day Number Badge */}
              <View
                style={[
                  styles.dayNumBadge,
                  isToday && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.dayNumText,
                    { color: cell.isCurrentMonth ? colors.text : colors.textMuted },
                    isToday && { color: '#FFF', fontWeight: '700' },
                    !cell.isCurrentMonth && { opacity: 0.4 },
                  ]}
                >
                  {cell.dayNum}
                </Text>
              </View>

              {/* Status Dots */}
              <View style={styles.dotsRow}>
                {statusColors.map((color, idx) => (
                  <View key={idx} style={[styles.dot, { backgroundColor: color }]} />
                ))}
                {dayAppts.length > 3 && (
                  <Text style={[styles.moreCount, { color: colors.textMuted }]}>
                    +{dayAppts.length - 3}
                  </Text>
                )}
              </View>

              {/* Appointment count pill */}
              {dayAppts.length > 0 && (
                <View style={[styles.countPill, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.countText, { color: colors.primary }]}>
                    {dayAppts.length} appt{dayAppts.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  weekHeaderCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: '14.28%', // 100% / 7 columns
    height: 80,
    borderWidth: 0.5,
    padding: 4,
    justifyContent: 'space-between',
  },
  outsideCell: {
    opacity: 0.45,
  },
  dayNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dayNumText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreCount: {
    fontSize: 9,
    fontWeight: '600',
  },
  countPill: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
