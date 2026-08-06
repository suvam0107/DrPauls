import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function EnrollmentsSkeleton() {
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
          <View style={styles.topRow}>
            <SkeletonBox width={48} height={48} radius="round" />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width={150} height={16} borderRadius={4} />
              <SkeletonBox width={120} height={13} borderRadius={4} />
            </View>
            <SkeletonBox width={60} height={20} borderRadius={10} />
          </View>

          <View style={[styles.progressSection, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <SkeletonBox width={130} height={12} borderRadius={4} />
            <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: 6 }} />
          </View>

          <View style={styles.bottomRow}>
            <SkeletonBox width={140} height={12} borderRadius={4} />
            <SkeletonBox width={70} height={26} borderRadius={8} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  card: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressSection: {
    paddingVertical: 10,
    marginVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
