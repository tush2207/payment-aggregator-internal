import React, { useEffect, useMemo, useState } from 'react';
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
} from '@mui/icons-material';

import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import NoData from '&src/components/NoData';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import { isBO, isCO } from '&src/constants/PaymentAggregratorConstant';
import useToggle from '&src/hooks/useToggle';
import ManageHelpDeskForm from '&src/modules/HelpDesk/ManageHelpDeskForm';
import HelpdeskServices from '&src/services/helpdesk';
import { formatDateOnly, formatTimeOnly } from '&src/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ManageHelpDesk = () => {
  const theme = useTheme();
  const { value: showLoader, setValue: setShowLoader } = useToggle();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [ticketData, setTicketData] = useState(null);
  const [allTicketsDetails, setAllTicketsDetails] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleClose = () => {
    setTicketData(null);
    setOpen(false);
  };

  const handleOpen = () => {
    setTicketData(null);
    setOpen(true);
  };

  const fetchAllTicketsData = async () => {
    setShowLoader(true);
    try {
      const response = await HelpdeskServices.getAllHelpdesks();
      setAllTicketsDetails(response?.data || {});
      successNotification('Fetched helpdesk data successfully');
      handleClose();
    } catch (error) {
      setAllTicketsDetails({});
      errorNotification(error?.response?.data?.message || 'Failed to fetch tickets');
    } finally {
      setShowLoader(false);
    }
  };

  useEffect(() => {
    fetchAllTicketsData();
  }, []);

  const handleDelete = async () => {
    setShowLoader(true);
    try {
      await HelpdeskServices.deleteHelpdesk(ticketData?.id);
      successNotification('Ticket deleted successfully');
      fetchAllTicketsData();
      setShowLoader(false);
      setConfirmDialogOpen(false);
    } catch (error) {
      setShowLoader(false);
      console.error('[ERROR] Delete failed:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const onEditClick = (value) => {
    setTicketData(value);
    setOpen(true);
  };

  const onDeleteClick = (value) => {
    setTicketData(value);
    setConfirmDialogOpen(true);
  };

  // Raw tickets list
  const ticketsList = allTicketsDetails?.ticketsList || [];

  // Compute live KPI analytics
  const kpiStats = useMemo(() => {
    const total = ticketsList.length;
    let openCount = 0;
    let pendingCount = 0;
    let resolvedCount = 0;

    ticketsList.forEach((ticket) => {
      const status = String(ticket?.status || '').toLowerCase();
      if (status === 'resolved' || status === 'closed') {
        resolvedCount++;
      } else if (status === 'pending' || status === 'in progress' || status === 'in_progress') {
        pendingCount++;
      } else {
        openCount++;
      }
    });

    return {
      total: allTicketsDetails?.totalRecords || total,
      open: allTicketsDetails?.openTkCount !== undefined ? allTicketsDetails.openTkCount : openCount,
      pending: allTicketsDetails?.pendingTkCount !== undefined ? allTicketsDetails.pendingTkCount : pendingCount,
      resolved: allTicketsDetails?.resolvedTkCount !== undefined ? allTicketsDetails.resolvedTkCount : resolvedCount,
    };
  }, [ticketsList, allTicketsDetails]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let list = ticketsList;

    // 1. KPI Filter
    if (selectedKpiFilter === 'OPEN') {
      list = list.filter((ticket) => {
        const s = String(ticket?.status || '').toLowerCase();
        return s === 'open' || s === 'new';
      });
    } else if (selectedKpiFilter === 'PENDING') {
      list = list.filter((ticket) => {
        const s = String(ticket?.status || '').toLowerCase();
        return s === 'pending' || s === 'in progress' || s === 'in_progress';
      });
    } else if (selectedKpiFilter === 'RESOLVED') {
      list = list.filter((ticket) => {
        const s = String(ticket?.status || '').toLowerCase();
        return s === 'resolved' || s === 'closed';
      });
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((ticket) => {
        const name = ticket?.ticketName?.toLowerCase() || '';
        const account = ticket?.accountNo?.toString() || '';
        const customer = ticket?.customerName?.toLowerCase() || '';
        const desc = ticket?.description?.toLowerCase() || '';
        const status = ticket?.status?.toLowerCase() || '';
        const priority = ticket?.priority?.toLowerCase() || '';
        return (
          name.includes(query) ||
          account.includes(query) ||
          customer.includes(query) ||
          desc.includes(query) ||
          status.includes(query) ||
          priority.includes(query)
        );
      });
    }

    return list;
  }, [ticketsList, selectedKpiFilter, searchQuery]);

  // Paginate tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredTickets.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTickets, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage) || 1;

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  const handleExportExcel = () => {
    try {
      const exportRows = filteredTickets.map((row, idx) => ({
        'Sr No.': idx + 1,
        'Ticket ID': row.id || 'N/A',
        'Created Date': row.createdAt ? formatDateOnly(row.createdAt) : 'N/A',
        'Ticket / Issue': row.ticketName || 'N/A',
        'Account Number': row.accountNo || 'N/A',
        'Customer Name': row.customerName || 'N/A',
        'Description': row.description || 'N/A',
        'Priority': row.priority || 'Medium',
        'Status': row.status || 'Open',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Help Desk Queries');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      saveAs(data, `helpdesk_queries_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      successNotification('Help desk report exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      errorNotification('Failed to export help desk report');
    }
  };

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Queries',
      value: kpiStats.total,
      icon: <HelpCenterRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.primary.main || '#176FC1',
      bgGradient: 'linear-gradient(135deg, rgba(23,111,193,0.12) 0%, rgba(23,111,193,0.02) 100%)',
      badge: 'All Tickets',
    },
    {
      id: 'OPEN',
      title: 'Open Queries',
      value: kpiStats.open,
      icon: <BugReport sx={{ fontSize: 26 }} />,
      color: '#ed6c02',
      bgGradient: 'linear-gradient(135deg, rgba(237,108,2,0.12) 0%, rgba(237,108,2,0.02) 100%)',
      badge: 'Action Required',
    },
    {
      id: 'PENDING',
      title: 'Pending Review',
      value: kpiStats.pending,
      icon: <PendingActionsOutlined sx={{ fontSize: 26 }} />,
      color: '#0284c7',
      bgGradient: 'linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(2,132,199,0.02) 100%)',
      badge: 'In Progress',
    },
    {
      id: 'RESOLVED',
      title: 'Resolved Tickets',
      value: kpiStats.resolved,
      icon: <DoneAllOutlined sx={{ fontSize: 26 }} />,
      color: '#2e7d32',
      bgGradient: 'linear-gradient(135deg, rgba(46,125,50,0.12) 0%, rgba(46,125,50,0.02) 100%)',
      badge: 'Closed',
    },
  ];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {showLoader && <FullScreenLoader />}

      {/* ── Executive PageHeader ── */}
      <SectionHeader
        showButton={!isCO}
        title="Help Desk & Support Management"
        description="Track, resolve, and audit branch queries, operational tickets, and technical support requests."
        icon={<HelpCenterRounded />}
        buttonText={isMobile ? 'Add' : 'Add Query'}
        buttonProps={{
          startIcon: <Add />,
        }}
        onButtonClick={handleOpen}
      />

      {/* ── Consistent KPI Analytics Metric Cards ── */}
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
                  background: isSelected ? card.bgGradient : '#ffffff',
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
                        width: 42,
                        height: 42,
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
                        color: isSelected ? '#ffffff' : card.color,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.2, p: 1.2, px: 2, bgcolor: '#f0f7ff', borderRadius: '8px', border: '1px dashed #176FC1' }}>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0E4F8D' }}>
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

      {/* ── Unified Table Action Header Bar ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8} flexWrap="wrap" gap={1.2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} color="#0E4F8D" sx={{ fontSize: '1.05rem' }}>
            Help Desk Queries
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
            ({filteredTickets.length} {filteredTickets.length === 1 ? 'record' : 'records'})
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search ticket, account, customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: 200, sm: 280 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                bgcolor: '#ffffff',
                fontSize: '0.82rem',
                height: '36px',
              },
            }}
          />

          <Tooltip title="Export all helpdesk tickets as Excel spreadsheet" arrow>
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

      {/* ── Modern Responsive Data Table ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '10px 10px 0 0',
          border: '1px solid',
          borderColor: '#cbd5e1',
          overflowX: 'auto',
          overflow: 'hidden',
          width: '100%',
          boxShadow: 'none',
        }}
      >
        <Table sx={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)', borderBottom: '2px solid #062545' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 50, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>#</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Created At</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Ticket / Issue</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Account No</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Customer Name</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Description</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Priority</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Status</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((row, index) => {
                const rowIndex = (page - 1) * rowsPerPage + index;

                return (
                  <TableRow
                    key={row.id || rowIndex}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '12px' }}>
                      {rowIndex + 1}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '12.5px', lineHeight: 1.3 }}>
                        {formatDateOnly(row.createdAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', display: 'block', mt: 0.2 }}>
                        {formatTimeOnly(row.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '13px' }}>
                        {row.ticketName || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontSize: '12.5px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {row.accountNo || 'N/A'}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, fontSize: '12.5px', color: 'text.primary' }}>
                      {row.customerName || 'N/A'}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.secondary', wordBreak: 'break-word' }}>
                        {row.description || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <StatusChipOrSelect value={row.priority} type="priority" />
                    </TableCell>

                    <TableCell align="center">
                      <StatusChipOrSelect value={row.status} />
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.8} justifyContent="center">
                        {isCO ? (
                          <Tooltip title="Reply / Update Ticket" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onEditClick(row)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'primary.light',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.light', color: '#fff' },
                              }}
                            >
                              <ReplyOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="View Query" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onEditClick(row)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'primary.light',
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.light', color: '#fff' },
                              }}
                            >
                              <VisibilityOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {isBO && (
                          <Tooltip title="Delete Query" arrow>
                            <IconButton
                              size="small"
                              onClick={() => onDeleteClick(row)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'error.light',
                                color: 'error.main',
                                '&:hover': { bgcolor: 'error.light', color: '#fff' },
                              }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <NoData message={searchQuery ? 'No matching tickets found' : 'No tickets available'} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ── Table Pagination Bar ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            px: 2.5,
            borderTop: '1px solid',
            borderColor: 'grey.200',
            bgcolor: '#fafafa',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Rows per page:
            </Typography>
            <TextField
              select
              size="small"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              sx={{
                width: 75,
                '& .MuiOutlinedInput-root': {
                  fontSize: '12px',
                  borderRadius: '6px',
                  bgcolor: '#fff',
                },
              }}
            >
              {[5, 10, 20, 50].map((option) => (
                <MenuItem key={option} value={option} sx={{ fontSize: '12px' }}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            size={isMobile ? 'small' : 'medium'}
            showFirstButton
            showLastButton
          />
        </Box>
      </TableContainer>

      {/* ── Add / Edit Dialog ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        headerText={ticketData ? 'Ticket Information' : 'Add New Query'}
      >
        <ManageHelpDeskForm
          updateDetails={ticketData}
          fetchAllTickets={fetchAllTicketsData}
          handleClose={handleClose}
          formClosed={open || confirmDialogOpen}
        />
      </DialogWithHeader>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmationDialogWithReason
        title="Delete Confirmation"
        description={
          <Typography>
            Are you sure you want to delete{' '}
            <Typography component="span" fontWeight={700} color="primary.main">
              {ticketData?.ticketName}
            </Typography>{' '}
            Ticket?
          </Typography>
        }
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        confirmTextColor="error"
        isLoading={showLoader}
      />
    </Box>
  );
};

export default ManageHelpDesk;
