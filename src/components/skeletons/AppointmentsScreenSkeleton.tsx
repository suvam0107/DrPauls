import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

export default function AppointmentsScreenSkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    >
      {[1, 2].map((groupIndex) => (
        <View key={groupIndex} style={{ marginBottom: 16 }}>
          {/* Section Header */}
          <View style={styles.groupHeader}>
            <SkeletonBox width={140} height={18} borderRadius={6} />
            <SkeletonBox width={50} height={14} borderRadius={4} />
          </View>

          {/* Cards under group */}
          {[1, 2, 3].map((cardIndex) => (
            <View
              key={cardIndex}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={{ width: 68, gap: 4 }}>
                <SkeletonBox width={54} height={16} borderRadius={4} />
                <SkeletonBox width={36} height={10} borderRadius={4} />
              </View>

              <View style={{ flex: 1, gap: 6 }}>
                <SkeletonBox width={130} height={15} borderRadius={4} />
                <SkeletonBox width={150} height={12} borderRadius={4} />
              </View>

              <SkeletonBox width={70} height={24} borderRadius={12} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
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
