import { useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import useUIStore from '../store/useUIStore';

export function useScrollNavbar() {
  const setNavVisible = useUIStore((s) => s.setNavVisible);
  const lastY = useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;

    // Keep navbar visible when near top of scroll container
    if (currentY <= 10) {
      setNavVisible(true);
      lastY.current = currentY;
      return;
    }

    const diff = currentY - lastY.current;
    if (Math.abs(diff) > 8) {
      if (diff > 0) {
        // Scrolling down -> translate navbar offscreen
        setNavVisible(false);
      } else {
        // Scrolling up -> translate navbar back on screen
        setNavVisible(true);
      }
      lastY.current = currentY;
    }
  };

  return { handleScroll };
}
