import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Vibration } from 'react-native';

// Allow Expo audio playback to mix with other media and behave like standard system sound
try {
  setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  });
} catch (error) {
  console.warn('Failed to configure feedback audio mode:', error);
}

// Audio Player Instances for the 7 UI sound assets
let clickPlayer: any = null;
let navigationPlayer: any = null;
let confirmationPlayer: any = null;
let loginPlayer: any = null;
let logoutPlayer: any = null;
let appointmentSuccessPlayer: any = null;
let appointmentFailurePlayer: any = null;

try {
  clickPlayer = createAudioPlayer(require('../../assets/audio/click.wav'));
  navigationPlayer = createAudioPlayer(require('../../assets/audio/navigation.wav'));
  confirmationPlayer = createAudioPlayer(require('../../assets/audio/confirmation.wav'));
  loginPlayer = createAudioPlayer(require('../../assets/audio/login.wav'));
  logoutPlayer = createAudioPlayer(require('../../assets/audio/logout.wav'));
  appointmentSuccessPlayer = createAudioPlayer(require('../../assets/audio/appointment_update_success.wav'));
  appointmentFailurePlayer = createAudioPlayer(require('../../assets/audio/appointment_update_failure.wav'));
} catch (error) {
  console.warn('Failed to initialize feedback audio players:', error);
}

let lastFeedbackTime = 0;
let lastPriority = 0; // Priority hierarchy: 1 = Click, 2 = OS Navigation, 3 = Confirmation/Auth/Toast

/**
 * Executes audio playback and haptic vibration feedback with strict priority guards
 * to prevent double-triggering or overlapping audio clips.
 */
function playAudioAndHaptic(
  player: any,
  hapticType: 'short' | 'medium',
  priority: number,
  cooldownMs: number = 80
) {
  const now = Date.now();

  // Overlap Guard: Suppress lower priority feedback if higher priority feedback fired recently (< 250ms)
  if (now - lastFeedbackTime < 250 && priority < lastPriority) {
    return;
  }

  // Rapid Fire Cooldown: Avoid audio stacking/glitching for identical priority within cooldown window
  if (now - lastFeedbackTime < cooldownMs && priority === lastPriority) {
    return;
  }

  lastFeedbackTime = now;
  lastPriority = priority;

  // 1. Haptic Vibration Feedback
  try {
    if (hapticType === 'short') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        Vibration.vibrate(15);
      });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
        Vibration.vibrate(35);
      });
    }
  } catch {
    Vibration.vibrate(hapticType === 'short' ? 15 : 35);
  }

  // 2. Audio Playback
  if (player) {
    try {
      if (typeof player.seekTo === 'function') {
        player.seekTo(0).then(() => {
          player.play();
        }).catch(() => {
          try {
            player.play();
          } catch {}
        });
      } else {
        player.play();
      }
    } catch {
      // Catch playback errors silently
    }
  }
}

/**
 * 1. click.wav: Short haptic feedback for UI clicks & taps
 */
export function playClickSound() {
  playAudioAndHaptic(clickPlayer, 'short', 1, 60);
}

/**
 * 2. navigation.wav: Short haptic feedback for OS back button/gesture navigation
 */
export function playNavigationSound() {
  playAudioAndHaptic(navigationPlayer, 'short', 2, 100);
}

/**
 * 3. confirmation.wav: Short haptic feedback for confirmation modals (logout & exit app)
 */
export function playConfirmationSound() {
  playAudioAndHaptic(confirmationPlayer, 'short', 3, 150);
}

/**
 * 4. login.wav: Medium haptic feedback on successful user login
 */
export function playLoginSound() {
  playAudioAndHaptic(loginPlayer, 'medium', 3, 200);
}

/**
 * 5. logout.wav: Medium haptic feedback on successful user sign out
 */
export function playLogoutSound() {
  playAudioAndHaptic(logoutPlayer, 'medium', 3, 200);
}

/**
 * 6. appointment_update_success.wav: Medium haptic feedback on successful appointment update toast
 */
export function playAppointmentSuccessSound() {
  playAudioAndHaptic(appointmentSuccessPlayer, 'medium', 3, 200);
}

/**
 * 7. appointment_update_failure.wav: Medium haptic feedback on failed appointment update toast
 */
export function playAppointmentFailureSound() {
  playAudioAndHaptic(appointmentFailurePlayer, 'medium', 3, 200);
}

/**
 * 8. Session marked attended sound
 */
export function playSessionMarkedSound() {
  playAudioAndHaptic(appointmentSuccessPlayer, 'medium', 3, 150);
}

/**
 * 9. Session cancelled sound
 */
export function playSessionCancelledSound() {
  playAudioAndHaptic(appointmentFailurePlayer, 'medium', 3, 150);
}

/**
 * 10. Package enrollment created sound
 */
export function playEnrollmentCreatedSound() {
  playAudioAndHaptic(confirmationPlayer, 'medium', 3, 200);
}

