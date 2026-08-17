import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { useBottomSheet } from '../shared/BottomSheet';
import Select from '../shared/Select';
import FormField from '../shared/FormField';
import { useTheme } from '../../theme/ThemeContext';
import { GENDERS, ENQUIRY_SOURCE } from '../../constants';
import { Patient, Gender } from '../../types';
import { playClickSound, playAppointmentSuccessSound } from '../../utils/feedback';
import { AddPatientSchema, AddPatientFormValues } from '../../schemas';
import { useAddPatientMutation } from '../../hooks/mutations/usePatientMutations';

export interface AddPatientSheetProps {
  visible: boolean;
  onClose: () => void;
  onPatientAdded?: (patient: Patient) => void;
  onCreated?: (patientId: string) => void;
}

function AddPatientForm({ onClose, onPatientAdded, onCreated }: Omit<AddPatientSheetProps, 'visible'>) {
  const { colors } = useTheme();
  const { expandSheet } = useBottomSheet();
  const addPatientMutation = useAddPatientMutation();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AddPatientFormValues>({
    resolver: zodResolver(AddPatientSchema),
    defaultValues: {
      name: '',
      mobile: '',
      gender: 'Male',
      enquirySource: 'Walk-in',
    },
  });

  const handleSave = handleSubmit(async (data) => {
    clearErrors('root');
    try {
      const newPatient = await addPatientMutation.mutateAsync({
        name: data.name.trim(),
        mobile: data.mobile.trim(),
        gender: data.gender as Gender,
        enquirySource: data.enquirySource,
        parentDetails: [],
        therapistDetails: [],
      });

      playAppointmentSuccessSound();
      if (onPatientAdded) onPatientAdded(newPatient);
      if (onCreated) onCreated(newPatient.id);
      reset();
      onClose();
    } catch (err: any) {
      setError('root', { message: err?.message || 'Failed to create patient.' });
    }
  });

  return (
    <BottomSheetScrollView
      style={{ paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingBottom: 220 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Quick Patient Registration</Text>

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
          <FormField label="Patient Name" required error={errors.name?.message}>
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
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={colors.textMuted}
            />
          </FormField>
        )}
      />

      <Controller
        control={control}
        name="mobile"
        render={({ field: { onChange, onBlur, value } }) => (
          <FormField label="Mobile Number" required error={errors.mobile?.message}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: errors.mobile ? colors.danger : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              onFocus={expandSheet}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textMuted}
            />
          </FormField>
        )}
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Gender"
                value={value}
                options={GENDERS}
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
            name="enquirySource"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Enquiry Source"
                value={value}
                options={ENQUIRY_SOURCE}
                onChange={(val) => {
                  playClickSound();
                  onChange(val);
                }}
              />
            )}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary }]}
        onPress={handleSave}
        activeOpacity={0.8}
      >
        <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
        <Text style={styles.saveBtnText}>Save & Select Patient</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
}

export default function AddPatientSheet({ visible, onClose, onPatientAdded, onCreated }: AddPatientSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={420} keyboardBlurBehavior="restore">
      <AddPatientForm onClose={onClose} onPatientAdded={onPatientAdded} onCreated={onCreated} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
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
