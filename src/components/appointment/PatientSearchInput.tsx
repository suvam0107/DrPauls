import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SearchInput from '../shared/SearchInput';
import { usePatientSearchQuery } from '../../hooks/queries/usePatientsQuery';
import { useDebounce } from '../../utils/useDebounce';
import SearchDropdownSkeleton from '../skeletons/SearchDropdownSkeleton';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Patient } from '../../types';

export interface PatientSearchInputProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient | null) => void;
  onAddNewPress: () => void;
}

export default function PatientSearchInput({
  selectedPatient,
  onSelectPatient,
  onAddNewPress,
}: PatientSearchInputProps) {
  const { colors } = useTheme();

  // Raw query — updates immediately on every keystroke (no lag)
  const [query, setQuery] = useState('');
  // Debounced query — fires the API call only after 200ms of silence
  const debouncedQuery = useDebounce(query, 200);

  // Server-side search: enabled on first character (>= 1 char)
  const { data: results = [], isFetching } = usePatientSearchQuery(debouncedQuery);

  const isSearching = isFetching && debouncedQuery.trim().length >= 1;
  const showSkeleton = isSearching && results.length === 0;
  const showResults = results.length > 0 && debouncedQuery.trim().length >= 1;
  const showNoResult =
    !isFetching &&
    debouncedQuery.trim().length >= 1 &&
    query.trim().length >= 1 &&
    results.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Search Patient</Text>
        <TouchableOpacity style={styles.addNewBtn} onPress={onAddNewPress}>
          <Ionicons name="person-add-outline" size={14} color={colors.primary} />
          <Text style={[styles.addNewText, { color: colors.primary }]}>Add New</Text>
        </TouchableOpacity>
      </View>

      {selectedPatient ? (
        <View style={[styles.selectedCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.patientName, { color: colors.text }]}>{selectedPatient.name}</Text>
            <Text style={[styles.patientMeta, { color: colors.textMuted }]}>
              {selectedPatient.mobile} • ID: {selectedPatient.id} ({selectedPatient.gender})
            </Text>
          </View>
          <TouchableOpacity onPress={() => onSelectPatient(null)}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, ID or mobile..."
            isFetching={isSearching}
          />

          {/* Loading skeleton while results fetch */}
          {showSkeleton && <SearchDropdownSkeleton />}

          {/* Results dropdown */}
          {showResults && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {results.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.resultItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    onSelectPatient(item);
                    setQuery('');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemSub, { color: colors.textMuted }]}>
                      {item.mobile} • {item.id}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* No result state */}
          {showNoResult && (
            <View style={[styles.noResultBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.noResultText, { color: colors.textMuted }]}>
                No patient found for "{debouncedQuery}".
              </Text>
              <TouchableOpacity onPress={onAddNewPress} style={{ marginTop: 4 }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                  Create "{query}" as a new patient
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addNewText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
  },
  patientMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 20,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  noResultBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  hintBox: {
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  noResultText: {
    fontSize: 13,
  },
});
