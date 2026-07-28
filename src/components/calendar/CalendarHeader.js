import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { APPOINTMENT_STATUS, STATUS_COLORS } from '../../constants';
import { formatDateShort, formatMonthYear, dayNumber, weekdayLabel } from '../../utils/dateUtils';

const VIEWS = ['Day', 'Week', 'Month'];
const VIEW_KEYS = ['day', 'week', 'month'];
const STATUS_FILTERS = Object.values(APPOINTMENT_STATUS);

export default function CalendarHeader({
  selectedDate,
  onDateChange,
  weekDates,
  calendarView,
  onViewChange,
  activeFilters,
  onFilterToggle,
}) {
  const { colors, isDark } = useTheme();

  const [tabWidth, setTabWidth] = useState(0);
  const viewIndicatorX = useSharedValue(0);

  const activeIndex = Math.max(0, VIEW_KEYS.indexOf(calendarView));

  useEffect(() => {
    if (tabWidth > 0) {
      viewIndicatorX.value = withTiming(activeIndex * tabWidth, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [calendarView, tabWidth, activeIndex]);

  const handleToggleLayout = (e) => {
    const totalW = e.nativeEvent.layout.width;
    if (totalW > 0) {
      setTabWidth(totalW / VIEWS.length);
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: viewIndicatorX.value }],
  }));

  const getDateLabel = () => {
    if (calendarView === 'day') {
      return formatDateShort(selectedDate);
    } else if (calendarView === 'week') {
      return `${formatDateShort(weekDates[0])} – ${formatDateShort(weekDates[6])}`;
    } else {
      return formatMonthYear(selectedDate);
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {/* Row 1: Date range & Today shortcut */}
      <View style={styles.row}>
        <View style={styles.dateNavGroup}>
          <TouchableOpacity onPress={() => onDateChange(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.dateLabel, { color: colors.text }]}>
            {getDateLabel()}
          </Text>

          <TouchableOpacity onPress={() => onDateChange(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.todayBtn, { borderColor: colors.primary }]}
          onPress={() => onDateChange(0)}
        >
          <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Day / Week / Month Toggle Pill */}
      <View style={styles.viewRow}>
        <View
          style={[styles.viewToggle, { backgroundColor: colors.surface }]}
          onLayout={handleToggleLayout}
        >
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.viewIndicator,
                { backgroundColor: colors.primary, width: tabWidth },
                indicatorStyle,
              ]}
            />
          )}
          {VIEWS.map((v, i) => {
            const key = VIEW_KEYS[i];
            const isActive = calendarView === key;
            return (
              <TouchableOpacity
                key={v}
                style={styles.viewBtn}
                onPress={() => onViewChange(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.viewBtnText,
                    { color: isActive ? '#FFF' : colors.textMuted },
                  ]}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Row 3: Week day strip (day view) */}
      {calendarView === 'day' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {weekDates.map((d) => {
            const active = d === selectedDate;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayPill, active && { backgroundColor: colors.primary }]}
                onPress={() => onDateChange(d)}
              >
                <Text style={[styles.dayName, { color: active ? '#FFF' : colors.textMuted }]}>
                  {weekdayLabel(d)}
                </Text>
                <Text style={[styles.dayNum, { color: active ? '#FFF' : colors.text }]}>
                  {dayNumber(d)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Row 4: Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((s) => {
          const active = activeFilters.includes(s);
          const c = STATUS_COLORS[s];
          const activeBg = isDark ? c + '45' : c + '25';
          return (
            <TouchableOpacity
              key={s}
              onPress={() => onFilterToggle(s)}
              style={[
                styles.filterChip,
                { borderColor: c, backgroundColor: active ? activeBg : 'transparent' },
              ]}
            >
              <Text style={[styles.filterText, { color: active && isDark ? '#FFFFFF' : c }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dateNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: { fontSize: 16, fontWeight: '700' },
  todayBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  todayText: { fontSize: 12, fontWeight: '600' },
  viewRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    height: 36,
  },
  viewIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 10,
  },
  viewBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  dayStrip: { paddingHorizontal: 16, gap: 6, paddingBottom: 6 },
  dayPill: { alignItems: 'center', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, minWidth: 46 },
  dayName: { fontSize: 11, fontWeight: '500' },
  dayNum: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  filters: { paddingHorizontal: 16, gap: 6, paddingBottom: 4 },
  filterChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  filterText: { fontSize: 11, fontWeight: '600' },
});
