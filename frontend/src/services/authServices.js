import ApiUrls from "./apiUrls";
import { getMethod, postMethod } from "./axiosConfig";

const AuthServices = {
  // ── Single DEV Login API (Matches bank-unified-portal /auth/dev-token) ──────
  devLogin: async (data = {}, config) => {
    try {
      const pfId = data.pfId || data.username || "145538";
      const role = data.role || "CO";
      return await getMethod(`/auth/dev-token?pfId=${encodeURIComponent(pfId)}&role=${encodeURIComponent(role)}`, config);
    } catch (error) {
      console.error(`Error in /auth/dev-token:`, error);
      throw error;
    }
  },

  // ── Standard LDAP / PROD Login API ──────────────────────────────────────────
  login: async (data, config) => {
    try {
      if (data && typeof data === 'object' && ('data' in data || 'username' in data)) {
        return await postMethod(ApiUrls.LOGIN, data, config);
      }
      const formData = new URLSearchParams();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      return await postMethod(ApiUrls.LOGIN, formData, { ...config, headers });
    } catch (error) {
      console.error(`Error in ${ApiUrls.LOGIN}:`, error);
      throw error;
    }
  },

  // ── Get User Details ────────────────────────────────────────────────────────
  userDetails: async (userId, config) => {
    try {
      return await getMethod(ApiUrls.GET_USER_DETAILS(userId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_USER_DETAILS}:`, error);
      throw error;
    }
  },
};

export default AuthServices;
