import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import Select from '../shared/Select';
import FormField from '../shared/FormField';
import PatientSearchInput from './PatientSearchInput';
import AddPatientSheet from './AddPatientSheet';
import { useTheme } from '../../theme/ThemeContext';
import {
  APPOINTMENT_TYPES,
  SERVICE_TYPES,
  VISIT_TYPES,
  APPOINTMENT_STATUS,
  LEAD_STATUS,
} from '../../constants';
import useAppointmentStore from '../../store/useAppointmentStore';
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
import { Patient } from '../../types';
import {
  playAppointmentSuccessSound,
  playAppointmentFailureSound,
  playEnrollmentCreatedSound,
  playClickSound,
} from '../../utils/feedback';
import {
  CreateAppointmentSchema,
  CreateAppointmentFormValues,
} from '../../schemas';

export interface InitialData {
  date?: string;
  time?: string;
  doctorId?: string;
}

export interface CreateSheetFormProps {
  initialData?: InitialData;
  onClose: () => void;
}

import { useDoctorsQuery, useTherapistsQuery } from '../../hooks/queries/useDoctorsQuery';
import { useCentersQuery } from '../../hooks/queries/useCentersQuery';
import { usePackagesQuery } from '../../hooks/queries/usePackagesQuery';
import { useAppointmentsQuery } from '../../hooks/queries/useAppointmentsQuery';
import { useAddAppointmentMutation } from '../../hooks/mutations/useAppointmentMutations';
import { useEnrollPatientMutation } from '../../hooks/mutations/usePackageMutations';

function CreateSheetForm({ initialData, onClose }: CreateSheetFormProps) {
  const { colors } = useTheme();
  const { expandSheet, handleScroll } = useBottomSheet();

  const { data: allDoctors = [] } = useDoctorsQuery();
  const { data: therapists = [] } = useTherapistsQuery();
  const addAppointmentMutation = useAddAppointmentMutation();
  const enrollPatientMutation = useEnrollPatientMutation();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: centers = [] } = useCentersQuery();
  const globalCenterId = useUIStore((s) => s.activeCenterId);
  const { data: packages = [] } = usePackagesQuery();

  const therapistsByService = (svc?: string) =>
    therapists.filter((t) => !svc || t.specialization === svc);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(initialData?.date || todayISO());

  const initialCenterId = globalCenterId || centers[0]?.id || 'CC-001';

  const centerDoctors = useMemo(() => {
    return allDoctors.filter((d) => {
      if (!d.centerSchedule || d.centerSchedule.length === 0) return true;
      return d.centerSchedule.some((cs) => cs.centerId === initialCenterId);
    });
  }, [allDoctors, initialCenterId]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CreateAppointmentFormValues>({
    resolver: zodResolver(CreateAppointmentSchema),
    defaultValues: {
      activeTab: 'Normal',
      centerId: initialCenterId,
      patientId: '',
      patientName: '',
      patientMobile: '',
      doctorId: initialData?.doctorId || centerDoctors[0]?.id || allDoctors[0]?.id || '',
      date: initialData?.date || todayISO(),
      startTime: initialData?.time || '10:00',
      appointmentType: APPOINTMENT_TYPES[0],
      serviceType: SERVICE_TYPES[0],
      visitType: VISIT_TYPES[0],
      therapistId: '',
      packageId: packages[0]?.id || '',
      sessionInterval: 7,
      prePaymentRequired: false,
      prePaymentAmount: '0',
      remark: '',
    },
  });

  const activeTab = watch('activeTab');
  const centerId = watch('centerId');
  const doctorId = watch('doctorId');
  const date = watch('date');
  const startTime = watch('startTime');
  const serviceType = watch('serviceType');
  const packageId = (watch as any)('packageId') || packages[0]?.id || '';
  const sessionInterval = (watch as any)('sessionInterval') || 7;
  const prePaymentRequired = watch('prePaymentRequired');

  const selectedDoctor = allDoctors.find((d) => d.id === doctorId);
  const selectedPkg = packages.find((p) => p.id === packageId);

  // Doctors for currently active center in form
  const activeCenterDoctors = useMemo(() => {
    return allDoctors.filter((d) => {
      if (!d.centerSchedule || d.centerSchedule.length === 0) return true;
      return d.centerSchedule.some((cs) => cs.centerId === centerId);
    });
  }, [allDoctors, centerId]);

  // Sync package serviceType when package selected
  useEffect(() => {
    if (activeTab === 'Package' && selectedPkg) {
      setValue('serviceType' as any, selectedPkg.serviceType as string);
      setValue('appointmentType' as any, 'Package Session');
    }
  }, [activeTab, packageId, selectedPkg, setValue]);

  // Sync initialData
  useEffect(() => {
    if (initialData?.date) setValue('date', initialData.date);
    if (initialData?.doctorId) setValue('doctorId', initialData.doctorId);
    if (initialData?.time) setValue('startTime', initialData.time);
  }, [initialData, setValue]);

  // Update doctor if center changes
  useEffect(() => {
    if (activeCenterDoctors.length > 0 && !activeCenterDoctors.some((d) => d.id === doctorId)) {
      setValue('doctorId', activeCenterDoctors[0].id);
    }
  }, [centerId, activeCenterDoctors, doctorId, setValue]);

  // Available slots for selected doctor, date & center
  const availableSlots = useMemo(() => {
    return getDoctorAvailableSlots(selectedDoctor, date, centerId);
  }, [selectedDoctor, date, centerId]);

  // Update time when availableSlots change
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!availableSlots.some((s) => s.time === startTime)) {
        setValue('startTime', availableSlots[0].time);
      }
    }
  }, [availableSlots, startTime, setValue]);

  const availableTherapists = therapistsByService(serviceType);
  const isDoctorAvailableToday = isDoctorAvailableOnDate(selectedDoctor, date, centerId);

  const handleSelectPatient = (patient: Patient | null) => {
    setSelectedPatient(patient);
    if (patient) {
      setValue('patientId', patient.id, { shouldValidate: true });
      setValue('patientName', patient.name, { shouldValidate: true });
      setValue('patientMobile', patient.mobile || '', { shouldValidate: true });
    } else {
      setValue('patientId', '', { shouldValidate: true });
      setValue('patientName', '');
      setValue('patientMobile', '');
    }
  };

  const handleCreate = handleSubmit(async (data) => {
    clearErrors('root');

    if (data.date < todayISO()) {
      setError('root', { message: 'Cannot create appointment for a past date' });
      playAppointmentFailureSound();
      return;
    }
    if (!isDoctorAvailableToday) {
      setError('root', { message: `${selectedDoctor?.name || 'Doctor'} is not available on this date at this center` });
      playAppointmentFailureSound();
      return;
    }
    if (!data.startTime) {
      setError('root', { message: 'Please select a valid time slot' });
      playAppointmentFailureSound();
      return;
    }

    const endTime = addMins(data.startTime, 30);

    // Conflict Validation
    const val = useAppointmentStore
      .getState()
      .validateSlot(data.date, data.startTime, endTime, data.doctorId);

    if (!val.valid) {
      setError('root', { message: val.message || 'Time slot collision detected' });
      playAppointmentFailureSound();
      return;
    }

    // Check Max Patients Per Day Warning
    const existingCount = appointments.filter(
      (a) => a.doctorId === data.doctorId && a.date === data.date && a.status !== APPOINTMENT_STATUS.CANCELLED
    ).length;

    const maxLimit = selectedDoctor?.maxPatientsPerDay || 20;
    if (existingCount >= maxLimit) {
      Toast.show({
        type: 'info',
        text1: 'Doctor Daily Limit Reached',
        text2: `Warning: ${selectedDoctor?.name} has ${existingCount}/${maxLimit} visits today. Proceeding...`,
        position: 'top',
        visibilityTime: 4000,
      });
    }

    try {
      if (data.activeTab === 'Package' && selectedPkg) {
        const enrollment = await enrollPatientMutation.mutateAsync({
          packageId: selectedPkg.id,
          patientId: data.patientId,
          patientName: data.patientName,
          patientMobile: data.patientMobile,
          doctorId: data.doctorId,
          centerId: data.centerId,
          therapistId: data.therapistId || '',
          therapistName: availableTherapists.find((t) => t.id === data.therapistId)?.name || '',
          startDate: data.date,
          startTime: data.startTime,
          sessionInterval: data.sessionInterval,
        });

        playEnrollmentCreatedSound();
        Toast.show({
          type: 'success',
          text1: 'Package Enrollment Created',
          text2: `${selectedPkg.totalSessions} sessions auto-scheduled every ${data.sessionInterval} days (${enrollment.enrollmentId})`,
          position: 'bottom',
        });
      } else if (data.activeTab === 'Normal') {
        await addAppointmentMutation.mutateAsync({
          centerId: data.centerId,
          patientId: data.patientId,
          patientName: data.patientName,
          patientMobile: data.patientMobile,
          doctorId: data.doctorId,
          doctorName: selectedDoctor?.name || '',
          date: data.date,
          startTime: data.startTime,
          endTime,
          appointmentType: data.appointmentType,
          serviceType: data.serviceType,
          visitType: data.visitType,
          therapistId: data.therapistId || '',
          therapistName: availableTherapists.find((t) => t.id === data.therapistId)?.name || '',
          isPackage: false,
          prePaymentRequired: data.prePaymentRequired,
          prePaymentAmount: data.prePaymentRequired ? parseFloat(data.prePaymentAmount) || 0 : 0,
          status: APPOINTMENT_STATUS.SCHEDULED,
          leadStatus: LEAD_STATUS.NEW,
          remark: data.remark || '',
        });

        playAppointmentSuccessSound();
        Toast.show({
          type: 'success',
          text1: 'Appointment Created',
          text2: `${data.patientName} booked with ${selectedDoctor?.name} at ${data.startTime}`,
          position: 'bottom',
        });
      }

      reset();
      setSelectedPatient(null);
      onClose();
    } catch (err: any) {
      setError('root', { message: err?.message || 'Failed to create appointment.' });
    }
  });

  const monthGridCells = useMemo(() => getMonthGrid(pickerMonth), [pickerMonth]);

  return (
    <>
      <BottomSheetScrollView
        style={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header & Mode Tabs */}
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.text }]}>Create Appointment</Text>
          <View style={[styles.tabGroup, { backgroundColor: colors.surface }]}>
            {(['Normal', 'Package'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setValue('activeTab', tab, { shouldValidate: true });
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab ? '#FFF' : colors.textMuted },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {errors.root?.message ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.dangerBg }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errors.root.message}</Text>
          </View>
        ) : null}

        {/* Center Switcher inside form */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="centerId"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Clinic Center"
                value={value}
                options={centers.map((c) => ({ label: c.cc_name, value: c.id }))}
                onChange={(val) => {
                  playClickSound();
                  onChange(val);
                }}
              />
            )}
          />
        </View>

        {/* Patient Search & Add */}
        <PatientSearchInput
          selectedPatient={selectedPatient}
          onSelectPatient={handleSelectPatient}
          onAddNewPress={() => setShowAddPatient(true)}
        />
        {errors.patientId?.message ? (
          <Text style={[styles.fieldErrorText, { color: colors.danger }]}>{errors.patientId.message}</Text>
        ) : null}

        {/* Package Selector & Interval if Package Mode */}
        {activeTab === 'Package' && (
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Controller
                control={control}
                name={"packageId" as any}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Select Package *"
                    value={value || packages[0]?.id || ''}
                    options={packages.map((p) => ({
                      label: `${p.name} (${p.serviceType} • ₹${p.price.toLocaleString()})`,
                      value: p.id,
                    }))}
                    onChange={(val) => {
                      playClickSound();
                      onChange(val);
                    }}
                  />
                )}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name={"sessionInterval" as any}
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Session Interval"
                    value={String(value || 7)}
                    options={[
                      { label: 'Every 7 Days', value: '7' },
                      { label: 'Every 14 Days', value: '14' },
                      { label: 'Every 21 Days', value: '21' },
                      { label: 'Every 30 Days', value: '30' },
                    ]}
                    onChange={(val) => onChange(parseInt(val, 10))}
                  />
                )}
              />
            </View>
          </View>
        )}

        {/* Pricing & Service Type Breakdown Card */}
        <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.primary + '40' }]}>
          <View style={styles.pricingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pricingLabel, { color: colors.textMuted }]}>
                {activeTab === 'Package' ? 'Package Pricing Breakdown' : 'Consultation Visit Fee'}
              </Text>
              <Text style={[styles.pricingValue, { color: colors.primary }]}>
                {activeTab === 'Package'
                  ? `Total: ₹${selectedPkg?.price?.toLocaleString() || 0} (${selectedPkg?.totalSessions || 0} Sessions)`
                  : `Doctor Consult Fee: ₹${selectedDoctor?.consultFee || 500}`}
              </Text>
            </View>
            {activeTab === 'Package' && selectedPkg ? (
              <View style={[styles.perSessionPill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.perSessionText, { color: colors.primary }]}>
                  ₹{selectedPkg.perSessionPrice || Math.round(selectedPkg.price / selectedPkg.totalSessions)}/session
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Doctor & Service */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name="doctorId"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Doctor"
                  value={value}
                  options={activeCenterDoctors.map((d) => ({
                    label: `${d.name} (${d.specialty})`,
                    value: d.id,
                  }))}
                  onChange={(val) => {
                    playClickSound();
                    onChange(val);
                  }}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name={"serviceType" as any}
              render={({ field: { onChange, value } }) => (
                <Select
                  label={activeTab === 'Package' ? 'Service Type (Packaged)' : 'Service Type'}
                  value={value || SERVICE_TYPES[0]}
                  options={SERVICE_TYPES}
                  onChange={onChange}
                />
              )}
            />
          </View>
        </View>

        {/* Interactive Date & Time Pickers */}
        <View style={styles.row}>
          {/* Date Picker Button */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
            <TouchableOpacity
              style={[
                styles.pickerInput,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
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
          </View>

          {/* Time Slot Selector */}
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
                  onChange={onChange}
                />
              )}
            />
          </View>
        </View>

        {/* Doctor Availability Error Box for selected Date */}
        {!isDoctorAvailableToday && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerBg || '#FEE2E2', borderColor: colors.danger + '40', borderWidth: 1, padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }]}>
            <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 }}>
              {selectedDoctor?.name || 'Doctor'} is unavailable on {formatDateShort(date)} at this center. Scheduling disallowed.
            </Text>
          </View>
        )}

        {/* Appointment Type & Therapist */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name={"appointmentType" as any}
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Appointment Type"
                  value={value || APPOINTMENT_TYPES[0]}
                  options={APPOINTMENT_TYPES}
                  onChange={onChange}
                />
              )}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Controller
              control={control}
              name={"therapistId" as any}
              render={({ field: { onChange, value } }) => (
                <Select
                  label={activeTab === 'Package' ? 'Therapist' : 'Therapist (Optional)'}
                  value={value || ''}
                  options={[
                    { label: 'None', value: '' },
                    ...availableTherapists.map((t) => ({ label: `${t.name} (${t.specialization})`, value: t.id })),
                  ]}
                  onChange={onChange}
                />
              )}
            />
          </View>
        </View>

        {/* Pre-payment Toggle */}
        <View style={[styles.prePaymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.prePaymentRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prePaymentTitle, { color: colors.text }]}>Pre-payment Required</Text>
              <Text style={[styles.prePaymentSub, { color: colors.textMuted }]}>
                Require upfront payment for this booking
              </Text>
            </View>
            <Controller
              control={control}
              name="prePaymentRequired"
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

          {prePaymentRequired && (
            <View style={{ marginTop: 10 }}>
              <Controller
                control={control}
                name="prePaymentAmount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <FormField label="Amount (₹)" error={errors.prePaymentAmount?.message}>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      onFocus={expandSheet}
                      keyboardType="numeric"
                      placeholder="500"
                      placeholderTextColor={colors.textMuted}
                    />
                  </FormField>
                )}
              />
            </View>
          )}
        </View>

        {/* Remark / Notes */}
        <Controller
          control={control}
          name="remark"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Remark / Clinical Notes" error={errors.remark?.message}>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    color: colors.text,
                  },
                ]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                onFocus={expandSheet}
                placeholder="Add optional clinical notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </FormField>
          )}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary },
            (!isDoctorAvailableToday || availableSlots.length === 0 || !startTime) && { opacity: 0.5 },
          ]}
          disabled={!isDoctorAvailableToday || availableSlots.length === 0 || !startTime}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Create Appointment</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>

      {/* Date Picker Calendar Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback>
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

              {/* Week Headers */}
              <View style={styles.calendarWeekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={[styles.calendarWeekText, { color: colors.textMuted }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* 7x5 Days Grid */}
              <View style={styles.calendarGrid}>
                {monthGridCells.map((cell) => {
                  const isSelected = cell.date === date;
                  const isPast = cell.date < todayISO();
                  const isDoctorAvail = isDoctorAvailableOnDate(selectedDoctor, cell.date, centerId);

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
                        setShowDatePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          { color: cell.isCurrentMonth ? colors.text : colors.textMuted },
                          isSelected && { color: '#FFF', fontWeight: '700' },
                          !isDoctorAvail && cell.isCurrentMonth && !isSelected && { color: colors.textMuted },
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
                style={[styles.calendarCloseBtn, { backgroundColor: colors.surface }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.calendarCloseText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Add Patient Sheet */}
      <AddPatientSheet
        visible={showAddPatient}
        onClose={() => setShowAddPatient(false)}
        onPatientAdded={(p) => handleSelectPatient(p)}
      />
    </>
  );
}

export interface CreateAppointmentSheetProps {
  visible: boolean;
  initialData?: InitialData;
  onClose: () => void;
}

export default function CreateAppointmentSheet({
  visible,
  initialData,
  onClose,
}: CreateAppointmentSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={640} keyboardBlurBehavior="none">
      <CreateSheetForm initialData={initialData} onClose={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  pricingCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  perSessionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  perSessionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 240,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
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
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
  },
  prePaymentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  prePaymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prePaymentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  prePaymentSub: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Calendar Modal
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 20,
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
