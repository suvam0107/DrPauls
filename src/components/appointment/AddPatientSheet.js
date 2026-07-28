import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import BottomSheet from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import { GENDERS, ENQUIRY_SOURCE } from '../../constants';
import usePatientStore from '../../store/usePatientStore';

export default function AddPatientSheet({ visible, onClose, onPatientAdded }) {
  const { colors } = useTheme();
  const addPatient = usePatientStore((s) => s.addPatient);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('Male');
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
      gender,
      enquirySource,
    });

    onPatientAdded && onPatientAdded(newPatient);
    setName('');
    setMobile('');
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={420}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Quick Patient Registration</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Patient Name *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            value={name}
            onChangeText={setName}
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
          <Text style={styles.saveBtnText}>Save & Select Patient</Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
