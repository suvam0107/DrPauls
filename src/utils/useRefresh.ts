import { useState, useCallback } from 'react';
import { queryClient } from '../api/queryClient';
import { playClickSound } from './feedback';

export function useRefresh(onCustomRefresh?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    playClickSound();

    try {
      if (onCustomRefresh) {
        await onCustomRefresh();
      }
      await queryClient.invalidateQueries();
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  }, [onCustomRefresh]);

  return { refreshing, onRefresh };
}
