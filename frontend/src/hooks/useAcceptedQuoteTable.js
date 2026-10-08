import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import aggregatorProjections from '&src/services/aggregatorProjections';
import applicationServices from '&src/services/applications';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import { fetchApplicationDetails, closeWorkflowDialog } from '&src/store/applicationFlowSlice';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/**
 * Custom hook for Accepted Quote Review & RO/Admin Confirmation.
 */
export const useAcceptedQuoteTable = ({ applicationDetails, aggregatorId }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const dispatch = useDispatch();
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState('');
  const tableRef = useRef(null);

  const { applicationId } = applicationDetails || {};

  const fetchQuoteDetails = useCallback(async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      const res = await aggregatorProjections.getAllProjections(applicationId, aggregatorId);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setQuoteDetails(data);
    } catch (e) {
      console.debug('Failed to load accepted quote details:', e);
    } finally {
      setLoading(false);
    }
  }, [applicationId, aggregatorId]);

  useEffect(() => {
    fetchQuoteDetails();
  }, [fetchQuoteDetails]);

  const handleConfirmAction = async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      if (actionType === 'accept') {
        await applicationServices.updateApplication(applicationId, {
          isQuoteAcceptRO: true,
          status: 'approved',
        });
        successNotification('Quotation accepted successfully.');
      } else {
        await applicationServices.updateApplication(applicationId, {
          isQuoteAcceptRO: false,
          reasonOfRejection: reason,
          status: 'rejected',
        });
        successNotification('Quotation rejected.');
      }
      setConfirmModalOpen(false);
      dispatch(fetchApplicationDetails(applicationId));
      dispatch(closeWorkflowDialog());
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to process quotation decision.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    try {
      const canvas = await html2canvas(tableRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, width, height);
      pdf.save(`Quotation_${applicationId || 'Doc'}.pdf`);
      successNotification('Quotation exported to PDF.');
    } catch (e) {
      errorNotification('Failed to export PDF.');
    }
  };

  return {
    quoteDetails,
    loading,
    accepted,
    setAccepted,
    confirmModalOpen,
    setConfirmModalOpen,
    actionType,
    setActionType,
    reason,
    setReason,
    tableRef,
    handleConfirmAction,
    handleExportPDF,
  };
};

export default useAcceptedQuoteTable;
