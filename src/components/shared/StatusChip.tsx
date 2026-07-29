import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS } from '../../constants';

const BG_ALPHA = '20'; // hex opacity for background tint

export interface StatusChipProps {
  status: string;
  small?: boolean;
}

/** Color-coded status badge chip */
export default function StatusChip({ status, small = false }: StatusChipProps) {
  const color = STATUS_COLORS[status] || '#6B7280';
  const bgColor = color + BG_ALPHA;

  return (
    <View style={[styles.chip, { backgroundColor: bgColor }, small && styles.small]}>
      <Text style={[styles.text, { color }, small && styles.smallText]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  smallText: { fontSize: 10 },
});
