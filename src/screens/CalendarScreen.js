import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import MonthGrid from '../components/calendar/MonthGrid';
import AppointmentDetailModal from '../components/calendar/AppointmentDetailModal';
import CreateAppointmentSheet from '../components/appointment/CreateAppointmentSheet';
import useAppointmentStore from '../store/useAppointmentStore';
import useUIStore from '../store/useUIStore';
import useDoctorStore from '../store/useDoctorStore';
import { todayISO, offsetDate, offsetMonth, getWeekDates } from '../utils/dateUtils';
import { useTheme } from '../theme/ThemeContext';

export default function CalendarScreen() {
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const weekDates = getWeekDates(selectedDate);

  const calendarView = useUIStore((s) => s.calendarView);
  const setCalendarView = useUIStore((s) => s.setCalendarView);

  const activeStatusFilters = useUIStore((s) => s.activeStatusFilters);
  const toggleStatusFilter = useUIStore((s) => s.toggleStatusFilter);

  const activeDoctorFilter = useUIStore((s) => s.activeDoctorFilter);
  const setDoctorFilter = useUIStore((s) => s.setDoctorFilter);

  const doctors = useDoctorStore((s) => s.doctors);
  const appointments = useAppointmentStore((s) => s.appointments);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [createData, setCreateData] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDateChange = (directionOrIso) => {
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

  const handleSlotPress = (date, time) => {
    setCreateData({ date, time });
    setShowCreate(true);
  };

  const handleAppointmentPress = (appt) => {
    setSelectedAppt(appt);
  };

  const handleMonthDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    // Switch to Day View on date selection for direct slot inspection
    setCalendarView('day');
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    if (activeDoctorFilter && a.doctorId !== activeDoctorFilter) return false;
    if (activeStatusFilters.length > 0 && !activeStatusFilters.includes(a.status)) return false;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Calendar Header with View toggles, date nav, filter chips */}
      <CalendarHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        weekDates={weekDates}
        calendarView={calendarView}
        onViewChange={setCalendarView}
        activeFilters={activeStatusFilters}
        onFilterToggle={toggleStatusFilter}
        selectedDoctor={activeDoctorFilter}
        doctors={doctors}
        onDoctorChange={setDoctorFilter}
      />

      {/* Main Interactive Grid View (Day / Week / Month) */}
      {calendarView === 'month' ? (
        <MonthGrid
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          onSelectDate={handleMonthDateSelect}
        />
      ) : (
        <CalendarGrid
          selectedDate={selectedDate}
          weekDates={weekDates}
          viewMode={calendarView}
          appointments={filteredAppointments}
          onSlotPress={handleSlotPress}
          onAppointmentPress={handleAppointmentPress}
        />
      )}

      {/* Detail Modal */}
      <AppointmentDetailModal
        visible={!!selectedAppt}
        appointment={selectedAppt}
        onClose={() => setSelectedAppt(null)}
      />

      {/* Create Appointment Modal */}
      <CreateAppointmentSheet
        visible={showCreate}
        initialData={createData}
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
});
