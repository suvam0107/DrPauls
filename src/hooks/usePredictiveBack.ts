import { useEffect, useId, useRef } from 'react';
import { usePredictiveBackContext, BackTransitionType, BackHandlerConfig } from '../utils/PredictiveBackContext';

export interface UsePredictiveBackOptions {
  id?: string;
  priority: number;
  transition: BackTransitionType;
  onCommit: () => void;
  onCancel?: () => void;
  enabled?: boolean;
}

export function usePredictiveBack(options: UsePredictiveBackOptions) {
  const { registerHandler, unregisterHandler } = usePredictiveBackContext();
  const generatedId = useId();
  const handlerId = options.id || generatedId;

  // Use refs to avoid re-registering on inline function changes
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (options.enabled === false) {
      unregisterHandler(handlerId);
      return;
    }

    const config: BackHandlerConfig = {
      id: handlerId,
      priority: optionsRef.current.priority,
      transition: optionsRef.current.transition,
      onCommit: () => optionsRef.current.onCommit(),
      onCancel: () => optionsRef.current.onCancel?.(),
      enabled: optionsRef.current.enabled ?? true,
    };

    registerHandler(config);

    return () => {
      unregisterHandler(handlerId);
    };
  }, [
    handlerId,
    options.priority,
    options.transition,
    options.enabled,
    registerHandler,
    unregisterHandler,
  ]);
}
