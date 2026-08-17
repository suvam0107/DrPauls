import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartesianChart, Bar, PolarChart, Pie } from 'victory-native';
import { matchFont, Line, vec } from '@shopify/react-native-skia';
import { useTheme } from '../theme/ThemeContext';
import useUIStore from '../store/useUIStore';
import { todayISO, getWeekDates } from '../utils/dateUtils';
import { APPOINTMENT_STATUS } from '../constants';
import AppRefreshControl from '../components/shared/AppRefreshControl';
import { useRefresh } from '../utils/useRefresh';
import { playClickSound } from '../utils/feedback';
import ReportsScreenSkeleton from '../components/skeletons/ReportsScreenSkeleton';
import { shareDetails } from '../utils/shareUtils';

import { useAppointmentsQuery } from '../hooks/queries/useAppointmentsQuery';
import { usePatientsQuery } from '../hooks/queries/usePatientsQuery';
import { useDoctorsQuery } from '../hooks/queries/useDoctorsQuery';
import { usePackagesQuery, useEnrollmentsQuery } from '../hooks/queries/usePackagesQuery';
import { useScrollNavbar } from '../hooks/useScrollNavbar';

export type TimePeriod = 'week' | 'month' | 'year' | 'all';

export interface ChartDetailItem {
  title: string;
  category: string;
  count: number;
  total: number;
  percentage: number;
  color: string;
  subtitle?: string;
  contextText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Month name constants
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// System fonts for Skia — resolved synchronously at module level
const AXIS_FONT = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: 'sans-serif' }),
  fontSize: 10,
  fontStyle: 'normal',
  fontWeight: 'normal',
});

const LABEL_FONT = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif', default: 'sans-serif' }),
  fontSize: 11,
  fontStyle: 'normal',
  fontWeight: 'bold',
});

export default function ReportsScreen() {
  const { colors, isDark } = useTheme();
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const insets = useSafeAreaInsets();
  const { refreshing, onRefresh } = useRefresh();
  const { handleScroll } = useScrollNavbar();

  const { data: appointments = [] } = useAppointmentsQuery();
  const { data: patients = [] } = usePatientsQuery();
  const { data: doctors = [] } = useDoctorsQuery();
  const { data: enrollments = [] } = useEnrollmentsQuery();
  const { data: packages = [] } = usePackagesQuery();

  const [period, setPeriod] = useState<TimePeriod>('month');

  const today = todayISO();

  // Grid line color — visible in both dark and light themes
  const gridColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';

  // Helper date calculations
  const { startOfWeek, endOfWeek, currentMonthPrefix, currentYearPrefix } = useMemo(() => {
    const weekDates = getWeekDates(today);
    const sorted = [...weekDates].sort();
    return {
      startOfWeek: sorted[0],
      endOfWeek: sorted[sorted.length - 1],
      currentMonthPrefix: today.substring(0, 7),
      currentYearPrefix: today.substring(0, 4),
    };
  }, [today]);

  // ── Period header label — human-readable range ──────────────────────────
  const periodLabel = useMemo(() => {
    if (period === 'week') {
      const s = new Date(startOfWeek + 'T00:00:00');
      const e = new Date(endOfWeek + 'T00:00:00');
      const fmtS = `${MONTH_SHORT[s.getMonth()]} ${s.getDate()}`;
      const fmtE = `${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
      return `${fmtS} – ${fmtE}`;
    }
    if (period === 'month') {
      const d = new Date(today + 'T00:00:00');
      return `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (period === 'year') return currentYearPrefix;
    // All time: span of years in data
    const centerAppts = appointments.filter((a) => !a.centerId || a.centerId === activeCenterId);
    if (centerAppts.length === 0) return 'All Time';
    const years = centerAppts.map((a) => a.date.substring(0, 4)).sort();
    const first = years[0];
    const last = years[years.length - 1];
    return first === last ? first : `${first} – ${last}`;
  }, [period, startOfWeek, endOfWeek, today, currentYearPrefix, appointments, activeCenterId]);

  // ── Filter appointments by period ───────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      if (appt.centerId && appt.centerId !== activeCenterId) return false;
      if (period === 'week') return appt.date >= startOfWeek && appt.date <= endOfWeek;
      if (period === 'month') return appt.date.startsWith(currentMonthPrefix);
      if (period === 'year') return appt.date.startsWith(currentYearPrefix);
      return true;
    });
  }, [appointments, activeCenterId, period, startOfWeek, endOfWeek, currentMonthPrefix, currentYearPrefix]);

  // ── Chart Data 1: Period-aware volume grouping ─────────────────────────
  const { chartData, chartLabels, chartDomain } = useMemo(() => {
    if (period === 'week') {
      const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const counts = [0, 0, 0, 0, 0, 0, 0];
      filteredAppointments.forEach((a) => {
        const d = new Date(a.date + 'T00:00:00');
        counts[(d.getDay() + 6) % 7]++;
      });
      const maxVal = Math.max(...counts, 1);
      return {
        chartData: DAY_LABELS.map((_, i) => ({ idx: i, count: counts[i] })),
        chartLabels: DAY_LABELS,
        chartDomain: { y: [0, Math.max(maxVal + 1, 3)] as [number, number] },
      };
    }

    if (period === 'month') {
      const counts: Record<string, number> = {};
      filteredAppointments.forEach((a) => { counts[a.date] = (counts[a.date] || 0) + 1; });
      const dates = Object.keys(counts).sort();
      if (dates.length === 0) return { chartData: [{ idx: 0, count: 0 }], chartLabels: ['—'], chartDomain: { y: [0, 4] as [number, number] } };
      const data = dates.map((d, i) => ({ idx: i, count: counts[d] }));
      const maxVal = Math.max(...data.map((d) => d.count), 1);
      return {
        chartData: data,
        chartLabels: dates.map((d) => d.substring(8)), // "DD"
        chartDomain: { y: [0, Math.max(maxVal + 1, 3)] as [number, number] },
      };
    }

    if (period === 'year') {
      const counts = new Array(12).fill(0);
      filteredAppointments.forEach((a) => {
        const m = parseInt(a.date.substring(5, 7), 10) - 1;
        counts[m]++;
      });
      const maxVal = Math.max(...counts, 1);
      return {
        chartData: MONTH_SHORT.map((_, i) => ({ idx: i, count: counts[i] })),
        chartLabels: MONTH_SHORT,
        chartDomain: { y: [0, Math.max(maxVal + 1, 3)] as [number, number] },
      };
    }

    // All time — group by year
    const counts: Record<string, number> = {};
    filteredAppointments.forEach((a) => {
      const y = a.date.substring(0, 4);
      counts[y] = (counts[y] || 0) + 1;
    });
    const years = Object.keys(counts).sort();
    if (years.length === 0) return { chartData: [{ idx: 0, count: 0 }], chartLabels: ['—'], chartDomain: { y: [0, 4] as [number, number] } };
    const data = years.map((y, i) => ({ idx: i, count: counts[y] }));
    const maxVal = Math.max(...data.map((d) => d.count), 1);
    return {
      chartData: data,
      chartLabels: years,
      chartDomain: { y: [0, Math.max(maxVal + 1, 3)] as [number, number] },
    };
  }, [filteredAppointments, period]);

  // Dynamic width for Volume chart if items exceed standard width (ample padding so end bars don't clip)
  const volumeChartWidth = useMemo(() => {
    const minWidthPerBar = 54;
    const baseWidth = SCREEN_WIDTH - 64;
    return Math.max(baseWidth, chartData.length * minWidthPerBar + 30);
  }, [chartData.length]);

  // ── KPI Totals ──────────────────────────────────────────────────────────
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
    return { totalAppts, totalPatients, activeEnrollments, estimatedRevenue };
  }, [filteredAppointments, patients, enrollments, packages, period]);

  const handleShareReport = () => {
    playClickSound();
    const summaryText = [
      `DR. PAUL'S CLINIC — OPERATIONAL REPORT (${periodLabel.toUpperCase()})`,
      `----------------------------------------`,
      `• Total Appointments: ${kpiData.totalAppts}`,
      `• Total Patients Registered: ${kpiData.totalPatients}`,
      `• Active Package Enrollments: ${kpiData.activeEnrollments}`,
      `• Estimated Revenue: ~ ₹${kpiData.estimatedRevenue.toLocaleString()} (Estimated)`,
      `• Generated On: ${new Date().toLocaleString()}`,
    ].join('\n');
    shareDetails(`Dr. Paul's Clinic Report — ${periodLabel}`, summaryText);
  };

  // ── Status breakdown (pie + legend) ────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts = { Confirmed: 0, Scheduled: 0, Paid: 0, Pending: 0, Cancelled: 0, Rescheduled: 0 };
    filteredAppointments.forEach((a) => {
      if (a.status === APPOINTMENT_STATUS.CONFIRMED) counts.Confirmed++;
      else if (a.status === APPOINTMENT_STATUS.SCHEDULED) counts.Scheduled++;
      else if (a.status === APPOINTMENT_STATUS.PAID) counts.Paid++;
      else if (a.status === APPOINTMENT_STATUS.PENDING) counts.Pending++;
      else if (a.status === APPOINTMENT_STATUS.CANCELLED) counts.Cancelled++;
      else if (a.status === APPOINTMENT_STATUS.RESCHEDULED) counts.Rescheduled++;
    });
    const total = filteredAppointments.length || 1;
    const items = [
      { label: 'Confirmed', count: counts.Confirmed, value: counts.Confirmed, color: colors.success },
      { label: 'Scheduled', count: counts.Scheduled, value: counts.Scheduled, color: colors.primary },
      { label: 'Paid', count: counts.Paid, value: counts.Paid, color: colors.purple },
      { label: 'Pending', count: counts.Pending, value: counts.Pending, color: colors.warning },
      { label: 'Cancelled', count: counts.Cancelled, value: counts.Cancelled, color: colors.danger },
      { label: 'Rescheduled', count: counts.Rescheduled, value: counts.Rescheduled, color: colors.cyan },
    ];
    return items.map((item) => ({ ...item, pct: Math.round((item.count / total) * 100) }));
  }, [filteredAppointments, colors]);

  const activeStatusPieData = useMemo(() => {
    const filtered = statusBreakdown.filter((s) => s.value > 0);
    if (filtered.length === 0) return [{ label: 'Empty', value: 1, color: colors.border, count: 0, pct: 0 }];
    return filtered;
  }, [statusBreakdown, colors]);

  // ── Service type distribution ───────────────────────────────────────────
  const serviceDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAppointments.forEach((a) => {
      const type = a.serviceType || 'General';
      map[type] = (map[type] || 0) + 1;
    });
    const colorPalette = [colors.primary, colors.purple, colors.cyan, colors.success, colors.warning, colors.danger];
    const entries = Object.entries(map)
      .map(([name, count], index) => ({ name, label: name, count, value: count, color: colorPalette[index % colorPalette.length] }))
      .sort((a, b) => b.count - a.count);
    const total = entries.reduce((s, e) => s + e.count, 0) || 1;
    return { entries, total };
  }, [filteredAppointments, colors]);

  const activeServicePieData = useMemo(() => {
    if (serviceDistribution.entries.length === 0) return [{ name: 'None', label: 'None', count: 0, value: 1, color: colors.border }];
    return serviceDistribution.entries;
  }, [serviceDistribution, colors]);

  // ── Doctor performance ──────────────────────────────────────────────────
  const doctorPerformance = useMemo(() => {
    return doctors.map((doc) => {
      const docAppts = filteredAppointments.filter((a) => a.doctorId === doc.id);
      const total = docAppts.length;
      const confirmed = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.CONFIRMED || a.status === APPOINTMENT_STATUS.SCHEDULED).length;
      const paid = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.PAID).length;
      const cancelled = docAppts.filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED).length;
      const cancelRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
      return { id: doc.id, name: doc.name, specialty: doc.specialty, total, confirmed, paid, cancelRate };
    }).sort((a, b) => b.total - a.total);
  }, [doctors, filteredAppointments]);

  // ── Enrollment lifecycle ────────────────────────────────────────────────
  const enrollmentSummary = useMemo(() => {
    const statuses = ['Active', 'Completed', 'Paused', 'Cancelled'] as const;
    const statusColors = { Active: colors.primary, Completed: colors.success, Paused: colors.warning, Cancelled: colors.danger };
    return statuses.map((st) => {
      const list = enrollments.filter((e) => e.status === st);
      const totalSessions = list.reduce((s, e) => s + e.totalSessions, 0);
      const completedSessions = list.reduce((s, e) => s + e.completedSessions, 0);
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
      return { status: st, label: st, count: list.length, value: list.length, color: statusColors[st], totalSessions, completedSessions, completionRate };
    });
  }, [enrollments, colors]);

  const activeEnrollmentPieData = useMemo(() => {
    const filtered = enrollmentSummary.filter((e) => e.value > 0);
    if (filtered.length === 0) {
      return [{ label: 'Active' as const, value: 1, color: colors.border, count: 0, status: 'Active' as const, totalSessions: 0, completedSessions: 0, completionRate: 0 }];
    }
    return filtered;
  }, [enrollmentSummary, colors]);

  // ── Acquisition sources ─────────────────────────────────────────────────
  const { acquisitionChartData, acquisitionLabels, acquisitionDomain } = useMemo(() => {
    const map: Record<string, number> = {};
    patients.forEach((p) => {
      const src = p.enquirySource || 'Walk-in';
      map[src] = (map[src] || 0) + 1;
    });
    const entries = Object.entries(map)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
    if (entries.length === 0) {
      return { acquisitionChartData: [{ idx: 0, count: 0 }], acquisitionLabels: ['—'], acquisitionDomain: { y: [0, 4] as [number, number] } };
    }
    const data = entries.map((e, i) => ({ idx: i, count: e.count }));
    const maxVal = Math.max(...data.map((d) => d.count), 1);
    return {
      acquisitionChartData: data,
      acquisitionLabels: entries.map((e) => e.source),
      acquisitionDomain: { y: [0, Math.max(maxVal + 1, 3)] as [number, number] },
    };
  }, [patients]);

  const acquisitionChartWidth = useMemo(() => {
    const minWidthPerBar = 76;
    const baseWidth = SCREEN_WIDTH - 64;
    return Math.max(baseWidth, acquisitionChartData.length * minWidthPerBar + 40);
  }, [acquisitionChartData.length]);

  // ── Detail Modal State & Interaction Handlers ────────────────────────────
  const [selectedDetail, setSelectedDetail] = useState<ChartDetailItem | null>(null);

  const openDetail = (item: ChartDetailItem) => {
    playClickSound();
    setSelectedDetail(item);
  };

  const handleVolumeBarPress = (index: number) => {
    const datum = chartData[index];
    if (!datum) return;
    const label = chartLabels[index] || `Day ${index + 1}`;
    const count = datum.count;
    const total = kpiData.totalAppts || 1;
    const pct = Math.round((count / total) * 100);
    openDetail({
      title: `${label}`,
      category: 'Appointment Volume',
      count,
      total,
      percentage: pct,
      color: colors.primary,
      subtitle: `Recorded for ${periodLabel}`,
      contextText: `${count} appointments scheduled (${pct}% of period total).`,
      icon: 'calendar-outline',
    });
  };

  const handleAcquisitionBarPress = (index: number) => {
    const datum = acquisitionChartData[index];
    if (!datum) return;
    const source = acquisitionLabels[index] || 'Other';
    const count = datum.count;
    const total = patients.length || 1;
    const pct = Math.round((count / total) * 100);
    openDetail({
      title: source,
      category: 'Patient Enquiry Source',
      count,
      total,
      percentage: pct,
      color: colors.cyan,
      subtitle: `${count} registered patients`,
      contextText: `${source} contributed ${pct}% of all recorded patient registrations.`,
      icon: 'compass-outline',
    });
  };

  const findSliceFromTouch = (
    touchX: number,
    touchY: number,
    size: number,
    innerRadiusPct: number,
    data: Array<{ label?: string; name?: string; value: number; color: string; count?: number; pct?: number }>
  ) => {
    const cx = size / 2;
    const cy = size / 2;
    const dx = touchX - cx;
    const dy = touchY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const outerR = size / 2;
    const innerR = outerR * innerRadiusPct;
    if (dist > outerR || dist < innerR) return null;

    const validItems = data.filter((d) => (d.value || 0) > 0);
    const total = validItems.reduce((sum, d) => sum + (d.value || 0), 0);
    if (total <= 0) return null;

    // Skia Path.arcToOval starts at 0° (3 o'clock / positive X) and sweeps clockwise:
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    let currentAngle = 0;
    for (const item of validItems) {
      const sweep = (item.value / total) * 360;
      if (angle >= currentAngle && angle <= currentAngle + sweep) {
        return item;
      }
      currentAngle += sweep;
    }
    return validItems[validItems.length - 1] || null;
  };

  const handleStatusPieTouch = (x: number, y: number) => {
    const slice = findSliceFromTouch(x, y, 160, 0, activeStatusPieData);
    if (slice && slice.label && slice.label !== 'Empty') {
      const item = statusBreakdown.find((s) => s.label === slice.label);
      if (item) openStatusDetail(item);
    }
  };

  const openStatusDetail = (item: (typeof statusBreakdown)[0]) => {
    openDetail({
      title: `${item.label} Status`,
      category: 'Appointment Status',
      count: item.count,
      total: filteredAppointments.length || 1,
      percentage: item.pct,
      color: item.color,
      subtitle: `${item.count} out of ${filteredAppointments.length} appointments`,
      contextText: `${item.label} status represents ${item.pct}% of appointments in ${periodLabel}.`,
      icon: 'pie-chart-outline',
    });
  };

  const handleServiceDonutTouch = (x: number, y: number) => {
    const slice = findSliceFromTouch(x, y, 140, 0.55, activeServicePieData);
    if (slice && slice.name && slice.name !== 'None') {
      const item = serviceDistribution.entries.find((s) => s.name === slice.name);
      if (item) openServiceDetail(item);
    }
  };

  const openServiceDetail = (item: (typeof serviceDistribution.entries)[0]) => {
    const total = serviceDistribution.total || 1;
    const pct = Math.round((item.count / total) * 100);
    openDetail({
      title: item.name,
      category: 'Clinical Service',
      count: item.count,
      total,
      percentage: pct,
      color: item.color,
      subtitle: `${item.count} sessions conducted`,
      contextText: `${item.name} represents ${pct}% of clinic procedure demand.`,
      icon: 'medical-outline',
    });
  };

  const handleEnrollmentPieTouch = (x: number, y: number) => {
    const slice = findSliceFromTouch(x, y, 120, 0, activeEnrollmentPieData);
    if (slice && (slice.label && slice.label !== 'Active' || slice?.count)) {
      const item = enrollmentSummary.find((e) => e.status === slice?.label);
      if (item) openEnrollmentDetail(item);
    }
  };

  const openEnrollmentDetail = (item: (typeof enrollmentSummary)[0]) => {
    const total = enrollments.length || 1;
    const pct = Math.round((item.count / total) * 100);
    openDetail({
      title: `${item.status} Packages`,
      category: 'Package Lifecycle',
      count: item.count,
      total,
      percentage: pct,
      color: item.color,
      subtitle: `${item.completedSessions}/${item.totalSessions} sessions completed (${item.completionRate}%)`,
      contextText: `${item.count} patients currently in ${item.status.toLowerCase()} package stage. Treatment compliance rate is ${item.completionRate}%.`,
      icon: 'cube-outline',
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<AppRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Reports & Analytics</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Clinical performance & operational intelligence
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.primary }]}
            onPress={handleShareReport}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={16} color="#FFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={[styles.periodRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['week', 'month', 'year', 'all'] as TimePeriod[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && { backgroundColor: colors.primary }]}
              onPress={() => { playClickSound(); setPeriod(p); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, { color: period === p ? '#FFF' : colors.textMuted, fontWeight: period === p ? '700' : '500' }]}>
                {p === 'week' ? 'Week' : p === 'month' ? 'Month' : p === 'year' ? 'Year' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>
          <View style={styles.kpiCardHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.trendBadge, { color: colors.success }]}>↑ 12%</Text>
          </View>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>{kpiData.totalAppts}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Appts</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.success }]}>
          <View style={styles.kpiCardHeader}>
            <Ionicons name="people-outline" size={20} color={colors.success} />
            <Text style={[styles.trendBadge, { color: colors.success }]}>↑ 8%</Text>
          </View>
          <Text style={[styles.kpiValue, { color: colors.success }]}>{kpiData.totalPatients}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Total Patients</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.purple }]}>
          <View style={styles.kpiCardHeader}>
            <Ionicons name="layers-outline" size={20} color={colors.purple} />
            <Text style={[styles.trendBadge, { color: colors.primary }]}>Active</Text>
          </View>
          <Text style={[styles.kpiValue, { color: colors.purple }]}>{kpiData.activeEnrollments}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Packages</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.cyan }]}>
          <View style={styles.kpiCardHeader}>
            <Ionicons name="cash-outline" size={20} color={colors.cyan} />
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          </View>
          <Text style={[styles.kpiValue, { color: colors.cyan, fontSize: 14 }]}>~ ₹{kpiData.estimatedRevenue.toLocaleString()}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>Est. Revenue</Text>
        </View>
      </ScrollView>

      {/* ── Section 1: Daily Appointment Volume (Scrollable if wide) ────── */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Appointment Volume</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{periodLabel} • Tap bar for details</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.chartArea, { width: volumeChartWidth, position: 'relative' }]}>
            <CartesianChart
              data={chartData}
              xKey="idx"
              yKeys={['count']}
              domain={chartDomain}
              domainPadding={{ left: 36, right: 36, top: 32, bottom: 0 }}
              xAxis={{
                font: AXIS_FONT,
                labelColor: colors.textMuted,
                formatXLabel: (val) => chartLabels[val as number] ?? '',
                tickCount: chartData.length,
                lineColor: gridColor,
              }}
              yAxis={[{
                font: AXIS_FONT,
                labelColor: colors.textMuted,
                tickCount: 4,
                lineColor: gridColor,
              }]}
              frame={{ lineColor: gridColor }}
            >
              {({ points, chartBounds, yScale, yTicks }) => (
                <>
                  {yTicks.map((tick) => (
                    <Line
                      key={`grid-y-${tick}`}
                      p1={vec(chartBounds.left, yScale(tick))}
                      p2={vec(chartBounds.right, yScale(tick))}
                      color={gridColor}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Bar
                    points={points.count}
                    chartBounds={chartBounds}
                    color={colors.primary}
                    roundedCorners={{ topLeft: 5, topRight: 5 }}
                    animate={{ type: 'timing', duration: 400 }}
                    labels={{
                      font: LABEL_FONT,
                      color: colors.primary,
                      position: 'top',
                      formatLabel: (v) => (v && v > 0 ? String(v) : ''),
                    }}
                  />
                </>
              )}
            </CartesianChart>

            {/* Interactive Tap Zones over each bar */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
              <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 36 }}>
                {chartData.map((_, i) => (
                  <TouchableOpacity
                    key={`volume-touch-${i}`}
                    style={{ flex: 1, height: '100%' }}
                    activeOpacity={0.4}
                    onPress={() => handleVolumeBarPress(i)}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Section 2: Appointment Status Full Pie Chart ───────────────── */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appointment Status Distribution</Text>
        </View>

        <View style={styles.chartWithLegendRow}>
          {/* Interactive Pie Chart Container */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => handleStatusPieTouch(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            style={styles.pieContainer}
          >
            <PolarChart data={activeStatusPieData} labelKey="label" valueKey="value" colorKey="color">
              <Pie.Chart innerRadius={0}>
                {() => (
                  <Pie.Slice animate={{ type: 'timing', duration: 400 }} />
                )}
              </Pie.Chart>
            </PolarChart>
          </TouchableOpacity>

          <View style={styles.legendGrid}>
            {statusBreakdown.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.legendItem}
                activeOpacity={0.7}
                onPress={() => openStatusDetail(item)}
              >
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  {item.label}: <Text style={{ fontWeight: '700' }}>{item.count}</Text>
                  {item.count > 0 && <Text style={{ color: colors.textMuted }}> ({item.pct}%)</Text>}
                </Text>
                <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Section 3: Service Type Donut ───────────────────────────────── */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="medical-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Service Type Distribution</Text>
        </View>

        <View style={styles.servicesRowContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => handleServiceDonutTouch(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            style={styles.donutWrapper}
          >
            <View style={styles.pieContainerMedium}>
              <PolarChart data={activeServicePieData} labelKey="label" valueKey="value" colorKey="color">
                <Pie.Chart innerRadius="60%">
                  {() => (
                    <Pie.Slice animate={{ type: 'timing', duration: 400 }} />
                  )}
                </Pie.Chart>
              </PolarChart>
            </View>
            <View style={styles.donutCenterOverlay} pointerEvents="none">
              <Text style={[styles.donutCenterNum, { color: colors.text }]}>{serviceDistribution.total}</Text>
              <Text style={[styles.donutCenterSub, { color: colors.textMuted }]}>Sessions</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.fullServiceLegend}>
            {serviceDistribution.entries.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={styles.donutLegendRow}
                activeOpacity={0.7}
                onPress={() => openServiceDetail(item)}
              >
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.donutLegendLabel, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.donutLegendVal, { color: colors.text }]}>{item.count}</Text>
                <Text style={[styles.donutLegendPct, { color: colors.textMuted }]}>
                  ({Math.round((item.count / serviceDistribution.total) * 100)}%)
                </Text>
                <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Section 4: Doctor Workload Table ────────────────────────────── */}
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
              { borderBottomColor: colors.border, borderBottomWidth: idx === doctorPerformance.length - 1 ? 0 : 1 },
              idx % 2 === 1 && { backgroundColor: colors.surface + '60' },
            ]}
          >
            <View style={{ flex: 2 }}>
              <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{doc.name}</Text>
              <Text style={[styles.docSpec, { color: colors.textMuted }]} numberOfLines={1}>{doc.specialty}</Text>
            </View>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.text, fontWeight: '700' }]}>{doc.total}</Text>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.primary }]}>{doc.confirmed}</Text>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'center', color: colors.success }]}>{doc.paid}</Text>
            <Text style={[styles.tdCell, { flex: 1, textAlign: 'right', color: doc.cancelRate > 20 ? colors.danger : colors.textMuted, fontWeight: doc.cancelRate > 20 ? '700' : '400' }]}>
              {doc.cancelRate}%
            </Text>
          </View>
        ))}
      </View>

      {/* ── Section 5: Package Enrollments Full Pie Chart ───────────────── */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="cube-outline" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Package Enrollments Lifecycle</Text>
        </View>

        <View style={styles.chartWithLegendRow}>
          {/* Interactive Pie Chart */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => handleEnrollmentPieTouch(e.nativeEvent.locationX, e.nativeEvent.locationY)}
            style={styles.pieContainerSmall}
          >
            <PolarChart data={activeEnrollmentPieData} labelKey="label" valueKey="value" colorKey="color">
              <Pie.Chart innerRadius={0}>
                {() => (
                  <Pie.Slice animate={{ type: 'timing', duration: 400 }} />
                )}
              </Pie.Chart>
            </PolarChart>
          </TouchableOpacity>

          <View style={[styles.enrollmentGrid, { flex: 1 }]}>
            {enrollmentSummary.map((item) => (
              <TouchableOpacity
                key={item.status}
                style={[styles.enrollmentCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: item.color, borderLeftWidth: 3 }]}
                activeOpacity={0.7}
                onPress={() => openEnrollmentDetail(item)}
              >
                <Text style={[styles.enrollmentStatus, { color: colors.text }]}>{item.status}</Text>
                <Text style={[styles.enrollmentCount, { color: item.color }]}>{item.count} packs</Text>
                <Text style={[styles.enrollmentSub, { color: colors.textMuted }]}>
                  {item.completedSessions}/{item.totalSessions} ({item.completionRate}%)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Section 6: Enquiry Source (Scrollable if wide) ─────────────── */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="compass-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Patient Enquiry Source</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Tap bar for channel details</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.chartAreaRotated, { width: acquisitionChartWidth, position: 'relative' }]}>
            <CartesianChart
              data={acquisitionChartData}
              xKey="idx"
              yKeys={['count']}
              domain={acquisitionDomain}
              domainPadding={{ left: 50, right: 50, top: 32, bottom: 0 }}
              xAxis={{
                font: AXIS_FONT,
                labelColor: colors.textMuted,
                labelRotate: -45,
                labelOffset: 8,
                formatXLabel: (val) => acquisitionLabels[val as number] ?? '',
                tickCount: acquisitionChartData.length,
                lineColor: gridColor,
              }}
              yAxis={[{
                font: AXIS_FONT,
                labelColor: colors.textMuted,
                tickCount: 4,
                lineColor: gridColor,
              }]}
              frame={{ lineColor: gridColor }}
            >
              {({ points, chartBounds, yScale, yTicks }) => (
                <>
                  {yTicks.map((tick) => (
                    <Line
                      key={`acq-grid-${tick}`}
                      p1={vec(chartBounds.left, yScale(tick))}
                      p2={vec(chartBounds.right, yScale(tick))}
                      color={gridColor}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Bar
                    points={points.count}
                    chartBounds={chartBounds}
                    color={colors.cyan}
                    roundedCorners={{ topLeft: 5, topRight: 5 }}
                    animate={{ type: 'timing', duration: 400 }}
                    labels={{
                      font: LABEL_FONT,
                      color: colors.cyan,
                      position: 'top',
                      formatLabel: (v) => (v && v > 0 ? String(v) : ''),
                    }}
                  />
                </>
              )}
            </CartesianChart>

            {/* Interactive Tap Zones over each bar */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
              <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 40 }}>
                {acquisitionChartData.map((_, i) => (
                  <TouchableOpacity
                    key={`acq-touch-${i}`}
                    style={{ flex: 1, height: '100%' }}
                    activeOpacity={0.4}
                    onPress={() => handleAcquisitionBarPress(i)}
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ── Chart Item Detail Modal ────────────────────────────────────── */}
      <Modal
        visible={!!selectedDetail}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDetail(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedDetail(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.detailModalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header Badge */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.categoryBadge, { backgroundColor: (selectedDetail?.color || colors.primary) + '22' }]}>
                <Ionicons
                  name={selectedDetail?.icon || 'analytics-outline'}
                  size={14}
                  color={selectedDetail?.color || colors.primary}
                />
                <Text style={[styles.categoryBadgeText, { color: selectedDetail?.color || colors.primary }]}>
                  {selectedDetail?.category}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { playClickSound(); setSelectedDetail(null); }}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Main Title & Metric */}
            <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedDetail?.title}</Text>
            {selectedDetail?.subtitle && (
              <Text style={[styles.detailSubtitle, { color: colors.textMuted }]}>{selectedDetail.subtitle}</Text>
            )}

            {/* Large Counter & Percentage */}
            <View style={[styles.detailMetricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.detailCount, { color: selectedDetail?.color || colors.primary }]}>
                  {selectedDetail?.count}
                </Text>
                <Text style={[styles.detailCountLabel, { color: colors.textMuted }]}>
                  Total Units / Sessions
                </Text>
              </View>
              <View style={styles.detailPctBadge}>
                <Text style={[styles.detailPctText, { color: selectedDetail?.color || colors.primary }]}>
                  {selectedDetail?.percentage}%
                </Text>
                <Text style={[styles.detailPctSub, { color: colors.textMuted }]}>of Total</Text>
              </View>
            </View>

            {/* Contribution Progress Bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(Math.max(selectedDetail?.percentage || 0, 4), 100)}%`,
                    backgroundColor: selectedDetail?.color || colors.primary,
                  },
                ]}
              />
            </View>

            {/* Context Clinical Description */}
            {selectedDetail?.contextText && (
              <View style={[styles.contextRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="information-circle-outline" size={16} color={selectedDetail?.color || colors.primary} style={{ marginTop: 2 }} />
                <Text style={[styles.contextText, { color: colors.text }]}>
                  {selectedDetail.contextText}
                </Text>
              </View>
            )}

            {/* Dismiss Button */}
            <TouchableOpacity
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={() => { playClickSound(); setSelectedDetail(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissBtnText}>Close Details</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  // ── KPI Strip ────────────────────────────────────────────────────────
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
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  trendBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  // ── Cards ─────────────────────────────────────────────────────────────
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  shareBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  // ── Chart areas ───────────────────────────────────────────────────────
  chartArea: {
    height: 210,
  },
  chartAreaRotated: {
    height: 245,
  },
  // ── Pie / Polar containers — NO flex centering, explicit w/h only ─────
  pieContainer: {
    width: 160,
    height: 160,
  },
  pieContainerMedium: {
    width: 140,
    height: 140,
  },
  pieContainerSmall: {
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
  // ── Donut center overlay ──────────────────────────────────────────────
  donutWrapper: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  donutCenterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  // ── Chart + legend layouts ─────────────────────────────────────────────
  chartWithLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  servicesRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // ── Legends ───────────────────────────────────────────────────────────
  legendGrid: {
    flex: 1,
    gap: 6,
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
  // ── Doctor table ───────────────────────────────────────────────────────
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
  // ── Enrollment cards ───────────────────────────────────────────────────
  enrollmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  enrollmentCard: {
    width: '48%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  enrollmentStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  enrollmentCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  enrollmentSub: {
    fontSize: 9,
    marginTop: 1,
  },
  // ── Detail Modal ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    elevation: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailSubtitle: {
    fontSize: 12,
    marginTop: -8,
  },
  detailMetricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailCount: {
    fontSize: 26,
    fontWeight: '800',
  },
  detailCountLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  detailPctBadge: {
    alignItems: 'flex-end',
  },
  detailPctText: {
    fontSize: 20,
    fontWeight: '800',
  },
  detailPctSub: {
    fontSize: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  contextText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  dismissBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dismissBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
