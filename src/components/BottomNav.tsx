import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
import useUIStore from '../store/useUIStore';

export interface BottomNavProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
  onPlusPress?: () => void;
  isQuickAddOpen?: boolean;
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

/** Per-tab animated pill highlight — springs outward with dense spring on icon and bold title */
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
  const iconScale = useSharedValue(isActive ? 1.15 : 1);
  const iconTranslateY = useSharedValue(isActive ? -1.5 : 0);
  const textScale = useSharedValue(isActive ? 1.05 : 1);
  const textTranslateY = useSharedValue(isActive ? -0.5 : 0);

  useEffect(() => {
    if (isActive) {
      // Spring outward then settle for pill
      widthScale.value = withSpring(1, {
        damping: 18,
        stiffness: 260,
        mass: 0.8,
      });
      pillOpacity.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.quad) });

      // Subtle, dense spring animation on the icon
      iconScale.value = withSpring(1.15, {
        damping: 12,
        stiffness: 350,
        mass: 0.5,
      });
      iconTranslateY.value = withSpring(-1.5, {
        damping: 12,
        stiffness: 350,
        mass: 0.5,
      });

      // Synchronized micro-spring for bold title
      textScale.value = withSpring(1.05, {
        damping: 14,
        stiffness: 320,
        mass: 0.6,
      });
      textTranslateY.value = withSpring(-0.5, {
        damping: 14,
        stiffness: 320,
        mass: 0.6,
      });
    } else {
      widthScale.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      pillOpacity.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
      iconScale.value = withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) });
      iconTranslateY.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
      textScale.value = withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) });
      textTranslateY.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.quad) });
    }
  }, [isActive]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ scaleX: widthScale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { translateY: iconTranslateY.value },
    ],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: textScale.value },
      { translateY: textTranslateY.value },
    ],
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

      {/* Icon with subtle, dense spring animation */}
      <Animated.View style={[styles.tabIconContainer, iconAnimStyle]}>
        <Ionicons
          name={isActive ? tab.activeIcon : tab.inactiveIcon}
          size={18}
          color={isActive ? colors.primary : colors.textMuted}
        />
      </Animated.View>

      {/* Bold animated title */}
      <Animated.Text
        style={[
          styles.label,
          {
            color: isActive ? colors.primary : colors.textMuted,
            fontWeight: isActive ? '900' : '600',
          },
          textAnimStyle,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export default function BottomNav({
  activeTab,
  onTabSelect,
  onPlusPress,
  isQuickAddOpen = false,
}: BottomNavProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);
  const navVisible = useUIStore((s) => s.navVisible);

  const translateY = useSharedValue(0);
  const fabRotation = useSharedValue(isQuickAddOpen ? 1 : 0);

  useEffect(() => {
    translateY.value = withTiming(navVisible ? 0 : 120, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, [navVisible]);

  useEffect(() => {
    fabRotation.value = withTiming(isQuickAddOpen ? 1 : 0, {
      duration: 220,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isQuickAddOpen]);

  const navAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const fabIconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value * 45}deg` }],
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
      {/* Left Floating Pill Container with Darker, Prominent Shadow */}
      <View
        style={[
          styles.pillContainer,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : colors.border,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.85 : 0.35,
            shadowRadius: 16,
            elevation: 18,
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

      {/* Right Floating FAB Button with Darker, Prominent Shadow */}
      <TouchableOpacity
        style={[
          styles.fabCircle,
          {
            backgroundColor: colors.primary,
            shadowColor: isDark ? '#000000' : colors.primary,
            shadowOpacity: isDark ? 0.6 : 0.35,
          },
        ]}
        onPress={handlePlusPress}
        activeOpacity={0.8}
      >
        <Animated.View style={fabIconAnimStyle}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
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
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 3,
    elevation: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
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
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: 24,
    elevation: 1,
    // scaleX animation starts from center and stretches outward
  },
  tabIconContainer: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    zIndex: 2,
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
});
