import ApiUrls from "./apiUrls";
import { getMethod, postMethod } from "./axiosConfig";

const AuthServices = {
  login: async (data, config) => {
    try {
      const formData  = new URLSearchParams();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      const headers ={
        'Content-Type': 'application/x-www-form-urlencoded',
      }
      return await postMethod(ApiUrls.LOGIN, formData, {...config, headers});
    } catch (error) {
      console.error(`Error in ${ApiUrls.LOGIN}:`, error);
      throw error;
    }
  },
  devLogin: async (data, config) => {
    try {
      return await postMethod(ApiUrls.DEV_LOGIN, data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.DEV_LOGIN}:`, error);
      throw error;
    }
  },
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
