import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
} from 'react-native';
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
import { todayISO, currentTimeSlot, addMins } from '../../utils/dateUtils';
import { Patient } from '../../types';

export interface InitialData {
  date?: string;
  time?: string;
}

export interface CreateSheetFormProps {
  initialData?: InitialData;
  onClose: () => void;
}

function CreateSheetForm({ initialData, onClose }: CreateSheetFormProps) {
  const { colors } = useTheme();
  const { expandSheet } = useBottomSheet();

  const doctors = useDoctorStore((s) => s.doctors);
  const therapistsByService = useDoctorStore((s) => s.therapistsByService);
  const addAppointment = useAppointmentStore((s) => s.addAppointment);

  const [activeTab, setActiveTab] = useState('Normal'); // 'Normal' | 'Package'
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState(currentTimeSlot());
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0]);
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [doctorId, setDoctorId] = useState(doctors[0]?.id || '');
  const [therapistId, setTherapistId] = useState('');
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);

  const [prePaymentRequired, setPrePaymentRequired] = useState(false);
  const [prePaymentAmount, setPrePaymentAmount] = useState('0');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData?.date) setDate(initialData.date);
    if (initialData?.time) setStartTime(initialData.time);
  }, [initialData]);

  const availableTherapists = therapistsByService(serviceType);
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  const handleCreate = () => {
    if (!selectedPatient) {
      setError('Please select or add a patient');
      return;
    }
    if (!doctorId) {
      setError('Please select a doctor');
      return;
    }

    setError('');
    const endTime = addMins(startTime, 30);

    addAppointment({
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

    onClose();
  };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={(e) => {
          if (e.nativeEvent.contentOffset.y > 4) {
            expandSheet();
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Header Tabs */}
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
                onPress={() => setActiveTab(tab)}
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

        {/* Patient Search & Add */}
        <PatientSearchInput
          selectedPatient={selectedPatient}
          onSelectPatient={setSelectedPatient}
          onAddNewPress={() => setShowAddPatient(true)}
        />

        {/* Date & Time Input */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Time (HH:mm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
        </View>

        {/* Appointment & Service Type */}
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
              label="Service Type"
              value={serviceType}
              options={SERVICE_TYPES}
              onChange={setServiceType}
            />
          </View>
        </View>

        {/* Doctor & Therapist Selection */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Select
              label="Doctor / Consultancy"
              value={doctorId}
              options={doctors.map((d) => ({ label: d.name, value: d.id }))}
              onChange={setDoctorId}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Select
              label="Therapist"
              value={therapistId}
              options={[
                { label: 'None', value: '' },
                ...availableTherapists.map((t) => ({ label: t.name, value: t.id })),
              ]}
              onChange={setTherapistId}
            />
          </View>
        </View>

        {/* Visit Type & Pre-payment Toggle */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Select
              label="Visit Type"
              value={visitType}
              options={VISIT_TYPES}
              onChange={setVisitType}
            />
          </View>
          <View style={styles.switchCol}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Pre-Payment Required?</Text>
            <Switch
              value={prePaymentRequired}
              onValueChange={setPrePaymentRequired}
              thumbColor={prePaymentRequired ? colors.primary : '#F4F3F4'}
            />
          </View>
        </View>

        {prePaymentRequired && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Pre-Payment Amount (₹)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={prePaymentAmount}
              onChangeText={setPrePaymentAmount}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Remark */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Remark</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={remark}
            onChangeText={setRemark}
            placeholder="Add optional notes..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
        >
          <Text style={styles.submitBtnText}>Create Appointment</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Add Patient Modal */}
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
    <BottomSheet visible={visible} onClose={onClose} snapHeight={620}>
      <CreateSheetForm initialData={initialData} onClose={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
