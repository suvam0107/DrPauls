import { useState, useCallback, useRef, useEffect } from 'react';
import { queryClient } from '../api/queryClient';
import { playClickSound } from './feedback';

export function useRefresh(onCustomRefresh?: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
        if (mountedRef.current) {
          setRefreshing(false);
        }
      }, 400);
    }
  }, [onCustomRefresh]);

  return { refreshing, onRefresh };
}
