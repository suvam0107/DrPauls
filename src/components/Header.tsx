import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import useCenterStore from '../store/useCenterStore';
import useUIStore from '../store/useUIStore';
import { playClickSound } from '../utils/feedback';

import useAuthStore from '../store/useAuthStore';
import { useCentersQuery } from '../hooks/queries/useCentersQuery';

export interface HeaderProps {
  onMenuPress: () => void;
  onThemeToggle?: () => void;
  onProfilePress?: () => void;
  onCenterPress?: () => void;
  title?: string;
}

export default function Header({
  onMenuPress,
  onThemeToggle,
  onProfilePress,
  onCenterPress,
  title = "Dr. Paul's Clinic",
}: HeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 0);

  const { data: centers = [] } = useCentersQuery();
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const currentCenter = centers.find((c) => c.id === activeCenterId) || centers[0];
  const user = useAuthStore((s) => s.user);
  const displayName = user?.name || 'Anita Roy';

  const handleMenuPress = () => {
    playClickSound();
    onMenuPress();
  };

  const handleProfilePress = () => {
    playClickSound();
    if (onProfilePress) onProfilePress();
  };

  const handleCenterPress = () => {
    if (onCenterPress) {
      playClickSound();
      onCenterPress();
    }
  };

  const headerHeight = centers.length > 0 ? 66 + topPadding : 56 + topPadding;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: topPadding,
          height: headerHeight,
        },
      ]}
    >
      <TouchableOpacity onPress={handleMenuPress} hitSlop={8}>
        <Ionicons name="menu-outline" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        {/* Center Toggle */}
        {currentCenter && (
          <TouchableOpacity
            style={styles.centerToggleRow}
            onPress={handleCenterPress}
            activeOpacity={0.7}
            hitSlop={6}
          >
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={[styles.centerText, { color: colors.primary }]} numberOfLines={1}>
              {currentCenter.cc_name}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={handleProfilePress}
        hitSlop={8}
        style={[styles.avatarBadge, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 22,
    height: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  centerToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  centerText: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 220,
  },
  avatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
