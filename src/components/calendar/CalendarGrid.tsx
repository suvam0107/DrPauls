import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  generateTimeSlots,
  timeToTopOffset,
  durationToHeight,
  weekdayLabel,
  dayNumber,
  currentTimeSlot,
  computeAppointmentLayouts,
  isPastSlot,
} from '../../utils/dateUtils';
import { SLOT_HEIGHT, TIME_LABEL_WIDTH } from '../../constants';
import DraggableChip from './DraggableChip';
import { Appointment, CalendarView } from '../../types';

const WEEK_COL_MIN_WIDTH = 76;
const HEADER_HEIGHT = 44;

export interface CalendarGridProps {
  selectedDate: string;
  weekDates: string[];
  viewMode?: CalendarView;
  appointments?: Appointment[];
  onSlotPress?: (date: string, time: string) => void;
  onAppointmentPress?: (appointment: Appointment) => void;
  onDateSelect?: (date: string) => void;
}

export default function CalendarGrid({
  selectedDate,
  weekDates,
  viewMode = 'day',
  appointments = [],
  onSlotPress,
  onAppointmentPress,
  onDateSelect,
}: CalendarGridProps) {
  const { colors, isDark } = useTheme();
  const timeSlots = generateTimeSlots();

  const verticalScrollRef = useRef<ScrollView>(null);
  const [isDraggingChip, setIsDraggingChip] = useState(false);

  /**
   * Track current scroll offset Y in a ref so DraggableChip's auto-scroll
   * can read and write the offset without triggering re-renders.
   */
  const scrollOffsetY = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetY.current = event.nativeEvent.contentOffset.y;
    },
    []
  );

  const isWeek = viewMode === 'week';
  const daysToRender = isWeek ? weekDates : [selectedDate];

  // Auto-scroll to current timeslot when the calendar page opens
  useEffect(() => {
    const currentSlot = currentTimeSlot();
    const targetY = Math.max(0, timeToTopOffset(currentSlot) - 60);
    const timer = setTimeout(() => {
      verticalScrollRef.current?.scrollTo({ y: targetY, animated: true });
      scrollOffsetY.current = targetY;
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      ref={verticalScrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={!isDraggingChip}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.gridWrapper}>
        {/* Fixed Left Time Labels Column */}
        <View style={[styles.stickyTimeColumn, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
          {/* Top-Left Corner Spacer Box (aligned with Week Header height) */}
          {isWeek && <View style={[styles.cornerBox, { height: HEADER_HEIGHT, borderBottomColor: colors.border }]} />}

          {/* Vertical Time Label Cells */}
          {timeSlots.map((slot) => (
            <View key={slot.time} style={[styles.timeLabelBox, { height: SLOT_HEIGHT }]}>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{slot.label}</Text>
            </View>
          ))}
        </View>

        {/* Right Schedule Area */}
        {isWeek ? (
          /* Single Synchronized Horizontal ScrollView containing BOTH Header and Grid Row! */
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            scrollEnabled={!isDraggingChip}
            style={{ flex: 1 }}
          >
            <View>
              {/* Synchronized Week Date Header Row */}
              <View style={[styles.weekHeaderRow, { borderBottomColor: colors.border, height: HEADER_HEIGHT }]}>
                {daysToRender.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.weekHeaderCol, { minWidth: WEEK_COL_MIN_WIDTH, borderLeftColor: colors.border, height: HEADER_HEIGHT }]}
                    onPress={() => onDateSelect && onDateSelect(d)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.weekDayName, { color: d === selectedDate ? colors.primary : colors.textMuted }]}>{weekdayLabel(d)}</Text>
                    <Text style={[styles.weekDayNum, { color: d === selectedDate ? colors.primary : colors.text }]}>{dayNumber(d)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Synchronized Day Columns Grid Row */}
              <View style={styles.dayColumnsRow}>
                {daysToRender.map((dateStr, cIdx) => {
                  const dayAppts = appointments.filter((a) => a.date === dateStr);
                  const layoutMap = computeAppointmentLayouts(dayAppts);

                  return (
                    <View
                      key={dateStr}
                      style={[
                        styles.dayColumn,
                        { borderColor: colors.border, minWidth: WEEK_COL_MIN_WIDTH },
                      ]}
                    >
                      {/* Empty slot touchable boxes */}
                      {timeSlots.map((slot) => {
                        const past = isPastSlot(dateStr, slot.time);
                        return (
                          <TouchableOpacity
                            key={slot.time}
                            style={[
                              styles.slotCell,
                              { height: SLOT_HEIGHT, borderColor: colors.border },
                              past && { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(229,231,235,0.4)' },
                            ]}
                            onPress={() => !past && onSlotPress && onSlotPress(dateStr, slot.time)}
                            disabled={past}
                            activeOpacity={0.6}
                          />
                        );
                      })}

                      {/* Overlay Occupied Appointment Chips with Drag-and-Drop */}
                      {dayAppts.map((appt) => {
                        const chipTop = timeToTopOffset(appt.startTime);
                        const chipHeight = durationToHeight(appt.startTime, appt.endTime);
                        const layout = layoutMap.get(appt.id) || { overlapIndex: 0, totalOverlapCount: 1 };

                        return (
                          <DraggableChip
                            key={appt.id}
                            appointment={appt}
                            onPress={onAppointmentPress}
                            isCompact
                            top={chipTop}
                            height={chipHeight}
                            colIndex={cIdx}
                            colWidth={WEEK_COL_MIN_WIDTH}
                            daysToRender={daysToRender}
                            overlapIndex={layout.overlapIndex}
                            totalOverlapCount={layout.totalOverlapCount}
                            scrollRef={verticalScrollRef}
                            scrollOffsetY={scrollOffsetY}
                            onDragStart={() => setIsDraggingChip(true)}
                            onDragEnd={() => setIsDraggingChip(false)}
                          />
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Single Day View */
          <View style={styles.singleDayContainer}>
            {daysToRender.map((dateStr) => {
              const dayAppts = appointments.filter((a) => a.date === dateStr);
              const layoutMap = computeAppointmentLayouts(dayAppts);

              return (
                <View
                  key={dateStr}
                  style={[styles.dayColumn, { borderColor: colors.border, flex: 1 }]}
                >
                  {/* Empty slot touchable boxes */}
                  {timeSlots.map((slot) => {
                    const past = isPastSlot(dateStr, slot.time);
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[
                          styles.slotCell,
                          { height: SLOT_HEIGHT, borderColor: colors.border },
                          past && { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(229,231,235,0.4)' },
                        ]}
                        onPress={() => !past && onSlotPress && onSlotPress(dateStr, slot.time)}
                        disabled={past}
                        activeOpacity={0.6}
                      />
                    );
                  })}

                  {/* Overlay Occupied Appointment Chips with Drag-and-Drop */}
                  {dayAppts.map((appt) => {
                    const chipTop = timeToTopOffset(appt.startTime);
                    const chipHeight = durationToHeight(appt.startTime, appt.endTime);
                    const layout = layoutMap.get(appt.id) || { overlapIndex: 0, totalOverlapCount: 1 };

                    return (
                      <DraggableChip
                        key={appt.id}
                        appointment={appt}
                        onPress={onAppointmentPress}
                        isCompact={false}
                        top={chipTop}
                        height={chipHeight}
                        colIndex={0}
                        colWidth={0}
                        daysToRender={[selectedDate]}
                        overlapIndex={layout.overlapIndex}
                        totalOverlapCount={layout.totalOverlapCount}
                        scrollRef={verticalScrollRef}
                        scrollOffsetY={scrollOffsetY}
                        onDragStart={() => setIsDraggingChip(true)}
                        onDragEnd={() => setIsDraggingChip(false)}
                      />
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  stickyTimeColumn: {
    width: TIME_LABEL_WIDTH,
    borderRightWidth: 1,
    zIndex: 20,
  },
  cornerBox: {
    borderBottomWidth: 1,
  },
  timeLabelBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  weekHeaderCol: {
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  weekDayName: {
    fontSize: 11,
    fontWeight: '500',
  },
  weekDayNum: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  dayColumnsRow: {
    flexDirection: 'row',
  },
  singleDayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  dayColumn: {
    position: 'relative',
    borderLeftWidth: 1,
  },
  slotCell: {
    borderBottomWidth: 1,
    width: '100%',
  },
});
