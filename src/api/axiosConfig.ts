/**
 * Axios Client Configuration
 * Sets up base URL, custom file-system adapter, and interceptor pipeline.
 */

import axios, { AxiosInstance } from 'axios';
import { customDataStoreAdapter } from './adapter';
import { requestInterceptor } from './interceptors/requestInterceptor';
import { responseInterceptor, responseErrorInterceptor } from './interceptors/responseInterceptor';

export const BASE_URL = 'http://drpauls.local/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  adapter: customDataStoreAdapter,
});

// Register request interceptors
apiClient.interceptors.request.use(requestInterceptor, (err) => Promise.reject(err));

// Register response interceptors
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
