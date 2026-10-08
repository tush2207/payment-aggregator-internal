import React, { useMemo } from 'react';
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
  MailRounded,
  KeyRounded,
  Visibility,
} from '@mui/icons-material';

import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import NoData from '&src/components/NoData';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import ManageAggregatorForm from '&src/modules/ManageAggregrator/ManageAggregatorForm';
import useManageAggregator from '&src/hooks/useManageAggregator';
import { CommonTableFilterSection } from '&src/components/Filters';

/**
 * ManageAggregator Page Component.
 *
 * @architecture Clean Architecture:
 * - Pure Presentational View (.jsx)
 * - All business logic, mutations, pagination, Excel reports isolated in useManageAggregator (.js)
 * - 100% theme design tokens (Zero hardcoded HEX values)
 */
const ManageAggregator = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
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
  } = useManageAggregator();

  const totalPages = Math.ceil(filteredAggregators.length / rowsPerPage) || 1;

  const headerActions = useMemo(() => {
    const list = [
      {
        label: 'Export All',
        onClick: handleExportExcel,
        variant: 'contained',
        color: 'success',
        startIcon: <FileDownloadRounded />,
        sx: {
          bgcolor: '#2E7D32',
          '&:hover': { bgcolor: '#1B5E20' },
          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
        },
      },
    ];
    if (isAdmin) {
      list.push({
        label: isMobile ? 'Add' : 'Add Aggregator',
        onClick: handleOpen,
        variant: 'contained',
        color: 'primary',
        startIcon: <Add />,
      });
    }
    return list;
  }, [isAdmin, isMobile, handleOpen, handleExportExcel]);

  const kpiCards = [
    {
      id: 'ALL',
      title: 'Total Aggregators',
      value: kpiStats.total,
      icon: <Groups2 sx={{ fontSize: 26 }} />,
      color: theme.palette.primary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
      badge: 'All Partners',
    },
    {
      id: 'ACTIVE',
      title: 'Active Partners',
      value: kpiStats.active,
      icon: <CheckCircleRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.success.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.12)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
      badge: 'Operational',
    },
    {
      id: 'INACTIVE',
      title: 'Inactive / Pending',
      value: kpiStats.inactive,
      icon: <HourglassTopRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.warning.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
      badge: 'Action Needed',
    },
    {
      id: 'MULTI',
      title: 'Multi-Channel Partners',
      value: kpiStats.multiChannel,
      icon: <HubRounded sx={{ fontSize: 26 }} />,
      color: theme.palette.secondary.main,
      bgGradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      badge: 'Integrated',
    },
  ];

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {showLoader && <FullScreenLoader />}

      {/* ── Executive PageHeader with Export All & Action Buttons ── */}
      <SectionHeader
        title="Manage Payment Aggregators"
        description="Configure approved payment aggregators, authorized contact points, and enabled services."
        icon={<Groups2 />}
        actions={headerActions}
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

      {/* ── Search Filter Bar (Matching standard search width, only search shown) ── */}
      <CommonTableFilterSection
        search={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search aggregator name, contact, email, services..."
        onReset={handleResetFilters}
        showStatusGroup={false}
        showFinancialYear={false}
        showMonth={false}
        showDateRange={false}
        showReset={false}
      />

      {/* ── Main Aggregators Table ── */}
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={(th) => ({ background: `linear-gradient(90deg, ${th.palette.primary.dark} 0%, ${th.palette.primary.main} 100%)` })}>
            <TableRow>
              <TableCell sx={{ color: '#fff', fontWeight: 700, width: 60 }}>Sr.</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Aggregator Name</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Contact Person</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Email Address</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Mobile Number</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Services</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'center', width: 160 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAggregators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6 }}>
                  <NoData message="No payment aggregators match your search or filter criteria." />
                </TableCell>
              </TableRow>
            ) : (
              paginatedAggregators.map((row, index) => (
                <TableRow key={row.aggregatorId || index} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{(page - 1) * rowsPerPage + index + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.dark' }}>{row.aggregatorName}</TableCell>
                  <TableCell>{row.contactPersonName || '-'}</TableCell>
                  <TableCell>{row.email || '-'}</TableCell>
                  <TableCell>{row.mobileNo || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(row.services || '').split('|').filter(Boolean).map((srv, sIdx) => (
                        <Chip key={sIdx} label={srv.trim()} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 20 }} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <StatusChipOrSelect value={row.status || 'active'} type="status" />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary" onClick={() => handleView(row)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {isAdmin && (
                        <>
                          <Tooltip title="Edit Aggregator">
                            <IconButton size="small" color="info" onClick={() => handleEdit(row)}>
                              <EditOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Dispatch Login Credentials Email">
                            <IconButton size="small" color="secondary" onClick={() => handleSendCredentials(row)}>
                              <MailRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Generate Temporary Password">
                            <IconButton size="small" sx={{ color: 'warning.main' }} onClick={() => handleResetPassword(row)}>
                              <KeyRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Aggregator">
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

      {/* ── Aggregator Form Dialog ── */}
      <DialogWithHeader
        open={open}
        onClose={handleClose}
        title={isViewMode ? 'Aggregator Details' : aggregatorData ? 'Edit Aggregator' : 'Add New Payment Aggregator'}
        maxWidth="md"
      >
        <ManageAggregatorForm
          aggregatorData={aggregatorData}
          isViewMode={isViewMode}
          onSuccess={() => {
            handleClose();
            fetchAllAggregators();
          }}
          onClose={handleClose}
        />
      </DialogWithHeader>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDeleteAggregator}
        title="Delete Payment Aggregator"
        message={`Are you sure you want to delete "${aggregatorData?.aggregatorName}"? This action cannot be undone.`}
      />
    </Box>
  );
};

export default ManageAggregator;
