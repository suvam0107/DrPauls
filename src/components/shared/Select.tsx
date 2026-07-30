import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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

interface LayoutPos {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Modern Select dropdown component.
 * Uses a transparent Modal overlay measured via window coordinates to completely isolate
 * touch & scroll gestures from parent Modals / ScrollViews (preventing scroll jitter and conflicts).
 * Features smooth Reanimated opening AND closing animations.
 */
export default function Select({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select…',
}: SelectProps) {
  const { colors } = useTheme();
  const triggerRef = useRef<View>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [layoutPos, setLayoutPos] = useState<LayoutPos>({ x: 0, y: 0, width: 200, height: 44 });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-6);
  const scaleY = useSharedValue(0.95);

  const screenHeight = Dimensions.get('window').height;

  const animateIn = () => {
    opacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 140, easing: Easing.out(Easing.quad) });
    scaleY.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
  };

  const animateOut = (onComplete?: () => void) => {
    opacity.value = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
    translateY.value = withTiming(-6, { duration: 120, easing: Easing.in(Easing.quad) });
    scaleY.value = withTiming(
      0.95,
      { duration: 120, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  };

  const handleOpen = () => {
    playClickSound();
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setLayoutPos({ x, y, width, height });
        setIsOpen(true);
        animateIn();
      });
    } else {
      setIsOpen(true);
      animateIn();
    }
  };

  const handleClose = (selectedValue?: string) => {
    playClickSound();
    animateOut(() => {
      setIsOpen(false);
      if (selectedValue !== undefined) {
        onChange(selectedValue);
      }
    });
  };

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scaleY: scaleY.value }],
  }));

  const selected = options.find((o) =>
    typeof o === 'object' ? o.value === value : o === value
  );
  const displayLabel = selected
    ? typeof selected === 'object'
      ? selected.label
      : selected
    : placeholder;

  // Determine if popup should float above or below trigger based on screen edge space
  const cardHeight = Math.min(180, Math.max(44, options.length * 42));
  const spaceBelow = screenHeight - (layoutPos.y + layoutPos.height);
  const showAbove = spaceBelow < cardHeight + 20 && layoutPos.y > cardHeight + 20;
  const topPos = showAbove ? layoutPos.y - cardHeight - 4 : layoutPos.y + layoutPos.height + 4;


  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}

      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          style={[
            styles.trigger,
            {
              backgroundColor: colors.surface,
              borderColor: isOpen ? colors.primary : colors.border,
            },
          ]}
          onPress={isOpen ? () => handleClose() : handleOpen}
          activeOpacity={0.75}
        >
          <Text
            style={[styles.triggerText, { color: value ? colors.text : colors.textMuted }]}
            numberOfLines={1}
          >
            {displayLabel}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={isOpen ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Transparent Modal overlay ensuring 100% isolated gesture & scroll context */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => handleClose()}
      >
        <Pressable style={styles.modalOverlay} onPress={() => handleClose()}>
          {/* Animated floating options card positioned directly at measured trigger coordinates */}
          <Animated.View
            style={[
              styles.popupCard,
              popupAnimatedStyle,
              {
                position: 'absolute',
                top: topPos,
                left: Math.max(12, layoutPos.x),
                width: Math.min(layoutPos.width, Dimensions.get('window').width - 24),
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              style={styles.scrollList}
            >
              {options.map((item, i) => {
                const val = typeof item === 'object' ? item.value : item;
                const lbl = typeof item === 'object' ? item.label : item;
                const isActive = val === value;
                const isLast = i === options.length - 1;

                return (
                  <TouchableOpacity
                    key={String(val ?? i)}
                    style={[
                      styles.option,
                      isActive && { backgroundColor: colors.primaryLight },
                      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleClose(val)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {lbl}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark-outline" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 2,
  },
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
  triggerText: { fontSize: 14, flex: 1, marginRight: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popupCard: {
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 180,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  scrollList: {
    maxHeight: 180,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionText: { fontSize: 14, flex: 1 },
});
