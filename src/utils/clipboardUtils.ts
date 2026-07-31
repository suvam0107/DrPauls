import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';
import Toast from 'react-native-toast-message';
import { playClickSound } from './feedback';

/**
 * Copies a string to the clipboard with haptic/audio feedback and toast alert.
 */
export async function copyToClipboard(value: string, label?: string) {
  if (!value) return;

  try {
    await Clipboard.setStringAsync(value);

    // Feedback
    playClickSound();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        Vibration.vibrate(30);
      });
    } catch {
      Vibration.vibrate(30);
    }

    Toast.show({
      type: 'success',
      text1: 'Copied to Clipboard',
      text2: label ? `${label}: ${value}` : value,
      position: 'bottom',
      visibilityTime: 2200,
    });
  } catch (error) {
    console.warn('Failed to copy to clipboard:', error);
  }
}
