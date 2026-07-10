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
        // return await axios.post(`/api/application/${applicationId}/projections`, projectionsData);
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      "Projections updated successfully."
    );
  };

  // 6. Add Aggregators & Send for Quote
  const addAggregators = async (applicationId, aggregatorIds) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/aggregators`, { aggregators: aggregatorIds });
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      "Aggregators assigned and sent for quotes successfully."
    );
  };

  // 7. Add Markup and send to RO
  const addMarkupAndSendToRO = async (applicationId, markupDetails) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/markup`, markupDetails);
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      "Markup added and sent to RO successfully."
    );
  };

  // 8. Customer Acceptance (by RO)
  const submitCustomerAcceptance = async (applicationId, fileData) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/customer-acceptance`, fileData);
        return new Promise(resolve => setTimeout(resolve, 800));
      },
      "Customer acceptance recorded successfully."
    );
  };

  // 9. PO Details Freeze (Final Approval)
  const finalizeApplicationPO = async (applicationId, poDetails) => {
    return handleApiCall(
      async () => {
        // return await axios.post(`/api/application/${applicationId}/finalize-po`, poDetails);
        return new Promise(resolve => setTimeout(resolve, 800));
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
