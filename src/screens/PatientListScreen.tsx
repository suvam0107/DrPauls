import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import SearchInput from '../components/shared/SearchInput';
import AddPatientSheet from '../components/appointment/AddPatientSheet';
import PatientDetailModal from '../components/patient/PatientDetailModal';
import usePatientStore from '../store/usePatientStore';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../types';
import { playClickSound } from '../utils/feedback';
import { copyToClipboard } from '../utils/clipboardUtils';

export default function PatientListScreen() {
  const { colors } = useTheme();
  const patients = usePatientStore((s) => s.patients);
  const search = usePatientStore((s) => s.search);

  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);

  const filteredPatients: Patient[] = query.trim() ? search(query) : patients;

  const handleOpenPatientDetail = (patient: Patient) => {
    playClickSound();
    setSelectedPatient(patient);
    setShowPatientDetail(true);
  };

  const handleCall = (phone?: string) => {
    if (!phone) return;
    playClickSound();
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Patient Directory</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>{patients.length} registered patients</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            playClickSound();
            setShowAdd(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={16} color="#FFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <SearchInput value={query} onChangeText={setQuery} placeholder="Search by name, ID or mobile..." />
      </View>

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleOpenPatientDetail(item)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{item.name.charAt(0)}</Text>
            </View>

            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => handleOpenPatientDetail(item)}
              onLongPress={() => copyToClipboard(`Patient: ${item.name} • Mobile: ${item.mobile} • Gender: ${item.gender}`, 'Patient Info')}
              activeOpacity={0.8}
            >
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {item.mobile} • {item.gender}
              </Text>
              {item.address ? (
                <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.address}
                </Text>
              ) : null}
            </TouchableOpacity>

            {/* Action Buttons: Copy & Call */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <TouchableOpacity
                style={styles.copyCardBtn}
                onPress={() => copyToClipboard(`Patient: ${item.name} • Mobile: ${item.mobile} • Gender: ${item.gender}`, 'Patient Info')}
                activeOpacity={0.7}
                hitSlop={6}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
              </TouchableOpacity>

              {item.mobile ? (
                <TouchableOpacity
                  style={styles.copyCardBtn}
                  onPress={() => handleCall(item.mobile)}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <Ionicons name="call-outline" size={16} color={colors.success} />
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Quick Add Patient Sheet */}
      <AddPatientSheet visible={showAdd} onClose={() => setShowAdd(false)} />

      {/* Patient Detail & Edit Modal */}
      <PatientDetailModal
        patient={selectedPatient}
        visible={showPatientDetail}
        onClose={() => setShowPatientDetail(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  searchBox: { paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  address: { fontSize: 11, marginTop: 2 },
  copyCardBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

