import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';

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
  const [isMounted, setIsMounted] = useState(false);

  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      opacity.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.quad) });
    } else if (isMounted) {
      opacity.value = withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) });
      translateY.value = withTiming(40, { duration: 90, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(setIsMounted)(false);
      });
    }
  }, [open]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const selected = options.find((o) =>
    typeof o === 'object' ? o.value === value : o === value
  );
  const displayLabel = selected
    ? typeof selected === 'object'
      ? selected.label
      : selected
    : placeholder;

  const handleOpen = () => {
    playClickSound();
    setOpen(true);
  };

  const handleSelectOption = (val: string) => {
    playClickSound();
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handleOpen}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: value ? colors.text : colors.textMuted }]}>
          {displayLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={isMounted || open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
            <Animated.View style={[styles.sheet, animatedStyle, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                      onPress={() => handleSelectOption(val)}
                    >
                      <Text style={[styles.optionText, { color: isActive ? colors.primary : colors.text }]}>
                        {lbl}
                      </Text>
                      {isActive && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
              />
            </Animated.View>
          </Pressable>
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
