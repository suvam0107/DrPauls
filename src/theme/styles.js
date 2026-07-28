import { StyleSheet } from 'react-native';

export const createStyles = (theme) => {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    surface: {
      backgroundColor: colors.surface,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
    },
    headerText: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    subtitleText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    captionText: {
      fontSize: 12,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    bodyText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    primaryButton: {
      backgroundColor: colors.text,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
  });
};
