import React, { useRef } from 'react';
import { TextInput, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

/** Debounced search input with clear button */
export default function SearchInput({ value, onChangeText, placeholder = 'Search…', debounceMs = 300 }) {
  const { colors } = useTheme();
  const timer = useRef(null);

  const handleChange = (text) => {
    clearTimeout(timer.current);
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
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, height: 44, gap: 8,
  },
  icon: { marginRight: 2 },
  input: { flex: 1, fontSize: 15 },
});
