/**
 * Axios Response Interceptor
 * - Standardizes response payload format
 * - Handles errors cleanly
 * - Logs debug trace in development
 */

import { AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '../types';

export const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
  if (__DEV__) {
    const spc = response.config?.data ? JSON.parse(response.config.data)?.spc : 'unknown';
    console.log(`[API Response] ${response.status} | spc: ${spc}`);
  }
  return response;
};

export const responseErrorInterceptor = (error: AxiosError): Promise<never> => {
  const message = error.message || 'An unexpected API error occurred';
  if (__DEV__) {
    console.error(`[API Error] ${error.config?.url}:`, message);
  }

  const customErrorResponse: ApiResponse<null> = {
    success: false,
    data: null,
    error: message,
    timestamp: new Date().toISOString(),
  };

  return Promise.reject(customErrorResponse);
};
