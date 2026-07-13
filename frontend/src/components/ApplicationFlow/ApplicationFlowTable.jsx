import React, { useState, useMemo, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack, Pagination,
  Typography, Box, TextField, MenuItem, Grid, Collapse
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Visibility, Edit, Delete, Timeline, FilterList, Download } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { openWorkflowDialog, selectUserRole } from '&src/store/applicationFlowSlice';
import usePOGenerator from '&src/hooks/usePOGenerator';
import { formatDateAndTime } from '&src/utils';
import CenterAlign from '&src/components/CenterAlign';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { isCO, isRO, PAYMENT_AGGREGATOR_WORKFLOW } from '&src/constants/PaymentAggregratorConstant';
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
  onRefresh,
  onFilterChange,
  onExport
}) {
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'CO';
  const [expandedRow, setExpandedRow] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { generatePO } = usePOGenerator();

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

  // Custom Filter States (defaults to current financial year and current month)
  const [financialYear, setFinancialYear] = useState(getCurrentFinancialYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
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
    setFinancialYear(getCurrentFinancialYear());
    setSelectedMonth(new Date().getMonth().toString());
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
    <TableCell onClick={() => handleSort(columnKey)} sx={{ cursor: 'pointer' }}>
      {label}
      {sortConfig.key === columnKey && (
        <span style={{ fontSize: '12px', marginLeft: '4px' }}>
          {sortConfig.direction === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </TableCell>
  );

  return (
    <Box>
      {/* 🔹 FILTER TOGGLE ACTION BAR */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Applications List ({totalRecords} records)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFiltersExpanded(!filtersExpanded)}
          >
            {filtersExpanded ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button size="small" variant="contained" color="success" onClick={handleExportExcel}>
            Export to Excel
          </Button>
        </Stack>
      </Box>

      {/* 🔹 COLLAPSIBLE PERIOD FILTERS PANEL */}
      <Collapse in={filtersExpanded}>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, borderColor: 'grey.300', bgcolor: '#fafafa' }}>
          <Grid container spacing={1.5} alignItems="center">
            {/* Search Query */}
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Search ID, name, account..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                    {fy === 'all' ? 'All Financial Years' : fy}
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
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={12} md={2}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                sx={{ height: '40px' }}
              >
                Reset Defaults
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {/* 🔹 DATA TABLE */}
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <SortHeader label="Date & Time" columnKey="createdAt" />
              <SortHeader label="App ID" columnKey="applicationId" />
              <SortHeader label="Customer Name" columnKey="customerName" />
              <TableCell>Branch Details</TableCell>
              <SortHeader label="Account No" columnKey="accountNo" />
              <SortHeader label="Category" columnKey="category" />
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell />
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
                      <TableCell>{rowIndex + 1}</TableCell>
                      <TableCell>{formatDateAndTime(customer.createdAt)}</TableCell>
                      <TableCell>{customer.applicationId}</TableCell>
                      <TableCell fontWeight={500}>{customer.customerName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{customer.branchName || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.regionName || 'N/A'}, {customer.zoneName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{customer.accountNo}</TableCell>
                      <TableCell>{customer.category}</TableCell>
                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect value={customer.status} type="workflow" />
                        </CenterAlign>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {(() => {
                            const { isVerificationPending, isInitialApproved, isViewMode } = getActionButtons(customer);
                            const showQuoteEvaluationBtn = customer?.isQuoteAddedPA === true && customer?.isMarkUpAddedCO === true && !customer?.isQuoteAcceptRO && !customer?.isFinalApproved;
                            // const showQuoteEvaluationBtn = customer?.isQuoteAddedPA === true && customer?.isMarkUpAddedCO === true && !customer?.isCustomerAccptance;
                            const showCostBenefitBtn = customer?.isFinalApproved === true;
                            const showDownloadPOBtn = customer?.isFinalApproved === true && isCO;
                            const showCOVerifyBtn = isCO && customer?.isReviewByRO === true && !customer?.isReviewByCO;
                            const showProcessFlowBtn = isCO && customer?.isReviewByRO === true && customer?.isReviewByCO === true;

                            return (
                              <>
                                {showCostBenefitBtn && isCO ? (
                                  <>
                                    <Tooltip title="View Cost Benefit Analysis" arrow placement="top">
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<Timeline />}
                                        sx={{ height: "28px", textTransform: "none", fontSize: "10px", px: 1, whiteSpace: "nowrap" }}
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
                                          <Download />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </>
                                ) :
                                  showQuoteEvaluationBtn && isRO ? (
                                    <Tooltip title="Evaluate submitted quotes from payment aggregators and propose final markup charges" arrow placement="top">
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="warning"
                                        startIcon={<Timeline />}
                                        sx={{ height: "28px", textTransform: "none", fontSize: "11px" }}
                                        onClick={() => dispatch(openWorkflowDialog(customer))}
                                      >
                                        Quote Evaluation
                                      </Button>
                                    </Tooltip>
                                  ) :
                                    showCOVerifyBtn && onVerify ? (
                                      <Tooltip title="Verify application details and documents" arrow placement="top">
                                        <Button
                                          size="small"
                                          sx={{ height: "28px", textTransform: "none", fontSize: "11px" }}
                                          variant="outlined"
                                          onClick={() => onVerify && onVerify(customer)}
                                        >
                                          Verify
                                        </Button>
                                      </Tooltip>
                                    ) : showProcessFlowBtn ? (
                                      <Tooltip title="View or update the progress of this payment aggregator application flow" arrow placement="top">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<Timeline />}
                                          sx={{ height: "28px", textTransform: "none", fontSize: "11px" }}
                                          onClick={() => dispatch(openWorkflowDialog(customer))}
                                        >
                                          Process Flow
                                        </Button>
                                      </Tooltip>
                                    ) : isInitialApproved && isCO ? (
                                      <Tooltip title="View or update the progress of this payment aggregator application flow" arrow placement="top">
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="secondary"
                                          startIcon={<Timeline />}
                                          sx={{ height: "28px", textTransform: "none", fontSize: "11px" }}
                                          onClick={() => dispatch(openWorkflowDialog(customer))}
                                        >
                                          Process Flow
                                        </Button>
                                      </Tooltip>
                                    ) : isVerificationPending && onVerify && (userRole === "RO" || userRole === "ZO") ? (
                                      <Tooltip title="Verify the customer's application details and uploaded documents" arrow placement="top">
                                        <Button
                                          size="small"
                                          sx={{ height: "28px", textTransform: "none", fontSize: "11px" }}
                                          variant="outlined"
                                          onClick={() => onVerify && onVerify(customer)}
                                        >
                                          Verify
                                        </Button>
                                      </Tooltip>
                                    ) : (
                                      onView && (
                                        <Tooltip title="View customer details and current application status" arrow placement="top">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => onView(customer)}
                                          >
                                            <Visibility />
                                          </IconButton>
                                        </Tooltip>
                                      )
                                    )}
                              </>
                            );
                          })()}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                          <Tooltip title={isExpanded ? "Collapse" : "Expand Workflow"}>
                            <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : rowIndex)}>
                              {isExpanded ? <KeyboardArrowUp color="primary" /> : <KeyboardArrowDown />}
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
                      <TableRow sx={{ p: 0 }}>
                        <TableCell colSpan={11}>
                          <RoleBasedStepper
                            steps={PAYMENT_AGGREGATOR_WORKFLOW(customer)}
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
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary">No applications found</Typography>
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
    </Box>
  );
}
