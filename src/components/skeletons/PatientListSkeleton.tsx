import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function PatientListSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <SkeletonBox width={44} height={44} radius="round" />

          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width={140} height={16} borderRadius={4} />
            <SkeletonBox width={110} height={12} borderRadius={4} />
            <SkeletonBox width={160} height={10} borderRadius={4} />
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <SkeletonBox width={28} height={28} borderRadius={8} />
            <SkeletonBox width={28} height={28} borderRadius={8} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
});
