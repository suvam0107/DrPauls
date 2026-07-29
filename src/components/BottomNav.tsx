import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export interface BottomNavProps {
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabSelect }: BottomNavProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 6);

  return (
    <View
      style={[
        styles.nav,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
          height: 58 + bottomPadding,
        },
      ]}
    >
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabSelect('home')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={24}
          color={activeTab === 'home' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.label,
            { color: activeTab === 'home' ? colors.primary : colors.textMuted },
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* New Appointment Tab (+ Icon) */}
      <TouchableOpacity
        style={styles.centerTab}
        onPress={() => onTabSelect('newAppt')}
        activeOpacity={0.8}
      >
        <View style={[styles.plusCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Settings Tab */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabSelect('settings')}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
          size={24}
          color={activeTab === 'settings' ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.label,
            { color: activeTab === 'settings' ? colors.primary : colors.textMuted },
          ]}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  centerTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  plusCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
