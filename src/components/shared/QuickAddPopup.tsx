import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { playClickSound } from '../../utils/feedback';

export interface QuickAddPopupProps {
  visible: boolean;
  onClose: () => void;
  onNewAppointment: () => void;
  onNewPatient: () => void;
}

export default function QuickAddPopup({
  visible,
  onClose,
  onNewAppointment,
  onNewPatient,
}: QuickAddPopupProps) {
  const { colors } = useTheme();

  const [isMounted, setIsMounted] = useState(visible);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      opacity.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
      scale.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.back(1.5)) });
      translateY.value = withTiming(0, { duration: 100, easing: Easing.out(Easing.quad) });
    } else if (isMounted) {
      opacity.value = withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) });
      scale.value = withTiming(0.8, { duration: 90, easing: Easing.in(Easing.quad) });
      translateY.value = withTiming(12, { duration: 90, easing: Easing.in(Easing.quad) }, () => {
        runOnJS(setIsMounted)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!isMounted && !visible) return null;

  return (
    <Modal visible={isMounted || visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.popup,
                animatedStyle,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                style={[styles.optionRow, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={() => {
                  playClickSound();
                  onClose();
                  onNewAppointment();
                }}
                activeOpacity={0.7}
              >
                <View>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>New Appointment</Text>
                  <Text style={[styles.optionSub, { color: colors.textMuted }]}>Book consultation or session</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  playClickSound();
                  onClose();
                  onNewPatient();
                }}
                activeOpacity={0.7}
              >
                <View>
                  <Ionicons name="person-add-outline" size={18} color={colors.success} />
                </View>
                <View>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>New Patient</Text>
                  <Text style={[styles.optionSub, { color: colors.textMuted }]}>Register a new patient record</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 72, // Above bottom nav
  },
  popup: {
    width: 230,
    borderRadius: 16,
    borderWidth: 1,
    padding: 6,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 10,
    marginTop: 1,
  },
});
