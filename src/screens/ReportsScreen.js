import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import { APPOINTMENT_STATUS } from '../constants';

export default function ReportsScreen() {
  const { colors } = useTheme();
  const appointments = useAppointmentStore((s) => s.appointments);

  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED).length;
  const paid = appointments.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;
  const cancelled = appointments.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Clinic Reports & Analytics</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>Overview of appointment performance</Text>

      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.num, { color: colors.primary }]}>{total}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Total Appointments</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.num, { color: colors.success }]}>{confirmed}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Confirmed</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.num, { color: colors.purple }]}>{paid}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Paid</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.num, { color: colors.danger }]}>{cancelled}</Text>
          <Text style={[styles.label, { color: colors.textMuted }]}>Cancelled</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  sub: { fontSize: 13, marginTop: 2, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  num: { fontSize: 24, fontWeight: '700' },
  label: { fontSize: 12, marginTop: 4 },
});
