import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonBox from '../shared/SkeletonBox';
import { useTheme } from '../../theme/ThemeContext';

/** Inline 3-row skeleton shown inside PatientSearchInput dropdown while fetching */
export default function SearchDropdownSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width={160} height={14} borderRadius={4} />
            <SkeletonBox width={120} height={11} borderRadius={4} />
          </View>
          <SkeletonBox width={16} height={16} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
});
