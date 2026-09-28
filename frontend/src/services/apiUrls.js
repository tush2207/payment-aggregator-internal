const ApiUrls = {
  // ---------------- Auth ----------------
  LOGIN: '/auth/login',
  LEGACY_LOGIN: '/token',
  DEV_LOGIN: '/api/dev-login',
  GET_USER_DETAILS: (userId) => `/get-user-details/${userId}`,

  // ---------------- Locations ----------------
  GET_ZONES: '/applications/locations/zones',
  GET_REGIONS: (zoneId) => (zoneId ? `/applications/locations/regions?zone_id=${encodeURIComponent(zoneId)}` : '/applications/locations/regions'),
  GET_BRANCHES: (zoneId, regionId) => {
    const params = new URLSearchParams();
    if (zoneId) params.append('zone_id', zoneId);
    if (regionId) params.append('region_id', regionId);
    const q = params.toString();
    return q ? `/applications/locations/branches?${q}` : '/applications/locations/branches';
  },
  GET_LOCATION_HIERARCHY: '/applications/locations/hierarchy',

  // ---------------- Applications ----------------
  GET_ALL_APPLICATIONS: (zoneId, page, search, status, category, createdAt, financialYear, month, startDate, endDate, pageSize, branchId, regionId, exportType, userRole) => {
    const safeZoneId = (zoneId === '0' || zoneId === 0 || !zoneId || zoneId === 'undefined' || zoneId === 'null') ? '00000' : zoneId;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (createdAt) params.append('createdAt', createdAt);
    if (financialYear) params.append('financialYear', financialYear);
    if (month) params.append('month', month);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    if (branchId) params.append('branchId', branchId);
    if (regionId) params.append('regionId', regionId);
    if (userRole) params.append('userRole', userRole);
    if (exportType) params.append('export', exportType);
    return `/get-all-applications/${safeZoneId}?${params.toString()}`;
  },

  GET_APPLICATION_BY_ID: (applicationId) => `/get-single-applications/${applicationId}`,
  GET_STAGE_METRICS: `/applications/stage-metrics`,
  GENERATE_SANCTION_LETTER: (applicationId) => `/applications/generate-sanction-letter/${applicationId}`,
  RESEND_PO_EMAIL: (applicationId) => `/applications/${applicationId}/resend-po-email`,
  ADD_APPLICATION: "/applications",
  UPDATE_APPLICATION: (applicationId) => `/applications/${applicationId}`,
  DELETE_APPLICATION: (applicationId) => `/applications/${applicationId}`,
  MARK_NOTIFICATION_READ: (notifId) => `/application-notifications/${notifId}/read`,
  MARK_ALL_NOTIFICATIONS_READ: `/application-notifications/mark-all-read`,


  // ---------------- Files ----------------
  GET_APPLICATIONS_BY_ACCOUNT_NUMBER: (accountNo) => `/applications/${accountNo}`,
  UPLOAD_FILE: "/files/upload",
  DOWNLOAD_FILE: (fileId) => `/files/download/${fileId}`,
  DELETE_FILE: (fileId) => `/files/delete/${fileId}`,

  // ----------------Manage Aggregators ----------------
  GET_ALL_AGGREGATORS: `/all-manage-aggregator`,
  GET_AGGREGATOR_BY_ID: (aggregatorId) =>
    `single-manage-aggregator/${aggregatorId}`,
  ADD_AGGREGATOR: "/manage-aggregator",
  UPDATE_AGGREGATOR: (aggregatorId) => `/manage-aggregator/${aggregatorId}`,
  DELETE_AGGREGATOR: (aggregatorId) => `/manage-aggregator/${aggregatorId}`,
  RESET_AGGREGATOR_CREDENTIALS: (aggregatorId) => `/manage-aggregator/${aggregatorId}/reset-credentials`,
  GET_AGGREGATOR_AUDIT_LOGS: (params = '') => `/manage-aggregator/audit-logs${params ? `?${params}` : ''}`,
  GET_SINGLE_AGGREGATOR_AUDIT_LOGS: (aggregatorId) => `/manage-aggregator/${aggregatorId}/audit-logs`,
  TEST_EMAIL: "/test-email",

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

  RESEND_QUOTE_EMAIL: (applicationId, aggregatorId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/resend-quote-email`,

  REQUEST_QUOTE_NEGOTIATION: (applicationId) =>
    `/applications/${applicationId}/request-negotiation`,

  GET_QUOTE_VERSIONS: (applicationId, aggregatorId) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/quote-versions`,

  GET_QUOTE_VERSION_DETAILS: (applicationId, aggregatorId, version) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/quote-versions/${version}`,

  COMPARE_QUOTE_VERSIONS: (applicationId, aggregatorId, v1, v2) =>
    `/applications/${applicationId}/aggregators/${aggregatorId}/quote-versions-compare?v1=${v1}&v2=${v2}`,

  // ---------------- PO Generator ----------------
  GENERATE_PO: (applicationId, aggregatorId) => `/generate-purchase-order/applicationId/${applicationId}/aggregatorId/${aggregatorId}`,


  // ----------------Help desk----------------
  GET_ALL_HELPDESKS: `/helpdesk/`,
  GET_HELPDESK_BY_ID: (ticketId) =>
    `single-helpdesk/${ticketId}`,
  ADD_HELPDESK: "/helpdesk",
  UPDATE_HELPDESK: (ticketId) => `/helpdesk/${ticketId}`,
  DELETE_HELPDESK: (ticketId) => `/helpdesk/${ticketId}`,
  GET_APPLICATION_QUERIES_SUMMARY: (appId) => `/helpdesk/application/${appId}/summary`,
  ADD_HELPDESK_COMMENT: (ticketId) => `/helpdesk/${ticketId}/comment`,
};

export default ApiUrls;
