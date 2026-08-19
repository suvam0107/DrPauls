import React, { useState, useMemo } from 'react';
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
import {
  todayISO,
  offsetDate,
  offsetMonth,
  getWeekDates,
  formatTime,
  timeToMins,
  minsToTime,
  getMonthGrid,
  formatDateShort,
  formatMonthYear,
} from '../utils/dateUtils';
import { useTheme } from '../theme/ThemeContext';
import { Appointment } from '../types';
import { playClickSound } from '../utils/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useRefresh } from '../utils/useRefresh';
import CalendarScreenSkeleton from '../components/skeletons/CalendarScreenSkeleton';

import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { useDoctorsQuery } from '../hooks/queries/useDoctorsQuery';

import { useScrollNavbar } from '../hooks/useScrollNavbar';

export default function CalendarScreen() {
  const { colors } = useTheme();
  const { refreshing, onRefresh } = useRefresh();
  const { handleScroll } = useScrollNavbar();
  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: doctors = [] } = useDoctorsQuery();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  const weekDates = getWeekDates(selectedDate);

  const calendarView = useUIStore((s) => s.calendarView);
  const setCalendarView = useUIStore((s) => s.setCalendarView);
  const activeCenterId = useUIStore((s) => s.activeCenterId);

  const activeStatusFilters = useUIStore((s) => s.activeStatusFilters);
  const toggleStatusFilter = useUIStore((s) => s.toggleStatusFilter);
  const activeDoctorFilter = useUIStore((s) => s.activeDoctorFilter);

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
    if (activeStatusFilters.length > 0) {
      const todayStr = todayISO();

      const matchesFilter = activeStatusFilters.some((status) => {
        const isPastDate = a.date < todayStr;

        if (status === 'Pending') {
          return a.status === 'Pending' && !isPastDate;
        }
        if (status === 'Overdue') {
          return a.status === 'Overdue' || (a.status === 'Pending' && isPastDate);
        }
        if (status === 'Unattended') {
          return (
            a.status === 'Unattended' ||
            ((a.status === 'Scheduled' || a.status === 'Confirmed') && isPastDate)
          );
        }
        return a.status === status;
      });
      if (!matchesFilter) return false;
    }
    return true;
  });

  // Grouping computation for List Mode:
  // - Day: 1-hour time intervals (e.g. 10:00 AM – 11:00 AM)
  // - Week: Day-wise (e.g. Mon, 18 Aug)
  // - Month: Week-wise (e.g. Week 1, Week 2...)
  const { groups, totalCount, emptyMessage } = useMemo(() => {
    if (calendarView === 'day') {
      const dayAppts = filteredAppointments
        .filter((a) => a.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const hourMap = new Map<number, Appointment[]>();
      dayAppts.forEach((appt) => {
        const startMins = timeToMins(appt.startTime);
        const hour = Math.floor(startMins / 60);
        if (!hourMap.has(hour)) {
          hourMap.set(hour, []);
        }
        hourMap.get(hour)!.push(appt);
      });

      const sortedHours = Array.from(hourMap.keys()).sort((a, b) => a - b);
      const dayGroups = sortedHours.map((hour) => {
        const startStr = minsToTime(hour * 60);
        const endStr = minsToTime((hour + 1) * 60);
        const label = `${formatTime(startStr)} – ${formatTime(endStr)}`;
        return {
          key: `hour-${hour}`,
          label,
          appointments: hourMap.get(hour) || [],
        };
      });

      return {
        groups: dayGroups,
        totalCount: dayAppts.length,
        emptyMessage: `No appointments scheduled for ${formatDateShort(selectedDate)}.`,
      };
    }

    if (calendarView === 'week') {
      const weekAppts = filteredAppointments.filter((a) => weekDates.includes(a.date));

      const weekGroups: { key: string; label: string; appointments: Appointment[] }[] = [];
      weekDates.forEach((dateStr) => {
        const apptsForDate = weekAppts
          .filter((a) => a.date === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        if (apptsForDate.length > 0) {
          weekGroups.push({
            key: `day-${dateStr}`,
            label: formatDateShort(dateStr),
            appointments: apptsForDate,
          });
        }
      });

      return {
        groups: weekGroups,
        totalCount: weekAppts.length,
        emptyMessage: 'No appointments scheduled for this week.',
      };
    }

    // Month view: group week-wise (5 weeks in 7x5 matrix)
    const monthGrid = getMonthGrid(selectedDate);
    const monthAppts = filteredAppointments.filter((a) =>
      monthGrid.some((cell) => cell.date === a.date)
    );

    const monthGroups: { key: string; label: string; appointments: Appointment[] }[] = [];
    for (let w = 0; w < 5; w++) {
      const weekCells = monthGrid.slice(w * 7, (w + 1) * 7);
      const weekCellDates = weekCells.map((c) => c.date);
      const apptsForWeek = monthAppts
        .filter((a) => weekCellDates.includes(a.date))
        .sort((a, b) =>
          a.date === b.date
            ? a.startTime.localeCompare(b.startTime)
            : a.date.localeCompare(b.date)
        );

      if (apptsForWeek.length > 0) {
        const startStr = formatDateShort(weekCells[0].date);
        const endStr = formatDateShort(weekCells[6].date);
        monthGroups.push({
          key: `week-${w + 1}`,
          label: `Week ${w + 1} (${startStr} – ${endStr})`,
          appointments: apptsForWeek,
        });
      }
    }

    return {
      groups: monthGroups,
      totalCount: monthAppts.length,
      emptyMessage: `No appointments scheduled for ${formatMonthYear(selectedDate)}.`,
    };
  }, [calendarView, selectedDate, weekDates, filteredAppointments]);

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
        /* List Mode View with Dynamic Grouping (Day: Hourly, Week: Daily, Month: Weekly) */
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.listContent}
          refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {totalCount} {totalCount === 1 ? 'session' : 'sessions'}
            </Text>
          </View>

          {totalCount === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {emptyMessage}
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.key} style={styles.groupSection}>
                {/* Group Section Header */}
                <View style={styles.groupHeader}>
                  <View style={[styles.groupHeaderAccent, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.groupHeaderLabel, { color: colors.text }]}>
                    {group.label}
                  </Text>
                  <View style={[styles.groupBadge, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.groupBadgeText, { color: colors.primary }]}>
                      {group.appointments.length} {group.appointments.length === 1 ? 'session' : 'sessions'}
                    </Text>
                  </View>
                </View>

                {/* Appointment Cards within Group */}
                {group.appointments.map((appt) => (
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
                      {calendarView !== 'day' && (
                        <Text style={[styles.apptDateText, { color: colors.textMuted }]}>
                          {formatDateShort(appt.date)}
                        </Text>
                      )}
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
                ))}
              </View>
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
          refreshing={refreshing}
          onRefresh={onRefresh}
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

      {/* Session Appointment Detail Modal — opened from timeline, redundant package link hidden */}
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
  groupSection: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  groupHeaderAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  groupHeaderLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  groupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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
  apptTimeCol: { width: 72, alignItems: 'flex-start' },
  timeText: { fontSize: 13, fontWeight: '700' },
  apptDateText: { fontSize: 10, marginTop: 1, fontWeight: '500' },
  durationText: { fontSize: 10, marginTop: 2 },
  apptInfoCol: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700' },
  apptMeta: { fontSize: 12, marginTop: 2 },
});

