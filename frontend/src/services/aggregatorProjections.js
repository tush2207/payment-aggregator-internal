import ApiUrls from "./apiUrls";
import { deleteMethod, getMethod, postMethod } from "./axiosConfig";

const aggregatorProjections = {
  getAllProjections: async (applicationId, aggregatorId, config) => {
    try {
      return await getMethod(ApiUrls.GET_ALL_PROJECTIONS_BY_APP_AGG(applicationId, aggregatorId), config);
    } catch (error) {
      console.error(`Error in GET_ALL_PROJECTIONS_BY_APP_AGG:`, error);
      throw error;
    }
  },

  getProjectionById: async (applicationId, aggregatorId, projectionId, config) => {
    try {
      return await getMethod(ApiUrls.GET_PROJECTION_BY_APP_AGG(applicationId, aggregatorId, projectionId), config);
    } catch (error) {
      console.error(`Error in GET_PROJECTION_BY_APP_AGG:`, error);
      throw error;
    }
  },

  createProjection: async (applicationId, data, config) => {
    try {
      return await postMethod(ApiUrls.CREATE_PROJECTION_BY_APP_AGG, data, config);
    } catch (error) {
      console.error(`Error in CREATE_PROJECTION_BY_APP_AGG:`, error);
      throw error;
    }
  },

  updateProjection: async (applicationId, aggregatorId, data, config) => {
    console.log(applicationId, aggregatorId, data, 'updateProjection')
    try {
      return await postMethod(ApiUrls.UPDATE_PROJECTION_BY_APP_AGG(applicationId, aggregatorId), data, config);
    } catch (error) {
      console.error(`Error in UPDATE_PROJECTION_BY_APP_AGG:`, error);
      throw error;
    }
  },

  updateProjectionByApplication: async (applicationId, data, config) => {
    console.log(applicationId, data, 'updateProjection')
    try {
      return await postMethod(ApiUrls.UPDATE_PROJECTION_BY_APP(applicationId), data, config);
    } catch (error) {
      console.error(`Error in UPDATE_PROJECTION_BY_APP:`, error);
      throw error;
    }
  },

  deleteProjection: async (applicationId, aggregatorId, projectionId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_PROJECTION_BY_APP_AGG(applicationId, aggregatorId, projectionId), config);
    } catch (error) {
      console.error(`Error in DELETE_PROJECTION_BY_APP_AGG:`, error);
      throw error;
    }
  },

  resendQuoteEmail: async (applicationId, aggregatorId, config) => {
    try {
      return await postMethod(ApiUrls.RESEND_QUOTE_EMAIL(applicationId, aggregatorId), {}, config);
    } catch (error) {
      console.error(`Error in RESEND_QUOTE_EMAIL:`, error);
      throw error;
    }
  },
};
export default aggregatorProjections;
