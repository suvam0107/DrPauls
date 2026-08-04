import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import usePackageStore from '../store/usePackageStore';
import useAppointmentStore from '../store/useAppointmentStore';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import RescheduleModal from '../components/calendar/RescheduleModal';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import SessionProgressRing from '../components/package/SessionProgressRing';
import { playClickSound } from '../utils/feedback';
import { useRefresh } from '../utils/useRefresh';
import { formatDateShort, getNextSessionAppointment } from '../utils/dateUtils';
import { Appointment } from '../types';

export default function PatientEnrollmentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();

  const enrollments = usePackageStore((s) => s.enrollments);
  const appointments = useAppointmentStore((s) => s.appointments);

  const [searchQuery, setSearchQuery] = useState('');
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>('All');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  // Lifted modal states — flat sibling stack, no nesting
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  const enrollmentStatusCategories = ['All', 'Active', 'Paused', 'Completed'];

  const filteredEnrollments = enrollments.filter((e) => {
    const matchesStatus = enrollmentStatusFilter === 'All' || e.status === enrollmentStatusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      e.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Patient Enrollments
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search enrollments by patient, package or ID..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Chips Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {enrollmentStatusCategories.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                enrollmentStatusFilter === status && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                playClickSound();
                setEnrollmentStatusFilter(status);
              }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: enrollmentStatusFilter === status ? '#FFF' : colors.text },
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Enrollments Content List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredEnrollments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="layers-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No package enrollments found.</Text>
          </View>
        ) : (
          filteredEnrollments.map((e) => {
            const nextAppt = getNextSessionAppointment(e.sessionIds, appointments);

            return (
              <View key={e.enrollmentId} style={[styles.enrollmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.enrollmentHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.tagRow}>
                      <View style={[styles.serviceTag, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.serviceTagText, { color: colors.primary }]}>{e.serviceType}</Text>
                      </View>
                    </View>
                    <Text style={[styles.pkgName, { color: colors.text }]}>{e.packageName}</Text>
                  </View>

                  <SessionProgressRing
                    total={e.totalSessions}
                    completed={e.completedSessions}
                    size={54}
                    strokeWidth={5}
                  />
                </View>

                <View style={[styles.enrollmentMeta, { borderTopColor: colors.border }]}>
                  <View style={styles.metaRow}>
                    <Ionicons name="person" size={14} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.text }]}>
                      {e.patientName} ({e.patientMobile})
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="medkit-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textMuted }]}>
                      Doctor: {e.doctorName}
                    </Text>
                  </View>
                </View>

                <View style={[styles.enrollmentFooter, { borderTopColor: colors.border }]}>
                  <View style={styles.nextDateBox}>
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text style={[styles.nextDateText, { color: colors.text }]}>
                      {nextAppt
                        ? `Next: ${formatDateShort(nextAppt.date)} (${nextAppt.startTime})`
                        : 'All Sessions Finished'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.detailsBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      playClickSound();
                      setSelectedEnrollmentId(e.enrollmentId);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailsBtnText}>View Timeline</Text>
                    <Ionicons name="chevron-forward" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ERP Detail Sheet — callbacks lifted, no nested modals inside */}
      <PackageEnrollmentDetailSheet
        visible={!!selectedEnrollmentId}
        enrollmentId={selectedEnrollmentId}
        onClose={() => setSelectedEnrollmentId(null)}
        onRescheduleSession={(appt) => setRescheduleTargetAppt(appt)}
        onViewSessionDetails={(appt) => setSelectedSessionAppt(appt)}
      />

      {/* Reschedule Modal — screen-level sibling */}
      <RescheduleModal
        visible={!!rescheduleTargetAppt}
        appointment={rescheduleTargetAppt}
        onClose={() => setRescheduleTargetAppt(null)}
      />

      {/* Session Appointment Detail Modal — screen-level sibling */}
      <AppointmentDetailModal
        visible={!!selectedSessionAppt}
        appointment={selectedSessionAppt}
        onClose={() => setSelectedSessionAppt(null)}
        onOpenEnrollmentTimeline={(enrollmentId) => {
          setSelectedSessionAppt(null);
          setSelectedEnrollmentId(enrollmentId);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBox: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterScroll: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  enrollmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  idBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  pkgName: {
    fontSize: 16,
    fontWeight: '700',
  },
  enrollmentMeta: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
  },
  enrollmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  nextDateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  nextDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
