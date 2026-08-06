import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function DoctorScreenSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <SkeletonBox width={46} height={46} radius="round" />

          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.nameHeaderRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <SkeletonBox width={160} height={16} borderRadius={4} />
                <SkeletonBox width={120} height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <SkeletonBox width={32} height={32} radius="round" />
                <SkeletonBox width={32} height={32} radius="round" />
              </View>
            </View>

            <SkeletonBox width={140} height={12} borderRadius={4} />
            <SkeletonBox width={100} height={12} borderRadius={4} style={{ marginTop: 2 }} />

            <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
              <SkeletonBox width={80} height={14} borderRadius={4} />
              <SkeletonBox width={90} height={12} borderRadius={4} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
