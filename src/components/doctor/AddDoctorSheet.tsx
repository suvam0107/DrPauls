import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import Select from '../shared/Select';
import FormField from '../shared/FormField';
import { useTheme } from '../../theme/ThemeContext';
import useUIStore from '../../store/useUIStore';
import { Doctor, WeekDay } from '../../types';
import { playClickSound, playAppointmentSuccessSound } from '../../utils/feedback';
import { generateDoctorWorkingHourSlots, timeToMins, formatTime } from '../../utils/dateUtils';
import { AddDoctorSchema, AddDoctorFormValues } from '../../schemas';
import { useCentersQuery } from '../../hooks/queries/useCentersQuery';
import { useAddDoctorMutation } from '../../hooks/mutations/useDoctorMutations';

const SPECIALTIES = ['Hair', 'Skin', 'Cosmetic', 'Hair Transplant', 'Laser', 'General'];
const WEEKDAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface AddDoctorSheetProps {
  visible: boolean;
  onClose: () => void;
  onDoctorAdded?: (doctor: Doctor) => void;
}

function AddDoctorForm({ onClose, onDoctorAdded }: Omit<AddDoctorSheetProps, 'visible'>) {
  const { colors } = useTheme();
  const { expandSheet } = useBottomSheet();
  const addDoctorMutation = useAddDoctorMutation();
  const { data: centers = [] } = useCentersQuery();
  const globalCenterId = useUIStore((s) => s.activeCenterId);

  const defaultCenterId = globalCenterId || centers[0]?.id || 'CC-001';
  const initialCenter = centers.find((c) => c.id === defaultCenterId) || centers[0];
  const initialStart = initialCenter?.openHours?.start || '10:00';
  const initialEnd = initialCenter?.openHours?.end || '19:00';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AddDoctorFormValues>({
    resolver: zodResolver(AddDoctorSchema),
    defaultValues: {
      name: '',
      specialty: 'Skin',
      department: 'Dermatology',
      qualification: 'MBBS, MD',
      phone: '',
      consultFee: '800',
      maxPatientsPerDay: '15',
      selectedDays: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun'],
      startHour: initialStart,
      endHour: initialEnd,
      centerId: defaultCenterId,
      available: true,
    },
  });

  const centerId = watch('centerId');
  const startHour = watch('startHour');
  const endHour = watch('endHour');
  const selectedDays = watch('selectedDays');

  const selectedCenter = useMemo(
    () => centers.find((c) => c.id === centerId) || centers[0],
    [centers, centerId]
  );

  const clinicStart = selectedCenter?.openHours?.start || '10:00';
  const clinicEnd = selectedCenter?.openHours?.end || '19:00';

  // Sync working hours when selected center operating hours change
  useEffect(() => {
    setValue('startHour', clinicStart);
    setValue('endHour', clinicEnd);
  }, [clinicStart, clinicEnd, setValue]);

  // Generate timeslots aligned with clinic opening and closing hours
  const timeSlots = useMemo(
    () => generateDoctorWorkingHourSlots(clinicStart, clinicEnd),
    [clinicStart, clinicEnd]
  );

  const startTimeOptions = useMemo(() => {
    return timeSlots.slice(0, -1).map((s) => ({
      label: s.label,
      value: s.time,
    }));
  }, [timeSlots]);

  const endTimeOptions = useMemo(() => {
    const startMins = timeToMins(startHour);
    const firstDisabledItem = {
      label: formatTime(startHour),
      value: startHour,
      disabled: true,
    };

    const beyondSlots = timeSlots
      .filter((s) => timeToMins(s.time) > startMins)
      .map((s) => ({
        label: s.label,
        value: s.time,
      }));

    return [firstDisabledItem, ...beyondSlots];
  }, [timeSlots, startHour]);

  const handleStartHourChange = (newStart: string) => {
    setValue('startHour', newStart);
    const newStartMins = timeToMins(newStart);
    const currentEndMins = timeToMins(endHour);
    if (currentEndMins <= newStartMins) {
      const nextSlot = timeSlots.find((s) => timeToMins(s.time) > newStartMins);
      if (nextSlot) {
        setValue('endHour', nextSlot.time);
      }
    }
  };

  const toggleDay = (day: WeekDay) => {
    playClickSound();
    const currentDays = selectedDays || [];
    const updated = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    setValue('selectedDays', updated, { shouldValidate: true });
  };

  const handleSave = handleSubmit(async (data) => {
    clearErrors('root');
    try {
      const fee = parseFloat(data.consultFee);
      const maxP = parseInt(data.maxPatientsPerDay, 10);

      const newDoc = await addDoctorMutation.mutateAsync({
        name: data.name.trim().startsWith('Dr.') ? data.name.trim() : `Dr. ${data.name.trim()}`,
        specialty: data.specialty,
        department: data.department.trim() || 'General Practice',
        qualification: data.qualification.trim() || 'MBBS',
        phone: data.phone.trim(),
        consultFee: fee,
        maxPatientsPerDay: maxP,
        location: selectedCenter?.cc_name || 'Guwahati Main',
        workingDays: data.selectedDays,
        workingHours: { start: data.startHour.trim() || clinicStart, end: data.endHour.trim() || clinicEnd },
        available: data.available,
        centerSchedule: [
          {
            centerId: data.centerId,
            workingDays: data.selectedDays,
            workingHours: { start: data.startHour.trim() || clinicStart, end: data.endHour.trim() || clinicEnd },
          },
        ],
      });

      playAppointmentSuccessSound();
      if (onDoctorAdded) onDoctorAdded(newDoc);
      reset();
      onClose();
    } catch (err: any) {
      setError('root', { message: err?.message || 'Failed to save doctor.' });
    }
  });

  return (
    <BottomSheetScrollView
      style={{ paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 240 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Add New Doctor</Text>

      {errors.root?.message ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errors.root.message}</Text>
        </View>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Doctor Name" required error={errors.name?.message}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: errors.name ? colors.danger : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onFocus={expandSheet}
              placeholder="e.g. Dr. Rajesh Sharma"
              placeholderTextColor={colors.textMuted}
            />
          </FormField>
        )}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="specialty"
            render={({ field: { onChange, value } }) => (
              <FormField label="Specialty" required error={errors.specialty?.message}>
                <Select
                  value={value}
                  options={SPECIALTIES}
                  onChange={(val) => {
                    playClickSound();
                    onChange(val);
                  }}
                />
              </FormField>
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="department"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Department" required error={errors.department?.message}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.department ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={expandSheet}
                  placeholder="e.g. Trichology"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="qualification"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Qualification" error={errors.qualification?.message}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.qualification ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={expandSheet}
                  placeholder="e.g. MBBS, MD"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Phone Number" required error={errors.phone?.message}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.phone ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={expandSheet}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="consultFee"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Consult Fee (₹)" required error={errors.consultFee?.message}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.consultFee ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={expandSheet}
                  keyboardType="numeric"
                  placeholder="800"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="maxPatientsPerDay"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField label="Max Patients / Day" required error={errors.maxPatientsPerDay?.message}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: errors.maxPatientsPerDay ? colors.danger : colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  onFocus={expandSheet}
                  keyboardType="numeric"
                  placeholder="15"
                  placeholderTextColor={colors.textMuted}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Controller
          control={control}
          name="centerId"
          render={({ field: { onChange, value } }) => (
            <FormField label="Clinic Center" required error={errors.centerId?.message}>
              <Select
                value={value}
                options={centers.map((c) => ({
                  label: `${c.cc_name} (${formatTime(c.openHours?.start || '10:00')} - ${formatTime(c.openHours?.end || '19:00')})`,
                  value: c.id,
                }))}
                onChange={(val) => {
                  playClickSound();
                  onChange(val);
                }}
              />
            </FormField>
          )}
        />
      </View>

      <View style={styles.field}>
        <FormField label="Working Days" required error={errors.selectedDays?.message}>
          <View style={styles.daysRow}>
            {WEEKDAYS.map((day) => {
              const selected = (selectedDays || []).includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayText, { color: selected ? '#FFF' : colors.text }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="startHour"
            render={({ field: { value } }) => (
              <FormField label="Start Time" required error={errors.startHour?.message}>
                <Select
                  value={value}
                  options={startTimeOptions}
                  onChange={(val) => {
                    playClickSound();
                    handleStartHourChange(val);
                  }}
                />
              </FormField>
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="endHour"
            render={({ field: { onChange, value } }) => (
              <FormField label="End Time" required error={errors.endHour?.message}>
                <Select
                  value={value}
                  options={endTimeOptions}
                  onChange={(val) => {
                    playClickSound();
                    onChange(val);
                  }}
                />
              </FormField>
            )}
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.switchTitle, { color: colors.text }]}>Active Availability</Text>
          <Text style={[styles.switchSub, { color: colors.textMuted }]}>
            Enable doctor for scheduling appointments
          </Text>
        </View>
        <Controller
          control={control}
          name="available"
          render={({ field: { onChange, value } }) => (
            <Switch
              value={value}
              onValueChange={(val) => {
                playClickSound();
                onChange(val);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={value ? '#FFFFFF' : '#F4F3F4'}
            />
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>Save Doctor</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
}

export default function AddDoctorSheet({
  visible,
  onClose,
  onDoctorAdded,
}: AddDoctorSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={600} keyboardBlurBehavior="none">
      <AddDoctorForm onClose={onClose} onDoctorAdded={onDoctorAdded} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  field: {
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
    marginTop: 2,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
