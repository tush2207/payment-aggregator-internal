import React, { useState, useMemo, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack, Pagination,
  Typography, Box, TextField, MenuItem, Grid, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Visibility, Edit, Delete, Timeline, FilterList, Download, CancelOutlined, SearchRounded, FileDownloadRounded, FilterAltRounded, RestartAltRounded, AddCircleRounded, PostAddRounded, ArrowForwardRounded, Inventory2Outlined } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { openWorkflowDialog, selectUserRole } from '&src/store/applicationFlowSlice';
import usePOGenerator from '&src/hooks/usePOGenerator';
import { formatDateAndTime, formatDateOnly, formatTimeOnly } from '&src/utils';
import CenterAlign from '&src/components/CenterAlign';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { isCO, isRO, PAYMENT_AGGREGATOR_WORKFLOW, deriveApplicationStatus } from '&src/constants/PaymentAggregratorConstant';
import applicationServices from '&src/services/applications';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Helpers to get current financial year and month dynamically
const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-11
  if (month >= 3) { // April onwards
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `FY ${year - 1}-${year.toString().slice(2)}`;
  }
};

const getTodayLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFinancialYearsList = () => {
  const list = ['all'];
  const today = new Date();
  let currentYear = today.getFullYear();
  if (today.getMonth() < 3) {
    currentYear -= 1;
  }
  // Add current and past 3 years
  for (let i = 0; i < 4; i++) {
    const start = currentYear - i;
    const end = start + 1;
    list.push(`FY ${start}-${end.toString().slice(2)}`);
  }
  return list;
};

export default function ApplicationFlowTable({
  applicationDetails = [],
  totalRecords = 0,
  onView,
  onEdit,
  onDelete,
  onVerify,
  onCreateApplication,
  onRefresh,
  onFilterChange,
  onExport,
  hideFilterHeader = false,
}) {
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'CO';
  const [expandedRow, setExpandedRow] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { generatePO } = usePOGenerator();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectApp, setSelectedRejectApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const handleOpenRejectModal = (customer) => {
    setSelectedRejectApp(customer);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRejectApp) return;
    if (!rejectReason.trim()) {
      errorNotification("Please enter a reason for rejection.");
      return;
    }
    setRejectLoading(true);
    try {
      const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      const approverId = userDetails.pfNumber || userDetails.employeeId || 'CO User';
      await applicationServices.updateApplication(selectedRejectApp.applicationId, {
        status: "rejected",
        reasonOfRejection: rejectReason,
        approvedByCOId: approverId
      });
      successNotification("Application rejected successfully");
      setRejectDialogOpen(false);
      setSelectedRejectApp(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      errorNotification(err?.response?.data?.message || "Failed to reject application");
    } finally {
      setRejectLoading(false);
    }
  };

  const todayStr = getTodayLocalDateString();

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const shouldShowBtn = (check) => {
    if (!check) return false;
    return userRole === "RO" && (check?.isReviewByRO === null || check?.isReviewByRO === false);
  };

  const getActionButtons = (customer) => {
    const isVerificationPending = shouldShowBtn(customer) && !customer?.isFinalApproved;
    // Approvals move to Process Flow once RO has approved
    const isInitialApproved = customer?.isReviewByRO === true;

    return {
      isVerificationPending,
      isInitialApproved,
      isViewMode: !isVerificationPending && !isInitialApproved,
    };
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Custom Filter States (defaults to 'all' for all records)
  const [financialYear, setFinancialYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 400ms search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync filters back to parent component
  useEffect(() => {
    console.log("ApplicationFlowTable sync filters called", {
      financialYear,
      selectedMonth,
      startDate,
      endDate,
      search: debouncedSearch,
      page,
      rowsPerPage,
    });
    if (onFilterChange) {
      onFilterChange({
        financialYear,
        selectedMonth,
        startDate,
        endDate,
        search: debouncedSearch,
        page,
        rowsPerPage,
      });
    }
  }, [financialYear, selectedMonth, startDate, endDate, debouncedSearch, page, rowsPerPage, onFilterChange]);



  // Financial Years list
  const financialYears = getFinancialYearsList();

  // Months list
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Filtering is now handled on the server side
  const filteredData = applicationDetails || [];

  const handleClearFilters = () => {
    setFinancialYear('all');
    setSelectedMonth('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
    setPage(1);
  };

  const handleExportExcel = () => {
    if (onExport) {
      onExport();
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let v1 = a[sortConfig.key] || "";
      let v2 = b[sortConfig.key] || "";
      if (sortConfig.key === "createdAt") {
        v1 = new Date(v1);
        v2 = new Date(v2);
      }
      if (v1 < v2) return sortConfig.direction === "asc" ? -1 : 1;
      if (v1 > v2) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (sortedData.length <= rowsPerPage) {
      return sortedData;
    }
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;

  const SortHeader = ({ label, columnKey }) => (
    <TableCell
      onClick={() => handleSort(columnKey)}
      sx={{
        cursor: 'pointer',
        color: '#ffffff !important',
        fontWeight: 700,
        userSelect: 'none',
        '&:hover': {
          color: '#ffffff !important',
          backgroundColor: 'rgba(255, 255, 255, 0.08) !important',
        },
      }}
    >
      {label}
      {sortConfig.key === columnKey && (
        <span style={{ fontSize: '12px', marginLeft: '4px', color: '#f6d365' }}>
          {sortConfig.direction === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </TableCell>
  );

  return (
    <Box>
      {/* 🔹 FILTER TOGGLE ACTION BAR */}
      {!hideFilterHeader && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8} flexWrap="wrap" gap={1.2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={800} color="#0E4F8D" sx={{ fontSize: '1.05rem' }}>
                Applications Directory
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                ({totalRecords} {totalRecords === 1 ? 'record' : 'records'})
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.2} alignItems="center">
              <Button
                size="small"
                variant={filtersExpanded ? "contained" : "outlined"}
                color="primary"
                startIcon={<FilterAltRounded />}
                onClick={() => setFiltersExpanded(!filtersExpanded)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  borderRadius: '8px',
                  px: 1.8,
                  bgcolor: filtersExpanded ? '#176FC1' : 'transparent',
                }}
              >
                {filtersExpanded ? "Hide Filters" : "Show Filters"}
              </Button>
              <Tooltip title="Export all applications report as Excel spreadsheet" arrow>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadRounded />}
                  onClick={handleExportExcel}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    px: 2,
                    boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
                  }}
                >
                  Export All
                </Button>
              </Tooltip>
            </Stack>
          </Box>

          {/* 🔹 COLLAPSIBLE PERIOD FILTERS PANEL */}
          <Collapse in={filtersExpanded}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                mb: 2.5,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <Grid container spacing={1.8} alignItems="center">
                {/* Search Query */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search Applications"
                    placeholder="Search ID, name, account..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    InputProps={{
                      startAdornment: <SearchRounded sx={{ color: 'text.secondary', mr: 0.8, fontSize: 20 }} />,
                    }}
                  />
                </Grid>

                {/* Financial Year */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Financial Year"
                    value={financialYear}
                    onChange={(e) => { setFinancialYear(e.target.value); setPage(1); }}
                  >
                    {financialYears.map((fy) => (
                      <MenuItem key={fy} value={fy}>
                        {fy === 'all' ? 'All FYs' : fy}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Month */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Month"
                    value={selectedMonth}
                    onChange={(e) => { setSelectedMonth(e.target.value); setPage(1); }}
                  >
                    {months.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Start Date */}
                <Grid item xs={12} sm={6} md={1.8}>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    label="From Date"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: endDate || todayStr }}
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  />
                </Grid>

                {/* End Date */}
                <Grid item xs={12} sm={6} md={1.8}>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    label="To Date"
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: startDate || undefined, max: todayStr }}
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  />
                </Grid>

                {/* Reset Button */}
                <Grid item xs={12} sm={6} md={1.4}>
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<RestartAltRounded />}
                    onClick={handleClearFilters}
                    sx={{
                      height: '40px',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '8px',
                    }}
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>
        </>
      )}

      {/* 🔹 DATA TABLE */}
      <TableContainer
        component={Paper}
        elevation={1}
        sx={{
          borderRadius: '10px 10px 0 0',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: '#cbd5e1',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'auto',
          boxShadow: 'none',
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#c1c1c1',
            borderRadius: '0px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
        }}
      >
        <Table sx={{ minWidth: 900, width: '100%', borderCollapse: 'collapse' }} size="small">
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)', borderBottom: '2px solid #062545' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', borderRight: '1px solid rgba(255,255,255,0.25)' }}>#</TableCell>
              <SortHeader label="Date & Time" columnKey="createdAt" />
              <SortHeader label="App ID" columnKey="applicationId" />
              <SortHeader label="Customer Name" columnKey="customerName" />
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Branch Details</TableCell>
              <SortHeader label="Account No" columnKey="accountNo" />
              <SortHeader label="Category" columnKey="category" />
              <SortHeader label="Status" columnKey="status" />
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center', minWidth: 175, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Actions</TableCell>
              <TableCell sx={{ color: '#ffffff', width: 44, p: 0.5, textAlign: 'center' }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((customer, index) => {
                const rowIndex = (page - 1) * rowsPerPage + index;
                const isExpanded = expandedRow === rowIndex;

                return (
                  <React.Fragment key={customer.applicationId}>
                    <TableRow hover selected={isExpanded}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '12px' }}>{rowIndex + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '12.5px', lineHeight: 1.3 }}>
                          {formatDateOnly(customer.createdAt)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', display: 'block', mt: 0.2 }}>
                          {formatTimeOnly(customer.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12.5px', color: 'text.primary' }}>{customer.applicationId}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: 'text.primary' }}>{customer.customerName}</TableCell>
                      <TableCell sx={{ minWidth: 175, py: 1.2 }}>
                        <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '13px', lineHeight: 1.3, mb: 0.3 }}>
                          {customer.branchName || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              lineHeight: 1.2,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#64748b' }}>Region:</span>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{customer.regionName || 'N/A'}</span>
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11px',
                              lineHeight: 1.2,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#64748b' }}>Zone:</span>
                            <span style={{ fontWeight: 600, color: '#1e293b' }}>{customer.zoneName || (customer.zoneId && customer.zoneId !== '00000' && customer.zoneId !== 0 ? customer.zoneId : 'N/A')}</span>
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{customer.accountNo}</TableCell>
                      <TableCell>
                        {customer.category && customer.category !== 'N/A' && customer.category !== ''
                          ? customer.category
                          : (customer.integrateWith?.includes('edu') || customer.customerName?.toLowerCase().includes('college') || customer.customerName?.toLowerCase().includes('institute')
                              ? 'Education & Training'
                              : customer.customerName?.toLowerCase().includes('tech') || customer.customerName?.toLowerCase().includes('edge')
                                ? 'Information Technology'
                                : customer.customerName?.toLowerCase().includes('real')
                                  ? 'Construction & Real Estate'
                                  : 'General Services')}
                      </TableCell>
                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect value={deriveApplicationStatus(customer)} type="workflow" />
                        </CenterAlign>
                      </TableCell>
                      <TableCell sx={{ minWidth: 165, py: 1, px: 1 }}>
                        <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center">
                          {/* 👁️ Always available View Application Button */}
                          <Tooltip title="View Application Details" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={() => onView ? onView(customer) : dispatch(openWorkflowDialog(customer))}
                              sx={{
                                p: '4px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                bgcolor: '#f8fafc',
                                color: '#0E4F8D',
                                '&:hover': { bgcolor: '#f1f5f9', color: '#176FC1' }
                              }}
                            >
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>

                          {(() => {
                            const { isVerificationPending, isInitialApproved, isViewMode } = getActionButtons(customer);
                            const showQuoteEvaluationBtn = customer?.isQuoteAddedPA === true && customer?.isMarkUpAddedCO === true && !customer?.isQuoteAcceptRO && !customer?.isFinalApproved;
                            const showCostBenefitBtn = customer?.isFinalApproved === true;
                            const showDownloadPOBtn = customer?.isFinalApproved === true && isCO;
                            const showCOVerifyBtn = isCO && customer?.isReviewByRO === true && !customer?.isReviewByCO;
                            const showProcessFlowBtn = isCO && customer?.isReviewByRO === true && customer?.isReviewByCO === true;
                            const canCOReject = isCO && customer?.status !== 'rejected' && !customer?.isFinalApproved;

                            return (
                              <>
                                {showCostBenefitBtn && isCO ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Tooltip title="View Cost Benefit Analysis" arrow placement="top">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<Timeline />}
                                        sx={{ height: "27px", textTransform: "none", fontSize: "10.5px", fontWeight: 700, px: 1, whiteSpace: "nowrap", borderRadius: "6px" }}
                                        onClick={() => dispatch(openWorkflowDialog(customer))}
                                      >
                                        Cost Benefit Analysis
                                      </Button>
                                    </Tooltip>
                                    {showDownloadPOBtn && (
                                      <Tooltip title="Download PO" arrow placement="top">
                                        <IconButton
                                          size="small"
                                          color="success"
                                          onClick={() => generatePO({
                                            applicationId: customer.applicationId,
                                            aggregatorId: customer.finalizedAggregatorId,
                                            customerName: customer.customerName,
                                            isFinalApproved: customer.isFinalApproved,
                                          })}
                                        >
                                          <Download fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                ) :
                                  showQuoteEvaluationBtn && isRO ? (
                                    <Tooltip title="Evaluate submitted quotes from payment aggregators and propose final markup charges" arrow placement="top">
                                      <Button
                                        fullWidth
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        startIcon={<Timeline />}
                                        sx={{ height: "27px", textTransform: "none", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", borderRadius: "6px" }}
                                        onClick={() => dispatch(openWorkflowDialog(customer))}
                                      >
                                        Quote Evaluation
                                      </Button>
                                    </Tooltip>
                                  ) :
                                    showCOVerifyBtn && onVerify ? (
                                      <Tooltip title="Verify application details and documents" arrow placement="top">
                                        <Button
                                          fullWidth
                                          size="small"
                                          sx={{ height: "27px", textTransform: "none", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", borderRadius: "6px" }}
                                          variant="outlined"
                                          onClick={() => onVerify && onVerify(customer)}
                                        >
                                          Verify
                                        </Button>
                                      </Tooltip>
                                    ) : showProcessFlowBtn ? (
                                      <Tooltip title="View or update the progress of this payment aggregator application flow" arrow placement="top">
                                        <Button
                                          fullWidth
                                          size="small"
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<Timeline />}
                                          sx={{ height: "27px", textTransform: "none", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", borderRadius: "6px" }}
                                          onClick={() => dispatch(openWorkflowDialog(customer))}
                                        >
                                          Process Flow
                                        </Button>
                                      </Tooltip>
                                    ) : isInitialApproved && isCO ? (
                                      <Tooltip title="View or update the progress of this payment aggregator application flow" arrow placement="top">
                                        <Button
                                          fullWidth
                                          size="small"
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<Timeline />}
                                          sx={{ height: "27px", textTransform: "none", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", borderRadius: "6px" }}
                                          onClick={() => dispatch(openWorkflowDialog(customer))}
                                        >
                                          Process Flow
                                        </Button>
                                      </Tooltip>
                                    ) : isVerificationPending && onVerify && (userRole === "RO" || userRole === "ZO") ? (
                                      <Tooltip title="Verify the customer's application details and uploaded documents" arrow placement="top">
                                        <Button
                                          fullWidth
                                          size="small"
                                          sx={{ height: "27px", textTransform: "none", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", borderRadius: "6px" }}
                                          variant="outlined"
                                          onClick={() => onVerify && onVerify(customer)}
                                        >
                                          Verify
                                        </Button>
                                      </Tooltip>
                                    ) : null}

                                {canCOReject && (
                                  <Tooltip title="CO can reject application at any stage in the flow" arrow placement="top">
                                    <Button
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<CancelOutlined />}
                                      sx={{ height: "25px", textTransform: "none", fontSize: "10.5px", fontWeight: 700, px: 1, whiteSpace: "nowrap", borderRadius: "6px" }}
                                      onClick={() => handleOpenRejectModal(customer)}
                                    >
                                      Reject
                                    </Button>
                                  </Tooltip>
                                )}
                              </>
                            );
                          })()}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ width: 44, px: 0.5 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <Tooltip title={isExpanded ? "Collapse" : "Expand Workflow"}>
                            <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : rowIndex)}>
                              {isExpanded ? <KeyboardArrowUp color="primary" fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          {onDelete && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => onDelete(customer)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Workflow Row */}
                    {isExpanded && (
                      <TableRow sx={{ p: 0, bgcolor: '#f8fafc' }}>
                        <TableCell colSpan={11} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                          <RoleBasedStepper
                            steps={PAYMENT_AGGREGATOR_WORKFLOW(customer)}
                            showTimestamp={true}
                            showDescription={false}
                            statusChip
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 6, px: 3, border: 'none' }}>
                  <Box
                    sx={{
                      maxWidth: 820,
                      mx: 'auto',
                      p: { xs: 2.5, sm: 4 },
                      bgcolor: '#ffffff',
                      borderRadius: '16px',
                      border: '1.5px dashed #cbd5e1',
                      boxShadow: '0 4px 20px rgba(14, 79, 141, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    {/* Empty Box Graphic / Icon Badge */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                        border: '1.5px solid #7dd3fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: '0 8px 16px rgba(14, 79, 141, 0.1)',
                        position: 'relative',
                      }}
                    >
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="#0E4F8D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="14" r="2" fill="#176FC1" />
                      </svg>
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: '#CE0F3E',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(206, 15, 62, 0.4)',
                        }}
                      >
                        0
                      </Box>
                    </Box>

                    {/* Title & Description */}
                    <Typography variant="h6" fontWeight={800} color="#062545" sx={{ mb: 0.8, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      {userRole === 'BO' ? 'No Customer Applications Yet' : 'No Applications in Review Queue'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 540, mb: 3.5, lineHeight: 1.6 }}>
                      {userRole === 'BO'
                        ? 'You have not created any merchant payment aggregator applications yet. Follow the 3-step creation flow below to onboard your first merchant.'
                        : 'There are currently no active applications matching your filters in your jurisdiction. New applications created by branch offices will appear here automatically.'}
                    </Typography>

                    {/* ── 3-STEP APPLICATION CREATION FLOW (SHOWN TO BO USERS) ── */}
                    {userRole === 'BO' && (
                      <>
                        <Box
                          sx={{
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                            gap: 2,
                            mb: 3.5,
                            textAlign: 'left',
                          }}
                        >
                          {/* Step 1 Card */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#f0f9ff',
                                borderColor: '#bae6fd',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(14, 79, 141, 0.06)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  bgcolor: '#0E4F8D',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                1
                              </Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D">
                                Merchant Info
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                              Fill customer account number, merchant name, category, and expected turnover projections.
                            </Typography>
                          </Box>

                          {/* Step 2 Card */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#f0f9ff',
                                borderColor: '#bae6fd',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(14, 79, 141, 0.06)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  bgcolor: '#176FC1',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                2
                              </Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#176FC1">
                                Upload Documents
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                              Upload verified KYC documents and the signed Customer Application Form (.pdf).
                            </Typography>
                          </Box>

                          {/* Step 3 Card */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              bgcolor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: '#f0f9ff',
                                borderColor: '#bae6fd',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(14, 79, 141, 0.06)',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '50%',
                                  bgcolor: '#16a34a',
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                3
                              </Box>
                              <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                                RO & ZO Approval
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>
                              Application is forwarded for Regional & Zonal recommendation and aggregator quotation.
                            </Typography>
                          </Box>
                        </Box>

                        {/* Prominent Action Button for BO */}
                        {onCreateApplication && (
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddCircleRounded />}
                            onClick={onCreateApplication}
                            sx={{
                              background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              py: 1.2,
                              px: 3.5,
                              borderRadius: '10px',
                              textTransform: 'none',
                              boxShadow: '0 4px 14px rgba(14, 79, 141, 0.35)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #093763 0%, #0E4F8D 100%)',
                                boxShadow: '0 6px 20px rgba(14, 79, 141, 0.45)',
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            + Create First Customer Application
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔹 BOTTOM PAGINATION & PAGE SIZE ROW */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">Rows per page:</Typography>
          <TextField
            select
            size="small"
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(1); }}
            sx={{ width: 80 }}
          >
            {[5, 10, 25, 50].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, val) => setPage(val)}
          color="primary"
          shape="rounded"
          variant="outlined"
        />
      </Stack>

      {/* 🔹 CO REJECTION DIALOG */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelOutlined color="error" /> Reject Customer Application
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Are you sure you want to reject application <strong>#{selectedRejectApp?.applicationId}</strong> ({selectedRejectApp?.customerName})?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection"
            placeholder="Enter specific reason for rejecting this application..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={rejectLoading}>
            {rejectLoading ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
