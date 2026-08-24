import ApiUrls from "./apiUrls";
import { getMethod, postMethod, putMethod, deleteMethod } from "./axiosConfig";

const applicationServices = {
  // 🔹 Get all applications
  getAllApplications: async ({ zoneId, page, search, status, category, createdAt, financialYear, month, startDate, endDate, pageSize, branchId, regionId, exportType, config } = {}) => {
    console.log('getAllApplicationsprops', zoneId, page, search, status, category, createdAt, financialYear, month, startDate, endDate, pageSize, branchId, regionId, exportType)

    try {
      const response = await getMethod(ApiUrls.GET_ALL_APPLICATIONS(zoneId, page, search, status, category, createdAt, financialYear, month, startDate, endDate, pageSize, branchId, regionId, exportType), config);
      if (response && response.data) {
        const mapApp = (app) => {
          if (!app) return app;
          return {
            ...app,
            isProjectionAdded: Boolean(app.isProjectionAdded) || app.status === "projectionadded",
            isAggregatorAdded: Boolean(app.isAggregatorAdded) || app.status === "quoterequested",
            isMarkUpAddedCO: Boolean(app.isMarkUpAddedCO) || app.status === "markupadded",
            isQuoteAcceptRO: Boolean(app.isQuoteAcceptRO) || app.status === "quoteaccepted",
            isFinalApproved: Boolean(app.isFinalApproved) || app.status === "finalapproved"
          };
        };

        if (Array.isArray(response.data.data)) {
          response.data.data = response.data.data.map(mapApp);
        } else if (Array.isArray(response.data)) {
          response.data = response.data.map(mapApp);
        }
      }
      return response;
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_ALL_APPLICATIONS}:`, error);
      throw error;
    }
  },

  // 🔹 Get application by ID
  getApplicationById: async (applicationId, config) => {
    try {
      const response = await getMethod(ApiUrls.GET_APPLICATION_BY_ID(applicationId), config);
      if (response && response.data) {
        const mapApp = (app) => {
          if (!app) return app;
          return {
            ...app,
            isProjectionAdded: Boolean(app.isProjectionAdded) || app.status === "projectionadded",
            isAggregatorAdded: Boolean(app.isAggregatorAdded) || app.status === "quoterequested",
            isMarkUpAddedCO: Boolean(app.isMarkUpAddedCO) || app.status === "markupadded",
            isQuoteAcceptRO: Boolean(app.isQuoteAcceptRO) || app.status === "quoteaccepted",
            isFinalApproved: Boolean(app.isFinalApproved) || app.status === "finalapproved"
          };
        };

        if (response.data.data) {
          response.data.data = mapApp(response.data.data);
        } else {
          response.data = mapApp(response.data);
        }
      }
      return response;
    } catch (error) {
      console.error(`Error in ${ApiUrls.GET_APPLICATION_BY_ID(applicationId)}:`, error);
      throw error;
    }
  },

  // 🔹 Add new application
  addApplication: async (data, config) => {
    try {
      return await postMethod(ApiUrls.ADD_APPLICATION, data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.ADD_APPLICATION}:`, error);
      throw error;
    }
  },

  // 🔹 Update application
  updateApplication: async (applicationId, data, config) => {
    try {
      return await putMethod(ApiUrls.UPDATE_APPLICATION(applicationId), data, config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.UPDATE_APPLICATION(applicationId)}:`, error);
      throw error;
    }
  },

  // 🔹 Delete application
  deleteApplication: async (applicationId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_APPLICATION(applicationId), config);
    } catch (error) {
      console.error(`Error in ${ApiUrls.DELETE_APPLICATION(applicationId)}:`, error);
      throw error;
    }
  },

  // 🔹 Upload file
  uploadFile: async (file, config) => {
    try {
      const formData = file;
      return await postMethod(ApiUrls.UPLOAD_FILE, formData, {
        ...config,
        baseType: 'loginMockApi',
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      console.error(`Error in ${ApiUrls.UPLOAD_FILE}:`, error);
      throw error;
    }
  },

  // 🔹 Download file
  downloadFile: async (filename, config) => {
    try {
      const response = await getMethod(ApiUrls.DOWNLOAD_FILE(filename), {
        ...config,
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error(`Error in ${ApiUrls.DOWNLOAD_FILE(filename)}:`, error);
      throw error;
    }
  },

  // 🔹 Delete file
  deleteFile: async (fileId, config) => {
    try {
      return await deleteMethod(ApiUrls.DELETE_FILE(fileId), {
        ...config,
        baseType: 'loginMockApi',
      });
    } catch (error) {
      console.error(`Error in ${ApiUrls.DELETE_FILE(fileId)}:`, error);
      throw error;
    }
  },

  generatePO: async (applicationId, aggregatorId, data, config) => {

    try {
      console.log(applicationId, aggregatorId, data, config, 'generatePO')
      const response = await getMethod(ApiUrls.GENERATE_PO(applicationId, aggregatorId), data, {
        ...config,
        responseType: "blob",
      });
      return response;
    } catch (error) {
      console.error(`Error in ${ApiUrls.GENERATE_PO(applicationId, aggregatorId)}:`, error);
      throw error;
    }
  },

  // 🔹 Get stage counts and KPI metrics
  getStageMetrics: async (params = {}, config) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.zoneId) queryParams.append('zoneId', params.zoneId);
      if (params.branchId) queryParams.append('branchId', params.branchId);
      if (params.regionId) queryParams.append('regionId', params.regionId);
      if (params.financialYear) queryParams.append('financialYear', params.financialYear);
      if (params.month) queryParams.append('month', params.month);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.search) queryParams.append('search', params.search);

      const url = `${ApiUrls.GET_STAGE_METRICS}?${queryParams.toString()}`;
      return await getMethod(url, config);
    } catch (error) {
      console.error('Error in getStageMetrics:', error);
      throw error;
    }
  },

};

export default applicationServices;
