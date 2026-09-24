import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Close,
  Search,
  HistoryRounded,
  FileDownloadRounded,
  SecurityUpdateGoodRounded,
  LockResetRounded,
  VpnKeyRounded,
  CheckCircleOutline,
  ErrorOutline,
  BlockRounded,
  PriceCheckRounded
} from '@mui/icons-material';
import manageAggregatorServices from '&src/services/manageAggregator';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const getActionChip = (action) => {
  const act = String(action || '').toUpperCase();
  switch (act) {
    case 'ONBOARDED':
      return { label: 'Onboarded', color: 'success', icon: <CheckCircleOutline sx={{ fontSize: '14px !important' }} /> };
    case 'CREDENTIALS_RESET':
      return { label: 'Credentials Reset', color: 'info', icon: <LockResetRounded sx={{ fontSize: '14px !important' }} /> };
    case 'LOGIN_SUCCESS':
      return { label: 'Login Success', color: 'success', icon: <VpnKeyRounded sx={{ fontSize: '14px !important' }} /> };
    case 'LOGIN_FAILED':
      return { label: 'Login Failed', color: 'error', icon: <ErrorOutline sx={{ fontSize: '14px !important' }} /> };
    case 'ACCOUNT_LOCKED':
      return { label: 'Account Locked', color: 'error', icon: <BlockRounded sx={{ fontSize: '14px !important' }} /> };
    case 'PASSWORD_RESET':
      return { label: 'Password Changed', color: 'primary', icon: <SecurityUpdateGoodRounded sx={{ fontSize: '14px !important' }} /> };
    case 'QUOTE_SUBMITTED':
      return { label: 'Quote Submitted', color: 'secondary', icon: <PriceCheckRounded sx={{ fontSize: '14px !important' }} /> };
    case 'STATUS_CHANGED':
      return { label: 'Status Changed', color: 'warning', icon: <HistoryRounded sx={{ fontSize: '14px !important' }} /> };
    case 'UPDATED':
      return { label: 'Profile Updated', color: 'default', icon: <HistoryRounded sx={{ fontSize: '14px !important' }} /> };
    case 'DELETED':
      return { label: 'Deleted', color: 'error', icon: <BlockRounded sx={{ fontSize: '14px !important' }} /> };
    default:
      return { label: action || 'Event', color: 'default', icon: <HistoryRounded sx={{ fontSize: '14px !important' }} /> };
  }
};

const AggregatorAuditDialog = ({ open, onClose, aggregator = null }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (open) {
      fetchAuditLogs();
    }
  }, [open, aggregator]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      let data;
      if (aggregator?.aggregatorId) {
        data = await manageAggregatorServices.getSingleAggregatorAuditLogs(aggregator.aggregatorId);
      } else {
        data = await manageAggregatorServices.getAggregatorAuditLogs();
      }
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch aggregator audit logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (log.aggregatorName || '').toLowerCase().includes(q) ||
        (log.performedBy || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.ipAddress || '').toLowerCase().includes(q);

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage) || 1;

  const handleExportExcel = () => {
    if (!filteredLogs.length) return;
    const exportData = filteredLogs.map((item, idx) => ({
      'Sr No': idx + 1,
      'Timestamp': item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'N/A',
      'Aggregator Name': item.aggregatorName || 'N/A',
      'Aggregator ID': item.aggregatorId || 'N/A',
      'Action': item.action || 'N/A',
      'Performed By': item.performedBy || 'N/A',
      'User Role': item.userRole || 'N/A',
      'IP Address': item.ipAddress || 'N/A',
      'Details': item.details || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aggregator_Audit_Trail');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const fileName = aggregator?.aggregatorName
      ? `Audit_Trail_${aggregator.aggregatorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `All_Aggregators_Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, bgcolor: '#004990', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', p: 0.8, borderRadius: '8px', display: 'flex' }}>
            <HistoryRounded sx={{ color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              {aggregator ? `${aggregator.aggregatorName} — Audit Trail` : 'Payment Aggregator System Audit Trail'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
              Immutable historical activity, authentication logs, and compliance audit trail
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* Filter Controls Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#fff', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
            <TextField
              size="small"
              placeholder="Search logs by user, detail, IP, partner..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              sx={{ minWidth: { xs: '100%', sm: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="ALL">All Event Types</MenuItem>
              <MenuItem value="ONBOARDED">Onboarded</MenuItem>
              <MenuItem value="CREDENTIALS_RESET">Credentials Reset</MenuItem>
              <MenuItem value="LOGIN_SUCCESS">Login Success</MenuItem>
              <MenuItem value="LOGIN_FAILED">Login Failed</MenuItem>
              <MenuItem value="ACCOUNT_LOCKED">Account Locked</MenuItem>
              <MenuItem value="PASSWORD_RESET">Password Reset</MenuItem>
              <MenuItem value="QUOTE_SUBMITTED">Quote Submitted</MenuItem>
              <MenuItem value="STATUS_CHANGED">Status Changed</MenuItem>
              <MenuItem value="UPDATED">Profile Updated</MenuItem>
              <MenuItem value="DELETED">Deleted</MenuItem>
            </TextField>
          </Stack>

          <Button
            variant="outlined"
            startIcon={<FileDownloadRounded />}
            onClick={handleExportExcel}
            disabled={!filteredLogs.length}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, borderColor: '#004990', color: '#004990' }}
          >
            Export Excel ({filteredLogs.length})
          </Button>
        </Paper>

        {/* Audit Logs Table */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#fff', maxHeight: 420 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: '#f1f5f9', fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.2 } }}>
                <TableCell>TIMESTAMP</TableCell>
                {!aggregator && <TableCell>AGGREGATOR</TableCell>}
                <TableCell>EVENT / ACTION</TableCell>
                <TableCell>PERFORMED BY</TableCell>
                <TableCell>IP ADDRESS</TableCell>
                <TableCell>AUDIT DETAILS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={30} sx={{ color: '#004990', mb: 1 }} />
                    <Typography variant="caption" display="block" color="text.secondary">
                      Loading audit logs...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <HistoryRounded sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                      No audit records found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      No activity logs match your current search and filter criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => {
                  const chip = getActionChip(log.action);
                  return (
                    <TableRow key={log.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : 'N/A'}
                      </TableCell>
                      {!aggregator && (
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#004990' }}>
                          {log.aggregatorName || `ID: ${log.aggregatorId}`}
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          icon={chip.icon}
                          label={chip.label}
                          color={chip.color}
                          size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 700, height: 24 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {log.performedBy || 'System'}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                            Role: {log.userRole || 'ADMIN'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#475569' }}>
                        {log.ipAddress || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: '#334155', maxWidth: 350 }}>
                        {log.details || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination footer */}
        {filteredLogs.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              Showing {Math.min((page - 1) * rowsPerPage + 1, filteredLogs.length)} to {Math.min(page * rowsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              size="small"
              color="primary"
              sx={{ '& .Mui-selected': { bgcolor: '#004990 !important', color: '#fff' } }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: '#fff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#004990', '&:hover': { bgcolor: '#003d7a' }, fontWeight: 700, textTransform: 'none', borderRadius: '8px', px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AggregatorAuditDialog;
