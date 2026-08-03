import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface AppRefreshControlProps extends Omit<RefreshControlProps, 'colors' | 'tintColor' | 'progressBackgroundColor'> {
  refreshing: boolean;
  onRefresh: () => void;
}

/** Theme-aligned Refresh Control component matching Dr. Paul's Clinic Light & Dark mode theme tokens */
export default function AppRefreshControl({ refreshing, onRefresh, ...props }: AppRefreshControlProps) {
  const { colors } = useTheme();

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
      progressBackgroundColor={colors.card}
      title="Pull to refresh..."
      titleColor={colors.textMuted}
      {...props}
    />
  );
}
