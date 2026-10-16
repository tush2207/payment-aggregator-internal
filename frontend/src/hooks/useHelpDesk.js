import { useState, useEffect, useMemo, useCallback } from 'react';
import useToggle from './useToggle';
import useQueryWebSocket from './useQueryWebSocket';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import HelpdeskServices from '&src/services/helpdesk';
import { exportHelpDeskToExcel } from '&src/utils/excelExport';

/**
 * Custom hook encapsulating all ticket query workflows, WebSocket synchronization,
 * filtering, pagination, and status updates for the Help Desk domain.
 *
 * @business_rule Support Operations:
 * - Real-time WebSocket synchronization across branch and central office
 * - Role-based query initiation and response threads
 * - Excel audit logs export
 *
 * @returns {Object} HelpDesk states, metrics, and handler actions.
 */
export default function useHelpDesk() {
  const { value: showLoader, setValue: setShowLoader } = useToggle();
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const [open, setOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [allTicketsDetails, setAllTicketsDetails] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchAllTicketsData = useCallback(async (silent = false) => {
    if (!silent) setShowLoader(true);
    try {
      const response = await HelpdeskServices.getAllHelpdesks();
      setAllTicketsDetails(response?.data || {});
    } catch (error) {
      setAllTicketsDetails({});
      if (!silent) {
        errorNotification(error?.response?.data?.message || 'Failed to fetch tickets');
      }
    } finally {
      if (!silent) setShowLoader(false);
    }
  }, [setShowLoader, errorNotification]);

  useEffect(() => {
    fetchAllTicketsData();
  }, [fetchAllTicketsData]);

  // Real-time WebSocket sync across all roles (silent refresh without closing modals)
  useQueryWebSocket('global', (event) => {
    if (event) {
      fetchAllTicketsData(true);
    }
  });

  const handleOpen = useCallback(() => {
    setTicketData(null);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setTicketData(null);
    setOpen(false);
  }, []);

  const handleEdit = useCallback((row) => {
    setTicketData(row);
    setOpen(true);
  }, []);

  const handleView = useCallback((row) => {
    setTicketData(row);
    setOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((row) => {
    setTicketData(row);
    setConfirmDialogOpen(true);
  }, []);

  const handleDeleteTicket = useCallback(async (reason) => {
    if (!ticketData?.id) return;
    try {
      const payload = {
        ...ticketData,
        isDeleted: true,
        reasonOfDeletion: reason || 'Deleted by Administrator',
      };
      await HelpdeskServices.updateHelpdesk(ticketData.id, payload);
      successNotification('Support ticket deleted successfully');
      fetchAllTicketsData();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to delete support ticket');
    } finally {
      setConfirmDialogOpen(false);
      setTicketData(null);
    }
  }, [ticketData, fetchAllTicketsData, errorNotification, successNotification]);

  const handleExportExcel = useCallback(() => {
    const list = Array.isArray(allTicketsDetails?.data)
      ? allTicketsDetails.data
      : Array.isArray(allTicketsDetails)
      ? allTicketsDetails
      : [];

    if (!list.length) {
      errorNotification('No ticket records available for export');
      return;
    }

    try {
      exportHelpDeskToExcel(
        list,
        `CBI_HelpDesk_Tickets_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      successNotification(`Exported ${list.length} support tickets to Excel successfully!`);
    } catch (err) {
      console.error('Export tickets failed:', err);
      errorNotification('Failed to export tickets report');
    }
  }, [allTicketsDetails, errorNotification, successNotification]);

  const ticketsList = useMemo(() => {
    return Array.isArray(allTicketsDetails?.data) ? allTicketsDetails.data : [];
  }, [allTicketsDetails]);

  const kpiStats = useMemo(() => {
    const total = ticketsList.length;
    const openCount = ticketsList.filter((t) => (t.status || '').toLowerCase() === 'open').length;
    const pendingCount = ticketsList.filter((t) => ['pending', 'in_progress'].includes((t.status || '').toLowerCase())).length;
    const resolvedCount = ticketsList.filter((t) => (t.status || '').toLowerCase() === 'resolved').length;

    return { total, open: openCount, pending: pendingCount, resolved: resolvedCount };
  }, [ticketsList]);

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

  const filteredTickets = useMemo(() => {
    return ticketsList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.ticketName || '').toLowerCase().includes(q) ||
        (item.customerName || '').toLowerCase().includes(q) ||
        (item.accountNo || '').includes(q) ||
        (item.branchName || '').toLowerCase().includes(q) ||
        (item.regionName || '').toLowerCase().includes(q) ||
        (item.zoneName || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        String(item.id || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const st = (item.status || '').toLowerCase();
      if (selectedKpiFilter === 'OPEN' && st !== 'open') return false;
      if (selectedKpiFilter === 'PENDING' && !['pending', 'in_progress'].includes(st)) return false;
      if (selectedKpiFilter === 'RESOLVED' && st !== 'resolved') return false;

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
  }, [ticketsList, searchQuery, selectedKpiFilter, financialYear, selectedMonth, startDate, endDate]);

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredTickets.slice(start, start + rowsPerPage);
  }, [filteredTickets, page, rowsPerPage]);

  return {
    showLoader,
    open,
    ticketData,
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
    filteredTickets,
    paginatedTickets,
    handleOpen,
    handleClose,
    handleEdit,
    handleView,
    handleDeleteConfirm,
    handleDeleteTicket,
    handleExportExcel,
    setConfirmDialogOpen,
    fetchAllTicketsData,
  };
}
