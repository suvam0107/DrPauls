import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import BottomSheet from '../shared/BottomSheet';
import Select from '../shared/Select';
import { useTheme } from '../../theme/ThemeContext';
import usePatientStore from '../../store/usePatientStore';
import { Patient, Gender } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GENDERS, ENQUIRY_SOURCE } from '../../constants';
import { playClickSound, playAppointmentSuccessSound } from '../../utils/feedback';
import { copyToClipboard } from '../../utils/clipboardUtils';

import { formatPatientText, shareDetails } from '../../utils/shareUtils';

export interface PatientDetailModalProps {
  patient: Patient | null;
  visible: boolean;
  onClose: () => void;
  onViewPastRecords?: (patientId: string) => void;
}

export default function PatientDetailModal({
  patient,
  visible,
  onClose,
  onViewPastRecords,
}: PatientDetailModalProps) {
  const { colors } = useTheme();
  const updatePatient = usePatientStore((s) => s.updatePatient);

  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('Male');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [enquirySource, setEnquirySource] = useState('Walk-in');
  const [referenceDoctor, setReferenceDoctor] = useState('');

  const [error, setError] = useState('');

  const [cachedPatient, setCachedPatient] = useState<Patient | null>(patient);

  // Hydrate fields when patient changes
  useEffect(() => {
    if (patient) {
      setCachedPatient(patient);
      setName(patient.name || '');
      setMobile(patient.mobile || '');
      setWhatsapp(patient.whatsapp || '');
      setAlternateMobile(patient.alternateMobile || '');
      setDob(patient.dob || '');
      setGender(patient.gender || 'Male');
      setEmail(patient.email || '');
      setAddress(patient.address || '');
      setPinCode(patient.pinCode || '');
      setState(patient.state || '');
      setDistrict(patient.district || '');
      setEnquirySource(patient.enquirySource || 'Walk-in');
      setReferenceDoctor(patient.referenceDoctor || '');
      setIsEditing(false);
      setError('');
    }
  }, [patient, visible]);

  const activePat = patient || cachedPatient;
  const rescheduleCount = activePat?.rescheduleCount || 0;
  const priority = activePat?.priority || 'High';

  const priorityColor =
    priority === 'High' ? '#10B981' : priority === 'Medium' ? '#F59E0B' : '#EF4444';

  const priorityBg =
    priority === 'High' ? '#D1FAE5' : priority === 'Medium' ? '#FEF3C7' : '#FEE2E2';

  const formattedPatientProfile = activePat ? formatPatientText(activePat) : '';

  const handleCopyProfile = () => {
    if (!formattedPatientProfile) return;
    copyToClipboard(formattedPatientProfile, 'Patient Record');
  };

  const handleShareProfile = () => {
    if (!formattedPatientProfile) return;
    shareDetails('Patient Record', formattedPatientProfile);
  };

  const handleCall = () => {
    if (!mobile) return;
    playClickSound();
    Linking.openURL(`tel:${mobile}`);
  };

  const handleSave = () => {
    if (!activePat) return;
    playClickSound();

    if (!name.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!mobile.trim() || mobile.trim().length < 10) {
      setError('Valid 10-digit mobile number is required');
      return;
    }

    setError('');

    const updates: Partial<Patient> = {
      name: name.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || undefined,
      alternateMobile: alternateMobile.trim() || undefined,
      dob: dob.trim() || undefined,
      gender: gender as Gender,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      pinCode: pinCode.trim() || undefined,
      state: state.trim() || undefined,
      district: district.trim() || undefined,
      enquirySource: enquirySource.trim() || undefined,
      referenceDoctor: referenceDoctor.trim() || undefined,
    };

    updatePatient(activePat.id, updates);
    playAppointmentSuccessSound();
    setIsEditing(false);
  };

  return (
    <BottomSheet visible={visible && !!activePat} onClose={onClose} snapHeight={580} keyboardBlurBehavior="none">
      {activePat ? (
        <BottomSheetScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 240 }} keyboardShouldPersistTaps="handled">
        {/* Priority-Highlighted Profile Card */}
        <View
          style={[
            styles.profileBorderCard,
            {
              backgroundColor: colors.surface,
              borderColor: priorityColor + '40',
              borderLeftWidth: 5,
              borderLeftColor: priorityColor,
            },
          ]}
        >
          {/* Header Profile Section with Copy & Share Icons */}
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(name || activePat.name).charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.patientName, { color: colors.text }]}>{name || activePat.name}</Text>
              <Text style={[styles.patientMeta, { color: colors.textMuted }]}>
                {gender || activePat.gender} • {rescheduleCount} Reschedule{rescheduleCount !== 1 ? 's' : ''} • Priority: <Text style={{ color: priorityColor, fontWeight: '700' }}>{priority} Priority</Text>
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
        </View>

        {/* View Past Records Link Button */}
        {onViewPastRecords ? (
          <TouchableOpacity
            style={[styles.pastRecordsBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40' }]}
            onPress={() => {
              playClickSound();
              onClose();
              onViewPastRecords(activePat.id);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.pastRecordsBtnText, { color: colors.primary }]}>
              View Patient Past Records & Medical History
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        ) : null}

        {/* Quick Action Bar */}
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.phoneTag}
            onLongPress={() => (mobile || activePat.mobile) && copyToClipboard(mobile || activePat.mobile, 'Mobile Number')}
            activeOpacity={0.7}
          >
            <Ionicons name="phone-portrait-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.phoneTagText, { color: colors.text }]}>{mobile || activePat.mobile}</Text>
          </TouchableOpacity>

          <View style={styles.actionBtns}>
            {mobile ? (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.success }]}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Ionicons name="call-outline" size={15} color="#FFF" />
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
                size={15}
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
                onLongPress={() => mobile && copyToClipboard(mobile, 'Mobile Number')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Mobile Number</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontWeight: '700' }]}>
                  {mobile}
                </Text>
              </TouchableOpacity>

              {whatsapp ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(whatsapp, 'WhatsApp Number')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>WhatsApp</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{whatsapp}</Text>
                </TouchableOpacity>
              ) : null}

              {alternateMobile ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(alternateMobile, 'Alternate Phone')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Alternate Phone</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{alternateMobile}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => copyToClipboard(gender, 'Gender')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Gender</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{gender}</Text>
              </TouchableOpacity>

              {dob ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(dob, 'Date of Birth')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Date of Birth</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{dob}</Text>
                </TouchableOpacity>
              ) : null}

              {email ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(email, 'Email Address')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email Address</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{email}</Text>
                </TouchableOpacity>
              ) : null}

              {address ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(address, 'Address')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: colors.text, flex: 1, textAlign: 'right' }]}>
                    {address}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {district || state || pinCode ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard([district, state, pinCode].filter(Boolean).join(', '), 'Location')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Location</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {[district, state, pinCode].filter(Boolean).join(', ')}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => copyToClipboard(enquirySource, 'Enquiry Source')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Enquiry Source</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{enquirySource}</Text>
              </TouchableOpacity>

              {referenceDoctor ? (
                <TouchableOpacity
                  style={[styles.infoRow, { borderBottomColor: colors.border }]}
                  onLongPress={() => copyToClipboard(referenceDoctor, 'Reference Doctor')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Reference Doctor</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{referenceDoctor}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[styles.infoRow, { borderBottomColor: colors.border }]}
                onLongPress={() => activePat.createdAt && copyToClipboard(new Date(activePat.createdAt).toLocaleDateString(), 'Registration Date')}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Registration Date</Text>
                <Text style={[styles.infoValue, { color: colors.textMuted, fontSize: 12 }]}>
                  {activePat.createdAt ? new Date(activePat.createdAt).toLocaleDateString() : 'N/A'}
                </Text>
              </TouchableOpacity>
            </View>
        ) : (
          /* EDIT FORM MODE */
          <View style={{ marginTop: 8 }}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Patient Full Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Mobile Number *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Select
                  label="Gender *"
                  value={gender}
                  options={GENDERS}
                  onChange={setGender}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>WhatsApp Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Optional"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Alternate Mobile</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={alternateMobile}
                  onChangeText={setAlternateMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Optional"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Date of Birth</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Street Address</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="House / Flat / Area"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>District / City</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>State</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Pin Code</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                  ]}
                  value={pinCode}
                  onChangeText={setPinCode}
                  keyboardType="numeric"
                  maxLength={6}
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

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Reference Doctor</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
                ]}
                value={referenceDoctor}
                onChangeText={setReferenceDoctor}
                placeholder="Dr. Name if referred"
                placeholderTextColor={colors.textMuted}
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
  profileBorderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
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
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pastRecordsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  pastRecordsBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  patientMeta: {
    fontSize: 13,
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
  phoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneTagText: {
    fontSize: 13,
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
