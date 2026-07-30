/**
 * Custom Axios Adapter
 * Intercepts requests to /nested and /nonnested endpoints.
 * Dispatches to handlers based on the request's 'spc' (specific) key.
 */

import { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiRequest, ApiResponse } from './types';
import { nonnestedHandlers } from './handlers/nonnestedHandlers';
import { nestedHandlers } from './handlers/nestedHandlers';

export const customDataStoreAdapter = async (
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse<ApiResponse<unknown>>> => {
  const url = config.url || '';
  let requestBody: ApiRequest;

  if (typeof config.data === 'string') {
    try {
      requestBody = JSON.parse(config.data);
    } catch {
      requestBody = config.data as any;
    }
  } else {
    requestBody = config.data;
  }

  const { spc, payload } = requestBody || {};

  if (!spc) {
    throw new Error(`[API Adapter Error] Missing required 'spc' key in request body.`);
  }

  let resultData: unknown;

  if (url.endsWith('/nested')) {
    const handler = (nestedHandlers as any)[spc];
    if (!handler) {
      throw new Error(`[API Adapter Error] No nested handler registered for spc key '${spc}'`);
    }
    resultData = handler(payload);
  } else if (url.endsWith('/nonnested')) {
    const handler = (nonnestedHandlers as any)[spc];
    if (!handler) {
      throw new Error(`[API Adapter Error] No nonnested handler registered for spc key '${spc}'`);
    }
    resultData = handler(payload);
  } else {
    throw new Error(
      `[API Adapter Error] Invalid endpoint family URL '${url}'. Endpoint must end with /nested or /nonnested.`
    );
  }

  const responsePayload: ApiResponse<unknown> = {
    success: true,
    data: resultData,
    timestamp: new Date().toISOString(),
  };

  return {
    data: responsePayload,
    status: 200,
    statusText: 'OK',
    headers: config.headers,
    config,
  };
};
