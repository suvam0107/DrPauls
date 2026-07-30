import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Toast from 'react-native-toast-message';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import Select from '../shared/Select';
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
import useDoctorStore from '../../store/useDoctorStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import useCenterStore from '../../store/useCenterStore';
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
import { Patient, Doctor } from '../../types';
import {
  playAppointmentSuccessSound,
  playAppointmentFailureSound,
  playClickSound,
} from '../../utils/feedback';
import { Ionicons } from '@expo/vector-icons';

export interface InitialData {
  date?: string;
  time?: string;
  doctorId?: string;
}

export interface CreateSheetFormProps {
  initialData?: InitialData;
  onClose: () => void;
}

function CreateSheetForm({ initialData, onClose }: CreateSheetFormProps) {
  const { colors } = useTheme();
  const { expandSheet, handleScroll } = useBottomSheet();

  const allDoctors = useDoctorStore((s) => s.doctors);
  const therapistsByService = useDoctorStore((s) => s.therapistsByService);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);
  const appointments = useAppointmentStore((s) => s.appointments);
  const centers = useCenterStore((s) => s.centers);
  const globalCenterId = useUIStore((s) => s.activeCenterId);

  const [centerId, setCenterId] = useState(globalCenterId);
  const [activeTab, setActiveTab] = useState('Normal'); // 'Normal' | 'Package'
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(todayISO());

  // Filter doctors for the selected center
  const centerDoctors = useMemo(() => {
    return allDoctors.filter((d) => {
      if (!d.centerSchedule || d.centerSchedule.length === 0) return true;
      return d.centerSchedule.some((cs) => cs.centerId === centerId);
    });
  }, [allDoctors, centerId]);

  const [doctorId, setDoctorId] = useState(initialData?.doctorId || centerDoctors[0]?.id || allDoctors[0]?.id || '');
  const selectedDoctor = allDoctors.find((d) => d.id === doctorId);

  // Available slots for selected doctor, date & center
  const availableSlots = useMemo(() => {
    return getDoctorAvailableSlots(selectedDoctor, date, centerId);
  }, [selectedDoctor, date, centerId]);

  const [startTime, setStartTime] = useState(availableSlots[0]?.time || '10:00');
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0]);
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [therapistId, setTherapistId] = useState('');
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);

  const [prePaymentRequired, setPrePaymentRequired] = useState(false);
  const [prePaymentAmount, setPrePaymentAmount] = useState('0');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  // Sync initialData
  useEffect(() => {
    if (initialData?.date) setDate(initialData.date);
    if (initialData?.doctorId) setDoctorId(initialData.doctorId);
  }, [initialData]);

  // Update time when availableSlots change
  useEffect(() => {
    if (availableSlots.length > 0) {
      if (!availableSlots.some((s) => s.time === startTime)) {
        setStartTime(availableSlots[0].time);
      }
    }
  }, [availableSlots]);

  // Update doctor if center changes
  useEffect(() => {
    if (centerDoctors.length > 0 && !centerDoctors.some((d) => d.id === doctorId)) {
      setDoctorId(centerDoctors[0].id);
    }
  }, [centerId, centerDoctors]);

  const availableTherapists = therapistsByService(serviceType);
  const isDoctorAvailableToday = isDoctorAvailableOnDate(selectedDoctor, date, centerId);

  const handleCreate = () => {
    if (!selectedPatient) {
      setError('Please select or add a patient');
      playAppointmentFailureSound();
      return;
    }
    if (!doctorId) {
      setError('Please select a doctor');
      playAppointmentFailureSound();
      return;
    }
    if (date < todayISO()) {
      setError('Cannot create appointment for a past date');
      playAppointmentFailureSound();
      return;
    }
    if (!isDoctorAvailableToday) {
      setError(`${selectedDoctor?.name || 'Doctor'} is not available on this date at this center`);
      playAppointmentFailureSound();
      return;
    }
    if (!startTime) {
      setError('Please select a valid time slot');
      playAppointmentFailureSound();
      return;
    }

    setError('');
    const endTime = addMins(startTime, 30);

    // Conflict Validation
    const val = useAppointmentStore
      .getState()
      .validateSlot(date, startTime, endTime, doctorId);

    if (!val.valid) {
      setError(val.message || 'Time slot collision detected');
      playAppointmentFailureSound();
      return;
    }

    // Check Max Patients Per Day Warning
    const existingCount = appointments.filter(
      (a) => a.doctorId === doctorId && a.date === date && a.status !== APPOINTMENT_STATUS.CANCELLED
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

    addAppointment({
      centerId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientMobile: selectedPatient.mobile,
      doctorId,
      doctorName: selectedDoctor?.name || '',
      date,
      startTime,
      endTime,
      appointmentType,
      serviceType,
      visitType,
      therapistId,
      therapistName: availableTherapists.find((t) => t.id === therapistId)?.name || '',
      isPackage: activeTab === 'Package',
      prePaymentRequired,
      prePaymentAmount: prePaymentRequired ? parseFloat(prePaymentAmount) || 0 : 0,
      status: APPOINTMENT_STATUS.SCHEDULED,
      leadStatus: LEAD_STATUS.NEW,
      remark,
    });

    playAppointmentSuccessSound();
    Toast.show({
      type: 'success',
      text1: 'Appointment Created',
      text2: `${selectedPatient.name} booked with ${selectedDoctor?.name} at ${startTime}`,
      position: 'bottom',
    });
    onClose();
  };

  const monthGridCells = useMemo(() => getMonthGrid(pickerMonth), [pickerMonth]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Header & Mode Tabs */}
        <View style={styles.topHeader}>
          <Text style={[styles.title, { color: colors.text }]}>Create Appointment</Text>
          <View style={[styles.tabGroup, { backgroundColor: colors.surface }]}>
            {['Normal', 'Package'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setActiveTab(tab);
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Center Switcher inside form */}
        <View style={styles.field}>
          <Select
            label="Clinic Center"
            value={centerId}
            options={centers.map((c) => ({ label: c.cc_name, value: c.id }))}
            onChange={(val) => {
              playClickSound();
              setCenterId(val);
            }}
          />
        </View>

        {/* Patient Search & Add */}
        <PatientSearchInput
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onAddNewPress={() => setShowAddPatient(true)}
        />

        {/* Doctor & Service */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Select
              label="Doctor"
              value={doctorId}
              options={centerDoctors.map((d) => ({
                label: `${d.name} (${d.specialty})`,
                value: d.id,
              }))}
              onChange={(val) => {
                playClickSound();
                setDoctorId(val);
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Service Type"
              value={serviceType}
              options={SERVICE_TYPES}
              onChange={setServiceType}
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
            <Select
              label="Time Slot"
              value={startTime}
              options={
                availableSlots.length > 0
                  ? availableSlots.map((s) => ({ label: s.label, value: s.time }))
                  : [{ label: 'No slots available', value: '' }]
              }
              onChange={(val) => setStartTime(val)}
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
            <Select
              label="Appointment Type"
              value={appointmentType}
              options={APPOINTMENT_TYPES}
              onChange={setAppointmentType}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Therapist (Optional)"
              value={therapistId}
              options={[
                { label: 'None', value: '' },
                ...availableTherapists.map((t) => ({ label: `${t.name} (${t.specialization})`, value: t.id })),
              ]}
              onChange={setTherapistId}
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
            <Switch
              value={prePaymentRequired}
              onValueChange={(val) => {
                playClickSound();
                setPrePaymentRequired(val);
              }}
              thumbColor={prePaymentRequired ? colors.primary : '#F4F3F4'}
            />
          </View>

          {prePaymentRequired && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Amount (₹)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={prePaymentAmount}
                onChangeText={setPrePaymentAmount}
                keyboardType="numeric"
                placeholder="500"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          )}
        </View>

        {/* Remark / Notes */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Remark / Clinical Notes</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
                height: 70,
                textAlignVertical: 'top',
              },
            ]}
            value={remark}
            onChangeText={setRemark}
            placeholder="Add optional clinical notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

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
      </ScrollView>

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
                        setDate(cell.date);
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
        onPatientAdded={(p) => setSelectedPatient(p)}
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
  if (!visible) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={640}>
      <CreateSheetForm initialData={initialData} onClose={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
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
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 12,
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
  warningText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  switchCol: {
    flex: 1,
    justifyContent: 'center',
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
