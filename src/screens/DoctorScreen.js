import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import useDoctorStore from '../store/useDoctorStore';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function DoctorScreen() {
  const { colors } = useTheme();
  const doctors = useDoctorStore((s) => s.doctors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Doctors & Consultants</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>{doctors.length} active doctors on duty</Text>
      </View>

      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="medical" size={24} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.spec, { color: colors.primary }]}>{item.specialty} ({item.department})</Text>
              <Text style={[styles.qual, { color: colors.textMuted }]}>{item.qualification}</Text>

              <View style={styles.footerRow}>
                <Text style={[styles.fee, { color: colors.text }]}>Fee: ₹{item.consultFee}</Text>
                <Text style={[styles.location, { color: colors.textMuted }]}>{item.location}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '700' },
  spec: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  qual: { fontSize: 12, marginTop: 2 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fee: { fontSize: 13, fontWeight: '700' },
  location: { fontSize: 12 },
});
