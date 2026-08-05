import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import MonthGrid from '../components/calendar/MonthGrid';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import PackageEnrollmentDetailSheet from '../components/package/PackageEnrollmentDetailSheet';
import RescheduleModal from '../components/calendar/RescheduleModal';
import CreateAppointmentSheet, { InitialData } from '../components/appointment/CreateAppointmentSheet';
import StatusChip from '../components/shared/StatusChip';
import useAppointmentStore from '../store/useAppointmentStore';
import useUIStore from '../store/useUIStore';
import useDoctorStore from '../store/useDoctorStore';
import { todayISO, offsetDate, offsetMonth, getWeekDates, formatTime } from '../utils/dateUtils';
import { useTheme } from '../theme/ThemeContext';
import { Appointment } from '../types';
import { playClickSound } from '../utils/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../utils/useRefresh';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { refreshing, onRefresh } = useRefresh();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  const weekDates = getWeekDates(selectedDate);

  const calendarView = useUIStore((s) => s.calendarView);
  const setCalendarView = useUIStore((s) => s.setCalendarView);
  const activeCenterId = useUIStore((s) => s.activeCenterId);

  const activeStatusFilters = useUIStore((s) => s.activeStatusFilters);
  const toggleStatusFilter = useUIStore((s) => s.toggleStatusFilter);
  const activeDoctorFilter = useUIStore((s) => s.activeDoctorFilter);

  const appointments = useAppointmentStore((s) => s.appointments);
  const doctors = useDoctorStore((s) => s.doctors);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [createData, setCreateData] = useState<InitialData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [rescheduleTargetAppt, setRescheduleTargetAppt] = useState<Appointment | null>(null);
  const [selectedSessionAppt, setSelectedSessionAppt] = useState<Appointment | null>(null);

  const handleDateChange = (directionOrIso: number | string) => {
    if (typeof directionOrIso === 'number') {
      if (directionOrIso === 0) {
        setSelectedDate(todayISO());
      } else if (calendarView === 'month') {
        setSelectedDate((prev) => offsetMonth(prev, directionOrIso));
      } else if (calendarView === 'week') {
        setSelectedDate((prev) => offsetDate(prev, directionOrIso * 7));
      } else {
        setSelectedDate((prev) => offsetDate(prev, directionOrIso * 1));
      }
    } else if (typeof directionOrIso === 'string') {
      setSelectedDate(directionOrIso);
    }
  };

  const handleSlotPress = (date: string, time: string) => {
    setCreateData({ date, time });
    setShowCreate(true);
  };

  const handleAppointmentPress = (appt: Appointment) => {
    setSelectedAppt(appt);
  };

  const handleMonthDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setCalendarView('day');
  };

  const handleOutMonthChange = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // Filtered appointments by active center, doctor filter & status filters
  const filteredAppointments = appointments.filter((a) => {
    if (a.centerId && a.centerId !== activeCenterId) return false;
    if (activeDoctorFilter && a.doctorId !== activeDoctorFilter) return false;
    if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(a.status)) return false;
    return true;
  });

  const selectedDateAppts = filteredAppointments.filter((a) => a.date === selectedDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Calendar Header with View toggles, date nav, filter chips & List/Grid toggle */}
      <CalendarHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        weekDates={weekDates}
        calendarView={calendarView}
        onViewChange={setCalendarView}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        activeFilters={activeStatusFilters}
        onFilterToggle={toggleStatusFilter}
      />

      {/* Main Content Area */}
      {displayMode === 'list' ? (
        /* List Mode View (view-only list, no drag-drop) */
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContent}
          refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              Schedule List ({selectedDateAppts.length})
            </Text>
          </View>

          {selectedDateAppts.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No appointments for this date in list view.
              </Text>
            </View>
          ) : (
            selectedDateAppts.map((appt) => (
              <TouchableOpacity
                key={appt.id}
                style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  playClickSound();
                  setSelectedAppt(appt);
                }}
              >
                <View style={styles.apptTimeCol}>
                  <Text style={[styles.timeText, { color: colors.primary }]}>{formatTime(appt.startTime)}</Text>
                  <Text style={[styles.durationText, { color: colors.textMuted }]}>30 mins</Text>
                </View>

                <View style={styles.apptInfoCol}>
                  <Text style={[styles.patientName, { color: colors.text }]}>{appt.patientName}</Text>
                  <Text style={[styles.apptMeta, { color: colors.textMuted }]}>
                    {appt.serviceType} • {appt.doctorName}
                  </Text>
                </View>

                <StatusChip status={appt.status} date={appt.date} small />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : calendarView === 'month' ? (
        /* Month Grid Matrix */
        <MonthGrid
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          onSelectDate={handleMonthDateSelect}
          onMonthChange={handleOutMonthChange}
        />
      ) : (
        /* Interactive Day/Week Grid with Drag and Drop & Red Unavailable Overlays */
        <CalendarGrid
          selectedDate={selectedDate}
          weekDates={weekDates}
          viewMode={calendarView}
          appointments={filteredAppointments}
          doctors={doctors}
          centerId={activeCenterId}
          onSlotPress={handleSlotPress}
          onAppointmentPress={handleAppointmentPress}
          onDateSelect={handleMonthDateSelect}
        />
      )}

      {/* Detail Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
        onOpenEnrollmentTimeline={(enrollmentId) => {
          setSelectedAppt(null);
          setSelectedEnrollmentId(enrollmentId);
        }}
      />

      {/* Package Enrollment Detail Sheet */}
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

      {/* Create Appointment Modal */}
      <CreateAppointmentSheet
        visible={showCreate}
        initialData={createData || undefined}
        onClose={() => {
          setShowCreate(false);
          setCreateData(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  emptyText: { fontSize: 13 },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  apptTimeCol: { width: 68, alignItems: 'flex-start' },
  timeText: { fontSize: 13, fontWeight: '700' },
  durationText: { fontSize: 10, marginTop: 2 },
  apptInfoCol: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700' },
  apptMeta: { fontSize: 12, marginTop: 2 },
});
