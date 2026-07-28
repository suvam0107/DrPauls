import React, { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import AppointmentChip from './AppointmentChip';
import { APPOINTMENT_STATUS } from '../../constants';
import {
  offsetToTime,
  timeToMins,
  addMins,
  formatTime,
  formatDateShort,
} from '../../utils/dateUtils';
import useAppointmentStore from '../../store/useAppointmentStore';

const ELIGIBLE_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.RESCHEDULED,
];

export default function DraggableChip({
  appointment,
  onPress,
  isCompact = false,
  top,
  height,
  colIndex = 0,
  colWidth = 76,
  daysToRender = [],
  onDragStart,
  onDragEnd,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);

  const isEligible = ELIGIBLE_STATUSES.includes(appointment.status);

  // Automatically reset animation transforms whenever the appointment date, start time, or status updates
  useEffect(() => {
    pan.setOffset({ x: 0, y: 0 });
    pan.setValue({ x: 0, y: 0 });
  }, [appointment.date, appointment.startTime, appointment.status]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!isEligible) return false;
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        if (!isEligible) return false;
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        if (onDragStart) onDragStart();
        setIsDragging(true);
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (onDragEnd) onDragEnd();
        pan.flattenOffset();
        setIsDragging(false);

        const currentDy = gestureState.dy;
        const currentDx = gestureState.dx;

        // If drag was negligible, reset animation vector cleanly
        if (Math.abs(currentDy) < 8 && Math.abs(currentDx) < 8) {
          pan.setOffset({ x: 0, y: 0 });
          pan.setValue({ x: 0, y: 0 });
          return;
        }

        // Calculate target time slot from Y offset
        const targetY = top + currentDy;
        const newStartTime = offsetToTime(targetY);
        const durationMins = timeToMins(appointment.endTime) - timeToMins(appointment.startTime);
        const newEndTime = addMins(newStartTime, durationMins);

        // Calculate target day from X offset in Week View
        let targetColIndex = colIndex;
        if (daysToRender.length > 1 && colWidth > 0) {
          const rawColIndex = Math.round((colIndex * colWidth + currentDx) / colWidth);
          targetColIndex = Math.max(0, Math.min(daysToRender.length - 1, rawColIndex));
        }
        const newDate = daysToRender[targetColIndex] || appointment.date;

        // Check if slot changed
        if (newDate === appointment.date && newStartTime === appointment.startTime) {
          pan.setOffset({ x: 0, y: 0 });
          pan.setValue({ x: 0, y: 0 });
          return;
        }

        // Comprehensive slot validation (past check + interval overlap check)
        const validation = useAppointmentStore
          .getState()
          .validateSlot(newDate, newStartTime, newEndTime, appointment.doctorId, appointment.id);

        if (validation.valid) {
          // Reset pan transform vectors before updating store so re-render mounts at new position with 0 offset
          pan.setOffset({ x: 0, y: 0 });
          pan.setValue({ x: 0, y: 0 });

          // Success: Update appointment store (changes date, startTime, and sets status to RESCHEDULED)
          useAppointmentStore.getState().moveAppointment(appointment.id, newDate, newStartTime, newEndTime);

          // Show Success Toast at bottom above navigation bar
          Toast.show({
            type: 'success',
            text1: 'Appointment Rescheduled',
            text2: `${appointment.patientName} moved to ${formatTime(newStartTime)} (${formatDateShort(newDate)})`,
            position: 'bottom',
            bottomOffset: 95,
            visibilityTime: 3000,
          });
        } else {
          // Failure: Reset pan vectors back to origin
          pan.setOffset({ x: 0, y: 0 });
          pan.setValue({ x: 0, y: 0 });

          // Show Failure Toast at bottom above navigation bar
          Toast.show({
            type: 'error',
            text1: validation.reason === 'past' ? 'Invalid Time' : 'Slot Colliding',
            text2: validation.message,
            position: 'bottom',
            bottomOffset: 95,
            visibilityTime: 3200,
          });
        }
      },
      onPanResponderTerminate: () => {
        if (onDragEnd) onDragEnd();
        setIsDragging(false);
        pan.setOffset({ x: 0, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.positioner,
        {
          top,
          height,
          left: isCompact ? 1 : 2,
          right: isCompact ? 1 : 2,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          zIndex: isDragging ? 999 : 10,
          elevation: isDragging ? 12 : 2,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <AppointmentChip
        appointment={appointment}
        onPress={onPress}
        isCompact={isCompact}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    justifyContent: 'center',
  },
});
