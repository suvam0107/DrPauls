import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import useDoctorStore from '../store/useDoctorStore';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Doctor } from '../types';
import { playClickSound } from '../utils/feedback';

export default function DoctorScreen() {
  const { colors } = useTheme();
  const doctors = useDoctorStore((s) => s.doctors);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    playClickSound();
    Linking.openURL(`tel:${phone}`);
  };

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
        renderItem={({ item }: { item: Doctor }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="medical-outline" size={24} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.spec, { color: colors.primary }]}>{item.specialty} ({item.department})</Text>
                </View>

                {/* Call Icon Button */}
                {item.phone && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(item.phone)}
                    activeOpacity={0.7}
                    hitSlop={6}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.success} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={[styles.qual, { color: colors.textMuted }]}>{item.qualification}</Text>

              {item.phone && (
                <Text style={[styles.phoneText, { color: colors.textMuted }]}>
                  {item.phone}
                </Text>
              )}

              <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
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
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: '700' },
  spec: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  qual: { fontSize: 12, marginTop: 2 },
  phoneText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  fee: { fontSize: 13, fontWeight: '700' },
  location: { fontSize: 12 },
});
