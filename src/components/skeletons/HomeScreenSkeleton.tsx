import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeScreenSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Date Banner Skeleton */}
      <View style={[styles.bannerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.bannerTextCol}>
          <SkeletonBox width={140} height={20} borderRadius={6} />
          <SkeletonBox width={90} height={14} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={110} height={34} borderRadius={10} />
      </View>

      {/* 2x2 Stats Cards Grid Skeleton */}
      <View style={styles.statsRow}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.statCardTop}>
              <SkeletonBox width={32} height={32} borderRadius={8} />
              <SkeletonBox width={30} height={24} borderRadius={6} />
            </View>
            <SkeletonBox width={80} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Quick Nav Bar Skeleton */}
      <View style={styles.quickNavRow}>
        {[1, 2].map((i) => (
          <View
            key={i}
            style={[styles.quickNavCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <SkeletonBox width={34} height={34} borderRadius={10} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width={100} height={14} borderRadius={4} />
              <SkeletonBox width={70} height={10} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* Upcoming Sessions Widget Skeleton */}
      <View style={[styles.widgetContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.widgetHeader}>
          <SkeletonBox width={180} height={18} borderRadius={6} />
          <SkeletonBox width={60} height={22} borderRadius={10} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {[1, 2].map((i) => (
            <View
              key={i}
              style={[styles.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <SkeletonBox width={120} height={14} borderRadius={4} />
              <SkeletonBox width={80} height={12} borderRadius={4} style={{ marginTop: 6 }} />
              <SkeletonBox width={140} height={12} borderRadius={4} style={{ marginTop: 10 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Today's Schedule Section Skeleton */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={130} height={20} borderRadius={6} />
        <SkeletonBox width={60} height={14} borderRadius={4} />
      </View>

      {/* Appointment Cards List Skeleton */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={{ width: 68, gap: 4 }}>
            <SkeletonBox width={50} height={16} borderRadius={4} />
            <SkeletonBox width={40} height={10} borderRadius={4} />
          </View>

          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width={130} height={16} borderRadius={4} />
            <SkeletonBox width={160} height={12} borderRadius={4} />
          </View>

          <SkeletonBox width={70} height={24} borderRadius={12} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTextCol: { flex: 1 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickNavRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickNavCard: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
  },
  widgetContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 16,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionCard: {
    width: 210,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
});
