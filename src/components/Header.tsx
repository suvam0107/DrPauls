import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export interface HeaderProps {
  onMenuPress: () => void;
  onThemeToggle: () => void;
  title?: string;
}

export default function Header({
  onMenuPress,
  onThemeToggle,
  title = "Dr. Paul's Clinic",
}: HeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 0);

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: topPadding,
          height: 56 + topPadding,
        },
      ]}
    >
      <TouchableOpacity onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="menu-outline" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>

      <TouchableOpacity onPress={onThemeToggle} hitSlop={8}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
