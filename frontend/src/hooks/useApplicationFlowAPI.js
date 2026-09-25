import { useState } from 'react';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import applicationServices from '&src/services/applications';

/**
 * Custom hook to handle real backend API calls for the Application Flow.
 */
export default function useApplicationFlowAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const handleApiCall = async (apiFunction, successMessage, errorMessage = "Failed to complete operation") => {
    setIsLoading(true);
    try {
      const response = await apiFunction();
      successNotification(successMessage);
      return { success: true, data: response };
    } catch (error) {
      console.error(error);
      errorNotification(error?.response?.data?.message || errorMessage);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Branch Submit Application
  const submitApplicationBranch = async (applicationId, data = {}) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          ...data,
          isApplicationSubmittedBR: true,
          status: 'applicationSubmitted',
        });
      },
      "Application submitted by Branch successfully."
    );
  };

  // 2. ZO Review
  const submitReviewZO = async (applicationId, statusVal, files) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          isReviewByZO: statusVal === 'approved' || statusVal === true,
          status: statusVal === 'approved' || statusVal === true ? 'approvedbyzo' : 'rejectedbyzo',
          zhRecommendationFile: files?.zhRecommendationFile || null,
        });
      },
      `ZO review recorded successfully.`
    );
  };

  // 3. RO Review
  const submitReviewRO = async (applicationId, statusVal, files) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          isReviewByRO: statusVal === 'approved' || statusVal === true,
          status: statusVal === 'approved' || statusVal === true ? 'approvedbyro' : 'rejectedbyro',
          rhRecommendationFile: files?.rhRecommendationFile || null,
        });
      },
      `RO review recorded successfully.`
    );
  };

  // 4. CO Review
  const submitReviewCO = async (applicationId, statusVal) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          isReviewByCO: statusVal === 'approved' || statusVal === true,
          status: statusVal === 'approved' || statusVal === true ? 'approvedbyco' : 'rejectedbyco',
        });
      },
      `CO review recorded successfully.`
    );
  };

  // 5. Update Projections
  const updateProjections = async (applicationId, projectionsData = {}) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          ...projectionsData,
          isProjectionAdded: true,
          status: 'projectionadded',
        });
      },
      "Projections updated successfully."
    );
  };

  // 6. Add Aggregators & Send for Quote
  const addAggregators = async (applicationId, aggregatorIds) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          isAggregatorAdded: true,
          status: 'quoterequested',
        });
      },
      "Aggregators assigned and sent for quotes successfully."
    );
  };

  // 7. Add Markup and send to RO
  const addMarkupAndSendToRO = async (applicationId, markupDetails = {}) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          ...markupDetails,
          isMarkUpAddedCO: true,
          isQuoteReviewCO: true,
          status: 'reviewquote',
        });
      },
      "Markup added and sent to RO successfully."
    );
  };

  // 8. Customer Acceptance (by RO)
  const submitCustomerAcceptance = async (applicationId, fileData = {}) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          ...fileData,
          isQuoteAcceptRO: true,
          status: 'quoteaccepted',
        });
      },
      "Customer acceptance recorded successfully."
    );
  };

  // 9. PO Details Freeze (Final Approval)
  const finalizeApplicationPO = async (applicationId, poDetails = {}) => {
    return handleApiCall(
      async () => {
        return await applicationServices.updateApplication(applicationId, {
          ...poDetails,
          isFinalApproved: true,
          status: 'finalapproved',
        });
      },
      "Purchase Order finalized and application approved."
    );
  };

  return {
    isLoading,
    submitApplicationBranch,
    submitReviewZO,
    submitReviewRO,
    submitReviewCO,
    updateProjections,
    addAggregators,
    addMarkupAndSendToRO,
    submitCustomerAcceptance,
    finalizeApplicationPO,
  };
}

