import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function UpcomingSessionsWidgetSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <SkeletonBox width={170} height={18} borderRadius={6} />
        <SkeletonBox width={60} height={20} borderRadius={10} />
      </View>

      <View style={styles.scrollContent}>
        {[1, 2].map((i) => (
          <View
            key={i}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.itemHeader}>
              <SkeletonBox width={110} height={14} borderRadius={4} />
              <SkeletonBox width={65} height={12} borderRadius={4} />
            </View>

            <SkeletonBox width={90} height={12} borderRadius={4} style={{ marginTop: 6 }} />

            <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
              <SkeletonBox width={130} height={11} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
  },
  itemCard: {
    width: 210,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
  },
});
