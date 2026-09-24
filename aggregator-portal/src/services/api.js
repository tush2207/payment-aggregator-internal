import axios from 'axios';
import { encryptPayload, decryptPayload } from '../utils/crypto';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/aggregator';
const IS_PROD = import.meta.env.PROD || import.meta.env.VITE_DEV_MODE === 'false' || import.meta.env.VITE_E2E_ENCRYPTION_ENABLED === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT Bearer Token & Transparent AES-256-GCM Encryption
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('aggregator_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // In PROD mode (or when explicitly requested), encrypt outgoing request payload
    if (IS_PROD && config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      try {
        const ciphertext = await encryptPayload(config.data);
        config.data = { encrypted_data: ciphertext };
        config.headers['X-Encrypted-Payload'] = 'true';
        config.headers['Accept-Encryption'] = 'aes256gcm';
      } catch (err) {
        console.error('[CRYPTO INTERCEPTOR] Request encryption failed:', err);
      }
    } else if (IS_PROD) {
      config.headers['Accept-Encryption'] = 'aes256gcm';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expiry (401) & Transparent Decryption
api.interceptors.response.use(
  async (response) => {
    // If response was encrypted by server, transparently decrypt before returning to caller
    if (response.data && response.data.encrypted && response.data.encrypted_data) {
      try {
        const decrypted = await decryptPayload(response.data.encrypted_data);
        response.data = decrypted;
      } catch (err) {
        console.error('[CRYPTO INTERCEPTOR] Response decryption failed:', err);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('aggregator_token');
      localStorage.removeItem('aggregator_profile');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  getCaptcha: async () => {
    const res = await api.get('/auth/captcha');
    return res.data;
  },
  login: async (payload) => {
    const res = await api.post('/auth/login', payload);
    return res.data;
  },
  resetPassword: async (payload) => {
    const res = await api.post('/auth/reset-password', payload);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('aggregator_token');
    localStorage.removeItem('aggregator_profile');
    window.location.href = '/login';
  },
};

export const rfqService = {
  getAssignedRfqs: async () => {
    const res = await api.get('/rfqs');
    return res.data;
  },
  getRfqDetails: async (applicationId) => {
    const res = await api.get(`/rfqs/${applicationId}`);
    return res.data;
  },
  submitQuote: async (applicationId, payload) => {
    const res = await api.post(`/rfqs/${applicationId}/quote`, payload);
    return res.data;
  },
};

export default api;
