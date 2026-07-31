import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import useCenterStore from '../store/useCenterStore';
import useUIStore from '../store/useUIStore';
import { playClickSound } from '../utils/feedback';

export interface HeaderProps {
  onMenuPress: () => void;
  onThemeToggle: () => void;
  onCenterPress?: () => void;
  title?: string;
}

export default function Header({
  onMenuPress,
  onThemeToggle,
  onCenterPress,
  title = "Dr. Paul's Clinic",
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 0);

  const centers = useCenterStore((s) => s.centers);
  const activeCenterId = useUIStore((s) => s.activeCenterId);
  const currentCenter = centers.find((c) => c.id === activeCenterId) || centers[0];

  const handleMenuPress = () => {
    playClickSound();
    onMenuPress();
  };

  const handleThemeToggle = () => {
    playClickSound();
    onThemeToggle();
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

      <TouchableOpacity onPress={handleThemeToggle} hitSlop={8}>
        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.text} />
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
});
