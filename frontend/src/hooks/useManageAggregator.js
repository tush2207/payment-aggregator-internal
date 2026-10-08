import { useState, useMemo, useCallback } from 'react';
import useAggregatorDetails from './useAggregatorDetails';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import manageAggregatorServices from '&src/services/manageAggregator';
import { isUserAdmin } from '&src/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Custom hook encapsulating all business logic, API mutations, Excel exports,
 * filtering, pagination, and credential workflows for the Manage Aggregator domain.
 *
 * @business_rule Bank Compliance & Partner Management:
 * - Allows authorized administrators to toggle partner active/inactive status
 * - Dispatches onboarding credentials and password reset triggers
 * - Manages pagination and Excel reporting
 *
 * @returns {Object} Aggregator domain states, metrics, and handler actions.
 */
export default function useManageAggregator() {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const { isLoading: showLoader, aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();

  const [open, setOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [aggregatorData, setAggregatorData] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Admin user verification
  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = useMemo(() => isUserAdmin(userDetails), [userDetails]);

  const handleOpen = useCallback(() => {
    setAggregatorData(null);
    setIsViewMode(false);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setAggregatorData(null);
    setIsViewMode(false);
    setOpen(false);
  }, []);

  const handleEdit = useCallback((row) => {
    setAggregatorData(row);
    setIsViewMode(false);
    setOpen(true);
  }, []);

  const handleView = useCallback((row) => {
    setAggregatorData(row);
    setIsViewMode(true);
    setOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((row) => {
    setAggregatorData(row);
    setConfirmDialogOpen(true);
  }, []);

  const handleDeleteAggregator = useCallback(async (reason) => {
    if (!aggregatorData?.aggregatorId) return;
    try {
      const payload = {
        ...aggregatorData,
        isDeleted: true,
        reasonOfDeletion: reason || 'Deleted by Administrator',
      };
      await manageAggregatorServices.updateManageAggregator(aggregatorData.aggregatorId, payload);
      successNotification('Payment Aggregator partner deleted successfully');
      fetchAllAggregators();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to delete aggregator');
    } finally {
      setConfirmDialogOpen(false);
      setAggregatorData(null);
    }
  }, [aggregatorData, fetchAllAggregators, errorNotification, successNotification]);

  const handleStatusToggle = useCallback(async (row) => {
    try {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';
      const payload = {
        ...row,
        status: newStatus,
      };
      await manageAggregatorServices.updateManageAggregator(row.aggregatorId, payload);
      successNotification(`Aggregator status updated to ${newStatus.toUpperCase()}`);
      fetchAllAggregators();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to update aggregator status');
    }
  }, [fetchAllAggregators, errorNotification, successNotification]);

  const handleSendCredentials = useCallback(async (row) => {
    try {
      await manageAggregatorServices.sendCredentialsEmail(row.aggregatorId);
      successNotification(`Onboarding credentials emailed successfully to ${row.email || row.aggregatorName}`);
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to dispatch onboarding credentials email');
    }
  }, [errorNotification, successNotification]);

  const handleResetPassword = useCallback(async (row) => {
    try {
      await manageAggregatorServices.resetPasswordEmail(row.aggregatorId);
      successNotification(`Temporary password generated and emailed to ${row.email || row.aggregatorName}`);
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to reset aggregator password');
    }
  }, [errorNotification, successNotification]);

  const handleExportExcel = useCallback(() => {
    const list = Array.isArray(aggregatorDetails?.data) ? aggregatorDetails.data : [];
    if (!list.length) {
      errorNotification('No aggregator records available for export');
      return;
    }

    const exportRows = list.map((item, index) => ({
      'Sr No.': index + 1,
      'Aggregator Name': item.aggregatorName || '-',
      'Contact Person': item.contactPersonName || '-',
      'Email ID': item.email || '-',
      'Mobile Number': item.mobileNo || '-',
      'Active Services': item.services ? item.services.replace(/\|/g, ', ') : '-',
      'Account Status': (item.status || 'active').toUpperCase(),
      'Onboarding Date': item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Aggregators');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(dataBlob, `CBI_Payment_Aggregators_${new Date().toISOString().slice(0, 10)}.xlsx`);
    successNotification('Aggregator directory exported successfully');
  }, [aggregatorDetails, errorNotification, successNotification]);

  // Metric Calculation
  const aggregatorsList = useMemo(() => {
    return Array.isArray(aggregatorDetails?.data) ? aggregatorDetails.data : [];
  }, [aggregatorDetails]);

  const kpiStats = useMemo(() => {
    const total = aggregatorsList.length;
    const active = aggregatorsList.filter((a) => a.status === 'active').length;
    const inactive = aggregatorsList.filter((a) => a.status === 'inactive').length;
    const multiChannel = aggregatorsList.filter((a) => (a.services || '').split('|').length > 2).length;

    return { total, active, inactive, multiChannel };
  }, [aggregatorsList]);

  // Custom Filter States
  const [financialYear, setFinancialYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFinancialYear('all');
    setSelectedMonth('all');
    setStartDate('');
    setEndDate('');
    setSelectedKpiFilter('ALL');
    setPage(1);
  }, []);

  // Filtered & Paginated records
  const filteredAggregators = useMemo(() => {
    return aggregatorsList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.aggregatorName || '').toLowerCase().includes(q) ||
        (item.contactPersonName || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.mobileNo || '').includes(q) ||
        (item.services || '').toLowerCase().includes(q) ||
        String(item.aggregatorId || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status Filter
      if (selectedKpiFilter === 'ACTIVE' && item.status !== 'active') return false;
      if (selectedKpiFilter === 'INACTIVE' && item.status !== 'inactive') return false;
      if (selectedKpiFilter === 'MULTI' && (item.services || '').split('|').length <= 2) return false;

      // Date & Period Filter
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (!isNaN(itemDate.getTime())) {
          // Financial Year filter (e.g. FY 2026-27)
          if (financialYear && financialYear !== 'all') {
            const cleanFy = financialYear.replace('FY ', '').trim();
            const [startYearStr, endYearStr] = cleanFy.split('-');
            const startYear = parseInt(startYearStr, 10);
            let endYear = parseInt(endYearStr, 10);
            if (endYear < 100) endYear = 2000 + endYear;
            const fyStart = new Date(startYear, 3, 1); // April 1
            const fyEnd = new Date(endYear, 2, 31, 23, 59, 59); // March 31
            if (itemDate < fyStart || itemDate > fyEnd) return false;
          }

          // Month filter (0-11)
          if (selectedMonth && selectedMonth !== 'all') {
            if (itemDate.getMonth() !== parseInt(selectedMonth, 10)) return false;
          }

          // Start Date filter
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }

          // End Date filter
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
      }

      return true;
    });
  }, [aggregatorsList, searchQuery, selectedKpiFilter, financialYear, selectedMonth, startDate, endDate]);

  const paginatedAggregators = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredAggregators.slice(start, start + rowsPerPage);
  }, [filteredAggregators, page, rowsPerPage]);

  return {
    showLoader,
    isAdmin,
    open,
    isViewMode,
    aggregatorData,
    confirmDialogOpen,
    selectedKpiFilter,
    setSelectedKpiFilter,
    searchQuery,
    setSearchQuery,
    financialYear,
    setFinancialYear,
    selectedMonth,
    setSelectedMonth,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleResetFilters,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    kpiStats,
    filteredAggregators,
    paginatedAggregators,
    handleOpen,
    handleClose,
    handleEdit,
    handleView,
    handleDeleteConfirm,
    handleDeleteAggregator,
    handleStatusToggle,
    handleSendCredentials,
    handleResetPassword,
    handleExportExcel,
    setConfirmDialogOpen,
    fetchAllAggregators,
  };
}
