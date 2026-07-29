import React, { useRef } from 'react';
import { TextInput, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/** Debounced search input with clear button */
export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
  debounceMs = 300,
}: SearchInputProps) {
  const { colors } = useTheme();
  const timer = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChangeText(text), debounceMs);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="search" size={18} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        defaultValue={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {!!value && (
        <TouchableOpacity
          onPress={() => {
            playClickSound();
            onChangeText('');
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  icon: { marginRight: 2 },
  input: { flex: 1, fontSize: 15 },
});
