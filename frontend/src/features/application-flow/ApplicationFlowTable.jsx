import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Table,
  TableBody,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Pagination,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  Timeline,
  Download,
  ArticleOutlined,
  QuestionAnswerRounded,
} from '@mui/icons-material';
import { CommonAppTable, CommonTableHeader, CommonTableEmptyState } from '&src/components/table/common';
import { CommonTableFilterSection } from '&src/components/Filters';
import { useApplicationFlowTable } from '&src/hooks/useApplicationFlowTable';
import { openWorkflowDialog } from '&src/store/applicationFlowSlice';
import ApplicationFlowRow from './ApplicationFlowRow';
import ApplicationFlowRejectDialog from './ApplicationFlowRejectDialog';
import ApplicationQueryModal from './ApplicationQueryModal';

const TABLE_COLUMNS = [
  { label: '#', width: 45 },
  { label: 'Date & Time', width: 125 },
  { label: 'App ID', width: 105 },
  { label: 'Customer Name', minWidth: 160 },
  { label: 'Branch Details', minWidth: 175 },
  { label: 'Account No', align: 'center', width: 110 },
  { label: 'Category', minWidth: 150 },
  { label: 'Workflow Status', align: 'center', minWidth: 140 },
  { label: 'Actions', align: 'center', minWidth: 175 },
  { label: '', width: 44, align: 'center' },
];

/**
 * Main Application Flow Table Component.
 * Strict < 250 lines, theme-driven, integrates exact portal columns, context action menu, and filter suite.
 */
export const ApplicationFlowTable = ({
  applicationDetails = [],
  totalRecords = 0,
  onView,
  onVerify,
  onRefresh,
  onFilterChange,
  onCreateApplication,
  onExport,
  hideFilterHeader = false,
  filters = {},
}) => {
  const {
    dispatch,
    userRole,
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
  } = useApplicationFlowTable({ onRefresh });

  const currentPage = filters.page || 1;
  const rowsPerPage = filters.rowsPerPage || 10;
  const totalPages = Math.ceil(totalRecords / rowsPerPage) || 1;

  const handleProcessFlow = (customer) => {
    dispatch(openWorkflowDialog(customer));
  };

  const handleSearchChange = (val) => {
    if (onFilterChange) onFilterChange({ search: val, page: 1 });
  };

  const handleFYChange = (val) => {
    if (onFilterChange) onFilterChange({ financialYear: val, page: 1 });
  };

  const handleMonthChange = (val) => {
    if (onFilterChange) onFilterChange({ selectedMonth: val, page: 1 });
  };

  const handleStartDateChange = (val) => {
    if (onFilterChange) onFilterChange({ startDate: val, page: 1 });
  };

  const handleEndDateChange = (val) => {
    if (onFilterChange) onFilterChange({ endDate: val, page: 1 });
  };

  const handleResetFilters = () => {
    if (onFilterChange) {
      onFilterChange({
        search: '',
        financialYear: 'all',
        selectedMonth: 'all',
        startDate: '',
        endDate: '',
        page: 1,
      });
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Filter Bar Section ── */}
      {!hideFilterHeader && (
        <Box sx={{ mb: 2 }}>
          <CommonTableFilterSection
            search={filters.search || ''}
            onSearchChange={handleSearchChange}
            financialYear={filters.financialYear || 'all'}
            onFinancialYearChange={handleFYChange}
            month={filters.selectedMonth || 'all'}
            onMonthChange={handleMonthChange}
            startDate={filters.startDate || ''}
            onStartDateChange={handleStartDateChange}
            endDate={filters.endDate || ''}
            onEndDateChange={handleEndDateChange}
            onReset={handleResetFilters}
            onExport={onExport}
            onCreateApplication={onCreateApplication}
            showSearch={true}
            showFinancialYear={true}
            showMonth={true}
            showDateRange={true}
            showReset={true}
            showStatusGroup={false}
          />
        </Box>
      )}

      {/* ── Main Table ── */}
      <CommonAppTable>
        <Table size="small" sx={{ minWidth: 1050, borderCollapse: 'collapse' }}>
          <CommonTableHeader columns={TABLE_COLUMNS} />

          <TableBody>
            {applicationDetails && applicationDetails.length > 0 ? (
              applicationDetails.map((customer, idx) => (
                <ApplicationFlowRow
                  key={customer.applicationId || idx}
                  customer={customer}
                  idx={(currentPage - 1) * rowsPerPage + idx}
                  expanded={expandedRow === customer.applicationId}
                  onToggleExpand={handleToggleRow}
                  userRole={userRole}
                  isAdmin={isAdmin}
                  onView={onView}
                  onVerify={onVerify}
                  onProcessFlow={handleProcessFlow}
                  onOpenReject={handleOpenRejectModal}
                  onOpenQuery={handleOpenQueryModal}
                  onOpenActionMenu={handleOpenActionMenu}
                />
              ))
            ) : (
              <CommonTableEmptyState
                colSpan={TABLE_COLUMNS.length}
                message="No Applications Found"
                description="There are currently no merchant applications matching the selected criteria."
              />
            )}
          </TableBody>
        </Table>
      </CommonAppTable>

      {/* ── Bottom Pagination Bar ── */}
      {totalRecords > 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body2" color="text.secondary">
              Rows per page:
            </Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={(e) => onFilterChange && onFilterChange({ rowsPerPage: parseInt(e.target.value, 10), page: 1 })}
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
            page={currentPage}
            onChange={(_, val) => onFilterChange && onFilterChange({ page: val })}
            color="primary"
            shape="rounded"
            variant="outlined"
          />
        </Stack>
      )}

      {/* ── All Actions Context Menu (For Final Approved / Application Flow Button) ── */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: '8px',
            minWidth: 230,
            py: 0.5,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            const cust = actionMenuCustomer;
            handleCloseActionMenu();
            if (onView) onView(cust);
            else dispatch(openWorkflowDialog(cust));
          }}
          sx={{ fontSize: '12.5px', py: 1, gap: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: 'primary.main' }}>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="View Application Details" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const cust = actionMenuCustomer;
            handleCloseActionMenu();
            dispatch(openWorkflowDialog(cust));
          }}
          sx={{ fontSize: '12.5px', py: 1, gap: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: '#7c3aed' }}>
            <Timeline fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Cost Benefit Analysis" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const cust = actionMenuCustomer;
            handleCloseActionMenu();
            generatePO({
              applicationId: cust?.applicationId,
              aggregatorId: cust?.finalizedAggregatorId,
              customerName: cust?.customerName,
              isFinalApproved: cust?.isFinalApproved,
            });
          }}
          sx={{ fontSize: '12.5px', py: 1, gap: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: '#16a34a' }}>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download Purchase Order (PO)" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const cust = actionMenuCustomer;
            handleCloseActionMenu();
            handleDownloadSanction(cust);
          }}
          sx={{ fontSize: '12.5px', py: 1, gap: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: '#2563eb' }}>
            <ArticleOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Download Sanction Letter (.docx)" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const cust = actionMenuCustomer;
            handleCloseActionMenu();
            handleOpenQueryModal(cust);
          }}
          sx={{ fontSize: '12.5px', py: 1, gap: 1.2 }}
        >
          <ListItemIcon sx={{ minWidth: 24, color: '#ea580c' }}>
            <QuestionAnswerRounded fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Queries & Change Window" primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* ── Rejection Confirmation Dialog ── */}
      <ApplicationFlowRejectDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        selectedApp={selectedRejectApp}
        reason={rejectReason}
        onChangeReason={setRejectReason}
        onConfirm={handleConfirmReject}
        loading={rejectLoading}
      />

      {/* ── Query Management Modal ── */}
      {queryModalOpen && (
        <ApplicationQueryModal
          open={queryModalOpen}
          onClose={handleCloseQueryModal}
          applicationId={selectedQueryApp?.applicationId}
          customerDetails={selectedQueryApp}
          onRefresh={onRefresh}
        />
      )}
    </Box>
  );
};

ApplicationFlowTable.propTypes = {
  applicationDetails: PropTypes.array,
  totalRecords: PropTypes.number,
  onView: PropTypes.func,
  onVerify: PropTypes.func,
  onRefresh: PropTypes.func,
  onFilterChange: PropTypes.func,
  onCreateApplication: PropTypes.func,
  onExport: PropTypes.func,
  hideFilterHeader: PropTypes.bool,
  filters: PropTypes.object,
};

export default ApplicationFlowTable;
