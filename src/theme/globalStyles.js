import { StyleSheet } from 'react-native';

/** Build global styles from a color object. Call inside component with useTheme(). */
export const createGlobalStyles = (colors) =>
  StyleSheet.create({
    // Layout
    flex1: { flex: 1 },
    container: { flex: 1, backgroundColor: colors.background },
    safeArea: { flex: 1, backgroundColor: colors.background },
    section: { paddingHorizontal: 16, paddingVertical: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    center: { alignItems: 'center', justifyContent: 'center' },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },

    // Input
    label: { fontSize: 13, fontWeight: '500', color: colors.textMuted, marginBottom: 4 },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 80,
      textAlignVertical: 'top',
    },

    // Buttons
    primaryBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    primaryBtnText: { color: colors.primaryFg, fontWeight: '600', fontSize: 15 },
    ghostBtn: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
    },
    ghostBtnText: { color: colors.primary, fontWeight: '600', fontSize: 15 },
    dangerBtn: {
      backgroundColor: colors.dangerBg,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
    },
    dangerBtnText: { color: colors.danger, fontWeight: '600', fontSize: 14 },

    // Chips
    chip: {
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chipText: { fontSize: 12, fontWeight: '600' },

    // Typography
    h1: { fontSize: 24, fontWeight: '700', color: colors.text },
    h2: { fontSize: 20, fontWeight: '700', color: colors.text },
    h3: { fontSize: 17, fontWeight: '600', color: colors.text },
    body: { fontSize: 15, color: colors.text },
    bodyMuted: { fontSize: 14, color: colors.textMuted },
    caption: { fontSize: 12, color: colors.textMuted },

    // Divider
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },

    // Bottom sheet base
    sheetHandle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: colors.border, alignSelf: 'center', marginBottom: 12,
    },
    sheetHeader: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  });
