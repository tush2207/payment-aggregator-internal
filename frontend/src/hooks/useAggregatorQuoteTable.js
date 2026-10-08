import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import useAggregatorDetails from '&src/hooks/useAggregatorDetails';
import aggregatorByApplication from '&src/services/aggregatorByApplication';
import aggregatorProjections from '&src/services/aggregatorProjections';
import applicationServices from '&src/services/applications';
import { isUserAdmin } from '&src/utils';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import { updateApplicationWorkflow } from '&src/store/applicationFlowSlice';

/**
 * Custom hook for Aggregator Quote orchestration, quote comparison,
 * email dispatches, and commercial approvals.
 */
export const useAggregatorQuoteTable = ({ customerDetails }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const dispatch = useDispatch();

  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState(dayjs().add(2, 'day'));
  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [selectedAggregatorsDetails, setSelectedAggregatorsDetails] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const [viewMode, setViewMode] = useState('aggregator');
  const [allProjections, setAllProjections] = useState({});
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [finalApprovedTab, setFinalApprovedTab] = useState('finalized');

  // Email modal state
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [dispatchedAggregators, setDispatchedAggregators] = useState([]);
  const [appProjectionsList, setAppProjectionsList] = useState([]);

  // Waiver / Acceptance states
  const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false);
  const [targetAggregatorForForward, setTargetAggregatorForForward] = useState(null);
  const [waiverChoice, setWaiverChoice] = useState('YES');
  const [waiverSubmitting, setWaiverSubmitting] = useState(false);

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isAdmin = isUserAdmin(userDetails);

  const {
    applicationId,
    aggregateDepositAmt,
    avgTransactionYearly,
    isQuoteAcceptRO,
    finalizedAggregatorId,
    category,
    avgTransactionSize,
  } = customerDetails || {};

  const fetchAggregatorProjections = useCallback(async () => {
    if (!applicationId) return;
    try {
      setProjectionsLoading(true);
      const res = await aggregatorProjections.getAllProjections(applicationId);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const grouped = {};
      data.forEach((item) => {
        const aggId = item.aggregatorId;
        if (!grouped[aggId]) grouped[aggId] = [];
        grouped[aggId].push(item);
      });
      setAllProjections(grouped);
      setAppProjectionsList(data);
    } catch (err) {
      console.debug('Failed to fetch projections:', err);
    } finally {
      setProjectionsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchAggregatorProjections();
  }, [fetchAggregatorProjections]);

  const handleFinalizeQuote = async (aggregator) => {
    if (!aggregator || !applicationId) return;
    setLoading(true);
    try {
      await applicationServices.updateApplication(applicationId, {
        finalizedAggregatorId: aggregator.aggregatorId,
        isQuoteFinalized: true,
      });
      await dispatch(
        updateApplicationWorkflow({
          applicationId,
          payload: { isQuoteAcceptRO: true, isAggregatorAssigned: true },
        })
      );
      successNotification(`Aggregator ${aggregator.aggregatorName || ''} finalized successfully.`);
      fetchAggregatorProjections();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to finalize quote.');
    } finally {
      setLoading(false);
    }
  };

  return {
    openRow,
    setOpenRow,
    loading,
    setLoading,
    endDate,
    setEndDate,
    selectedAggregators,
    setSelectedAggregators,
    selectedAggregatorsDetails,
    setSelectedAggregatorsDetails,
    openModal,
    setOpenModal,
    viewMode,
    setViewMode,
    allProjections,
    projectionsLoading,
    finalApprovedTab,
    setFinalApprovedTab,
    emailPreviewOpen,
    setEmailPreviewOpen,
    dispatchedAggregators,
    setDispatchedAggregators,
    appProjectionsList,
    acceptanceModalOpen,
    setAcceptanceModalOpen,
    targetAggregatorForForward,
    setTargetAggregatorForForward,
    waiverChoice,
    setWaiverChoice,
    waiverSubmitting,
    setWaiverSubmitting,
    isAdmin,
    handleFinalizeQuote,
    fetchAggregatorProjections,
  };
};

export default useAggregatorQuoteTable;
