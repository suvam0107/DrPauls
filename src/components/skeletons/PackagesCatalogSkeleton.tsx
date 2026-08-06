import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function PackagesCatalogSkeleton() {
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
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width={170} height={18} borderRadius={4} />
              <SkeletonBox width={80} height={12} borderRadius={4} />
            </View>
            <SkeletonBox width={70} height={22} borderRadius={10} />
          </View>

          <SkeletonBox width="100%" height={28} borderRadius={4} style={{ marginVertical: 10 }} />

          <View style={styles.tagRow}>
            <SkeletonBox width={90} height={20} borderRadius={6} />
            <SkeletonBox width={110} height={20} borderRadius={6} />
            <SkeletonBox width={80} height={20} borderRadius={6} />
          </View>

          <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
            <View style={{ gap: 4 }}>
              <SkeletonBox width={80} height={18} borderRadius={4} />
              <SkeletonBox width={100} height={10} borderRadius={4} />
            </View>
            <SkeletonBox width={90} height={34} borderRadius={10} />
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
