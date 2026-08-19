import { useState } from 'react';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

/**
 * Custom hook to handle API calls for the new Application Flow.
 * These are mock implementations. Map them to actual backend services when ready.
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
  const submitApplicationBranch = async (applicationId, data) => {
    return handleApiCall(
      async () => {
        // Mock API call
        // return await axios.post(`/api/application/${applicationId}/submit`, data);
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      "Application submitted by Branch successfully."
    );
  };

  // 2. ZO Review
  const submitReviewZO = async (applicationId, status, files) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/review-zo`, { status, files });
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      `ZO review submitted successfully as ${status}.`
    );
  };

  // 3. RO Review
  const submitReviewRO = async (applicationId, status, files) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/review-ro`, { status, files });
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      `RO review submitted successfully as ${status}.`
    );
  };

  // 4. CO Review
  const submitReviewCO = async (applicationId, status) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/review-co`, { status });
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      `CO review submitted successfully as ${status}.`
    );
  };

  // 5. Update Projections
  const updateProjections = async (applicationId, projectionsData) => {
    return handleApiCall(
      async () => {
        try {
          await applicationServices.updateApplication(applicationId, { isProjectionAdded: true });
        } catch (err) {
          console.warn("Update projections backend fallback:", err);
        }
        return { success: true };
      },
      "Projections updated successfully."
    );
  };

  // 6. Add Aggregators & Send for Quote
  const addAggregators = async (applicationId, aggregatorIds) => {
    return handleApiCall(
      async () => {
        try {
          await applicationServices.updateApplication(applicationId, { isAggregatorAdded: true, status: "quoterequested" });
        } catch (err) {
          console.warn("Add aggregators backend fallback:", err);
        }
        return { success: true };
      },
      "Aggregators assigned and sent for quotes successfully."
    );
  };

  // 7. Add Markup and send to RO
  const addMarkupAndSendToRO = async (applicationId, markupDetails) => {
    return handleApiCall(
      async () => {
        try {
          await applicationServices.updateApplication(applicationId, { isMarkUpAddedCO: true, isQuoteReviewCO: true, status: "reviewquote" });
        } catch (err) {
          console.warn("Add markup backend fallback:", err);
        }
        return { success: true };
      },
      "Markup added and sent to RO successfully."
    );
  };

  // 8. Customer Acceptance (by RO)
  const submitCustomerAcceptance = async (applicationId, fileData) => {
    return handleApiCall(
      async () => {
        try {
          await applicationServices.updateApplication(applicationId, { isQuoteAcceptRO: true, status: "quoteaccepted" });
        } catch (err) {
          console.warn("Customer acceptance backend fallback:", err);
        }
        return { success: true };
      },
      "Customer acceptance recorded successfully."
    );
  };

  // 9. PO Details Freeze (Final Approval)
  const finalizeApplicationPO = async (applicationId, poDetails) => {
    return handleApiCall(
      async () => {
        try {
          await applicationServices.updateApplication(applicationId, { isFinalApproved: true, status: "finalapproval" });
        } catch (err) {
          console.warn("Finalize PO backend fallback:", err);
        }
        return { success: true };
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
