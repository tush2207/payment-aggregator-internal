const ApiUrls = {
  // ---------------- Auth ----------------
  LOGIN: '/token',
  DEV_LOGIN: '/dev-login',
  GET_USER_DETAILS: (userId) => `/get-user-details/${userId}`,

  // ---------------- Applications ----------------
  GET_ALL_APPLICATIONS: (zoneId, page, search, status, category, createdAt) => `/get-all-applications/${zoneId}?status=${status}&search=${search}&createdAt=${createdAt}`,

  // GET_ALL_APPLICATIONS: (zoneId, page, search, status, category) => `/get-all-applications/${zoneId}/?page=${page}&search=${search}&status=${status}&category=${category}`,
  GET_APPLICATION_BY_ID: (applicationId) => `/get-single-applications/${applicationId}`,
  ADD_APPLICATION: "/applications",
  UPDATE_APPLICATION: (applicationId) => `/applications-sunil/${applicationId}`,
  DELETE_APPLICATION: (applicationId) => `/applications/${applicationId}`,

  // ---------------- Files ----------------
  GET_APPLICATIONS_BY_ACCOUNT_NUMBER: (accountNo) => `/applications/${accountNo}`,
  UPLOAD_FILE: "/files/upload",
  DOWNLOAD_FILE: (fileId) => `/files/download/${fileId}`,

  // ----------------Manage Aggregators ----------------
  GET_ALL_AGGREGATORS: `/all-manage-aggregator`,
  GET_AGGREGATOR_BY_ID: (aggregatorId) =>
    `single-manage-aggregator/${aggregatorId}`,
  ADD_AGGREGATOR: "/manage-aggregator/plain",
  UPDATE_AGGREGATOR: (aggregatorId) => `/manage-aggregator/${aggregatorId}`,
  DELETE_AGGREGATOR: (aggregatorId) => `/manage-aggregator/${aggregatorId}`,

  // ---------------- Aggregators by Application ----------------

  GET_ALL_AGGREGATORS_BY_APPLICATION: (applicationId) =>
    `/all-payment-aggregator/${applicationId}`,
  GET_AGGREGATOR_BY_APPLICATION: (applicationId) =>
    `all-payment-aggregator/${applicationId}`,
  CREATE_AGGREGATOR_BY_APPLICATION: `/applications/payment-aggregators`,
  UPDATE_AGGREGATOR_BY_APPLICATION: (applicationId, aggregatorId) =>
    `payment-aggregator/application/${applicationId}/aggregator/${aggregatorId}`,
  DELETE_AGGREGATOR_BY_APPLICATION: (aggregatorId) =>
    `payment-aggregator/${aggregatorId}`,

  // ---------------- Projections by Application & Aggregator ----------------
  GET_ALL_PROJECTIONS_BY_APP_AGG: (applicationId, aggregatorId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/projections`,

  GET_PROJECTION_BY_APP_AGG: (applicationId, aggregatorId, projectionId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/projections/${projectionId}`,

  CREATE_PROJECTION_BY_APP_AGG: `applications/aggregators/complex-projections`,

  UPDATE_PROJECTION_BY_APP_AGG: (applicationId, aggregatorId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/projections`,

  DELETE_PROJECTION_BY_APP_AGG: (applicationId, aggregatorId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/projections`,


  UPDATE_PROJECTION_BY_APP: (applicationId) =>
    `/applications/bulk-update-charges/${applicationId}`,

  // ---------------- PO Generator ----------------
  GENERATE_PO: (applicationId, aggregatorId) => `/generate-purchase-order/applicationId/${applicationId}/aggregatorId/${aggregatorId}`,


  // ----------------Help desk----------------
  GET_ALL_HELPDESKS: `/helpdesk/`,
  GET_HELPDESK_BY_ID: (ticketId) =>
    `single-helpdesk/${ticketId}`,
  ADD_HELPDESK: "/helpdesk",
  UPDATE_HELPDESK: (ticketId) => `/helpdesk/${ticketId}`,
  DELETE_HELPDESK: (ticketId) => `/helpdesk/${ticketId}`,
};

export default ApiUrls;
