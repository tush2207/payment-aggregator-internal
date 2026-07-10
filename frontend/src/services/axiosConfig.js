import axios from 'axios';
import { getCookie } from '&src/utils/cookies';

// Create Base API Instance
const createBaseApi = () => {
  const defaultBaseURL = import.meta.env.VITE_BASE_API_URL;

  const baseApi = axios.create({
    baseURL: defaultBaseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
    withCredentials: false,
  });

  baseApi.interceptors.request.use(
    (config) => setHeaders(config),
    (error) => {
      const err = {
        message: error.message || 'Request failed',
        status: error.response?.status,
        data: error.response?.data,
        requestUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      };
      console.error('API Service Failed', err);
      return Promise.reject(error);
    });

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
  console.error("API Service Failed", {
    data: error?.response?.data,
    status: error?.response?.status,
    requestUrl: error?.response?.config?.url,
  });
  throw error; // Rethrow so the caller can handle it if needed
};

// Handle API Requests
const handleRequest = async (method, url, payload = {}, config = {}) => {
  try {
    const baseApi = createBaseApi(config?.baseType);

    if (['get', 'delete'].includes(method)) {
      return await baseApi[method](url, config);
    }

    return await baseApi[method](url, payload, config);
  } catch (error) {
    apiServiceErrorHandler(error);
  }
};

// Export HTTP Methods
export const getMethod = (url, config = {}) => handleRequest("get", url, null, config);
export const postMethod = (url, data = {}, config = {}) => handleRequest("post", url, data, config);
export const putMethod = (url, data = {}, config = {}) => handleRequest("put", url, data, config);
export const deleteMethod = (url, config = {}) => handleRequest("delete", url, null, config);
export const patchMethod = (url, data = {}, config = {}) => handleRequest("patch", url, data, config);
