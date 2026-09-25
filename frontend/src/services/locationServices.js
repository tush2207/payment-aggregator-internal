import { getMethod } from './axiosConfig';
import ApiUrls from './apiUrls';

export const locationServices = {
  getZones: async (config = {}) => {
    return await getMethod(ApiUrls.GET_ZONES, config);
  },

  getRegions: async (zoneId = null, config = {}) => {
    return await getMethod(ApiUrls.GET_REGIONS(zoneId), config);
  },

  getBranches: async (zoneId = null, regionId = null, config = {}) => {
    return await getMethod(ApiUrls.GET_BRANCHES(zoneId, regionId), config);
  },

  getLocationHierarchy: async (config = {}) => {
    return await getMethod(ApiUrls.GET_LOCATION_HIERARCHY, config);
  },
};

export default locationServices;
