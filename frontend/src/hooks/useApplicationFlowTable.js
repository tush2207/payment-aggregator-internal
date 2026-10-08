import { useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserRole } from '&src/store/applicationFlowSlice';
import usePOGenerator from '&src/hooks/usePOGenerator';
import { isUserAdmin } from '&src/utils';
import applicationServices from '&src/services/applications';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

/**
 * Custom hook encapsulating state, rejection flow, sanction letter download,
 * and menu actions for the Application Flow Table.
 */
export const useApplicationFlowTable = ({ onRefresh }) => {
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'CO';
  const [expandedRow, setExpandedRow] = useState(null);
  const { generatePO } = usePOGenerator();
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = useMemo(() => isUserAdmin(userDetails), [userDetails]);

  // Rejection modal states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectApp, setSelectedRejectApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // Sanction letter downloading state
  const [downloadingSanctionId, setDownloadingSanctionId] = useState(null);

  // Row Action menu anchor
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuCustomer, setActionMenuCustomer] = useState(null);

  // Query modal state
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [selectedQueryApp, setSelectedQueryApp] = useState(null);

  const handleOpenRejectModal = (customer) => {
    setSelectedRejectApp(customer);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRejectApp) return;
    if (!rejectReason.trim()) {
      errorNotification('Please enter a reason for rejection.');
      return;
    }
    setRejectLoading(true);
    try {
      const approverId = userDetails.pfNumber || userDetails.employeeId || 'CO User';
      await applicationServices.updateApplication(selectedRejectApp.applicationId, {
        status: 'rejected',
        reasonOfRejection: rejectReason,
        approvedByCOId: approverId,
      });
      successNotification('Application rejected successfully');
      setRejectDialogOpen(false);
      setSelectedRejectApp(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to reject application');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDownloadSanction = async (customer) => {
    if (!customer?.applicationId) return;
    setDownloadingSanctionId(customer.applicationId);
    try {
      const response = await applicationServices.generateSanctionLetter(customer.applicationId);
      const blob = new Blob([response.data || response], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sanction_Letter_${customer.applicationId}_${(customer.customerName || 'Merchant').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      successNotification('Sanction Letter downloaded successfully.');
    } catch (err) {
      console.error('Failed to download sanction letter:', err);
      errorNotification('Failed to generate/download Sanction Letter.');
    } finally {
      setDownloadingSanctionId(null);
    }
  };

  const handleOpenActionMenu = (event, customer) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuCustomer(customer);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActionMenuCustomer(null);
  };

  const handleOpenQueryModal = (customer) => {
    setSelectedQueryApp(customer);
    setQueryModalOpen(true);
  };

  const handleCloseQueryModal = () => {
    setQueryModalOpen(false);
    setSelectedQueryApp(null);
  };

  const handleToggleRow = (appId) => {
    setExpandedRow((prev) => (prev === appId ? null : appId));
  };

  return {
    dispatch,
    userRole,
    userDetails,
    isAdmin,
    expandedRow,
    handleToggleRow,
    rejectDialogOpen,
    setRejectDialogOpen,
    selectedRejectApp,
    rejectReason,
    setRejectReason,
    rejectLoading,
    handleOpenRejectModal,
    handleConfirmReject,
    downloadingSanctionId,
    handleDownloadSanction,
    actionMenuAnchor,
    actionMenuCustomer,
    handleOpenActionMenu,
    handleCloseActionMenu,
    queryModalOpen,
    selectedQueryApp,
    handleOpenQueryModal,
    handleCloseQueryModal,
    generatePO,
  };
};

export default useApplicationFlowTable;
