import { makeMutable } from 'react-native-reanimated';

/**
 * Singleton Reanimated shared values for predictive back progress.
 * Kept off the React render cycle for 60fps+ performance.
 */
export const backProgressValue = makeMutable<number>(0);
export const backGestureActive = makeMutable<boolean>(false);
