import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import BottomSheet from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import useUIStore from '../../store/useUIStore';
import {
  todayISO,
  addMins,
  getDoctorAvailableSlots,
  isDoctorAvailableOnDate,
  getMonthGrid,
  formatDateShort,
  formatMonthYear,
  offsetMonth,
} from '../../utils/dateUtils';
import { Appointment } from '../../types';
import { playAppointmentSuccessSound, playAppointmentFailureSound, playClickSound } from '../../utils/feedback';
import { Ionicons } from '@expo/vector-icons';
import { RescheduleSchema, RescheduleFormValues } from '../../schemas';

import RescheduleConfirmationModal from '../shared/RescheduleConfirmationModal';
import AppToast from '../shared/AppToast';

import { useDoctorsQuery } from '../../hooks/queries/useDoctorsQuery';
import { useAppointmentsQuery } from '../../hooks/queries/useAppointmentsQuery';
import { useMoveAppointmentMutation } from '../../hooks/mutations/useAppointmentMutations';

export interface RescheduleModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export default function RescheduleModal({ visible, appointment: initialAppt, onClose }: RescheduleModalProps) {
  const { colors } = useTheme();
  const { data: appointments = [] } = useAppointmentsQuery();
  const appointment = initialAppt ? (appointments.find((a) => a.id === initialAppt.id) || initialAppt) : null;

  const { data: doctors = [] } = useDoctorsQuery();
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const moveAppointmentMutation = useMoveAppointmentMutation();

  const apptCenterId = appointment?.centerId || activeCenterId;

  // Filter doctors available at this center
  const centerDoctors = useMemo(() => {
    return doctors.filter((d) => {
      if (!d.centerSchedule || d.centerSchedule.length === 0) return true;
      return d.centerSchedule.some((cs) => cs.centerId === apptCenterId);
    });
  }, [doctors, apptCenterId]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(appointment?.date || todayISO());
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RescheduleFormValues>({
    resolver: zodResolver(RescheduleSchema),
    defaultValues: {
      doctorId: appointment?.doctorId || centerDoctors[0]?.id || '',
      date: appointment?.date || todayISO(),
      startTime: appointment?.startTime || '10:00',
    },
  });

  const doctorId = watch('doctorId');
  const date = watch('date');
  const startTime = watch('startTime');

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  // Sync state on appointment change
  useEffect(() => {
    if (appointment) {
      reset({
        doctorId: appointment.doctorId,
        date: appointment.date,
        startTime: appointment.startTime,
      });
      setPickerMonth(appointment.date);
      setShowConfirm(false);
      setShowDatePicker(false);
    }
  }, [appointment, reset]);

  // Available slots for doctor + date + center
  const availableSlots = useMemo(() => {
    return getDoctorAvailableSlots(selectedDoctor, date, apptCenterId);
  }, [selectedDoctor, date, apptCenterId]);

  useEffect(() => {
    if (availableSlots.length > 0 && !availableSlots.some((s) => s.time === startTime)) {
      setValue('startTime', availableSlots[0].time);
    }
  }, [availableSlots, startTime, setValue]);

  const isDoctorAvailableToday = isDoctorAvailableOnDate(selectedDoctor, date, apptCenterId);

  const handleInitialSaveClick = handleSubmit((data) => {
    clearErrors('root');

    if (data.date < todayISO()) {
      setError('root', { message: 'Cannot reschedule to a past date' });
      playAppointmentFailureSound();
      return;
    }
    if (!isDoctorAvailableToday) {
      setError('root', { message: `${selectedDoctor?.name || 'Doctor'} is not available on this date` });
      playAppointmentFailureSound();
      return;
    }
    if (!data.startTime) {
      setError('root', { message: 'Please select a valid time slot' });
      playAppointmentFailureSound();
      return;
    }

    setShowConfirm(true);
  });

  const handleConfirmReschedule = async () => {
    if (!appointment) return;
    const endTime = addMins(startTime, 30);
    await moveAppointmentMutation.mutateAsync({
      id: appointment.id,
      newDate: date,
      newStartTime: startTime,
      newEndTime: endTime,
      newDoctorId: doctorId,
    });

    playAppointmentSuccessSound();
    Toast.show({
      type: 'success',
      text1: 'Appointment Rescheduled',
      text2: `${appointment.patientName} moved to ${formatDateShort(date)} at ${startTime}`,
      position: 'bottom',
    });
    setShowConfirm(false);
    onClose();
  };

  const monthGridCells = getMonthGrid(pickerMonth);

  return (
    <>
      <BottomSheet visible={visible && !!appointment} onClose={onClose} snapHeight={580} keyboardBlurBehavior="none">
        {appointment ? (
          <BottomSheetScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 220 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Reschedule / Edit Appointment</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>
                {appointment.patientName} • Current: {formatDateShort(appointment.date)} {appointment.startTime}
              </Text>
            </View>

            {errors.root?.message ? <Text style={styles.errorText}>{errors.root.message}</Text> : null}

            {/* Doctor Selector */}
            <View style={styles.field}>
              <Controller
                control={control}
                name="doctorId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Doctor"
                    value={value}
                    options={centerDoctors.map((d) => ({
                      label: `${d.name} (${d.specialty})`,
                      value: d.id,
                    }))}
                    onChange={(val) => {
                      playClickSound();
                      onChange(val);
                      if (errors.root) clearErrors('root');
                    }}
                  />
                )}
              />
              {errors.doctorId?.message ? (
                <Text style={styles.errorText}>{errors.doctorId.message}</Text>
              ) : null}
            </View>

            {/* Date & Time Row */}
            <View style={styles.row}>
              {/* Date Field */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
                <TouchableOpacity
                  style={[styles.pickerInput, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => {
                    playClickSound();
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={[styles.pickerValue, { color: colors.text }]}>
                    {formatDateShort(date)}
                  </Text>
                </TouchableOpacity>
                {errors.date?.message ? (
                  <Text style={styles.errorText}>{errors.date.message}</Text>
                ) : null}
              </View>

              {/* Time Slot Dropdown */}
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label="Time Slot"
                      value={value}
                      options={
                        availableSlots.length > 0
                          ? availableSlots.map((s) => ({ label: s.label, value: s.time }))
                          : [{ label: 'No slots available', value: '' }]
                      }
                      onChange={(val) => {
                        onChange(val);
                        if (errors.root) clearErrors('root');
                      }}
                    />
                  )}
                />
                {errors.startTime?.message ? (
                  <Text style={styles.errorText}>{errors.startTime.message}</Text>
                ) : null}
              </View>
            </View>

            {!isDoctorAvailableToday && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerBg, borderColor: colors.danger + '40', borderWidth: 1, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }]}>
                <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 }}>
                  {selectedDoctor?.name || 'Doctor'} is unavailable on {formatDateShort(date)}. Rescheduling disallowed.
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.danger }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={18} color="#FFF" />
                <Text style={[styles.cancelBtnText, { color: '#FFF' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  (!isDoctorAvailableToday || availableSlots.length === 0 || !startTime) && { opacity: 0.5 },
                ]}
                disabled={!isDoctorAvailableToday || availableSlots.length === 0 || !startTime}
                onPress={handleInitialSaveClick}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#FFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        ) : null}
      </BottomSheet>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.calendarModalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.calendarModalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={[styles.calendarBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => setPickerMonth((m) => offsetMonth(m, -1))}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>
                {formatMonthYear(pickerMonth)}
              </Text>
              <TouchableOpacity
                onPress={() => setPickerMonth((m) => offsetMonth(m, 1))}
                hitSlop={8}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <Text key={d} style={[styles.calendarWeekText, { color: colors.textMuted }]}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {monthGridCells.map((cell) => {
                const isSelected = cell.date === date;
                const isPast = cell.date < todayISO();
                const isDoctorAvail = isDoctorAvailableOnDate(selectedDoctor, cell.date, apptCenterId);

                return (
                  <TouchableOpacity
                    key={cell.date}
                    style={[
                      styles.calendarCell,
                      isSelected && { backgroundColor: colors.primary, borderRadius: 8 },
                      !cell.isCurrentMonth && { opacity: 0.3 },
                      isDoctorAvail && !isSelected && { backgroundColor: colors.primaryLight },
                      !isDoctorAvail && cell.isCurrentMonth && !isSelected && { backgroundColor: colors.surface },
                    ]}
                    disabled={isPast}
                    onPress={() => {
                      playClickSound();
                      setValue('date', cell.date, { shouldValidate: true });
                      if (errors.root) clearErrors('root');
                      setShowDatePicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarCellText,
                        { color: cell.isCurrentMonth ? colors.text : colors.textMuted },
                        isSelected && { color: '#FFF', fontWeight: '700' },
                        isPast && { opacity: 0.4 },
                      ]}
                    >
                      {cell.dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.calendarCloseBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={[styles.calendarCloseText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Standalone Reschedule Confirmation Popup Modal */}
      {appointment && (
        <RescheduleConfirmationModal
          visible={showConfirm}
          patientName={appointment.patientName}
          fromDate={appointment.date}
          fromTime={appointment.startTime}
          toDate={date}
          toTime={startTime}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirmReschedule}
        />
      )}
      <AppToast />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginVertical: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginVertical: 8,
  },
  field: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Calendar Modal
  calendarModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  calendarBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarCloseBtn: {
    marginTop: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
