import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function CalendarScreenSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Date Bar Skeleton */}
      <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <SkeletonBox width={24} height={12} borderRadius={3} />
            <SkeletonBox width={32} height={32} radius="round" />
          </View>
        ))}
      </View>

      {/* Grid Slot Skeleton List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {[10, 11, 12, 13, 14, 15, 16, 17, 18].map((hour) => (
          <View key={hour} style={[styles.timeRow, { borderBottomColor: colors.border }]}>
            <SkeletonBox width={45} height={14} borderRadius={4} />
            <View style={{ flex: 1 }}>
              {hour % 2 === 0 ? (
                <View style={[styles.slotCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <SkeletonBox width={120} height={14} borderRadius={4} />
                  <SkeletonBox width={180} height={11} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gridContent: { paddingHorizontal: 16, paddingBottom: 40 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
    minHeight: 64,
  },
  slotCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});
