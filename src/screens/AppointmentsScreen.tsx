import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import useDoctorStore from '../store/useDoctorStore';
import usePatientStore, { calculatePatientPriority } from '../store/usePatientStore';
import { Appointment } from '../types';
import StatusChip from '../components/shared/StatusChip';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import RescheduleModal from '../components/calendar/RescheduleModal';
import {
  todayISO,
  offsetDate,
  formatDateShort,
  formatTime,
  getMonthGrid,
  formatMonthYear,
  offsetMonth,
} from '../utils/dateUtils';
import { playClickSound } from '../utils/feedback';

import AppRefreshControl from '../components/shared/AppRefreshControl';
import { useRefresh } from '../utils/useRefresh';

export type RangeMode = 'today' | 'yesterday' | 'custom';
export type GroupingMode = 'doctor' | 'patient';

export default function AppointmentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();

  const appointments = useAppointmentStore((s) => s.appointments);
  const doctors = useDoctorStore((s) => s.doctors);
  const patients = usePatientStore((s) => s.patients);

  const [rangeMode, setRangeMode] = useState<RangeMode>('today');
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('doctor');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom range dates
  const yesterdayDate = offsetDate(todayISO(), -1);
  const [startDate, setStartDate] = useState(offsetDate(todayISO(), -7));
  const [endDate, setEndDate] = useState(todayISO());

  // Date Picker Modal state
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [pickerMonth, setPickerMonth] = useState(todayISO());

  // Selected appointment for detail modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  // Lifted ERP Package Enrollment timeline & session modals
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  // Compute effective date range
  const { effectiveStart, effectiveEnd } = useMemo(() => {
    if (rangeMode === 'today') return { effectiveStart: todayISO(), effectiveEnd: todayISO() };
    if (rangeMode === 'yesterday') return { effectiveStart: yesterdayDate, effectiveEnd: yesterdayDate };
    return { effectiveStart: startDate, effectiveEnd: endDate };
  }, [rangeMode, yesterdayDate, startDate, endDate]);

  // Filter & sort appointments
  const filteredAppointments = useMemo(() => {
    let result = appointments.filter(
      (a) => a.date >= effectiveStart && a.date <= effectiveEnd
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.patientMobile.includes(q) ||
          a.serviceType.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
      );
    }

    // Sort descending by date and time
    result.sort((a, b) => {
      const timeA = `${a.date} ${a.startTime}`;
      const timeB = `${a.date} ${a.startTime}`;
      return timeB.localeCompare(timeA);
    });

    return result;
  }, [appointments, effectiveStart, effectiveEnd, searchQuery]);

  // Group appointments
  const groupedData = useMemo(() => {
    if (groupingMode === 'doctor') {
      const groups: Record<string, { title: string; subtitle: string; items: Appointment[] }> = {};
      filteredAppointments.forEach((a) => {
        const key = a.doctorId || 'unknown';
        if (!groups[key]) {
          const docObj = doctors.find((d) => d.id === a.doctorId);
          groups[key] = {
            title: a.doctorName || 'Doctor',
            subtitle: docObj?.specialty ? `${docObj.specialty} • ${docObj.department}` : 'Specialist',
            items: [],
          };
        }
        groups[key].items.push(a);
      });
      return Object.values(groups);
    } else {
      const groups: Record<string, { title: string; subtitle: string; items: Appointment[] }> = {};
      filteredAppointments.forEach((a) => {
        const key = a.patientId || a.patientName || 'unknown';
        if (!groups[key]) {
          groups[key] = {
            title: a.patientName,
            subtitle: `Mobile: ${a.patientMobile}`,
            items: [],
          };
        }
        groups[key].items.push(a);
      });
      return Object.values(groups);
    }
  }, [filteredAppointments, groupingMode, doctors]);

  const monthGridCells = useMemo(() => getMonthGrid(pickerMonth), [pickerMonth]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header & Search Bar */}
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Appointments Directory</Text>
          <View style={[styles.totalBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.totalBadgeText, { color: colors.primary }]}>
              {filteredAppointments.length} Total
            </Text>
          </View>
        </View>

        {/* Date Range Selector Pills */}
        <View style={[styles.rangePillsRow, { backgroundColor: colors.surface }]}>
          {(['today', 'yesterday', 'custom'] as RangeMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.rangePill,
                rangeMode === mode && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                playClickSound();
                setRangeMode(mode);
              }}
            >
              <Text
                style={[
                  styles.rangePillText,
                  { color: rangeMode === mode ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                {mode === 'today' ? 'Today' : mode === 'yesterday' ? 'Yesterday' : 'Custom Range'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Date Range Pickers (if mode is custom) */}
        {rangeMode === 'custom' && (
          <View style={styles.customDateRow}>
            <TouchableOpacity
              style={[styles.datePickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                playClickSound();
                setActivePicker('start');
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.datePickerLabel, { color: colors.textMuted }]}>From:</Text>
              <Text style={[styles.datePickerValue, { color: colors.text }]}>
                {formatDateShort(startDate)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.datePickerBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => {
                playClickSound();
                setActivePicker('end');
              }}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.datePickerLabel, { color: colors.textMuted }]}>To:</Text>
              <Text style={[styles.datePickerValue, { color: colors.text }]}>
                {formatDateShort(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Bar & Grouping Toggle Row */}
        <View style={styles.filterBarRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by doctor, patient or service..."
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Doctor-wise vs Patient-wise Toggle */}
          <View style={[styles.groupToggleGroup, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.groupToggleBtn,
                groupingMode === 'doctor' && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                playClickSound();
                setGroupingMode('doctor');
              }}
            >
              <Ionicons
                name="medical-outline"
                size={14}
                color={groupingMode === 'doctor' ? '#FFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.groupToggleText,
                  { color: groupingMode === 'doctor' ? '#FFF' : colors.textMuted },
                ]}
              >
                Doctor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.groupToggleBtn,
                groupingMode === 'patient' && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                playClickSound();
                setGroupingMode('patient');
              }}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={groupingMode === 'patient' ? '#FFF' : colors.textMuted}
              />
              <Text
                style={[
                  styles.groupToggleText,
                  { color: groupingMode === 'patient' ? '#FFF' : colors.textMuted },
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Grouped List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {groupedData.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Appointments Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Try adjusting your date range, search query, or grouping filter.
            </Text>
          </View>
        ) : (
          groupedData.map((group, gIdx) => {
            const pat = groupingMode === 'patient'
              ? patients.find((p) => p.name.toLowerCase() === group.title.toLowerCase() || p.mobile === group.subtitle)
              : null;
            const patPriority = pat ? (pat.priority || calculatePatientPriority(pat.rescheduleCount || 0)) : null;
            const priorityColor = patPriority === 'High' ? '#10B981' : patPriority === 'Medium' ? '#F59E0B' : patPriority === 'Low' ? '#EF4444' : null;

            return (
              <View
                key={gIdx}
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: priorityColor ? priorityColor + '40' : colors.border,
                    borderLeftWidth: priorityColor ? 5 : 1,
                    borderLeftColor: priorityColor || colors.border,
                  },
                ]}
              >
                {/* Group Header */}
                <View style={[styles.groupHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groupTitle, { color: colors.text }]}>{group.title}</Text>
                    <Text style={[styles.groupSub, { color: colors.textMuted }]}>{group.subtitle}</Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.countBadgeText}>{group.items.length} Visit{group.items.length > 1 ? 's' : ''}</Text>
                  </View>
                </View>

                {/* Group Appointments List */}
                <View style={styles.groupApptsList}>
                  {group.items.map((appt) => (
                    <TouchableOpacity
                      key={appt.id}
                      style={[styles.apptRowItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        playClickSound();
                        setSelectedAppt(appt);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.timeCol}>
                        <Text style={[styles.timeText, { color: colors.primary }]}>{formatTime(appt.startTime)}</Text>
                        <Text style={[styles.dateSubText, { color: colors.textMuted }]}>{formatDateShort(appt.date)}</Text>
                      </View>

                      <View style={{ flex: 1, paddingHorizontal: 10 }}>
                        <Text style={[styles.patientNameText, { color: colors.text }]} numberOfLines={1}>
                          {groupingMode === 'doctor' ? appt.patientName : `${appt.doctorName}`}
                        </Text>
                        <Text style={[styles.serviceTypeText, { color: colors.textMuted }]}>
                          {appt.serviceType} • {appt.appointmentType} {appt.isPackage ? '[Pkg.]' : ''}
                        </Text>
                        {appt.originalSchedule ? (
                          <View style={styles.rescheduledBadgeRow}>
                            <Ionicons name="swap-horizontal-outline" size={12} color="#D97706" />
                            <Text style={styles.rescheduledBadgeText}>Rescheduled from {formatDateShort(appt.originalSchedule.date)}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.statusCol}>
                        <StatusChip status={appt.status} date={appt.date} />
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginTop: 4 }} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Appointment Detail Bottom Sheet Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onOpenEnrollmentTimeline={(enrollmentId) => {
          setSelectedAppt(null);
          setSelectedEnrollmentId(enrollmentId);
        }}
      />

      {/* Package Enrollment Detail Sheet (ERP Timeline) */}
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

      {/* Session Appointment Detail Modal — opened from ERP timeline, redundant package link hidden */}
      <AppointmentDetailModal
        visible={!!selectedSessionAppt}
        appointment={selectedSessionAppt}
        onClose={() => setSelectedSessionAppt(null)}
        hidePackageTimelineLink
      />

      {/* Interactive Date Picker Modal for Custom Range */}
      <Modal
        visible={!!activePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.calendarBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setPickerMonth((m) => offsetMonth(m, -1))} hitSlop={8}>
                  <Ionicons name="chevron-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.calendarMonthTitle, { color: colors.text }]}>
                  {formatMonthYear(pickerMonth)} ({activePicker === 'start' ? 'Start Date' : 'End Date'})
                </Text>
                <TouchableOpacity onPress={() => setPickerMonth((m) => offsetMonth(m, 1))} hitSlop={8}>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarWeekHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={[styles.calendarWeekText, { color: colors.textMuted }]}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {monthGridCells.map((cell) => {
                  const isSelected = activePicker === 'start' ? cell.date === startDate : cell.date === endDate;
                  return (
                    <TouchableOpacity
                      key={cell.date}
                      style={[
                        styles.calendarCell,
                        isSelected && { backgroundColor: colors.primary, borderRadius: 8 },
                        !cell.isCurrentMonth && { opacity: 0.3 },
                      ]}
                      onPress={() => {
                        playClickSound();
                        if (activePicker === 'start') {
                          setStartDate(cell.date);
                          if (cell.date > endDate) setEndDate(cell.date);
                        } else {
                          setEndDate(cell.date);
                          if (cell.date < startDate) setStartDate(cell.date);
                        }
                        setActivePicker(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.calendarCellText,
                          { color: cell.isCurrentMonth ? colors.text : colors.textMuted },
                          isSelected && { color: '#FFF', fontWeight: '700' },
                        ]}
                      >
                        {cell.dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.calendarCloseBtn, { backgroundColor: colors.surface }]}
                onPress={() => setActivePicker(null)}
              >
                <Text style={[styles.calendarCloseText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
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
    fontSize: 20,
    fontWeight: '700',
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rangePillsRow: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  datePickerLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  datePickerValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
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
  groupToggleGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  groupToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  groupToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  groupSub: {
    fontSize: 12,
    marginTop: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  groupApptsList: {},
  apptRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timeCol: {
    width: 76,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  patientNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceTypeText: {
    fontSize: 12,
    marginTop: 2,
  },
  rescheduledBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rescheduledBadgeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  statusCol: {
    alignItems: 'flex-end',
  },

  // Modal
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarMonthTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  calendarCellText: {
    fontSize: 13,
    fontWeight: '500',
  },
  calendarCloseBtn: {
    marginTop: 14,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCloseText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
