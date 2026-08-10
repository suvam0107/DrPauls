import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of silence.
 * The raw value updates immediately — bind your TextInput to the raw state.
 * Pass the debounced value to query hooks so API calls fire only after the user pauses.
 *
 * @param value   The raw, immediately-updated value (e.g. controlled input state)
 * @param delay   How long to wait after the last change before updating (default 200ms)
 */
export function useDebounce<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
