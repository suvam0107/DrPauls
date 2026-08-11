import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
// backProgressValue / backGestureActive are defined in ./backProgress.ts but
// the native gesture-progress API (OnBackAnimationCallback) requires an EAS
// dev build on Android 14+. They are kept as a stub for future native module
// integration but are not wired in the current Expo Go-compatible flow.

export type BackTransitionType = 'slide' | 'fade' | 'scale-fade' | 'vertical' | 'none';

export interface BackHandlerConfig {
  id: string;
  priority: number;
  transition: BackTransitionType;
  onCommit: () => void;
  onCancel?: () => void;
  enabled?: boolean;
}

interface PredictiveBackContextType {
  registerHandler: (config: BackHandlerConfig) => void;
  unregisterHandler: (id: string) => void;
  getActiveHandler: () => BackHandlerConfig | null;
}

const PredictiveBackContext = createContext<PredictiveBackContextType | null>(null);

export function PredictiveBackProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Map<string, BackHandlerConfig>>(new Map());
  const [_, setTick] = useState(0); // Trigger internal re-evaluate if needed

  const registerHandler = useCallback((config: BackHandlerConfig) => {
    handlersRef.current.set(config.id, config);
    setTick((t) => t + 1);
  }, []);

  const unregisterHandler = useCallback((id: string) => {
    handlersRef.current.delete(id);
    setTick((t) => t + 1);
  }, []);

  const getActiveHandler = useCallback((): BackHandlerConfig | null => {
    const active = Array.from(handlersRef.current.values())
      .filter((h) => h.enabled !== false)
      .sort((a, b) => b.priority - a.priority);
    return active.length > 0 ? active[0] : null;
  }, []);

  // Standard BackHandler integration for fallback / hardware back button
  useEffect(() => {
    const onBackPress = () => {
      const active = getActiveHandler();
      if (active) {
        active.onCommit();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [getActiveHandler]);

  return (
    <PredictiveBackContext.Provider value={{ registerHandler, unregisterHandler, getActiveHandler }}>
      {children}
    </PredictiveBackContext.Provider>
  );
}

export function usePredictiveBackContext() {
  const context = useContext(PredictiveBackContext);
  if (!context) {
    throw new Error('usePredictiveBackContext must be used within a PredictiveBackProvider');
  }
  return context;
}
