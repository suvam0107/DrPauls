/**
 * Axios Request Interceptor
 * - Attaches Bearer JWT token from AsyncStorage / Auth state
 * - Injects request timestamp
 * - Logs request debug details
 */

import { InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_TOKEN = '@drpauls_jwt_token';

export const requestInterceptor = async (
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage read errors in interceptor
  }

  // Add metadata headers
  config.headers['X-Request-Timestamp'] = new Date().toISOString();

  // Clean console debug log
  if (__DEV__) {
    const spc = config.data?.spc || 'unknown';
    const url = config.url || '';
    console.log(`[API Request] POST ${url} | spc: ${spc}`);
  }

  return config;
};
