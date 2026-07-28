import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import {
  generateTimeSlots,
  timeToTopOffset,
  durationToHeight,
  weekdayLabel,
  dayNumber,
  currentTimeSlot,
} from '../../utils/dateUtils';
import { SLOT_HEIGHT, TIME_LABEL_WIDTH } from '../../constants';
import DraggableChip from './DraggableChip';

const WEEK_COL_MIN_WIDTH = 76;
const HEADER_HEIGHT = 44;

export default function CalendarGrid({
  selectedDate,
  weekDates,
  viewMode = 'day',
  appointments = [],
  onSlotPress,
  onAppointmentPress,
}) {
  const { colors } = useTheme();
  const timeSlots = generateTimeSlots();

  const verticalScrollRef = useRef(null);
  const [isDraggingChip, setIsDraggingChip] = useState(false);

  const isWeek = viewMode === 'week';
  const daysToRender = isWeek ? weekDates : [selectedDate];

  // Auto-scroll to current timeslot when the calendar page opens
  useEffect(() => {
    const currentSlot = currentTimeSlot();
    const targetY = Math.max(0, timeToTopOffset(currentSlot) - 60);
    const timer = setTimeout(() => {
      verticalScrollRef.current?.scrollTo({ y: targetY, animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView
      ref={verticalScrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={!isDraggingChip}
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
                  <View key={d} style={[styles.weekHeaderCol, { minWidth: WEEK_COL_MIN_WIDTH, borderLeftColor: colors.border, height: HEADER_HEIGHT }]}>
                    <Text style={[styles.weekDayName, { color: colors.textMuted }]}>{weekdayLabel(d)}</Text>
                    <Text style={[styles.weekDayNum, { color: colors.text }]}>{dayNumber(d)}</Text>
                  </View>
                ))}
              </View>

              {/* Synchronized Day Columns Grid Row */}
              <View style={styles.dayColumnsRow}>
                {daysToRender.map((dateStr, cIdx) => {
                  const dayAppts = appointments.filter((a) => a.date === dateStr);

                  return (
                    <View
                      key={dateStr}
                      style={[
                        styles.dayColumn,
                        { borderColor: colors.border, minWidth: WEEK_COL_MIN_WIDTH },
                      ]}
                    >
                      {/* Empty slot touchable boxes */}
                      {timeSlots.map((slot) => (
                        <TouchableOpacity
                          key={slot.time}
                          style={[styles.slotCell, { height: SLOT_HEIGHT, borderColor: colors.border }]}
                          onPress={() => onSlotPress && onSlotPress(dateStr, slot.time)}
                          activeOpacity={0.6}
                        />
                      ))}

                      {/* Overlay Occupied Appointment Chips with Drag-and-Drop */}
                      {dayAppts.map((appt) => {
                        const top = timeToTopOffset(appt.startTime);
                        const height = durationToHeight(appt.startTime, appt.endTime);

                        return (
                          <DraggableChip
                            key={appt.id}
                            appointment={appt}
                            onPress={onAppointmentPress}
                            isCompact
                            top={top}
                            height={height}
                            colIndex={cIdx}
                            colWidth={WEEK_COL_MIN_WIDTH}
                            daysToRender={daysToRender}
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

              return (
                <View
                  key={dateStr}
                  style={[styles.dayColumn, { borderColor: colors.border, flex: 1 }]}
                >
                  {/* Empty slot touchable boxes */}
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot.time}
                      style={[styles.slotCell, { height: SLOT_HEIGHT, borderColor: colors.border }]}
                      onPress={() => onSlotPress && onSlotPress(dateStr, slot.time)}
                      activeOpacity={0.6}
                    />
                  ))}

                  {/* Overlay Occupied Appointment Chips with Drag-and-Drop */}
                  {dayAppts.map((appt) => {
                    const top = timeToTopOffset(appt.startTime);
                    const height = durationToHeight(appt.startTime, appt.endTime);

                    return (
                      <DraggableChip
                        key={appt.id}
                        appointment={appt}
                        onPress={onAppointmentPress}
                        isCompact={false}
                        top={top}
                        height={height}
                        colIndex={0}
                        colWidth={0}
                        daysToRender={[selectedDate]}
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
