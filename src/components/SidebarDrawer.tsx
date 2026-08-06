import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import useAuthStore from '../store/useAuthStore';
import { playClickSound } from '../utils/feedback';

const DRAWER_WIDTH = 280;

export interface SubMenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}

export interface MenuItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: string;
  subItems?: SubMenuItem[];
}

export interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  currentScreen?: string;
}

/** Multi-level expandable menu group with smooth Reanimated chevron rotation & height transition */
function CollapsibleMenuGroup({
  item,
  currentScreen,
  onNavigate,
  onCloseDrawer,
}: {
  item: MenuItem;
  currentScreen?: string;
  onNavigate: (screen: string) => void;
  onCloseDrawer: () => void;
}) {
  const { colors } = useTheme();
  const isChildActive = item.subItems?.some((sub) => sub.screen === currentScreen);
  const [isOpen, setIsOpen] = useState(isChildActive || false);

  const animation = useSharedValue(isChildActive || false ? 1 : 0);

  useEffect(() => {
    animation.value = withTiming(isOpen ? 1 : 0, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  }, [isOpen]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animation.value * 90}deg` }],
  }));

  const subMenuContainerStyle = useAnimatedStyle(() => ({
    opacity: animation.value,
    maxHeight: animation.value * 140,
    overflow: 'hidden',
  }));

  return (
    <View style={styles.collapsibleWrapper}>
      <TouchableOpacity
        style={[
          styles.menuItem,
          { borderBottomColor: colors.border },
          isChildActive && { backgroundColor: colors.surface },
        ]}
        onPress={() => {
          playClickSound();
          setIsOpen((prev) => !prev);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name={item.icon} size={20} color={colors.primary} />
        <Text style={[styles.menuLabel, { color: colors.text, fontWeight: '700' }]}>{item.label}</Text>
        <Animated.View style={[{ marginLeft: 'auto' }, chevronStyle]}>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={subMenuContainerStyle}>
        <View style={styles.subMenuListContainer}>
          {/* Vertical tree hierarchy line matching IDE tree view style */}
          <View style={[styles.treeGuideLine, { backgroundColor: colors.border }]} />

          {item.subItems?.map((sub) => {
            const isActive = currentScreen === sub.screen;
            return (
              <TouchableOpacity
                key={sub.screen}
                style={[
                  styles.subMenuItemFullWidth,
                  isActive
                    ? {
                      backgroundColor: colors.primaryLight,
                      borderLeftColor: colors.primary,
                    }
                    : {
                      backgroundColor: 'transparent',
                      borderLeftColor: 'transparent',
                    },
                ]}
                onPress={() => {
                  playClickSound();
                  onNavigate(sub.screen);
                  onCloseDrawer();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={sub.icon}
                  size={17}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.subMenuLabel,
                    {
                      color: isActive ? colors.primary : colors.text,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {sub.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

export default function SidebarDrawer({ visible, onClose, onNavigate, currentScreen }: SidebarDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const translateX = useSharedValue(-DRAWER_WIDTH);
  const opacity = useSharedValue(0);

  const menuItems: MenuItem[] = [
    { label: 'Calendar Grid', icon: 'calendar-outline', screen: 'calendar' },
    { label: 'All Appointments', icon: 'time-outline', screen: 'appointments' },
    { label: 'Patient Directory', icon: 'people-outline', screen: 'patients' },
    { label: 'Doctor Schedule', icon: 'medical-outline', screen: 'doctors' },
    { label: 'Reports & Analytics', icon: 'bar-chart-outline', screen: 'reports' },
    {
      label: 'Packages',
      icon: 'gift-outline',
      subItems: [
        { label: 'Available Packages', icon: 'pricetag-outline', screen: 'available-packages' },
        { label: 'Patient Enrollments', icon: 'layers-outline', screen: 'patient-enrollments' },
      ],
    },
  ];

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 100, easing: Easing.out(Easing.quad) });
      translateX.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = withTiming(0, { duration: 80 });
      translateX.value = withTiming(-DRAWER_WIDTH, { duration: 100, easing: Easing.in(Easing.quad) });
    }
  }, [visible]);

  const handleClose = () => {
    playClickSound();
    translateX.value = withTiming(-DRAWER_WIDTH, { duration: 100, easing: Easing.in(Easing.quad) });
    opacity.value = withTiming(0, { duration: 80 }, () => {
      runOnJS(onClose)();
    });
  };

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const displayName = user?.name || 'Anita Roy';
  const displayRole = user?.role || 'Receptionist';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Animated Backdrop */}
        <Pressable style={styles.backdropPressable} onPress={handleClose}>
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />
        </Pressable>

        {/* Animated Slide-in Drawer */}
        <Animated.View style={[styles.drawer, { backgroundColor: colors.card, borderRightColor: colors.border }, drawerStyle]}>
          {/* Staff Info Header */}
          <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top + 16, 44) }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.staffName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[styles.staffRole, { color: colors.textMuted }]}>
                {displayRole} • Dr. Paul's Clinic
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Navigation Items List */}
          <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
            {menuItems.map((item) => {
              if (item.subItems) {
                return (
                  <CollapsibleMenuGroup
                    key={item.label}
                    item={item}
                    currentScreen={currentScreen}
                    onNavigate={onNavigate}
                    onCloseDrawer={handleClose}
                  />
                );
              }

              const isActive = currentScreen === item.screen;
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: colors.border },
                    isActive && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => {
                    playClickSound();
                    if (item.screen) onNavigate(item.screen);
                    handleClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer Clinic Info */}
          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
            <Text style={[styles.clinicTitle, { color: colors.text }]}>Dr. Paul's Clinic</Text>
            <Text style={[styles.clinicSub, { color: colors.textMuted }]}>
              Guwahati • Receptionist Console
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    borderRightWidth: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
  },
  staffRole: {
    fontSize: 12,
    marginTop: 2,
  },
  menuList: {
    paddingVertical: 12,
  },
  collapsibleWrapper: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  subMenuListContainer: {
    position: 'relative',
    width: '100%',
    paddingVertical: 2,
  },
  treeGuideLine: {
    position: 'absolute',
    left: 26,
    top: 0,
    bottom: 6,
    width: 1.5,
    borderRadius: 1,
    opacity: 0.7,
    zIndex: 10
  },
  subMenuItemFullWidth: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    gap: 10,
    borderLeftWidth: 3,
  },
  subMenuLabel: {
    fontSize: 13,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  clinicTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  clinicSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
