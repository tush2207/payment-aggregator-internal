import ApiUrls from "./apiUrls";
import { getMethod, postMethod } from "./axiosConfig";

const auditLogsService = {
  getAuditTrailByApplication: async (applicationId, config) => {
    try {
      return await getMethod(`/api/applications/${applicationId}/audit-trail`, config);
    } catch (error) {
      console.error(`Error fetching audit trail for app ${applicationId}:`, error);
      throw error;
    }
  },

  recordAuditLog: async (logPayload, config) => {
    try {
      return await postMethod("/api/audit-logs", logPayload, config);
    } catch (error) {
      console.warn("Failed to post audit log:", error);
      return null;
    }
  }
};

export default auditLogsService;
