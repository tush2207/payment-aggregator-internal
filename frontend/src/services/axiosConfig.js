import axios from 'axios';
import { getCookie, removeCookie } from '&src/utils/cookies';
import { encryptPayload, decryptPayload } from '&src/utils/crypto';

const IS_CRYPTO_ENABLED =
  import.meta.env.VITE_E2E_ENCRYPTION_ENABLED === 'true' &&
  !import.meta.env.DEV &&
  import.meta.env.VITE_DEV_MODE !== 'true';

// ── In-Flight Request Deduplication & In-Memory Response Cache ────────────────
const inFlightRequests = new Map();
const apiMemoryCache = new Map();
const DEFAULT_CACHE_TTL_MS = 4000; // 4 seconds TTL for read-only GET requests

export const clearApiCache = () => {
  apiMemoryCache.clear();
};

// Set Headers with Token if Required
const setHeaders = (config, isTokenRequired = true) => {
  if (isTokenRequired) {
    const token = getCookie('accessToken') || (typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};

// Singleton Base API Instance
const defaultBaseURL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/api';
const baseApi = axios.create({
  baseURL: defaultBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
});

// Request Interceptor (JWT Token & AES-256-GCM Payload Encryption when enabled)
baseApi.interceptors.request.use(
  async (config) => {
    config = setHeaders(config);

    // Automatically encrypt outgoing JSON payload only when crypto is strictly enabled
    if (IS_CRYPTO_ENABLED && config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      try {
        const ciphertext = await encryptPayload(config.data);
        config.data = { encrypted_data: ciphertext };
        config.headers['X-Encrypted-Payload'] = 'true';
        config.headers['Accept-Encryption'] = 'aes256gcm';
      } catch (err) {
        console.error('[CRYPTO INTERCEPTOR] Request payload encryption failed:', err);
      }
    } else if (IS_CRYPTO_ENABLED) {
      config.headers['Accept-Encryption'] = 'aes256gcm';
    }

    return config;
  },
  (error) => {
    console.error('API Request Configuration Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (Transparent Decryption & Error Handling)
baseApi.interceptors.response.use(
  async (response) => {
    // If response payload is encrypted, decrypt transparently
    if (response.data && response.data.encrypted && response.data.encrypted_data) {
      try {
        const decrypted = await decryptPayload(response.data.encrypted_data);
        response.data = decrypted;
      } catch (err) {
        console.error('[CRYPTO INTERCEPTOR] Response payload decryption failed:', err);
      }
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED';

    // 401 Unauthorized -> clear token and redirect to login
    if (status === 401) {
      removeCookie('accessToken');
      removeCookie('role');
      removeCookie('username');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // 503 Service Unavailable or Network Error (Backend down)
    if (status === 503 || status === 502 || status === 504 || isNetworkError) {
      console.warn('Backend service is unreachable or returned 503/502/504:', error.message);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('service-health-event', {
            detail: { status: 'down', error: error.message },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

// Handle API Service Errors
const apiServiceErrorHandler = (error) => {
  console.error('API Service Failed:', {
    data: error?.response?.data,
    status: error?.response?.status,
    requestUrl: error?.config?.url,
    message: error?.message,
  });
  throw error;
};

// Handle API Requests with Deduplication & SWR Caching
const handleRequest = async (method, url, payload = {}, config = {}) => {
  try {
    const isGet = method === 'get';
    const cacheKey = isGet ? `${url}_${JSON.stringify(config.params || {})}` : null;
    const now = Date.now();

    // 1. Return cached response for idempotent GET requests if within TTL
    if (isGet && !config.bypassCache && cacheKey && apiMemoryCache.has(cacheKey)) {
      const cached = apiMemoryCache.get(cacheKey);
      if (now - cached.timestamp < (config.cacheTTL || DEFAULT_CACHE_TTL_MS)) {
        return cached.data;
      }
      apiMemoryCache.delete(cacheKey);
    }

    // 2. Return in-flight promise if an identical GET is already resolving
    if (isGet && cacheKey && inFlightRequests.has(cacheKey)) {
      return await inFlightRequests.get(cacheKey);
    }

    // 3. Clear cache on mutations (POST / PUT / DELETE / PATCH)
    if (!isGet) {
      clearApiCache();
    }

    // 4. Execute HTTP Request with Deduplication Promise Tracking
    const executePromise = (async () => {
      let res;
      if (['get', 'delete'].includes(method)) {
        res = await baseApi[method](url, config);
      } else {
        res = await baseApi[method](url, payload, config);
      }

      // Store in memory cache for GETs
      if (isGet && cacheKey) {
        apiMemoryCache.set(cacheKey, {
          data: res,
          timestamp: Date.now(),
        });
      }
      return res;
    })();

    if (isGet && cacheKey) {
      inFlightRequests.set(cacheKey, executePromise);
    }

    try {
      const response = await executePromise;
      return response;
    } finally {
      if (isGet && cacheKey) {
        inFlightRequests.delete(cacheKey);
      }
    }
  } catch (error) {
    apiServiceErrorHandler(error);
  }
};

// Export HTTP Methods
export const getMethod = (url, config = {}) => handleRequest('get', url, null, config);
export const postMethod = (url, data = {}, config = {}) => handleRequest('post', url, data, config);
export const putMethod = (url, data = {}, config = {}) => handleRequest('put', url, data, config);
export const deleteMethod = (url, config = {}) => handleRequest('delete', url, null, config);
export const patchMethod = (url, data = {}, config = {}) => handleRequest('patch', url, data, config);
