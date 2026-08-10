import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import useAppointmentStore from '../store/useAppointmentStore';
import usePatientStore, { calculatePatientPriority } from '../store/usePatientStore';
import useDoctorStore from '../store/useDoctorStore';
import usePackageStore from '../store/usePackageStore';
import useUIStore from '../store/useUIStore';
import { todayISO, getWeekDates } from '../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../constants';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import { useRefresh } from '../utils/useRefresh';
import { playClickSound } from '../utils/feedback';
import ReportsScreenSkeleton from '../components/skeletons/ReportsScreenSkeleton';

import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { usePatientsQuery } from '../hooks/queries/usePatientsQuery';
import { useDoctorsQuery } from '../hooks/queries/useDoctorsQuery';
import { usePackagesQuery, useEnrollmentsQuery } from '../hooks/queries/usePackagesQuery';

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();

  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: patients = [] } = usePatientsQuery();
  const { data: doctors = [] } = useDoctorsQuery();
  const { data: enrollments = [] } = useEnrollmentsQuery();
  const { data: packages = [] } = usePackagesQuery();
  const activeCenterId = useUIStore((s) => s.activeCenterId);

  const [period, setPeriod] = useState<TimePeriod>('month');

  const today = todayISO();

  // Helper date calculations using local timezone without UTC shifts
  const { startOfWeek, endOfWeek, currentMonthPrefix, currentYearPrefix } = useMemo(() => {
    const weekDates = getWeekDates(today);
    const sorted = [...weekDates].sort();
    return {
      startOfWeek: sorted[0],
      endOfWeek: sorted[sorted.length - 1],
      currentMonthPrefix: today.substring(0, 7), // "YYYY-MM"
      currentYearPrefix: today.substring(0, 4),  // "YYYY"
    };
  }, [today]);

  // Filter appointments based on center and selected period
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.centerId && appt.centerId !== activeCenterId) return false;
      if (period === 'week') {
        return appt.date >= startOfWeek && appt.date <= endOfWeek;
      }
      if (period === 'month') {
        return appt.date.startsWith(currentMonthPrefix);
      }
      if (period === 'year') {
        return appt.date.startsWith(currentYearPrefix);
      }
      return true;
    });
  }, [appointments, activeCenterId, period, startOfWeek, endOfWeek, currentMonthPrefix, currentYearPrefix]);

  // Metric 1: KPI Totals
  const kpiData = useMemo(() => {
    const totalAppts = filteredAppointments.length;
    const totalPatients = patients.length;
    const activeEnrollments = enrollments.filter((e) => e.status === 'Active').length;

    const confirmedOrPaid = filteredAppointments.filter(
      (a) => a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.PAID || a.status === APPOINTMENT_STATUS.SCHEDULED
    );
    const apptRevenue = confirmedOrPaid.reduce((sum, a) => sum + (a.prePaymentAmount || 0), 0);
    const packageRevenue = packages.reduce((sum, p) => sum + (p.price || 0), 0);
    const estimatedRevenue = apptRevenue + (period === 'all' ? packageRevenue : Math.round(packageRevenue / 3));

    return {
      totalAppts,
      totalPatients,
      activeEnrollments,
      estimatedRevenue,
    };
  }, [filteredAppointments, patients, enrollments, packages, period]);

  // Metric 2: Appointment Status Breakdown
  const statusBreakdown = useMemo(() => {
    const counts = {
      Confirmed: 0,
      Scheduled: 0,
      Paid: 0,
      Pending: 0,
      Cancelled: 0,
      Rescheduled: 0,
    };

    filteredAppointments.forEach((a) => {
      if (a.status === APPOINTMENT_STATUS.CONFIRMED) counts.Confirmed++;
      else if (a.status === APPOINTMENT_STATUS.SCHEDULED) counts.Scheduled++;
      else if (a.status === APPOINTMENT_STATUS.PAID) counts.Paid++;
      else if (a.status === APPOINTMENT_STATUS.PENDING) counts.Pending++;
      else if (a.status === APPOINTMENT_STATUS.CANCELLED) counts.Cancelled++;
      else if (a.status === APPOINTMENT_STATUS.RESCHEDULED) counts.Rescheduled++;
    });

    const total = filteredAppointments.length || 1;
    return [
      { key: 'Confirmed', count: counts.Confirmed, pct: Math.round((counts.Confirmed / total) * 100), color: colors.success },
      { key: 'Scheduled', count: counts.Scheduled, pct: Math.round((counts.Scheduled / total) * 100), color: colors.primary },
      { key: 'Paid', count: counts.Paid, pct: Math.round((counts.Paid / total) * 100), color: colors.purple },
      { key: 'Pending', count: counts.Pending, pct: Math.round((counts.Pending / total) * 100), color: colors.warning },
      { key: 'Cancelled', count: counts.Cancelled, pct: Math.round((counts.Cancelled / total) * 100), color: colors.danger },
      { key: 'Rescheduled', count: counts.Rescheduled, pct: Math.round((counts.Rescheduled / total) * 100), color: colors.cyan },
    ];
  }, [filteredAppointments, colors]);

  // Metric 3: Service Type Distribution
  const serviceDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAppointments.forEach((a) => {
      const type = a.serviceType || 'General';
      map[type] = (map[type] || 0) + 1;
    });

    const colorPalette = [
      colors.primary,
      colors.purple,
      colors.cyan,
      colors.success,
      colors.warning,
      colors.danger,
    ];

    const entries = Object.entries(map).map(([name, count], index) => ({
      name,
      count,
      color: colorPalette[index % colorPalette.length],
    }));

    entries.sort((a, b) => b.count - a.count);
    const total = entries.reduce((s, e) => s + e.count, 0) || 1;

    return { entries, total };
  }, [filteredAppointments, colors]);

  // Metric 4: Daily Activity Heatmap (Mon-Sun for current week)
  const weeklyHeatmap = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    const weekAppts = appointments.filter(
      (a) => (!a.centerId || a.centerId === activeCenterId) && a.date >= startOfWeek && a.date <= endOfWeek
    );

    weekAppts.forEach((a) => {
      const d = new Date(a.date);
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
      counts[dayIdx]++;
    });

    const maxCount = Math.max(...counts, 1);
    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      heightPct: (counts[idx] / maxCount) * 100,
      isClosed: day === 'Thu', // Thursday Closed as per Architecture
      isToday: idx === (new Date().getDay() + 6) % 7,
    }));
  }, [appointments, activeCenterId, startOfWeek, endOfWeek]);

  // Metric 5: Doctor Performance
  const doctorPerformance = useMemo(() => {
    return doctors.map((doc) => {
      const docAppts = filteredAppointments.filter((a) => a.doctorId === doc.id);
      const total = docAppts.length;
      const confirmed = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.SCHEDULED).length;
      const paid = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;
      const cancelled = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length;
      const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

      return {
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        total,
        confirmed,
        paid,
        cancelRate,
      };
    }).sort((a, b) => b.total - a.total);
  }, [doctors, filteredAppointments]);

  // Metric 6: Enrollment Lifecycle Summary
  const enrollmentSummary = useMemo(() => {
    const statuses = ['Active', 'Completed', 'Paused', 'Cancelled'] as const;
    return statuses.map((st) => {
      const list = enrollments.filter((e) => e.status === st);
      const totalSessions = list.reduce((s, e) => s + e.totalSessions, 0);
      const completedSessions = list.reduce((s, e) => s + e.completedSessions, 0);
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

      return {
        status: st,
        count: list.length,
        totalSessions,
        completedSessions,
        completionRate,
      };
    });
  }, [enrollments]);

  // Metric 7: Acquisition Source Breakdown
  const acquisitionSources = useMemo(() => {
    const map: Record<string, number> = {};
    patients.forEach((p) => {
      const src = p.enquirySource || 'Walk-in';
      map[src] = (map[src] || 0) + 1;
    });

    const entries = Object.entries(map).map(([source, count]) => ({
      source,
      count,
    })).sort((a, b) => b.count - a.count);

    const max = Math.max(...entries.map((e) => e.count), 1);
    return entries.map((e) => ({
      ...e,
      pctOfMax: (e.count / max) * 100,
    }));
  }, [patients]);

  // Metric 8: Patient Priority Distribution
  const priorityDistribution = useMemo(() => {
    let high = 0;
    let med = 0;
    let low = 0;

    patients.forEach((p) => {
      const prio = p.priority || calculatePatientPriority(p.rescheduleCount || 0);
      if (prio === 'High') high++;
      else if (prio === 'Medium') med++;
      else low++;
    });

    const total = patients.length || 1;
    return [
      { label: 'High Priority', count: high, pct: Math.round((high / total) * 100), color: '#10B981' },
      { label: 'Medium Priority', count: med, pct: Math.round((med / total) * 100), color: '#F59E0B' },
      { label: 'Low Priority', count: low, pct: Math.round((low / total) * 100), color: '#EF4444' },
    ];
  }, [patients]);

  const isLoading = refreshing;

  if (isLoading) {
    return <ReportsScreenSkeleton />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Row */}
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Clinical performance & operational intelligence
        </Text>

        {/* Time Period Selector — Prominent Dedicated Row */}
        <View style={[styles.periodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                period === p && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                playClickSound();
                setPeriod(p);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodText,
                  { color: period === p ? '#FFF' : colors.textMuted, fontWeight: period === p ? '700' : '500' },
                ]}
              >
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === 'year' ? 'Year' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section 1: KPI Summary Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.kpiRow}
      >
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.kpiValue, { color: colors.primary }]}>{kpiData.totalAppts}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Appts</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.success }]}>
          <Ionicons name="people-outline" size={20} color={colors.success} />
          <Text style={[styles.kpiValue, { color: colors.success }]}>{kpiData.totalPatients}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Patients</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.purple }]}>
          <Ionicons name="layers-outline" size={20} color={colors.purple} />
          <Text style={[styles.kpiValue, { color: colors.purple }]}>{kpiData.activeEnrollments}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Active Packages</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.warning }]}>
          <Ionicons name="wallet-outline" size={20} color={colors.warning} />
          <Text style={[styles.kpiValue, { color: colors.warning }]}>₹{kpiData.estimatedRevenue.toLocaleString()}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Est. Revenue</Text>
        </View>
      </ScrollView>

      {/* Section 2: Appointment Status Breakdown */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appointment Status Distribution</Text>
        </View>

        {/* Multi-segment Segmented Bar */}
        <View style={[styles.segmentedBarContainer, { backgroundColor: colors.surface }]}>
          {statusBreakdown.map((item) =>
            item.pct > 0 ? (
              <View
                key={item.key}
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                  height: '100%',
                }}
              />
            ) : null
          )}
        </View>

        {/* Status Legend Row */}
        <View style={styles.legendGrid}>
          {statusBreakdown.map((item) => (
            <View key={item.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>
                {item.key}: <Text style={{ fontWeight: '700' }}>{item.count}</Text> ({item.pct}%)
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Section 3: Service Type Distribution (Dedicated Full Row) */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="medical-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Service Type Distribution</Text>
        </View>

        <View style={styles.servicesRowContainer}>
          <View style={styles.donutContainer}>
            <Svg height={140} width={140} viewBox="0 0 100 100">
              <G rotation="-90" origin="50, 50">
                {(() => {
                  let cumulativePercent = 0;
                  return serviceDistribution.entries.map((item) => {
                    const pct = item.count / serviceDistribution.total;
                    const strokeDasharray = `${pct * 251.2} ${251.2}`;
                    const strokeDashoffset = -cumulativePercent * 251.2;
                    cumulativePercent += pct;
                    return (
                      <Circle
                        key={item.name}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={item.color}
                        strokeWidth="16"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </G>
            </Svg>
            <View style={styles.donutCenterLabel}>
              <Text style={[styles.donutCenterNum, { color: colors.text }]}>{serviceDistribution.total}</Text>
              <Text style={[styles.donutCenterSub, { color: colors.textMuted }]}>Sessions</Text>
            </View>
          </View>

          {/* Service Legend List */}
          <View style={styles.fullServiceLegend}>
            {serviceDistribution.entries.map((item) => (
              <View key={item.name} style={styles.donutLegendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.donutLegendLabel, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{item.count}</Text>
                <Text style={[styles.donutLegendPct, { color: colors.textMuted }]}>
                  ({Math.round((item.count / serviceDistribution.total) * 100)}%)
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Section 4: Daily Activity Heatmap / Weekly Load (Dedicated Full Row) */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Weekly Session Load (Mon – Sun)</Text>
        </View>

        <View style={styles.weeklyChartBox}>
          {weeklyHeatmap.map((bar) => (
            <View key={bar.day} style={styles.barCol}>
              <Text style={[styles.barValText, { color: colors.textMuted }]}>{bar.count}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                {bar.isClosed ? (
                  <View style={[styles.closedBarFill, { backgroundColor: colors.border }]} />
                ) : (
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${Math.max(bar.heightPct, 12)}%`,
                        backgroundColor: bar.isToday ? colors.primary : colors.purple,
                      },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.barDayText,
                  { color: bar.isToday ? colors.primary : colors.textMuted, fontWeight: bar.isToday ? '700' : '500' },
                ]}
              >
                {bar.day}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Section 5: Doctor Performance Table */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Doctor Workload & Performance</Text>
        </View>

        <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.thCell, { flex: 2, color: colors.textMuted }]}>Doctor</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>Appts</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>Conf</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>Paid</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'right', color: colors.textMuted }]}>Cancel %</Text>
        </View>

        {doctorPerformance.map((doc, idx) => (
          <View
            key={doc.id}
            style={[
              styles.tableRow,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: idx === doctorPerformance.length - 1 ? 0 : 1,
              },
              idx % 2 === 1 && { backgroundColor: colors.surface + '60' },
            ]}
          >
            <View style={{ flex: 2 }}>
              <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>
                {doc.name}
              </Text>
              <Text style={[styles.docSpec, { color: colors.textMuted }]} numberOfLines={1}>
                {doc.specialty}
              </Text>
            </View>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.text, fontWeight: '700' }]}>
              {doc.total}
            </Text>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.primary }]}>
              {doc.confirmed}
            </Text>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.success }]}>
              {doc.paid}
            </Text>
            <Text
              style={[
                styles.tdCell,
                {
                  flex: 1,
                  textAlign: 'right',
                  color: doc.cancelRate > 20 ? colors.danger : colors.textMuted,
                  fontWeight: doc.cancelRate > 20 ? '700' : '400',
                },
              ]}
            >
              {doc.cancelRate}%
            </Text>
          </View>
        ))}
      </View>

      {/* Section 6: Package Enrollment Lifecycle */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="cube-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Package Enrollments Lifecycle</Text>
        </View>

        <View style={styles.enrollmentGrid}>
          {enrollmentSummary.map((item) => (
            <View
              key={item.status}
              style={[
                styles.enrollmentCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.enrollmentStatus, { color: colors.text }]}>{item.status}</Text>
              <Text style={[styles.enrollmentCount, { color: colors.primary }]}>{item.count} packs</Text>
              <View style={styles.enrollmentMeta}>
                <Text style={[styles.enrollmentSub, { color: colors.textMuted }]}>
                  {item.completedSessions}/{item.totalSessions} sessions ({item.completionRate}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Dual Row (Patient Acquisition & Priority) */}
      <View style={styles.dualCardRow}>
        {/* Section 7: Acquisition Source */}
        <View style={[styles.card, styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="compass-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Enquiry Source</Text>
          </View>

          <View style={styles.sourceList}>
            {acquisitionSources.map((item) => (
              <View key={item.source} style={styles.sourceRow}>
                <Text style={[styles.sourceName, { color: colors.text }]} numberOfLines={1}>
                  {item.source}
                </Text>
                <View style={[styles.sourceBarTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.sourceBarFill,
                      { width: `${item.pctOfMax}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.sourceCount, { color: colors.textMuted }]}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 8: Patient Priority Distribution */}
        <View style={[styles.card, styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Patient Priority</Text>
          </View>

          <View style={styles.prioList}>
            {priorityDistribution.map((item) => (
              <View key={item.label} style={styles.prioCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={[styles.prioLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[styles.prioVal, { color: item.color }]}>
                    {item.count} ({item.pct}%)
                  </Text>
                </View>
                <View style={[styles.prioTrack, { backgroundColor: colors.surface }]}>
                  <View style={[styles.prioFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  headerBlock: {
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  periodRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginTop: 4,
    gap: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontSize: 13,
  },
  kpiRow: {
    gap: 12,
    paddingRight: 16,
  },
  kpiCard: {
    width: 135,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    gap: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  segmentedBarContainer: {
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  servicesRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    width: 140,
    position: 'relative',
  },
  donutCenterLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  donutCenterSub: {
    fontSize: 10,
  },
  fullServiceLegend: {
    flex: 1,
    gap: 8,
  },
  donutLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donutLegendLabel: {
    flex: 1,
    fontSize: 12,
  },
  donutLegendVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  donutLegendPct: {
    fontSize: 11,
  },
  weeklyChartBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 11,
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 100,
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 9,
  },
  closedBarFill: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  barDayText: {
    fontSize: 12,
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tdCell: {
    fontSize: 12,
  },
  docName: {
    fontSize: 13,
    fontWeight: '600',
  },
  docSpec: {
    fontSize: 10,
    marginTop: 2,
  },
  enrollmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  enrollmentCard: {
    width: '48%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  enrollmentStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  enrollmentCount: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  enrollmentMeta: {
    marginTop: 4,
  },
  enrollmentSub: {
    fontSize: 10,
  },
  dualCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  sourceList: {
    gap: 10,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceName: {
    width: 55,
    fontSize: 11,
  },
  sourceBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sourceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sourceCount: {
    width: 16,
    fontSize: 11,
    textAlign: 'right',
  },
  prioList: {
    gap: 12,
  },
  prioCard: {
    gap: 2,
  },
  prioLabel: {
    fontSize: 11,
  },
  prioVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  prioTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  prioFill: {
    height: '100%',
    borderRadius: 4,
  },
});
