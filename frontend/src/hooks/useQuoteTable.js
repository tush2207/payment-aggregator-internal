import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import aggregatorProjections from '&src/services/aggregatorProjections';
import aggregatorByApplication from '&src/services/aggregatorByApplication';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';
import { calculateQuoteRow, calculateTotals, getProjectionsForCustomer, getChannelOrder } from '&src/utils/calculation';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

/**
 * Custom hook for Quote Table data fetching, rate changes, and calculation.
 */
export const useQuoteTable = ({
  applicationDetails,
  aggregatorId,
  onSaveSuccess,
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [errorRowIds, setErrorRowIds] = useState([]);

  const { applicationId } = applicationDetails || {};

  const calculateAllQuoteRows = useCallback((details) => {
    const totTxns = Number(
      applicationDetails?.avgTransactionYearly ||
      (applicationDetails?.totalAnnualTransaction && Number(applicationDetails.totalAnnualTransaction)) ||
      0
    );
    const totAmt = Number(
      applicationDetails?.aggregateDepositAmt ||
      applicationDetails?.totalBankCollection ||
      (applicationDetails?.avgTransactionSize * applicationDetails?.avgTransactionYearly) ||
      0
    );

    const baselineList = getProjectionsForCustomer(
      PROJECTION_CAL_DETAILS,
      applicationDetails?.projection,
      applicationDetails?.avgTransactionSize,
      applicationId
    );
    const baselineMap = new Map();
    baselineList.forEach((b) => {
      const key = (b.transactionType || '').toLowerCase().trim();
      if (key) baselineMap.set(key, b);
    });

    const firstPass = details.map((row) => {
      let r = { ...row };
      const key = (r.transactionType || '').toLowerCase().trim();
      const bData = baselineMap.get(key);
      if (bData) {
        if (!r.transactionCount || r.transactionCount === '0%') r.transactionCount = bData.transactionCount;
        if (!r.transactionValue || r.transactionValue === '0%') r.transactionValue = bData.transactionValue;
      }
      return r;
    });

    return firstPass.map((r) => calculateQuoteRow(r, totTxns, totAmt)).sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
  }, [applicationDetails, applicationId]);

  const fetchQuoteDetails = useCallback(async () => {
    if (!applicationId || !aggregatorId) return;
    try {
      setLoading(true);
      const res = await aggregatorProjections.getAllProjections(applicationId, aggregatorId);
      const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (rawData.length > 0) {
        const calculated = calculateAllQuoteRows(rawData);
        setQuoteDetails(calculated);
      }
    } catch (e) {
      console.debug('Failed to fetch quote details:', e);
    } finally {
      setLoading(false);
    }
  }, [applicationId, aggregatorId, calculateAllQuoteRows]);

  useEffect(() => {
    fetchQuoteDetails();
  }, [fetchQuoteDetails]);

  const handleRateChange = (id, field, value) => {
    setQuoteDetails((prev) => {
      const updated = prev.map((row) => {
        if (row.id === id) {
          return { ...row, [field]: value };
        }
        return row;
      });
      return calculateAllQuoteRows(updated);
    });
  };

  const totals = useMemo(() => calculateTotals(quoteDetails), [quoteDetails]);

  return {
    quoteDetails,
    setQuoteDetails,
    loading,
    setLoading,
    openModal,
    setOpenModal,
    errorRowIds,
    setErrorRowIds,
    handleRateChange,
    totals,
    fetchQuoteDetails,
  };
};

export default useQuoteTable;
