import axios from 'axios';
import { getCookie, removeCookie } from '&src/utils/cookies';

// Create Base API Instance
const createBaseApi = () => {
  const defaultBaseURL = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/api';

  const baseApi = axios.create({
    baseURL: defaultBaseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
    withCredentials: false,
  });

  // Request Interceptor
  baseApi.interceptors.request.use(
    (config) => setHeaders(config),
    (error) => {
      console.error('API Request Configuration Error:', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  baseApi.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const isNetworkError = !error.response && error.code !== 'ECONNABORTED';

      // 401 Unauthorized -> clear token and redirect to login
      if (status === 401) {
        removeCookie('accessToken');
        removeCookie('role');
        removeCookie('username');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 503 Service Unavailable or Network Error (Backend down)
      if (status === 503 || status === 502 || status === 504 || isNetworkError) {
        console.warn('Backend service is unreachable or returned 503/502/504:', error.message);
        // Dispatch custom window event so UI can show notifications or redirect if needed
        window.dispatchEvent(
          new CustomEvent('service-health-event', {
            detail: { status: 'down', error: error.message },
          })
        );
      }

      return Promise.reject(error);
    }
  );

  return baseApi;
};

// Set Headers with Token if Required
const setHeaders = (config, isTokenRequired = true) => {
  if (isTokenRequired) {
    const token = getCookie('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};

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

// Handle API Requests
const handleRequest = async (method, url, payload = {}, config = {}) => {
  try {
    const baseApi = createBaseApi();

    if (['get', 'delete'].includes(method)) {
      return await baseApi[method](url, config);
    }

    return await baseApi[method](url, payload, config);
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
