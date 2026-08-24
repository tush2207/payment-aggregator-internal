import ApiUrls from "./apiUrls";
import { deleteMethod, getMethod, postMethod, putMethod } from "./axiosConfig";

const manageAggregatorServices = {
  // 🔹 Get all aggregators
  getAllAggregators: async (config) => {
    try {
      return await getMethod(ApiUrls.GET_ALL_AGGREGATORS, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_ALL_AGGREGATORS}:`, error);
      throw error;
    }
  },

  // 🔹 Get aggregator by ID
  getAggregatorById: async (aggregatorId, config) => {
    try {
      return await getMethod(ApiUrls.GET_AGGREGATOR_BY_ID(aggregatorId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_AGGREGATOR_BY_ID(aggregatorId)}:`, error);
      throw error;
    }
  },

  // 🔹 Add aggregator
  addAggregator: async (data, config) => {
    try {
      return await postMethod(ApiUrls.ADD_AGGREGATOR, data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.ADD_AGGREGATOR}:`, error);
      throw error;
    }
  },

  // 🔹 Update aggregator
  updateAggregator: async (aggregatorId, data, config) => {
    try {
      return await putMethod(ApiUrls.UPDATE_AGGREGATOR(aggregatorId), data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.UPDATE_AGGREGATOR(aggregatorId)}:`, error);
      throw error;
    }
  },

  // 🔹 Delete aggregator
  deleteAggregator: async (aggregatorId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_AGGREGATOR(aggregatorId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.DELETE_AGGREGATOR(aggregatorId)}:`, error);
      throw error;
    }
  },

  // 🔹 Test Email Dispatch
  testEmail: async (data, config) => {
    try {
      return await postMethod(ApiUrls.TEST_EMAIL, data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.TEST_EMAIL}:`, error);
      throw error;
    }
  },
};
export default manageAggregatorServices;
