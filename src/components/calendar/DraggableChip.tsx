import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import AppointmentChip from './AppointmentChip';
import { APPOINTMENT_STATUS, SLOT_HEIGHT, SLOT_MINUTES } from '../../constants';
import {
  timeToMins,
  minsToTime,
  addMins,
  formatTime,
  formatDateShort,
  isPastSlot,
} from '../../utils/dateUtils';
import { GRID_START_HOUR, GRID_END_HOUR } from '../../constants';
import useAppointmentStore from '../../store/useAppointmentStore';
import { Appointment } from '../../types';
import { playAppointmentSuccessSound, playAppointmentFailureSound } from '../../utils/feedback';
import { useMoveAppointmentMutation } from '../../hooks/mutations/useAppointmentMutations';

const ELIGIBLE_STATUSES: string[] = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.RESCHEDULED,
];

/** Top boundary trigger: pageY above calendar header (header height ~165px) */
const AUTO_SCROLL_TOP_BOUNDARY = 165;
/** Bottom boundary trigger offset from screen height (bottom navbar ~110px) */
const AUTO_SCROLL_BOTTOM_MARGIN = 110;
/** Pixels per 16ms tick (~60fps) */
const AUTO_SCROLL_SPEED = 6;

export interface DraggableChipProps {
  appointment: Appointment;
  onPress?: (appointment: Appointment) => void;
  isCompact?: boolean;
  top: number;
  height: number;
  colIndex?: number;
  colWidth?: number;
  daysToRender?: string[];
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** 0-based column index within concurrent overlapping cluster */
  overlapIndex?: number;
  /** Total count of concurrent overlapping appointments in cluster */
  totalOverlapCount?: number;
  /** ScrollView ref from CalendarGrid for edge-detection auto-scroll during drag */
  scrollRef?: React.RefObject<any>;
  /** Current scroll offset Y tracked by the parent CalendarGrid */
  scrollOffsetY?: React.MutableRefObject<number>;
}

/**
 * Snaps a pixel Y offset (relative to the grid top) to the nearest slot boundary,
 * then converts to "HH:mm".
 */
function snapOffsetToTime(offsetY: number): string {
  const gridStartMins = GRID_START_HOUR * 60;
  const gridEndMins = GRID_END_HOUR * 60;

  const rawMins = gridStartMins + (offsetY / SLOT_HEIGHT) * SLOT_MINUTES;
  const snapped = Math.round(rawMins / SLOT_MINUTES) * SLOT_MINUTES;
  const clamped = Math.max(gridStartMins, Math.min(gridEndMins - SLOT_MINUTES, snapped));
  return minsToTime(clamped);
}

import RescheduleConfirmationModal from '../shared/RescheduleConfirmationModal';

export interface PendingMoveData {
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}

export default function DraggableChip({
  appointment,
  onPress,
  isCompact = false,
  top,
  height,
  colIndex = 0,
  colWidth = 76,
  daysToRender = [],
  overlapIndex = 0,
  totalOverlapCount = 1,
  onDragStart,
  onDragEnd,
  scrollRef,
  scrollOffsetY,
}: DraggableChipProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMoveData | null>(null);
  const moveAppointmentMutation = useMoveAppointmentMutation();

  const isPast = isPastSlot(appointment.date, appointment.startTime);
  const isEligible = ELIGIBLE_STATUSES.includes(appointment.status) && !isPast;

  // Refs for latest data (prevents stale closures inside PanResponder)
  const appointmentRef = useRef(appointment);
  appointmentRef.current = appointment;

  const topRef = useRef(top);
  topRef.current = top;

  const colIndexRef = useRef(colIndex);
  colIndexRef.current = colIndex;

  const colWidthRef = useRef(colWidth);
  colWidthRef.current = colWidth;

  const daysToRenderRef = useRef(daysToRender);
  daysToRenderRef.current = daysToRender;

  // Track initial scroll position and latest gesture offsets during drag
  const initialScrollYRef = useRef(0);
  const lastDxRef = useRef(0);
  const lastDyRef = useRef(0);

  // Auto-scroll animation frame state
  const autoAnimationFrameRef = useRef<number | null>(null);
  const lastMoveYRef = useRef(0);

  const screenHeight = Dimensions.get('window').height;
  const bottomBoundary = screenHeight - AUTO_SCROLL_BOTTOM_MARGIN;

  /** Stop running auto-scroll animation frame */
  const stopAutoScroll = useCallback(() => {
    if (autoAnimationFrameRef.current !== null) {
      cancelAnimationFrame(autoAnimationFrameRef.current);
      autoAnimationFrameRef.current = null;
    }
  }, []);

  /** Smooth low-latency auto-scroll animation frame loop tethered to VSync */
  const startAutoScrollLoop = useCallback(() => {
    if (autoAnimationFrameRef.current !== null) return;

    const scrollStep = () => {
      const pageY = lastMoveYRef.current;
      const isTop = pageY < AUTO_SCROLL_TOP_BOUNDARY;
      const isBottom = pageY > bottomBoundary;

      if ((!isTop && !isBottom) || !scrollRef?.current || !scrollOffsetY) {
        autoAnimationFrameRef.current = null;
        return;
      }

      const direction = isTop ? -1 : 1;
      const currentOffset = scrollOffsetY.current;
      const maxScrollLimit = (GRID_END_HOUR - GRID_START_HOUR) * (60 / SLOT_MINUTES) * SLOT_HEIGHT;
      const nextOffset = Math.max(0, Math.min(maxScrollLimit, currentOffset + direction * 5));

      if (nextOffset !== currentOffset) {
        scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
        scrollOffsetY.current = nextOffset;

        const scrollDelta = nextOffset - initialScrollYRef.current;
        pan.setValue({ x: lastDxRef.current, y: lastDyRef.current + scrollDelta });
      }

      autoAnimationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    autoAnimationFrameRef.current = requestAnimationFrame(scrollStep);
  }, [scrollRef, scrollOffsetY, bottomBoundary, pan]);

  /** Update touch pageY during drag and trigger/stop auto-scroll */
  const updateAutoScroll = useCallback(
    (pageY: number) => {
      lastMoveYRef.current = pageY;
      const isTop = pageY < AUTO_SCROLL_TOP_BOUNDARY;
      const isBottom = pageY > bottomBoundary;

      if (isTop || isBottom) {
        startAutoScrollLoop();
      } else {
        stopAutoScroll();
      }
    },
    [bottomBoundary, startAutoScrollLoop, stopAutoScroll]
  );

  const panResponder = useMemo(
    () =>
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

          initialScrollYRef.current = scrollOffsetY ? scrollOffsetY.current : 0;
          lastDxRef.current = 0;
          lastDyRef.current = 0;

          pan.setOffset({ x: 0, y: 0 });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: (evt, gestureState) => {
          lastDxRef.current = gestureState.dx;
          lastDyRef.current = gestureState.dy;

          const currentScroll = scrollOffsetY ? scrollOffsetY.current : 0;
          const scrollDelta = currentScroll - initialScrollYRef.current;

          // Position chip combining gesture movement + scroll delta
          pan.setValue({ x: gestureState.dx, y: gestureState.dy + scrollDelta });

          // Edge-detection auto-scroll trigger
          updateAutoScroll(evt.nativeEvent.pageY);
        },
        onPanResponderRelease: (_, gestureState) => {
          stopAutoScroll();
          if (onDragEnd) onDragEnd();
          pan.flattenOffset();
          setIsDragging(false);

          const finalScroll = scrollOffsetY ? scrollOffsetY.current : 0;
          const totalScrollDelta = finalScroll - initialScrollYRef.current;
          const effectiveDy = gestureState.dy + totalScrollDelta;
          const effectiveDx = gestureState.dx;

          const appt = appointmentRef.current;
          const currentTop = topRef.current;
          const currentColIndex = colIndexRef.current;
          const currentColWidth = colWidthRef.current;
          const currentDays = daysToRenderRef.current;

          // If drag was negligible, reset
          if (Math.abs(effectiveDy) < 8 && Math.abs(effectiveDx) < 8) {
            pan.setValue({ x: 0, y: 0 });
            return;
          }

          // Calculate target time slot from total Y offset (snap to grid)
          const targetY = currentTop + effectiveDy;
          const newStartTime = snapOffsetToTime(targetY);
          const durationMins = timeToMins(appt.endTime) - timeToMins(appt.startTime);
          const newEndTime = addMins(newStartTime, durationMins);

          // Calculate target day from X offset in Week View
          let targetColIndex = currentColIndex;
          if (currentDays.length > 1 && currentColWidth > 0) {
            const rawColIndex = Math.round(
              (currentColIndex * currentColWidth + effectiveDx) / currentColWidth
            );
            targetColIndex = Math.max(0, Math.min(currentDays.length - 1, rawColIndex));
          }
          const newDate = currentDays[targetColIndex] || appt.date;

          // Check if slot actually changed
          if (newDate === appt.date && newStartTime === appt.startTime) {
            pan.setValue({ x: 0, y: 0 });
            return;
          }

          // Slot validation (past check + doctor collision + patient double-booking check)
          const validation = useAppointmentStore
            .getState()
            .validateSlot(newDate, newStartTime, newEndTime, appt.doctorId, appt.id);

          // Reset pan transform
          pan.setValue({ x: 0, y: 0 });

          if (validation.valid) {
            // Trigger confirmation popup modal for drag-and-drop reschedule
            setPendingMove({ newDate, newStartTime, newEndTime });
          } else {
            playAppointmentFailureSound();
            Toast.show({
              type: 'error',
              text1: validation.reason === 'past' ? 'Invalid Time' : 'Slot Collision',
              text2: validation.message,
              position: 'bottom',
              visibilityTime: 3200,
            });
          }
        },
        onPanResponderTerminate: () => {
          stopAutoScroll();
          if (onDragEnd) onDragEnd();
          setIsDragging(false);
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [isEligible, updateAutoScroll, stopAutoScroll, scrollOffsetY, pan]
  );

  const count = totalOverlapCount > 1 ? totalOverlapCount : 1;
  const widthPct = `${100 / count}%`;
  const leftPct = `${(100 / count) * overlapIndex}%`;

  return (
    <>
      <Animated.View
        style={[
          styles.positioner,
          {
            top,
            height,
            width: widthPct as any,
            left: leftPct as any,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
            zIndex: isDragging ? 999 : 10 + overlapIndex,
            elevation: isDragging ? 12 : 2 + overlapIndex,
            opacity: isDragging ? 0.5 : 1,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <AppointmentChip
          appointment={appointment}
          onPress={onPress}
          isCompact={isCompact}
          isDraggable={isEligible}
        />
      </Animated.View>

      {/* D&D Reschedule Confirmation Popup Modal */}
      {pendingMove ? (
        <RescheduleConfirmationModal
          visible={!!pendingMove}
          patientName={appointment.patientName}
          fromDate={appointment.date}
          fromTime={appointment.startTime}
          toDate={pendingMove.newDate}
          toTime={pendingMove.newStartTime}
          doctorName={appointment.doctorName}
          onCancel={() => setPendingMove(null)}
          onConfirm={async () => {
            await moveAppointmentMutation.mutateAsync({
              id: appointment.id,
              newDate: pendingMove.newDate,
              newStartTime: pendingMove.newStartTime,
              newEndTime: pendingMove.newEndTime,
            });

            playAppointmentSuccessSound();
            Toast.show({
              type: 'success',
              text1: 'Appointment Rescheduled',
              text2: `${appointment.patientName} moved to ${formatTime(pendingMove.newStartTime)} (${formatDateShort(pendingMove.newDate)})`,
              position: 'bottom',
              visibilityTime: 3000,
            });
            setPendingMove(null);
          }}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    justifyContent: 'center',
  },
});
