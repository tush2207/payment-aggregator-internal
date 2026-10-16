import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  StorageRounded,
  DeleteForeverRounded,
  RefreshRounded,
  SearchRounded,
  DeleteOutlineRounded,
  CheckCircleRounded,
  LayersClearRounded,
} from '@mui/icons-material';
import applicationServices from '&src/services/applications';
import TruncateConfirmModal from './TruncateConfirmModal';

export default function DatabaseTablesManager() {
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [searchApp, setSearchApp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal State
  const [modalState, setModalState] = useState({
    open: false,
    title: '',
    targetName: '',
    targetType: 'table', // 'table' | 'all' | 'application'
    recordCount: 0,
    payload: null,
  });

  // Notification / Alert State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Fetch Live Table Summary ──────────────────────────────────────────────
  const fetchTableSummary = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await applicationServices.getQATablesSummary();
      if (res && res.data && Array.isArray(res.data.tables)) {
        setTables(res.data.tables);
      }
    } catch (err) {
      console.error('Failed to load QA tables summary:', err);
      showNotification('Failed to fetch table metadata.', 'error');
    } finally {
      setLoadingTables(false);
    }
  }, []);

  // ── Fetch Live Applications for Force-Delete Grid ──────────────────────────
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const res = await applicationServices.getAllApplications({ zoneId: '00000', page: 1, pageSize: 50 });
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list)) {
        setApplications(list);
      }
    } catch (err) {
      console.error('Failed to load applications for QA manager:', err);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    fetchTableSummary();
    fetchApplications();
  }, [fetchTableSummary, fetchApplications]);

  // ── Modal Open Handlers ───────────────────────────────────────────────────
  const handleOpenTruncateTable = (tbl) => {
    setModalState({
      open: true,
      title: `Truncate Table: ${tbl.label} (${tbl.tableName})`,
      targetName: tbl.tableName,
      targetType: 'table',
      recordCount: tbl.count,
      payload: tbl.tableName,
    });
  };

  const handleOpenWipeAll = () => {
    const totalApps = tables.find((t) => t.tableName === 'applications')?.count || applications.length;
    setModalState({
      open: true,
      title: 'Wipe All Test Applications & Associated Commercials',
      targetName: 'All Applications, Projections, Quotes & Tickets',
      targetType: 'all',
      recordCount: totalApps,
      payload: 'ALL_APPLICATIONS',
    });
  };

  const handleOpenDeleteSingleApp = (app) => {
    setModalState({
      open: true,
      title: `Force Delete Application #${app.applicationId}`,
      targetName: `${app.applicationId} (${app.customerName || 'Customer'})`,
      targetType: 'application',
      recordCount: 1,
      payload: app.applicationId,
    });
  };

  // ── Execution of Truncate / Delete ─────────────────────────────────────────
  const handleExecuteConfirmedAction = async () => {
    setActionLoading(true);
    try {
      if (modalState.targetType === 'all') {
        const res = await applicationServices.wipeAllQAApplications();
        showNotification(res?.data?.message || 'Successfully wiped all QA applications and child records.', 'success');
      } else if (modalState.targetType === 'table') {
        const res = await applicationServices.truncateQATable(modalState.payload);
        showNotification(res?.data?.message || `Successfully truncated table ${modalState.payload}.`, 'success');
      } else if (modalState.targetType === 'application') {
        const res = await applicationServices.forceDeleteQAApplication(modalState.payload);
        showNotification(res?.data?.message || `Successfully deleted application #${modalState.payload}.`, 'success');
      }
      setModalState((prev) => ({ ...prev, open: false }));
      await fetchTableSummary();
      await fetchApplications();
    } catch (err) {
      console.error('Error during QA database operation:', err);
      const errMsg = err?.response?.data?.detail || err?.message || 'Operation failed.';
      showNotification(`Failed: ${errMsg}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Metrics Calculation ───────────────────────────────────────────────────
  const totalAppsCount = tables.find((t) => t.tableName === 'applications')?.count ?? 0;
  const totalProjectionsCount = tables.find((t) => t.tableName === 'projection_details')?.count ?? 0;
  const totalQuotesCount = tables.find((t) => t.tableName === 'payment_aggregators')?.count ?? 0;
  const totalQueriesCount = tables.find((t) => t.tableName === 'helpdesk')?.count ?? 0;

  const filteredApps = applications.filter((a) => {
    if (!searchApp.trim()) return true;
    const query = searchApp.toLowerCase();
    return (
      String(a.applicationId).includes(query) ||
      (a.customerName && a.customerName.toLowerCase().includes(query)) ||
      (a.branchName && a.branchName.toLowerCase().includes(query)) ||
      (a.status && a.status.toLowerCase().includes(query))
    );
  });

  return (
    <Box>
      {/* ── Top Alert / Guide Banner ── */}
      <Alert
        severity="error"
        icon={<StorageRounded fontSize="inherit" />}
        sx={{
          mb: 3,
          borderRadius: '10px',
          bgcolor: '#fff1f2',
          border: '1px solid #fecdd3',
          '& .MuiAlert-message': { width: '100%' },
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={() => {
                fetchTableSummary();
                fetchApplications();
              }}
              disabled={loadingTables || loadingApps}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Refresh Counts
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<LayersClearRounded />}
              onClick={handleOpenWipeAll}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: '6px' }}
            >
              Wipe All Test Applications
            </Button>
          </Box>
        }
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9f1239' }}>
          QA & Testing Database Operations (Live Environment Wiping & Table Truncation)
        </Typography>
        <Typography variant="caption" sx={{ color: '#881337', display: 'block', mt: 0.5 }}>
          Use these controls exclusively during test iterations to flush corrupted test states, reset test workflows, or clear individual application datasets.
        </Typography>
      </Alert>

      {/* ── Metric Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'APPLICATIONS', count: totalAppsCount, color: '#0E4F8D', bg: '#eff6ff' },
          { label: 'PROJECTION RECORDS', count: totalProjectionsCount, color: '#059669', bg: '#ecfdf5' },
          { label: 'AGGREGATOR QUOTES', count: totalQuotesCount, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'HELPDESK QUERIES', count: totalQueriesCount, color: '#d97706', bg: '#fffbeb' },
        ].map((m, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper
              sx={{
                p: 2,
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                bgcolor: m.bg,
                boxShadow: 'none',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>
                {m.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: m.color, mt: 0.5 }}>
                {loadingTables ? '...' : m.count}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Table 1: Live Database Tables & Truncate Actions ── */}
      <Card sx={{ mb: 3, borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageRounded sx={{ color: '#0E4F8D', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0E4F8D' }}>
              Database Tables & Record Counts
            </Typography>
          </Box>
          <Chip label={`${tables.length} Registered Tables`} size="small" sx={{ fontWeight: 700, fontSize: '11px' }} />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#0E4F8D' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '11.5px', width: 220 }}>TABLE NAME / MODEL</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '11.5px', width: 140 }}>CATEGORY</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '11.5px', width: 120, textAlign: 'center' }}>RECORD COUNT</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '11.5px' }}>DESCRIPTION & USAGE</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '11.5px', width: 160, textAlign: 'right' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingTables ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: '#0E4F8D', mr: 1, verticalAlign: 'middle' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Loading database table summaries...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : tables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: '#64748b' }}>
                    No table metadata available.
                  </TableCell>
                </TableRow>
              ) : (
                tables.map((tbl) => (
                  <TableRow key={tbl.tableName} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '13px' }}>
                        {tbl.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '11px' }}>
                        {tbl.tableName} &bull; {tbl.modelName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tbl.category}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '10.5px',
                          bgcolor: tbl.category === 'Core Workflow' ? '#eff6ff' : tbl.category === 'Commercials' ? '#ecfdf5' : '#f1f5f9',
                          color: tbl.category === 'Core Workflow' ? '#1d4ed8' : tbl.category === 'Commercials' ? '#047857' : '#475569',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Chip
                        label={`${tbl.count} rows`}
                        size="small"
                        color={tbl.count > 0 ? 'primary' : 'default'}
                        variant={tbl.count > 0 ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 800, fontSize: '11px', height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#475569', fontSize: '11.5px', display: 'block' }}>
                        {tbl.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteForeverRounded />}
                        onClick={() => handleOpenTruncateTable(tbl)}
                        disabled={tbl.count === 0}
                        sx={{
                          fontWeight: 700,
                          fontSize: '11px',
                          textTransform: 'none',
                          borderRadius: '6px',
                          py: 0.25,
                        }}
                      >
                        Truncate Table
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Table 2: Live Test Applications Manager & Force Delete Grid ── */}
      <Card sx={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: 'none' }}>
        <Box
          sx={{
            p: 2,
            bgcolor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0E4F8D' }}>
              Test Applications Manager ({applications.length} Loaded)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Directly inspect and purge individual test applications and their complete cascading records.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              size="small"
              placeholder="Search by ID, customer, branch..."
              value={searchApp}
              onChange={(e) => setSearchApp(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 280, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshRounded />}
              onClick={fetchApplications}
              disabled={loadingApps}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 90 }}>APP ID</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 220 }}>CUSTOMER NAME</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 160 }}>BRANCH / REGION</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 140 }}>STATUS</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 130 }}>TURNOVER (₹)</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 120 }}>CREATED AT</TableCell>
                <TableCell sx={{ bgcolor: '#0E4F8D', color: '#fff', fontWeight: 700, fontSize: '11px', width: 100, textAlign: 'center' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingApps ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={20} sx={{ mr: 1, verticalAlign: 'middle' }} />
                    <Typography variant="caption">Loading applications...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: '#64748b' }}>
                    No applications found matching search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => (
                  <TableRow key={app.applicationId} hover>
                    <TableCell sx={{ fontWeight: 800, color: '#0E4F8D', fontFamily: 'monospace' }}>
                      #{app.applicationId}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '12.5px' }}>
                        {app.customerName || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.email || app.mobileNo || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: '#334155' }}>
                        {app.branchName || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.regionName || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={app.status || 'Submitted'}
                        size="small"
                        color={
                          app.isFinalApproved || app.status === 'finalapproved'
                            ? 'success'
                            : app.status?.toLowerCase().includes('reject')
                            ? 'error'
                            : 'info'
                        }
                        sx={{ fontWeight: 700, fontSize: '10.5px', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      ₹{Number(app.avgTransactionYearly || app.totalAnnualTransaction || 0).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#64748b' }}>
                      {app.createdAt ? String(app.createdAt).slice(0, 10) : '—'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Tooltip title={`Hard Delete App #${app.applicationId}`}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteSingleApp(app)}
                          sx={{ bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecdd3' } }}
                        >
                          <DeleteOutlineRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ── Confirmation Modal ── */}
      <TruncateConfirmModal
        open={modalState.open}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        onConfirm={handleExecuteConfirmedAction}
        title={modalState.title}
        targetName={modalState.targetName}
        targetType={modalState.targetType}
        recordCount={modalState.recordCount}
        loading={actionLoading}
      />

      {/* ── Toast Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
