import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { playClickSound } from '../utils/feedback';

export interface BottomNavProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onPlusPress?: () => void;
}

interface TabConfig {
  key: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'home', label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { key: 'calendar', label: 'Calendar', activeIcon: 'calendar', inactiveIcon: 'calendar-outline' },
  { key: 'patients', label: 'Patients', activeIcon: 'people', inactiveIcon: 'people-outline' },
  { key: 'appointments', label: 'Appts', activeIcon: 'time', inactiveIcon: 'time-outline' },
];

/** Per-tab animated pill highlight — springs from 0 width + 0 opacity outward */
function TabItem({
  tab,
  isActive,
  onPress,
  colors,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  // Width: 0 (inactive) → 1 (active) as a scale multiplier on max width
  const widthScale = useSharedValue(isActive ? 1 : 0);
  const pillOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (isActive) {
      // Spring outward then settle
      widthScale.value = withSpring(1, {
        damping: 18,
        stiffness: 260,
        mass: 0.8,
      });
      pillOpacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });
    } else {
      widthScale.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      pillOpacity.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
    }
  }, [isActive]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scaleX: widthScale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Animated pill background — grows from center outward via scaleX */}
      <Animated.View
        style={[
          styles.tabPill,
          { backgroundColor: colors.primaryLight },
          pillStyle,
        ]}
      />

      {/* Icon + label sit on top, always centered */}
      <Ionicons
        name={isActive ? tab.activeIcon : tab.inactiveIcon}
        size={18}
        color={isActive ? colors.primary : colors.textMuted}
        style={styles.tabIcon}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.primary : colors.textMuted, fontWeight: isActive ? '700' : '500' },
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

import useUIStore from '../store/useUIStore';

export default function BottomNav({ activeTab, onTabSelect, onPlusPress }: BottomNavProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  const navVisible = useUIStore((s) => s.navVisible);

  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(navVisible ? 0 : 120, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [navVisible]);

  const navAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleTabPress = (tab: string) => {
    playClickSound();
    onTabSelect(tab);
  };

  const handlePlusPress = () => {
    playClickSound();
    if (onPlusPress) {
      onPlusPress();
    } else {
      onTabSelect('quickAdd');
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottomPadding },
        navAnimStyle,
      ]}
      pointerEvents="box-none"
    >
      {/* Left Floating Pill Container */}
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onPress={() => handleTabPress(tab.key)}
            colors={colors}
          />
        ))}
      </View>

      {/* Right Floating FAB Button */}
      <TouchableOpacity
        style={[
          styles.fabCircle,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={handlePlusPress}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 99,
  },
  pillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    paddingHorizontal: 2,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 27,
    // scaleX animation starts from center and stretches outward
  },
  tabIcon: {
    zIndex: 2,
  },
  label: {
    fontSize: 8,
    marginTop: 2,
    zIndex: 2,
  },
  fabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
