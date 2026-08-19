import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';
import { APPOINTMENT_STATUS, STATUS_COLORS } from '../../constants';
import { formatDateShort, formatMonthYear, dayNumber, weekdayLabel } from '../../utils/dateUtils';
import { CalendarView } from '../../types';
import { playClickSound } from '../../utils/feedback';

const VIEWS = ['Day', 'Week', 'Month'];
const VIEW_KEYS: CalendarView[] = ['day', 'week', 'month'];
const STATUS_FILTERS: string[] = Object.values(APPOINTMENT_STATUS);

export interface CalendarHeaderProps {
  selectedDate: string;
  onDateChange: (deltaOrDate: number | string) => void;
  weekDates: string[];
  calendarView: CalendarView;
  onViewChange: (view: CalendarView) => void;
  displayMode?: 'grid' | 'list';
  onDisplayModeChange?: (mode: 'grid' | 'list') => void;
  activeFilters: string[];
  onFilterToggle: (status: string) => void;
}

export default function CalendarHeader({
  selectedDate,
  onDateChange,
  weekDates,
  calendarView,
  onViewChange,
  displayMode = 'grid',
  onDisplayModeChange,
  activeFilters,
  onFilterToggle,
}: CalendarHeaderProps) {
  const { colors, isDark } = useTheme();

  const [tabWidth, setTabWidth] = useState(0);
  const viewIndicatorX = useSharedValue(0);

  const activeIndex = Math.max(0, VIEW_KEYS.indexOf(calendarView));

  useEffect(() => {
    if (tabWidth > 0) {
      viewIndicatorX.value = withTiming(activeIndex * tabWidth, {
        duration: 90,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [calendarView, tabWidth, activeIndex]);

  const handleToggleLayout = (e: LayoutChangeEvent) => {
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

  const handleDatePress = (deltaOrDate: number | string) => {
    playClickSound();
    onDateChange(deltaOrDate);
  };

  const handleViewPress = (view: CalendarView) => {
    playClickSound();
    onViewChange(view);
  };

  const handleFilterPress = (status: string) => {
    playClickSound();
    onFilterToggle(status);
  };

  const handleDisplayToggle = () => {
    playClickSound();
    if (onDisplayModeChange) {
      onDisplayModeChange(displayMode === 'grid' ? 'list' : 'grid');
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.row}>
        <View style={styles.dateNavGroup}>
          <TouchableOpacity
            onPress={() => handleDatePress(-1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navArrowBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.dateLabel, { color: colors.text }]}>
            {getDateLabel()}
          </Text>

          <TouchableOpacity
            onPress={() => handleDatePress(1)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.navArrowBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={[styles.todayBtn, { borderColor: colors.primary }]}
            onPress={() => handleDatePress(0)}
          >
            <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
          </TouchableOpacity>

          {/* List Mode / Grid Mode Icon Toggle */}
          <TouchableOpacity
            style={[
              styles.modeBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleDisplayToggle}
            hitSlop={6}
          >
            <Ionicons
              name={displayMode === 'grid' ? 'list-outline' : 'grid-outline'}
              size={18}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
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
                onPress={() => handleViewPress(key)}
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
                onPress={() => handleDatePress(d)}
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
  navArrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dateLabel: { fontSize: 16, fontWeight: '700' },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  todayText: { fontSize: 12, fontWeight: '600' },
  modeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
