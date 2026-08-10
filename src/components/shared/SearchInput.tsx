import React, { useRef } from 'react';
import { TextInput, View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isFetching?: boolean;
  autoFocus?: boolean;
}

/**
 * Fully controlled search input with clear button and optional isFetching spinner.
 * Debouncing is the CALLER's responsibility — bind `value` directly to your state,
 * and pass the debounced value to query hooks.
 */
export default function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search…',
  isFetching = false,
  autoFocus = false,
}: SearchInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="search" size={18} color={colors.textMuted} style={styles.icon} />
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
      />
      {isFetching ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      ) : !!value ? (
        <TouchableOpacity
          onPress={() => {
            playClickSound();
            onChangeText('');
            inputRef.current?.focus();
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : null}
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
  spinner: { marginLeft: 4 },
});
