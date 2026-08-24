import ApiUrls from "./apiUrls";
import { getMethod, postMethod, putMethod, deleteMethod } from "./axiosConfig";

const aggregatorByApplication = {
  getAllAggregatorsByApplication: async (applicationId, config) => {
    try {
      return await getMethod(ApiUrls.GET_ALL_AGGREGATORS_BY_APPLICATION(applicationId), config);
    } catch (error) {
      console.error(`Error in GET_ALL_AGGREGATORS_BY_APPLICATION:`, error);
      throw error;
    }
  },

  getAggregatorsByApplication: async (applicationId, config) => {
    try {
      return await getMethod(ApiUrls.GET_ALL_AGGREGATORS_BY_APPLICATION(applicationId), config);
    } catch (error) {
      console.error(`Error in getAggregatorsByApplication:`, error);
      throw error;
    }
  },

  getAggregatorByApplication: async (applicationId, aggregatorId, config) => {
    try {
      return await getMethod(ApiUrls.GET_AGGREGATOR_BY_APPLICATION(applicationId, aggregatorId), config);
    } catch (error) {
      console.error(`Error in GET_AGGREGATOR_BY_APPLICATION:`, error);
      throw error;
    }
  },

  createAggregatorByApplication: async (applicationId, data, config) => {
    try {
      return await postMethod(ApiUrls.CREATE_AGGREGATOR_BY_APPLICATION, data, config);
    } catch (error) {
      console.error(`Error in CREATE_AGGREGATOR_BY_APPLICATION:`, error);
      throw error;
    }
  },

  updateAggregatorByApplication: async (applicationId, aggregatorId, data, config) => {
    try {
      return await putMethod(ApiUrls.UPDATE_AGGREGATOR_BY_APPLICATION(applicationId,aggregatorId), data, config);
    } catch (error) {
      console.error(`Error in UPDATE_AGGREGATOR_BY_APPLICATION:`, error);
      throw error;
    }
  },

  deleteAggregatorByApplication: async (applicationId, aggregatorId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_AGGREGATOR_BY_APPLICATION(applicationId, aggregatorId), config);
    } catch (error) {
      console.error(`Error in DELETE_AGGREGATOR_BY_APPLICATION:`, error);
      throw error;
    }
  },
};

export default aggregatorByApplication
