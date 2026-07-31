import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import BottomSheet from './BottomSheet';
import { useTheme } from '../../theme/ThemeContext';
import useCenterStore from '../../store/useCenterStore';
import useUIStore from '../../store/useUIStore';
import { Ionicons } from '@expo/vector-icons';
import { playClickSound } from '../../utils/feedback';

export interface CenterSwitchSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function CenterSwitchSheet({ visible, onClose }: CenterSwitchSheetProps) {
  const { colors } = useTheme();
  const centers = useCenterStore((s) => s.centers);
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const setActiveCenterId = useUIStore((s) => s.setActiveCenterId);

  const handleSelect = (id: string) => {
    playClickSound();
    setActiveCenterId(id);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={380}>
      <BottomSheetScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Select Clinic Center</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Switching center updates all schedules and data
          </Text>
        </View>

        {centers.map((center) => {
          const isActive = center.id === activeCenterId;
          return (
            <TouchableOpacity
              key={center.id}
              style={[
                styles.centerCard,
                {
                  backgroundColor: isActive ? colors.primaryLight : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelect(center.id)}
              activeOpacity={0.7}
            >
              <View style={styles.centerInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.centerName, { color: colors.text }]}>
                    {center.cc_name}
                  </Text>
                  {center.isMain && (
                    <View style={[styles.mainBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.address, { color: colors.textMuted }]} numberOfLines={2}>
                  {center.bill_address}
                </Text>
              </View>

              {isActive && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
  },
  centerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  centerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  mainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  address: {
    fontSize: 12,
  },
});
