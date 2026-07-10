import { useState, useCallback, useEffect } from 'react';
import applicationFlowService from './services';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

export default function useApplicationFlow() {
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      // Typically we'd do: const response = await applicationFlowService.fetchApplications(params);
      // For now, since we don't have the exact API, let's use the provided JSON as fallback if needed
      // or just trust the API if it's there. 
      const response = await applicationFlowService.fetchApplications(params);
      // setApplications(response.data || []);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch applications');
      // errorNotification(err?.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleApiCall = async (apiFunc, successMsg) => {
    setIsLoading(true);
    try {
      await apiFunc();
      successNotification(successMsg);
      await fetchApplications(); // Refresh list after action
      return true;
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Action failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const submitApplicationBR = (id) => handleApiCall(
    () => applicationFlowService.submitApplicationBR(id),
    'Application submitted successfully!'
  );

  const reviewByZO = (id, isApproved) => handleApiCall(
    () => applicationFlowService.reviewByZO(id, isApproved),
    `Application ${isApproved ? 'approved' : 'rejected'} by ZO`
  );

  const reviewByRO = (id, isApproved) => handleApiCall(
    () => applicationFlowService.reviewByRO(id, isApproved),
    `Application ${isApproved ? 'approved' : 'rejected'} by RO`
  );

  const reviewByCO = (id, isApproved) => handleApiCall(
    () => applicationFlowService.reviewByCO(id, isApproved),
    `Application ${isApproved ? 'approved' : 'rejected'} by CO`
  );

  const submitProjections = (id, projections) => handleApiCall(
    () => applicationFlowService.submitProjections(id, projections),
    'Projections updated successfully!'
  );

  const addAggregators = (id, aggregatorIds) => handleApiCall(
    () => applicationFlowService.addAggregators(id, aggregatorIds),
    'Aggregators added and sent for quote!'
  );

  const acceptQuoteRO = (id, quoteDetails) => handleApiCall(
    () => applicationFlowService.acceptQuoteRO(id, quoteDetails),
    'Quote accepted and sent for Customer Acceptance!'
  );

  const finalApproval = (id, isApproved) => handleApiCall(
    () => applicationFlowService.finalApproval(id, isApproved),
    `Application final ${isApproved ? 'approved' : 'rejected'}`
  );

  return {
    applications,
    setApplications,
    isLoading,
    error,
    fetchApplications,
    submitApplicationBR,
    reviewByZO,
    reviewByRO,
    reviewByCO,
    submitProjections,
    addAggregators,
    acceptQuoteRO,
    finalApproval
  };
}
