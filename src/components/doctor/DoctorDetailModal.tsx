import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import BottomSheet from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import useDoctorStore from '../../store/useDoctorStore';
import { Doctor, WeekDay } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { playClickSound, playAppointmentSuccessSound } from '../../utils/feedback';
import { copyToClipboard } from '../../utils/clipboardUtils';

import { formatDoctorText, shareDetails } from '../../utils/shareUtils';

const SPECIALTIES = ['Hair', 'Skin', 'Cosmetic', 'Hair Transplant', 'Laser', 'General'];
const WEEKDAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

import { useUpdateDoctorMutation } from '../../hooks/mutations/useDoctorMutations';

export interface DoctorDetailModalProps {
  doctor: Doctor | null;
  visible: boolean;
  onClose: () => void;
}

export default function DoctorDetailModal({
  doctor,
  visible,
  onClose,
}: DoctorDetailModalProps) {
  const { colors } = useTheme();
  const updateDoctorMutation = useUpdateDoctorMutation();

  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Skin');
  const [department, setDepartment] = useState('');
  const [qualification, setQualification] = useState('');
  const [phone, setPhone] = useState('');
  const [consultFee, setConsultFee] = useState('800');
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState('15');
  const [location, setLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]);
  const [startHour, setStartHour] = useState('10:00');
  const [endHour, setEndHour] = useState('19:00');
  const [available, setAvailable] = useState(true);

  const [error, setError] = useState('');

  const [cachedDoctor, setCachedDoctor] = useState<Doctor | null>(doctor);

  // Hydrate fields when doctor changes
  useEffect(() => {
    if (doctor) {
      setCachedDoctor(doctor);
      setName(doctor.name || '');
      setSpecialty(doctor.specialty || 'Skin');
      setDepartment(doctor.department || '');
      setQualification(doctor.qualification || '');
      setPhone(doctor.phone || '');
      setConsultFee(String(doctor.consultFee || 800));
      setMaxPatientsPerDay(String(doctor.maxPatientsPerDay || 15));
      setLocation(doctor.location || '');
      setSelectedDays(doctor.workingDays || ['Mon', 'Tue', 'Wed', 'Fri', 'Sat', 'Sun']);
      setStartHour(doctor.workingHours?.start || '10:00');
      setEndHour(doctor.workingHours?.end || '19:00');
      setAvailable(doctor.available ?? true);
      setIsEditing(false);
      setError('');
    }
  }, [doctor, visible]);

  const activeDoc = doctor || cachedDoctor;
  if (!activeDoc) return null;

  const formattedDocProfile = formatDoctorText(activeDoc);

  const handleCopyProfile = () => {
    copyToClipboard(formattedDocProfile, 'Doctor Profile');
  };

  const handleShareProfile = () => {
    shareDetails('Doctor Profile', formattedDocProfile);
  };

  const handleCall = () => {
    if (!phone) return;
    playClickSound();
    Linking.openURL(`tel:${phone}`);
  };

  const toggleDay = (day: WeekDay) => {
    playClickSound();
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
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

    const updates: Partial<Doctor> = {
      name: name.trim(),
      specialty: specialty.trim() || 'Skin',
      department: department.trim() || 'Dermatology',
      qualification: qualification.trim() || 'MBBS',
      phone: phone.trim() || undefined,
      consultFee: parseFloat(consultFee) || 800,
      maxPatientsPerDay: parseInt(maxPatientsPerDay) || 15,
      location: location.trim() || 'Guwahati Main',
      workingDays: selectedDays,
      workingHours: {
        start: startHour || '10:00',
        end: endHour || '19:00',
      },
      available,
    };

    await updateDoctorMutation.mutateAsync({ id: activeDoc.id, updates });
    playAppointmentSuccessSound();
    setIsEditing(false);
  };

  return (
    <BottomSheet visible={visible && !!activeDoc} onClose={onClose} snapHeight={560} keyboardBlurBehavior="none">
      {activeDoc ? (
        <BottomSheetScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 240 }} keyboardShouldPersistTaps="handled">
          {/* Header Profile Section with Copy & Share Icons */}
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="medical-outline" size={28} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.docName, { color: colors.text }]}>{name || activeDoc.name}</Text>
              <Text style={[styles.docSpec, { color: colors.primary }]}>
                {specialty || activeDoc.specialty} • {department || activeDoc.department}
              </Text>
            </View>

            {/* Plain Copy & Share Icons side-by-side */}
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={handleCopyProfile}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <Ionicons name="copy-outline" size={19} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareProfile}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <Ionicons name="share-social-outline" size={19} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status & Quick Action Bar */}
          <View style={[styles.actionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: available ? colors.success : colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: available ? colors.success : colors.danger },
                ]}
              >
                {available ? 'Available On Duty' : 'On Leave'}
              </Text>
            </View>

            <View style={styles.actionBtns}>
              {phone ? (
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: colors.success }]}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call-outline" size={16} color="#FFF" />
                  <Text style={[styles.btnText, { color: '#FFF' }]}>Call</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.iconBtn,
                  { backgroundColor: isEditing ? colors.danger : colors.primary },
                ]}
                onPress={() => {
                  playClickSound();
                  setIsEditing(!isEditing);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isEditing ? 'close-circle-outline' : 'create-outline'}
                  size={16}
                  color="#FFF"
                />
                <Text style={[styles.btnText, { color: '#FFF' }]}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isEditing ? (
            /* READ-ONLY VIEW MODE */
            <View style={styles.detailsContainer}>
              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => qualification && copyToClipboard(qualification, 'Qualification')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Qualification</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {qualification || 'Not specified'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => phone && copyToClipboard(phone, 'Phone Number')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Contact Phone</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{phone || 'N/A'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => consultFee && copyToClipboard(`₹${consultFee}`, 'Consultation Fee')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Consultation Fee</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>
                  ₹{consultFee}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => maxPatientsPerDay && copyToClipboard(`${maxPatientsPerDay} patients / day`, 'Max Patients')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Max Daily Patients</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {maxPatientsPerDay} patients / day
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => location && copyToClipboard(location, 'Location')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Location / Branch</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {location || 'Guwahati Main'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => copyToClipboard(`${startHour} – ${endHour}`, 'Working Hours')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Working Hours</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {startHour} – {endHour}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 12 }}
                onLongPress={() => copyToClipboard(selectedDays.join(', '), 'Working Days')}
                activeOpacity={0.8}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted, marginBottom: 6 }]}>
                  Working Days (Long-press to copy)
                </Text>
                <View style={styles.daysRow}>
                  {WEEKDAYS.map((day) => {
                    const isActive = selectedDays.includes(day);
                    return (
                      <View
                        key={day}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: isActive ? colors.primaryLight : colors.surface,
                            borderColor: isActive ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: isActive ? colors.primary : colors.textMuted },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            /* EDIT FORM MODE */
            <View style={{ marginTop: 8 }}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Doctor Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={name}
                  onChangeText={setName}
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
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={department}
                    onChangeText={setDepartment}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Qualification</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={qualification}
                    onChangeText={setQualification}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Phone Number *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Consult Fee (₹) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={consultFee}
                    onChangeText={setConsultFee}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Max Patients / Day *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={maxPatientsPerDay}
                    onChangeText={setMaxPatientsPerDay}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Location / Branch</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

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
                        <Text style={[styles.dayText, { color: selected ? '#FFF' : colors.text }]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>Start Time (HH:mm)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={startHour}
                    onChangeText={setStartHour}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>End Time (HH:mm)</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                    ]}
                    value={endHour}
                    onChangeText={setEndHour}
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                  Available On Duty
                </Text>
                <Switch
                  value={available}
                  onValueChange={(val) => {
                    playClickSound();
                    setAvailable(val);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={available ? '#FFFFFF' : '#F4F3F4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>

            </View>
          )}
        </BottomSheetScrollView>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 18,
    fontWeight: '700',
  },
  docSpec: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  docId: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
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
