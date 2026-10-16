import React, { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  BugReport,
  Clear,
  DeleteOutline,
  DoneAllOutlined,
  EditOutlined,
  PendingActionsOutlined,
  Search,
  VisibilityOutlined,
  ReplyOutlined,
  HelpCenterRounded,
  Add,
  FilterAltOffRounded,
  FileDownloadRounded,
  AttachFileRounded,
} from '@mui/icons-material';

import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import NoData from '&src/components/feedback/NoData';
import StatusChipOrSelect from '&src/components/table/common/StatusChipOrSelect';
import { isBO, isCO } from '&src/constants/PaymentAggregratorConstant';
import ApplicationQueryModal from '&src/features/application-flow/ApplicationQueryModal';
import ManageHelpDeskForm from '&src/features/helpdesk/ManageHelpDeskForm';
import useHelpDesk from '&src/hooks/useHelpDesk';
import { formatDateOnly, formatTimeOnly } from '&src/utils';
import { CommonTableFilterSection } from '&src/components/Filters';

/**
 * ManageHelpDesk Page Component.
 *
 * @architecture Clean Architecture:
 * - Pure Presentational View (.jsx)
 * - All business logic, WebSocket syncing, mutations, pagination, and Excel reports in useHelpDesk (.js)
 * - 100% theme design tokens (Zero hardcoded HEX values)
 */
const ManageHelpDesk = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedTicketForChat, setSelectedTicketForChat] = React.useState(null);

  const {
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
  } = useHelpDesk();

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage) || 1;

  const headerActions = useMemo(() => {
    const list = [
      {
        label: 'Export All',
        onClick: handleExportExcel,
        variant: 'outlined',
        color: 'primary',
        startIcon: <FileDownloadRounded />,
        sx: {
          fontWeight: 700,
          borderRadius: '8px',
          px: 2.2,
          py: 0.9,
          boxShadow: '0 2px 8px rgba(155, 10, 46, 0.25)',
        },
      },
    ];
    if (!isCO) {
      list.push({
        label: isMobile ? 'Add' : 'Add Query',
        onClick: handleOpen,
        variant: 'contained',
        color: 'primary',
        startIcon: <Add />,
      });
    }
    return list;
  }, [isCO, isMobile, handleOpen, handleExportExcel]);

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Queries',
      value: kpiStats.total,
      icon: <HelpCenterRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.primary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      badge: 'All Tickets',
    },
    {
      id: 'OPEN',
      title: 'Open Queries',
      value: kpiStats.open,
      icon: <BugReport sx={{ fontSize: 26 }} />,
      color: theme.palette.warning.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
      badge: 'Action Required',
    },
    {
      id: 'PENDING',
      title: 'Pending Review',
      value: kpiStats.pending,
      icon: <PendingActionsOutlined sx={{ fontSize: 26 }} />,
      color: theme.palette.info.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
      badge: 'In Progress',
    },
    {
      id: 'RESOLVED',
      title: 'Resolved Tickets',
      value: kpiStats.resolved,
      icon: <DoneAllOutlined sx={{ fontSize: 26 }} />,
      color: theme.palette.success.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
      badge: 'Closed',
    },
  ];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {showLoader && <FullScreenLoader />}

      {/* ── Executive PageHeader with Export All & Actions ── */}
      <SectionHeader
        title="Help Desk & Support Management"
        description="Track, resolve, and audit branch queries, operational tickets, and technical support requests."
        icon={<HelpCenterRounded />}
        actions={headerActions}
      />

      {/* ── KPI Analytics Metric Cards ── */}
      <Grid container spacing={2} mb={3}>
        {kpiCards.map((card) => {
          const isSelected = selectedKpiFilter === card.id;

          return (
            <Grid item xs={12} sm={6} md={3} key={card.id}>
              <Card
                onClick={() => setSelectedKpiFilter(selectedKpiFilter === card.id ? 'ALL' : card.id)}
                elevation={0}
                sx={{
                  cursor: 'pointer',
                  p: 0,
                  borderRadius: '14px',
                  border: '2px solid',
                  borderColor: isSelected ? card.color : 'grey.200',
                  background: isSelected ? card.bgGradient : theme.palette.background.paper,
                  boxShadow: isSelected
                    ? `0 6px 18px ${alpha(card.color, 0.25)}`
                    : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 8px 20px ${alpha(card.color, 0.22)}`,
                    borderColor: card.color,
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(card.color, 0.12),
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>

                    <Chip
                      label={card.badge}
                      size="small"
                      sx={{
                        bgcolor: isSelected ? card.color : alpha(card.color, 0.08),
                        color: isSelected ? theme.palette.common.white : card.color,
                        fontWeight: 700,
                        fontSize: '0.68rem',
                        borderRadius: '6px',
                        height: 20,
                      }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.80rem' }}>
                    {card.title}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mt: 0.4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: card.color, fontSize: '1.75rem', lineHeight: 1.1 }}>
                      {card.value}
                    </Typography>

                    <Typography variant="caption" sx={{ color: isSelected ? card.color : 'text.disabled', fontSize: '0.70rem', fontWeight: 600 }}>
                      {isSelected ? '● Filtering active' : 'Click to filter'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Active KPI Filter Indicator Banner ── */}
      {selectedKpiFilter !== 'ALL' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.2, p: 1.2, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: '8px', border: `1px dashed ${theme.palette.primary.main}` }}>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'primary.dark' }}>
            Active Filter: <b>{kpiCards.find((c) => c.id === selectedKpiFilter)?.title}</b> ({filteredTickets.length} records)
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<FilterAltOffRounded />}
            onClick={() => setSelectedKpiFilter('ALL')}
            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0.2, px: 1.2, ml: 'auto', borderRadius: '6px' }}
          >
            Clear Filter
          </Button>
        </Box>
      )}

      {/* ── Unified Filter Section (All except active status buttons) ── */}
      <CommonTableFilterSection
        search={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search query subject, account, customer, branch, ID..."
        financialYear={financialYear}
        onFinancialYearChange={(val) => {
          setFinancialYear(val);
          setPage(1);
        }}
        month={selectedMonth}
        onMonthChange={(val) => {
          setSelectedMonth(val);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(val) => {
          setStartDate(val);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(val) => {
          setEndDate(val);
          setPage(1);
        }}
        onReset={handleResetFilters}
        showStatusGroup={false}
      />

      {/* ── Main Tickets Table ── */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={(th) => ({ background: `linear-gradient(90deg, ${th.palette.primary.dark} 0%, ${th.palette.primary.main} 100%)` })}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 700, width: 60 }}>Sr.</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Created Date</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Ticket Subject</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>A/C No.</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Branch / Region</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Priority</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', width: 140 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} sx={{ py: 6 }}>
                  <NoData message="No support queries match your search or filter criteria." />
                </TableCell>
              </TableRow>
            ) : (
              paginatedTickets.map((row, index) => (
                <TableRow key={row.id || index} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.80rem' }}>
                      {formatDateOnly(row.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatTimeOnly(row.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.dark' }}>
                    {row.ticketName}
                  </TableCell>
                  <TableCell>{row.customerName || '-'}</TableCell>
                  <TableCell>{row.accountNo || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: '0.80rem' }}>{row.branchName || '-'}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.regionName || '-'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChipOrSelect value={row.priority || 'medium'} type="priority" />
                  </TableCell>
                  <TableCell align="center">
                    <StatusChipOrSelect value={row.status || 'open'} type="status" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Query Details">
                        <IconButton size="small" color="primary" onClick={() => handleView(row)}>
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Open Discussion Thread">
                        <IconButton size="small" color="info" onClick={() => setSelectedTicketForChat(row)}>
                          <ReplyOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {isBO && (
                        <>
                          <Tooltip title="Edit Query">
                            <IconButton size="small" sx={{ color: 'warning.main' }} onClick={() => handleEdit(row)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Query">
                            <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(row)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Table Pagination Bar ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} flexWrap="wrap" gap={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">Rows per page:</Typography>
          <TextField
            select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            sx={{ width: 75 }}
          >
            {[5, 10, 25, 50].map((num) => (
              <MenuItem key={num} value={num}>{num}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
          color="primary"
          shape="rounded"
          size={isMobile ? 'small' : 'medium'}
        />
      </Box>

      {/* ── Ticket Add/Edit Dialog ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        title={ticketData ? 'Edit Support Ticket' : 'Create New Support Query'}
        maxWidth="md"
      >
        <ManageHelpDeskForm
          ticketData={ticketData}
          onSuccess={() => {
            handleClose();
            fetchAllTicketsData();
          }}
          onClose={handleClose}
        />
      </DialogWithHeader>

      {/* ── Discussion Thread Modal ── */}
      {selectedTicketForChat && (
        <ApplicationQueryModal
          open={Boolean(selectedTicketForChat)}
          onClose={() => setSelectedTicketForChat(null)}
          applicationData={{
            applicationId: selectedTicketForChat.id,
            customerName: selectedTicketForChat.customerName,
          }}
        />
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDeleteTicket}
        title="Delete Support Query"
        message={`Are you sure you want to delete ticket "${ticketData?.ticketName}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ManageHelpDesk;
