import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Tooltip,
  Typography,
  Chip,
  Stack,
  Switch,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Add,
  Clear,
  DeleteOutline,
  EditOutlined,
  Search,
  Groups2,
  CheckCircleRounded,
  HourglassTopRounded,
  HubRounded,
  FilterAltOffRounded,
  FileDownloadRounded,
  LockPerson,
  MailRounded,
} from '@mui/icons-material';

import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import NoData from '&src/components/NoData';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import useAggregatorDetails from '&src/hooks/useAggregatorDetails';
import useToggle from '&src/hooks/useToggle';
import ManageAggregatorForm from '&src/modules/ManageAggregrator/ManageAggregatorForm';
import manageAggregatorServices from '&src/services/manageAggregator';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';

const ManageAggregator = () => {
  const theme = useTheme();
  const { value: isLoading, setValue: setShowLoader } = useToggle();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [open, setOpen] = useState(false);
  const [aggregatorData, setAggregatorData] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState('ALL');

  const { isLoading: showLoader, aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleOpen = () => {
    setAggregatorData(null);
    setOpen(true);
  };

  const handleClose = () => {
    setAggregatorData(null);
    setOpen(false);
  };

  const handleDelete = async () => {
    setShowLoader(true);
    try {
      await manageAggregatorServices.deleteAggregator(aggregatorData?.aggregatorId);
      successNotification('Aggregator deleted successfully');
      fetchAllAggregators?.();
      setShowLoader(false);
      setConfirmDialogOpen(false);
    } catch (error) {
      setShowLoader(false);
      console.error('[ERROR] Delete failed:', error);
      errorNotification(error?.response?.data?.message || 'Failed to delete Aggregator');
    }
  };

  const handleToggleStatus = async (agg) => {
    const currentIsActive = String(agg?.status || '').toLowerCase() === 'active';
    const newStatus = currentIsActive ? 'inactive' : 'active';
    setShowLoader(true);
    try {
      await manageAggregatorServices.updateAggregator(agg.aggregatorId, {
        ...agg,
        status: newStatus,
      });
      successNotification(`${agg.aggregatorName} marked as ${newStatus === 'active' ? 'Active' : 'Inactive'}`);
      fetchAllAggregators?.();
    } catch (error) {
      console.error('[ERROR] Status toggle failed:', error);
      errorNotification(error?.response?.data?.message || 'Failed to update Aggregator status');
    } finally {
      setShowLoader(false);
    }
  };

  const onEditClick = (value) => {
    setAggregatorData(value);
    setOpen(true);
  };

  const onDeleteClick = (value) => {
    setAggregatorData(value);
    setConfirmDialogOpen(true);
  };

  // Compute live KPI analytics
  const kpiStats = useMemo(() => {
    const list = Array.isArray(aggregatorDetails) ? aggregatorDetails : [];
    const total = list.length;
    let active = 0;
    let inactive = 0;
    let withServices = 0;

    list.forEach((agg) => {
      const isAct = String(agg?.status || '').toLowerCase() === 'active';
      if (isAct) {
        active++;
      } else {
        inactive++;
      }
      if (agg?.services && agg.services !== '-' && String(agg.services).trim() !== '') {
        withServices++;
      }
    });

    return { total, active, inactive, withServices };
  }, [aggregatorDetails]);

  // Filter aggregators
  const filteredAggregators = useMemo(() => {
    let list = Array.isArray(aggregatorDetails) ? aggregatorDetails : [];

    // 1. KPI Filter
    if (selectedKpiFilter === 'ACTIVE') {
      list = list.filter((agg) => String(agg?.status || '').toLowerCase() === 'active');
    } else if (selectedKpiFilter === 'INACTIVE') {
      list = list.filter((agg) => String(agg?.status || '').toLowerCase() !== 'active');
    } else if (selectedKpiFilter === 'SERVICES') {
      list = list.filter((agg) => agg?.services && agg.services !== '-' && String(agg.services).trim() !== '');
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((agg) => {
        const name = agg?.aggregatorName?.toLowerCase() || '';
        const person = agg?.contactPersonName?.toLowerCase() || '';
        const email = agg?.email?.toLowerCase() || '';
        const mobile = agg?.mobileNo?.toString() || '';
        const services = agg?.services?.toLowerCase() || '';
        return (
          name.includes(query) ||
          person.includes(query) ||
          email.includes(query) ||
          mobile.includes(query) ||
          services.includes(query)
        );
      });
    }

    return list;
  }, [aggregatorDetails, selectedKpiFilter, searchQuery]);

  // Paginate aggregators
  const paginatedAggregators = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredAggregators.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAggregators, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredAggregators.length / rowsPerPage) || 1;

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1);
  };

  const handleExportExcel = () => {
    try {
      const exportRows = filteredAggregators.map((row, idx) => ({
        'Sr No.': idx + 1,
        'Aggregator ID': row.aggregatorId || 'N/A',
        'Aggregator Name': row.aggregatorName || 'N/A',
        'Contact Person': row.contactPersonName || 'N/A',
        'Contact Email': row.email || 'N/A',
        'Mobile Number': row.mobileNo || 'N/A',
        'Services Enabled': Array.isArray(row.services) ? row.services.join(', ') : row.services || '-',
        'Status': row.status || 'Active',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Aggregators');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      saveAs(data, `payment_aggregators_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      successNotification('Aggregators list exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      errorNotification('Failed to export aggregators list');
    }
  };

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Aggregators',
      value: kpiStats.total,
      icon: <Groups2 sx={{ fontSize: 26 }} />,
      color: theme.palette.primary.main || '#176FC1',
      bgGradient: 'linear-gradient(135deg, rgba(23,111,193,0.12) 0%, rgba(23,111,193,0.02) 100%)',
      badge: 'All Partners',
    },
    {
      id: 'ACTIVE',
      title: 'Active Partners',
      value: kpiStats.active,
      icon: <CheckCircleRounded sx={{ fontSize: 26 }} />,
      color: '#2e7d32',
      bgGradient: 'linear-gradient(135deg, rgba(46,125,50,0.12) 0%, rgba(46,125,50,0.02) 100%)',
      badge: 'Operational',
    },
    {
      id: 'INACTIVE',
      title: 'Inactive / Pending',
      value: kpiStats.inactive,
      icon: <HourglassTopRounded sx={{ fontSize: 26 }} />,
      color: '#ed6c02',
      bgGradient: 'linear-gradient(135deg, rgba(237,108,2,0.12) 0%, rgba(237,108,2,0.02) 100%)',
      badge: 'Action Needed',
    },
    {
      id: 'SERVICES',
      title: 'Configured Services',
      value: kpiStats.withServices,
      icon: <HubRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.secondary.main || '#CE0F3E',
      bgGradient: 'linear-gradient(135deg, rgba(206,15,62,0.12) 0%, rgba(206,15,62,0.02) 100%)',
      badge: 'Integrated',
    },
  ];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {(isLoading || showLoader) && <FullScreenLoader />}

      {/* ── Executive PageHeader ── */}
      <SectionHeader
        showButton
        title="Manage Payment Aggregators"
        description="Configure approved payment aggregators, authorized contact points, and enabled services."
        icon={<Groups2 />}
        buttonText={isMobile ? 'Add' : 'Add Aggregator'}
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
            Active Filter: <b>{kpiCards.find((c) => c.id === selectedKpiFilter)?.title}</b> ({filteredAggregators.length} records)
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
            Aggregators Directory
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
            ({filteredAggregators.length} {filteredAggregators.length === 1 ? 'record' : 'records'})
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search aggregator, contact, email..."
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

          <Tooltip title="Export all aggregators as Excel spreadsheet" arrow>
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
        <Table sx={{ minWidth: 850, borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)', borderBottom: '2px solid #062545' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 50, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>#</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Aggregator Name</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Contact Person</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Contact Email</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Mobile Number</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, borderRight: '1px solid rgba(255,255,255,0.25)' }}>Services</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Status</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.5, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedAggregators.length > 0 ? (
              paginatedAggregators.map((row, index) => {
                const rowIndex = (page - 1) * rowsPerPage + index;
                const isUserActive = String(row?.status || '').toLowerCase() === 'active';
                const servicesText = row?.services
                  ? Array.isArray(row.services)
                    ? row.services.join(', ')
                    : row.services.replace(/\|/g, ', ')
                  : '-';

                return (
                  <TableRow
                    key={row.aggregatorId || rowIndex}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '12px' }}>
                      {rowIndex + 1}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '13px' }}>
                        {row.aggregatorName || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ fontWeight: 600, fontSize: '12.5px', color: 'text.primary' }}>
                      {row.contactPersonName || 'N/A'}
                    </TableCell>

                    <TableCell sx={{ fontSize: '12.5px', color: 'text.secondary' }}>
                      {row.email || 'N/A'}
                    </TableCell>

                    <TableCell sx={{ fontSize: '12.5px', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {row.mobileNo || 'N/A'}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography variant="body2" sx={{ fontSize: '12px', color: 'text.primary', wordBreak: 'break-word' }}>
                        {servicesText}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <StatusChipOrSelect value={row.status} type="status" />
                        <Tooltip title={isUserActive ? 'Active Partner' : 'Inactive Partner'} arrow>
                          <IconButton size="small" sx={{ p: 0.5 }}>
                            {isUserActive ? (
                              <LockOpenOutlined sx={{ color: 'success.main', fontSize: 18 }} />
                            ) : (
                              <LockPerson sx={{ color: 'error.main', fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={0.8} justifyContent="center">
                        <Tooltip title="Send Test Quotation Email" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onTestEmailClick(row)}
                            sx={{
                              bgcolor: 'rgba(23, 111, 193, 0.08)',
                              color: '#176FC1',
                              '&:hover': { bgcolor: '#176FC1', color: '#fff' },
                            }}
                          >
                            <MailRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Aggregator" arrow>
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
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Aggregator" arrow>
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
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <NoData message={searchQuery ? 'No matching aggregators found' : 'No aggregators available'} />
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

      {/* ── Add / Edit Aggregator Modal ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="md"
        headerText={aggregatorData ? 'Edit Payment Aggregator' : 'Add Payment Aggregator'}
      >
        <ManageAggregatorForm
          updateDetails={aggregatorData}
          handleClose={handleClose}
          fetchAllAggregators={fetchAllAggregators}
        />
      </DialogWithHeader>

      {/* ── Test Email Modal ── */}


      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Aggregator"
        message={`Are you sure you want to delete "${aggregatorData?.aggregatorName}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ManageAggregator;
