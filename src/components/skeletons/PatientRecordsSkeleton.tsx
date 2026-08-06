import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function PatientRecordsSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Patient Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBox width={56} height={56} radius="round" />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox width={160} height={18} borderRadius={4} />
          <SkeletonBox width={120} height={12} borderRadius={4} />
          <SkeletonBox width={180} height={10} borderRadius={4} />
        </View>
      </View>

      {/* Stats Summary Row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <SkeletonBox width={28} height={20} borderRadius={4} />
            <SkeletonBox width={60} height={10} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* History Timeline Header */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={150} height={18} borderRadius={6} />
      </View>

      {/* Timeline Rows Skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={{ width: 70, gap: 4 }}>
            <SkeletonBox width={54} height={14} borderRadius={4} />
            <SkeletonBox width={40} height={10} borderRadius={4} />
          </View>

          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width={130} height={15} borderRadius={4} />
            <SkeletonBox width={140} height={12} borderRadius={4} />
          </View>

          <SkeletonBox width={65} height={22} borderRadius={10} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
});
