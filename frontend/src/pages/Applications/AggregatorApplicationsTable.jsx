import React, { useState, useMemo } from 'react';
import {
  Box,
  Collapse,
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
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Search,
  Clear,
  Visibility,
  Timeline,
  AccountBalanceWalletRounded,
  CheckCircleOutline,
  HourglassEmptyRounded,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import NoData from '&src/components/NoData';
import { openWorkflowDialog, selectUserRole } from '&src/store/applicationFlowSlice';
import { formatDateOnly, formatTimeOnly } from '&src/utils';

export default function AggregatorApplicationsTable({
  aggregators = [],
  applications = [],
  onView,
  onVerify,
}) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'CO';
  const isCO = userRole === 'CO';

  const [expandedAggregatorId, setExpandedAggregatorId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Group applications under each aggregator
  const aggregatorGroups = useMemo(() => {
    if (!aggregators || aggregators.length === 0) return [];

    return aggregators.map((agg) => {
      const aggIdStr = String(agg.aggregatorId || agg.id || '');
      const aggNameLower = (agg.aggregatorName || '').toLowerCase().trim();

      // Match applications assigned to this aggregator
      const assignedApps = applications.filter((app) => {
        const appAggId = String(app.finalizedAggregatorId || app.aggregatorId || '');
        const appAggName = (app.finalizedAggregatorName || app.aggregatorName || '').toLowerCase().trim();
        const quotes = app.aggregatorQuotes || [];
        const hasQuote = quotes.some(
          (q) => String(q.aggregatorId) === aggIdStr || (q.aggregatorName && q.aggregatorName.toLowerCase().trim() === aggNameLower)
        );

        return appAggId === aggIdStr || appAggName === aggNameLower || hasQuote;
      });

      const approvedCount = assignedApps.filter((a) => a.isFinalApproved).length;
      const pendingCount = assignedApps.filter((a) => !a.isFinalApproved).length;

      return {
        ...agg,
        assignedApps,
        totalAssigned: assignedApps.length,
        approvedCount,
        pendingCount,
      };
    });
  }, [aggregators, applications]);

  // Filter aggregators by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return aggregatorGroups;

    const query = searchQuery.toLowerCase().trim();
    return aggregatorGroups.filter((agg) => {
      const name = (agg.aggregatorName || '').toLowerCase();
      const contact = (agg.contactPersonName || '').toLowerCase();
      const email = (agg.email || '').toLowerCase();
      // Also match if any assigned customer application matches
      const hasMatchingCustomer = agg.assignedApps.some(
        (app) =>
          (app.customerName || '').toLowerCase().includes(query) ||
          String(app.applicationId || '').includes(query)
      );

      return name.includes(query) || contact.includes(query) || email.includes(query) || hasMatchingCustomer;
    });
  }, [aggregatorGroups, searchQuery]);

  // Paginate
  const paginatedGroups = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return filteredGroups.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredGroups, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredGroups.length / rowsPerPage) || 1;

  const handleToggleExpand = (id) => {
    setExpandedAggregatorId((prev) => (prev === id ? null : id));
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {/* ── Search Bar Banner ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          background: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: { xs: '100%', sm: 280 }, maxWidth: 450 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search aggregator or assigned customer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
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
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
                bgcolor: '#f8fafc',
                fontSize: '13px',
              },
            }}
          />
        </Box>

        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontSize: '13px' }}>
          Aggregators Overview ({filteredGroups.length} {filteredGroups.length === 1 ? 'record' : 'records'})
        </Typography>
      </Paper>

      {/* ── Main Aggregator Groups Table ── */}
      <TableContainer
        component={Paper}
        elevation={1}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          overflowX: 'auto',
          width: '100%',
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#c1c1c1', borderRadius: '4px' },
        }}
      >
        <Table sx={{ minWidth: 950 }} size="small">
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 45, py: 1.4, px: 1.5, fontSize: '12px' }}>#</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px' }}>Aggregator Name</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px' }}>Contact Person</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center' }}>Total Assigned</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center' }}>Approved & Onboarded</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center' }}>In Process / Quotes</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.4, px: 1.5, fontSize: '12px', textAlign: 'center', width: 90 }}>Assigned Apps</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedGroups.length > 0 ? (
              paginatedGroups.map((agg, index) => {
                const rowIndex = (page - 1) * rowsPerPage + index;
                const isExpanded = expandedAggregatorId === agg.aggregatorId;

                return (
                  <React.Fragment key={agg.aggregatorId || rowIndex}>
                    <TableRow
                      hover
                      selected={isExpanded}
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '12px' }}>
                        {rowIndex + 1}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalanceWalletRounded sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontSize: '13px', lineHeight: 1.2 }}>
                              {agg.aggregatorName || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                              {agg.email || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '12.5px' }}>
                          {agg.contactPersonName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          {agg.mobileNo || ''}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={`${agg.totalAssigned} Applications`}
                          size="small"
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          icon={<CheckCircleOutline sx={{ fontSize: '14px !important' }} />}
                          label={`${agg.approvedCount} Approved`}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          icon={<HourglassEmptyRounded sx={{ fontSize: '14px !important' }} />}
                          label={`${agg.pendingCount} In Review`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            borderRadius: '6px',
                          }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <StatusChipOrSelect value={agg.status || 'active'} type="status" />
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title={isExpanded ? 'Hide Applications' : 'View Assigned Applications'} arrow>
                          <Button
                            size="small"
                            variant={isExpanded ? 'contained' : 'outlined'}
                            color="primary"
                            onClick={() => handleToggleExpand(agg.aggregatorId)}
                            endIcon={isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                            sx={{
                              textTransform: 'none',
                              fontSize: '11px',
                              fontWeight: 600,
                              py: 0.3,
                              px: 1,
                              borderRadius: '6px',
                            }}
                          >
                            {agg.assignedApps.length}
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* ── Nested Assigned Customer Applications Table ── */}
                    {isExpanded && (
                      <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                        <TableCell colSpan={8} sx={{ p: 2.5 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid #cbd5e1',
                              bgcolor: '#ffffff',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                              <Typography variant="subtitle2" fontWeight={800} color="primary.dark">
                                Assigned Customer Applications for {agg.aggregatorName} ({agg.assignedApps.length} records)
                              </Typography>
                            </Box>

                            {agg.assignedApps.length > 0 ? (
                              <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>#</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>Date & Time</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>App ID</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>Customer Name</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>Branch / Region</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary' }}>Category</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textAlign: 'center' }}>Status</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: 'text.secondary', textAlign: 'center' }}>Actions</TableCell>
                                    </TableRow>
                                  </TableHead>

                                  <TableBody>
                                    {agg.assignedApps.map((cust, cIdx) => (
                                      <TableRow key={cust.applicationId || cIdx} hover>
                                        <TableCell sx={{ fontSize: '11px', color: 'text.secondary' }}>{cIdx + 1}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                          <Typography variant="caption" fontWeight={700} display="block">
                                            {formatDateOnly(cust.createdAt)}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                            {formatTimeOnly(cust.createdAt)}
                                          </Typography>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>{cust.applicationId}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12.5px' }}>{cust.customerName}</TableCell>
                                        <TableCell sx={{ minWidth: 160, py: 1 }}>
                                          <Typography variant="caption" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '12px', display: 'block', mb: 0.2 }}>
                                            {cust.branchName || 'N/A'}
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <Typography variant="caption" sx={{ fontSize: '10.5px', color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.4, whiteSpace: 'nowrap' }}>
                                              <span style={{ fontWeight: 600, color: '#64748b' }}>Region:</span>
                                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{cust.regionName || 'N/A'}</span>
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontSize: '10.5px', color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.4, whiteSpace: 'nowrap' }}>
                                              <span style={{ fontWeight: 600, color: '#64748b' }}>Zone:</span>
                                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{cust.zoneName || (cust.zoneId && cust.zoneId !== '00000' && cust.zoneId !== 0 ? cust.zoneId : 'N/A')}</span>
                                            </Typography>
                                          </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '12px' }}>{cust.category || 'General Services'}</TableCell>
                                        <TableCell align="center">
                                          <StatusChipOrSelect value={cust.status || 'pending'} type="workflow" />
                                        </TableCell>
                                        <TableCell align="center">
                                          <Stack direction="row" spacing={0.8} justifyContent="center">
                                            <Tooltip title="View Application Details" arrow>
                                              <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => onView && onView(cust)}
                                                sx={{ p: 0.5, border: '1px solid', borderColor: 'grey.300', borderRadius: '6px' }}
                                              >
                                                <Visibility sx={{ fontSize: 16 }} />
                                              </IconButton>
                                            </Tooltip>

                                            {isCO && (
                                              <Tooltip title="Workflow / Cost Benefit Analysis" arrow>
                                                <IconButton
                                                  size="small"
                                                  color="secondary"
                                                  onClick={() => dispatch(openWorkflowDialog(cust))}
                                                  sx={{ p: 0.5, border: '1px solid', borderColor: 'secondary.light', borderRadius: '6px' }}
                                                >
                                                  <Timeline sx={{ fontSize: 16 }} />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Stack>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Box sx={{ py: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  No customer applications assigned to this aggregator yet.
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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

        {/* ── Table Pagination ── */}
        {filteredGroups.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              px: 3,
              py: 2,
              borderTop: '1px solid',
              borderColor: 'grey.200',
              bgcolor: '#ffffff',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                Rows per page:
              </Typography>
              <TextField
                select
                size="small"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                sx={{
                  width: 75,
                  '& .MuiSelect-select': { py: 0.6, fontSize: '12px', fontWeight: 600 },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </TextField>
            </Box>

            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 600,
                  fontSize: '12px',
                },
              }}
            />
          </Box>
        )}
      </TableContainer>
    </Box>
  );
}
