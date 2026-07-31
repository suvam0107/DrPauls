import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import useDoctorStore from '../../store/useDoctorStore';
import { Doctor, WeekDay } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound, playAppointmentSuccessSound } from '../../utils/feedback';

const SPECIALTIES = ['Hair', 'Skin', 'Cosmetic', 'Hair Transplant', 'Laser', 'General'];
const WEEKDAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export interface AddDoctorSheetProps {
  visible: boolean;
  onClose: () => void;
  onDoctorAdded?: (doctor: Doctor) => void;
}

export default function AddDoctorSheet({
  visible,
  onClose,
  onDoctorAdded,
}: AddDoctorSheetProps) {
  const { colors } = useTheme();
  const addDoctor = useDoctorStore((s) => s.addDoctor);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Skin');
  const [department, setDepartment] = useState('Dermatology');
  const [qualification, setQualification] = useState('MBBS, MD');
  const [phone, setPhone] = useState('');
  const [consultFee, setConsultFee] = useState('800');
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState('15');
  const [location, setLocation] = useState('Guwahati Main');
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([
    'Mon',
    'Tue',
    'Wed',
    'Fri',
    'Sat',
    'Sun',
  ]);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('19:00');
  const [available, setAvailable] = useState(true);

  const [error, setError] = useState('');

  const toggleDay = (day: WeekDay) => {
    playClickSound();
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = () => {
    playClickSound();

    if (!name.trim()) {
      setError('Doctor name is required');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Valid 10-digit phone number is required');
      return;
    }
    const fee = parseFloat(consultFee);
    if (isNaN(fee) || fee < 0) {
      setError('Valid consult fee is required');
      return;
    }
    const maxP = parseInt(maxPatientsPerDay, 10);
    if (isNaN(maxP) || maxP <= 0) {
      setError('Valid max patients per day is required');
      return;
    }
    if (selectedDays.length === 0) {
      setError('Select at least one working day');
      return;
    }

    setError('');

    const newDoc = addDoctor({
      name: name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`,
      specialty,
      department: department.trim() || 'General Practice',
      qualification: qualification.trim() || 'MBBS',
      phone: phone.trim(),
      consultFee: fee,
      maxPatientsPerDay: maxP,
      location: location.trim() || 'Guwahati Main',
      workingDays: selectedDays,
      workingHours: { start: startHour.trim() || '10:00', end: endHour.trim() || '19:00' },
      available,
      centerSchedule: [
        {
          centerId: 'CC-001',
          workingDays: selectedDays,
          workingHours: { start: startHour.trim() || '10:00', end: endHour.trim() || '19:00' },
        },
      ],
    });

    playAppointmentSuccessSound();
    if (onDoctorAdded) onDoctorAdded(newDoc);

    // Reset form
    setName('');
    setPhone('');
    setError('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={600}>
      <BottomSheetScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Add New Doctor</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Doctor Name *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dr. Rajesh Sharma"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Select
              label="Specialty *"
              value={specialty}
              options={SPECIALTIES}
              onChange={setSpecialty}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Department *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={department}
              onChangeText={setDepartment}
              placeholder="e.g. Trichology"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Qualification</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={qualification}
              onChangeText={setQualification}
              placeholder="e.g. MBBS, MD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit mobile"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Consult Fee (₹) *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={consultFee}
              onChangeText={setConsultFee}
              keyboardType="numeric"
              placeholder="800"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Max Patients / Day *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={maxPatientsPerDay}
              onChangeText={setMaxPatientsPerDay}
              keyboardType="numeric"
              placeholder="15"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Location / Branch</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Guwahati Main"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {/* Working Days Multi-Select */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Working Days *</Text>
          <View style={styles.daysRow}>
            {WEEKDAYS.map((day) => {
              const selected = selectedDays.includes(day);
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
        </View>

        {/* Working Hours */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Start Time (HH:mm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={startHour}
              onChangeText={setStartHour}
              placeholder="10:00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>End Time (HH:mm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={endHour}
              onChangeText={setEndHour}
              placeholder="19:00"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Available On Duty</Text>
          <Switch
            value={available}
            onValueChange={(val) => {
              playClickSound();
              setAvailable(val);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save Doctor</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 12,
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
