import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function ReportsScreenSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Time Period Filter Pills */}
      <View style={styles.filterRow}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} width={70} height={32} borderRadius={16} />
        ))}
      </View>

      {/* KPI 4-Grid Cards Skeleton */}
      <View style={styles.kpiGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <SkeletonBox width={28} height={28} borderRadius={6} />
            <SkeletonBox width={45} height={22} borderRadius={4} style={{ marginTop: 8 }} />
            <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Donut Chart Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBox width={160} height={18} borderRadius={4} />
        <View style={styles.donutContainer}>
          <SkeletonBox width={120} height={120} radius="round" />
        </View>
      </View>

      {/* Doctor Performance List Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBox width={180} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.leaderRow}>
            <SkeletonBox width={32} height={32} radius="round" />
            <View style={{ flex: 1, gap: 4 }}>
              <SkeletonBox width={130} height={14} borderRadius={4} />
              <SkeletonBox width={90} height={10} borderRadius={4} />
            </View>
            <SkeletonBox width={50} height={16} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Bar Chart Area Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBox width={170} height={18} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={styles.barChartContainer}>
          {[40, 80, 60, 100, 70, 50, 90].map((h, idx) => (
            <SkeletonBox key={idx} width={24} height={h} borderRadius={6} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    paddingTop: 10,
  },
});
