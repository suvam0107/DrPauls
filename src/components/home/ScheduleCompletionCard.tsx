import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';

export interface ScheduleCompletionCardProps {
  todayApptsCount: number;
  confirmedCount: number;
  paidCount: number;
  pendingCount: number;
  scheduledCount: number;
  rescheduledCount: number;
  cancelledCount: number;
  onNavigateAppointments: (statusFilter?: string) => void;
}

export default function ScheduleCompletionCard({
  todayApptsCount,
  confirmedCount,
  paidCount,
  pendingCount,
  scheduledCount,
  rescheduledCount,
  cancelledCount,
  onNavigateAppointments,
}: ScheduleCompletionCardProps) {
  const { colors, isDark } = useTheme();

  const total = todayApptsCount || 1;
  const fulfilledCount = confirmedCount + paidCount;
  const fulfillmentPct = todayApptsCount > 0 ? Math.round((fulfilledCount / todayApptsCount) * 100) : 0;
  const paidPct = todayApptsCount > 0 ? Math.round((paidCount / todayApptsCount) * 100) : 0;

  // Segment widths in percentage for stacked bar
  const paidBarPct = (paidCount / total) * 100;
  const confirmedBarPct = (confirmedCount / total) * 100;
  const pendingBarPct = (pendingCount / total) * 100;
  const scheduledBarPct = (scheduledCount / total) * 100;
  const rescheduledBarPct = (rescheduledCount / total) * 100;

  // SVG Radial Ring dimensions
  const size = 76;
  const strokeWidth = 7;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(fulfillmentPct, 100)) / 100;

  const handleChipPress = (filter?: string) => {
    playClickSound();
    onNavigateAppointments(filter);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <View style={[styles.headerIconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="pie-chart" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Schedule Completion</Text>
          </View>
        </View>
      </View>

      {/* Main Stats Row: Radial Gauge + Progress & Meta */}
      <View style={styles.radialMetaRow}>
        {/* Radial Progress Ring */}
        <View style={styles.ringWrapper}>
          <Svg width={size} height={size}>
            {/* Background Ring Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Fulfilled Foreground Ring Stroke */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.success}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>
          {/* Radial Center Overlay Text */}
          <View style={styles.ringCenterOverlay}>
            <Text style={[styles.ringPctText, { color: colors.text }]}>{fulfillmentPct}%</Text>
            <Text style={[styles.ringSubText, { color: colors.textMuted }]}>Done</Text>
          </View>
        </View>

        {/* Right Stacked Progress & Metrics */}
        <View style={styles.metaCol}>
          <View style={styles.kpiPillsRow}>
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: colors.success }]}>
                {fulfilledCount}<Text style={{ fontSize: 11, color: colors.textMuted }}>/{todayApptsCount}</Text>
              </Text>
              <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>Sessions Conducted</Text>
            </View>
            <View style={styles.dividerDot} />
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiVal, { color: colors.purple }]}>{paidPct}%</Text>
              <Text style={[styles.kpiLbl, { color: colors.textMuted }]}>Payment Settled</Text>
            </View>
          </View>

          {/* Multi-Color Segmented Track */}
          <View style={[styles.stackedTrackTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            {paidBarPct > 0 && (
              <View style={{ width: `${paidBarPct}%`, height: '100%', backgroundColor: colors.success, borderRadius: 2 }} />
            )}
            {confirmedBarPct > 0 && (
              <View style={{ width: `${confirmedBarPct}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 2 }} />
            )}
            {scheduledBarPct > 0 && (
              <View style={{ width: `${scheduledBarPct}%`, height: '100%', backgroundColor: colors.purple, borderRadius: 2 }} />
            )}
            {rescheduledBarPct > 0 && (
              <View style={{ width: `${rescheduledBarPct}%`, height: '100%', backgroundColor: colors.cyan, borderRadius: 2 }} />
            )}
            {pendingBarPct > 0 && (
              <View style={{ width: `${pendingBarPct}%`, height: '100%', backgroundColor: colors.warning, borderRadius: 2 }} />
            )}
          </View>

          {/* Stacked Bar Color Legend Labels */}
          <View style={styles.barLegendRow}>
            <View style={styles.legendDotItem}>
              <View style={[styles.miniDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Paid ({paidCount})</Text>
            </View>
            <View style={styles.legendDotItem}>
              <View style={[styles.miniDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Confirmed ({confirmedCount})</Text>
            </View>
            {pendingCount > 0 && (
              <View style={styles.legendDotItem}>
                <View style={[styles.miniDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>Pending ({pendingCount})</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Interactive Status Chips Grid */}
      <View style={styles.chipGrid}>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleChipPress()}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={13} color={colors.primary} />
          <Text style={[styles.chipText, { color: colors.primary }]}>{todayApptsCount} Total</Text>
        </TouchableOpacity>

        {confirmedCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.successBg }]}
            onPress={() => handleChipPress('Confirmed')}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
            <Text style={[styles.chipText, { color: colors.success }]}>{confirmedCount} Confirmed</Text>
          </TouchableOpacity>
        )}

        {paidCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.purpleBg }]}
            onPress={() => handleChipPress('Paid')}
            activeOpacity={0.7}
          >
            <Ionicons name="card-outline" size={13} color={colors.purple} />
            <Text style={[styles.chipText, { color: colors.purple }]}>{paidCount} Paid</Text>
          </TouchableOpacity>
        )}

        {pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.warningBg }]}
            onPress={() => handleChipPress('Pending')}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={13} color={colors.warning} />
            <Text style={[styles.chipText, { color: colors.warning }]}>{pendingCount} Pending</Text>
          </TouchableOpacity>
        )}

        {scheduledCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.primaryLight }]}
            onPress={() => handleChipPress('Scheduled')}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-number-outline" size={13} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>{scheduledCount} Scheduled</Text>
          </TouchableOpacity>
        )}

        {rescheduledCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.cyanBg }]}
            onPress={() => handleChipPress('Rescheduled')}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={13} color={colors.cyan} />
            <Text style={[styles.chipText, { color: colors.cyan }]}>{rescheduledCount} Rescheduled</Text>
          </TouchableOpacity>
        )}

        {cancelledCount > 0 && (
          <TouchableOpacity
            style={[styles.chip, { backgroundColor: colors.dangerBg }]}
            onPress={() => handleChipPress('Cancelled')}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={13} color={colors.danger} />
            <Text style={[styles.chipText, { color: colors.danger }]}>{cancelledCount} Cancelled</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  radialMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ringWrapper: {
    width: 76,
    height: 76,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPctText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ringSubText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  metaCol: {
    flex: 1,
    gap: 8,
  },
  kpiPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kpiItem: {
    gap: 1,
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '500',
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(128,128,128,0.4)',
  },
  stackedTrackTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    gap: 2,
  },
  barLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  legendDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
