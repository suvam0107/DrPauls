import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export interface SelectOptionObject {
  label: string;
  value: string;
}

export type SelectOption = string | SelectOptionObject;

export interface SelectProps {
  label?: string;
  value: string;
  options?: SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
}

/** Minimal styled picker (select) component */
export default function Select({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select…',
}: SelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find((o) =>
    typeof o === 'object' ? o.value === value : o === value
  );
  const displayLabel = selected
    ? typeof selected === 'object'
      ? selected.label
      : selected
    : placeholder;

  return (
    <>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: value ? colors.text : colors.textMuted }]}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {label ? <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={(item, i) =>
                String(typeof item === 'object' ? item.value : item ?? i)
              }
              renderItem={({ item }) => {
                const val = typeof item === 'object' ? item.value : item;
                const lbl = typeof item === 'object' ? item.label : item;
                const isActive = val === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, isActive && { backgroundColor: colors.primaryLight }]}
                    onPress={() => {
                      onChange(val);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, { color: isActive ? colors.primary : colors.text }]}>
                      {lbl}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  trigger: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: { fontSize: 14, flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 12,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 15, fontWeight: '600', paddingHorizontal: 16, paddingBottom: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  optionText: { fontSize: 15 },
});
