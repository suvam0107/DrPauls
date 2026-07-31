import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import { GENDERS, ENQUIRY_SOURCE } from '../../constants';
import usePatientStore from '../../store/usePatientStore';
import { Patient, Gender } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export interface AddPatientSheetProps {
  visible: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
}

function AddPatientForm({ onClose, onPatientAdded }: Omit<AddPatientSheetProps, 'visible'>) {
  const { colors } = useTheme();
  const { expandSheet } = useBottomSheet();
  const addPatient = usePatientStore((s) => s.addPatient);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState<string>('Male');
  const [enquirySource, setEnquirySource] = useState('Walk-in');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    const newPatient = addPatient({
      name: name.trim(),
      mobile: mobile.trim(),
      gender: gender as Gender,
      enquirySource,
      parentDetails: [],
      therapistDetails: [],
    });

    if (onPatientAdded) onPatientAdded(newPatient);
    setName('');
    setMobile('');
    onClose();
  };

  return (
    <BottomSheetScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 220 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text }]}>Quick Patient Registration</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Patient Name *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={name}
          onChangeText={setName}
          onFocus={expandSheet}
          placeholder="e.g. Rahul Sharma"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Mobile Number *</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          value={mobile}
          onChangeText={setMobile}
          onFocus={expandSheet}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="10-digit mobile number"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Select
            label="Gender"
            value={gender}
            options={GENDERS}
            onChange={setGender}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            label="Enquiry Source"
            value={enquirySource}
            options={ENQUIRY_SOURCE}
            onChange={setEnquirySource}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave}>
        <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>Save & Select Patient</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
}

export default function AddPatientSheet({ visible, onClose, onPatientAdded }: AddPatientSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={420} keyboardBlurBehavior="restore">
      <AddPatientForm onClose={onClose} onPatientAdded={onPatientAdded} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
