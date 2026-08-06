// Light mode color palette
export interface ColorPalette {
  dark: boolean;
  background: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryFg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  purple: string;
  purpleBg: string;
  cyan: string;
  cyanBg: string;
  shadow: string;
}

export const LIGHT: ColorPalette = {
  dark: false,
  background: '#FFFFFF',
  surface: '#F4F4F5',
  card: '#FFFFFF',
  border: '#E4E4E7',
  text: '#09090B',
  textMuted: '#71717A',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryFg: '#FFFFFF',
  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  purple: '#7C3AED',
  purpleBg: '#F5F3FF',
  cyan: '#0891B2',
  cyanBg: '#ECFEFF',
  shadow: 'rgba(0,0,0,0.08)',
};

// Dark mode color palette — Robinhood Pitch Black + Midnight Blue Tint Style
export const DARK: ColorPalette = {
  dark: true,
  background: '#000000',    // Pure Pitch Black
  surface: '#070A10',       // Blacker surface with slight blue tint
  card: '#0E131F',          // Blacker card with slight blue tint
  border: '#171F2E',        // Dark midnight blue border stroke
  text: '#FFFFFF',          // High contrast crisp white
  textMuted: '#808D9E',     // Blue-tinted soft slate secondary text
  primary: '#3875F6',       // Electric Robinhood Blue
  primaryLight: '#0E1E3B',  // Midnight blue container tint
  primaryFg: '#FFFFFF',
  success: '#00C805',       // Signature Robinhood Emerald Green
  successBg: '#042211',     // Midnight emerald container tint
  warning: '#FF9500',       // Robinhood Amber / Gold
  warningBg: '#221402',     // Midnight amber container tint
  danger: '#FF3B30',        // Vivid Signal Red
  dangerBg: '#240809',      // Midnight red container tint
  purple: '#A855F7',        // Neon Electric Purple
  purpleBg: '#1B0C30',      // Midnight purple container tint
  cyan: '#00D5E6',          // Electric Cyan
  cyanBg: '#031E2A',        // Midnight cyan container tint
  shadow: 'rgba(0,0,0,0.9)',
};
