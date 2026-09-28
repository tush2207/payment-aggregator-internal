import ApiUrls from "./apiUrls";
import { getMethod, postMethod, putMethod, deleteMethod } from "./axiosConfig";

const HelpdeskServices = {
  //  Get all Helpdesks
  getAllHelpdesks: async (config) => {
    try {
      return await getMethod(ApiUrls.GET_ALL_HELPDESKS, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_ALL_HELPDESKS}:`, error);
      throw error;
    }
  },

  //  Get Helpdesk by ID
  getHelpdeskById: async (ticketId, config) => {
    try {
      return await getMethod(ApiUrls.GET_HELPDESK_BY_ID(ticketId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_HELPDESK_BY_ID(ticketId)}:`, error);
      throw error;
    }
  },

  //  Add new Helpdesk
  addHelpdesk: async (data, config) => {
    try {
      return await postMethod(ApiUrls.ADD_HELPDESK, data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.ADD_HELPDESK}:`, error);
      throw error;
    }
  },

  //  Update Helpdesk
  updateHelpdesk: async (ticketId, data, config) => {
    try {
      return await putMethod(ApiUrls.UPDATE_HELPDESK(ticketId), data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.UPDATE_HELPDESK(ticketId)}:`, error);
      throw error;
    }
  },

  //  Delete Helpdesk
  deleteHelpdesk: async (ticketId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_HELPDESK(ticketId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.DELETE_HELPDESK(ticketId)}:`, error);
      throw error;
    }
  },

  //  Get Application Queries Summary (counts & read-only status)
  getApplicationQueriesSummary: async (applicationId, config) => {
    try {
      return await getMethod(ApiUrls.GET_APPLICATION_QUERIES_SUMMARY(applicationId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_APPLICATION_QUERIES_SUMMARY(applicationId)}:`, error);
      throw error;
    }
  },

  //  Add comment or revert to ticket
  addTicketComment: async (ticketId, data, config) => {
    try {
      return await postMethod(ApiUrls.ADD_HELPDESK_COMMENT(ticketId), data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.ADD_HELPDESK_COMMENT(ticketId)}:`, error);
      throw error;
    }
  }

};

export default HelpdeskServices
