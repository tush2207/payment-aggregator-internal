import axios from 'axios';

// Ensure you replace the base URL or rely on your axios instance interceptors
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:1212/api',
});

// Create generic endpoints for the application flow
const applicationFlowService = {
  // Fetch applications for a specific role or generically
  fetchApplications: async (params) => {
    return apiClient.get('/applications', { params });
  },

  // 1. Branch submits application
  submitApplicationBR: async (applicationId) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isApplicationSubmittedBR: true,
      status: 'submitted'
    });
  },

  // 2. Zonal Head reviews application
  reviewByZO: async (applicationId, isApproved) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isReviewByZO: isApproved,
      status: isApproved ? 'approvedbyzo' : 'rejectedbyzo'
    });
  },

  // 3. Regional Head reviews application
  reviewByRO: async (applicationId, isApproved) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isReviewByRO: isApproved,
      status: isApproved ? 'approvedbyro' : 'rejectedbyro'
    });
  },

  // 4. Central Officer (CO) reviews application
  reviewByCO: async (applicationId, isApproved) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isReviewByCO: isApproved,
      status: isApproved ? 'approvedbyco' : 'rejectedbyco'
    });
  },

  // 5. Submit Projections
  submitProjections: async (applicationId, projections) => {
    // Projections payload from ProjectionModal
    return apiClient.post(`/applications/${applicationId}/projections`, {
      projections
    });
  },

  // 6. Add Aggregators
  addAggregators: async (applicationId, aggregatorIds) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isAggregatorAdded: true,
      selectedAggregatorIds: aggregatorIds,
      status: 'aggregatoradded'
    });
  },

  // 7. RO Accepts quote and adds markup
  acceptQuoteRO: async (applicationId, quoteDetails) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isQuoteAcceptRO: true,
      markupDetails: quoteDetails,
      status: 'quoteacceptedro'
    });
  },

  // 8. Final Approval (Customer Acceptance / PO)
  finalApproval: async (applicationId, isApproved) => {
    return apiClient.put(`/applications/${applicationId}`, {
      isFinalApproved: isApproved,
      status: isApproved ? 'finalapproved' : 'rejected'
    });
  }
};

export default applicationFlowService;
