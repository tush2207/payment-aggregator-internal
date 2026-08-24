import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  TableContainer,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add,
  DeleteOutline,
  AutoFixHighRounded,
  RestartAltRounded,
  InfoOutlined,
  CheckCircleRounded,
  WarningAmberRounded,
  TrendingUpRounded,
  Close,
} from '@mui/icons-material';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';
import aggregatorProjections from '&src/services/aggregatorProjections';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { generateProjectionArray, calculateProjectionDetails } from '&src/utils/calculation';
import { formatNumber } from '&src/utils';
import { useDispatch } from 'react-redux';
import { updateApplicationWorkflow } from '&src/store/applicationFlowSlice';

const PRESET_CHANNELS = [
  'Internet banking',
  'UPI',
  'Debit card - Rupay',
  'Debit card - Master/Visa (Above 2000)',
  'Debit card - Master/Visa (Upto 2000)',
  'Credit cards',
  'Corporate Net Banking',
  'Wallets & Prepaid Cards',
  'Bharat QR / Dynamic QR',
  'International Cards & Forex',
  'BNPL & EMI Payments',
  'Custom Channel',
];

const UpdateProjectionPercentage = ({ customerDetails }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const {
    applicationId,
    avgTransactionSize = 0,
    avgTransactionYearly = 0,
    aggregateDepositAmt = 0,
    totalAnnualTransaction = 0,
  } = customerDetails || {};

  const totalVolume = Number(totalAnnualTransaction || aggregateDepositAmt || avgTransactionSize * avgTransactionYearly) || 0;
  const totalTxns = Number(avgTransactionYearly) || 0;

  const [loading, setLoading] = useState(false);
  const [allCharges, setAllCharges] = useState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newChannelType, setNewChannelType] = useState('UPI');
  const [customChannelName, setCustomChannelName] = useState('');
  const [newCountPercent, setNewCountPercent] = useState(0);
  const [newValuePercent, setNewValuePercent] = useState(0);

  // ---------------------- Initialize Baseline Projections ----------------------
  const initializeBaseline = () => {
    if (PROJECTION_CAL_DETAILS && Array.isArray(PROJECTION_CAL_DETAILS)) {
      const isLessThan2K = Number(avgTransactionSize) <= 2000;
      
      // Parse customer application selected projections if available
      const rawProjs = customerDetails?.projection;
      const selectedProjs = rawProjs
        ? (typeof rawProjs === 'string' ? rawProjs.split('|').map((s) => s.trim().toLowerCase()).filter(Boolean) : [])
        : [];
      
      const hasProjsFilter = selectedProjs.length > 0;
      const initialized = [];
      let nextId = 1;

      // Filter standard PROJECTION_CAL_DETAILS based on customer selection if available
      PROJECTION_CAL_DETAILS.forEach((q) => {
        const typeLower = q.transactionType.toLowerCase();
        let shouldInclude = true;

        if (hasProjsFilter) {
          if (q.isIB) {
            // Keep IB sub-banks if Internet banking is selected
            shouldInclude = selectedProjs.some((p) => p.includes('internet') || p.includes('banking') || p.includes('netbanking'));
          } else if (typeLower.includes('internet') || typeLower.includes('banking')) {
            shouldInclude = selectedProjs.some((p) => p.includes('internet') || p.includes('banking') || p.includes('netbanking'));
          } else if (typeLower.includes('upi')) {
            shouldInclude = selectedProjs.some((p) => p.includes('upi'));
          } else if (typeLower.includes('debit')) {
            shouldInclude = selectedProjs.some((p) => p.includes('debit'));
          } else if (typeLower.includes('credit')) {
            shouldInclude = selectedProjs.some((p) => p.includes('credit'));
          } else {
            shouldInclude = selectedProjs.some((p) => p === typeLower);
          }
        }

        if (shouldInclude) {
          let count = q.transactionCount ? parseInt(q.transactionCount) || 0 : 0;
          let val = q.transactionValue ? parseInt(q.transactionValue) || 0 : 0;

          // Apply 2K rule if applicable
          if (q.transactionType === 'Debit card - Master/Visa (Upto 2000)') {
            count = isLessThan2K ? 40 : 0;
            val = isLessThan2K ? 25 : 0;
          } else if (q.transactionType === 'Debit card - Master/Visa (Above 2000)') {
            count = isLessThan2K ? 0 : 40;
            val = isLessThan2K ? 0 : 25;
          }

          initialized.push({
            id: nextId,
            order: nextId,
            transactionType: q.transactionType,
            transactionCount: count,
            transactionValue: val,
            isIB: q.isIB || false,
            isCustom: false,
          });
          nextId++;
        }
      });

      // Add any custom projections specified in application form that are not in standard baseline
      if (rawProjs) {
        const rawList = typeof rawProjs === 'string' ? rawProjs.split('|').map((s) => s.trim()).filter(Boolean) : [];
        rawList.forEach((projName) => {
          const pLower = projName.toLowerCase();
          const isStandard =
            pLower.includes('internet') ||
            pLower.includes('upi') ||
            pLower.includes('debit') ||
            pLower.includes('credit');

          if (!isStandard) {
            const alreadyInList = initialized.some((item) => item.transactionType.toLowerCase() === pLower);
            if (!alreadyInList) {
              initialized.push({
                id: nextId,
                order: nextId,
                transactionType: projName,
                transactionCount: 0,
                transactionValue: 0,
                isIB: false,
                isCustom: false, // from application form, so not dynamically added in step 1
              });
              nextId++;
            }
          }
        });
      }

      setAllCharges(initialized);
    }
  };

  useEffect(() => {
    initializeBaseline();
  }, [customerDetails?.applicationId, customerDetails?.projection, customerDetails?.avgTransactionSize]);

  // Handle numeric percentage change
  const handleNumericChange = (id, field, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      const numVal = value === '' ? 0 : Math.min(100, Math.max(0, parseInt(value, 10)));
      setAllCharges((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: numVal } : row))
      );
    }
  };

  // Add new projection row
  const handleConfirmAddChannel = () => {
    const channelName =
      newChannelType === 'Custom Channel'
        ? customChannelName.trim() || 'Custom Payment Method'
        : newChannelType;

    if (!channelName) {
      errorNotification('Please specify a valid channel name.');
      return;
    }

    // Check if channel already exists
    const exists = allCharges.some(
      (c) => c.transactionType.toLowerCase() === channelName.toLowerCase()
    );
    if (exists) {
      errorNotification(`Channel "${channelName}" already exists in the projection list.`);
      return;
    }

    const nextId = allCharges.length > 0 ? Math.max(...allCharges.map((c) => c.id)) + 1 : 1;
    const newRow = {
      id: nextId,
      order: nextId,
      transactionType: channelName,
      transactionCount: Math.min(100, Math.max(0, parseInt(newCountPercent, 10) || 0)),
      transactionValue: Math.min(100, Math.max(0, parseInt(newValuePercent, 10) || 0)),
      isIB: false,
      isCustom: true,
    };

    setAllCharges((prev) => [...prev, newRow]);
    setAddModalOpen(false);
    setCustomChannelName('');
    setNewCountPercent(0);
    setNewValuePercent(0);
    successNotification(`Added "${channelName}" to projection channels.`);
  };

  const handleDeleteRow = (id) => {
    setAllCharges((prev) => prev.filter((row) => row.id !== id));
    successNotification('Channel removed from projections.');
  };

  // ---------------------- Auto-Balance & Normalize Percentages ----------------------
  const handleAutoBalance = () => {
    const parentRows = allCharges.filter((r) => !r.isIB);
    if (!parentRows.length) return;

    const curTotalCount = parentRows.reduce((sum, r) => sum + (r.transactionCount || 0), 0);
    const curTotalValue = parentRows.reduce((sum, r) => sum + (r.transactionValue || 0), 0);

    let updated = [...allCharges];

    // 1. Balance Count Percentages
    if (curTotalCount > 0 && curTotalCount !== 100) {
      let allocatedCount = 0;
      updated = updated.map((row, idx) => {
        if (row.isIB) return row;
        if (idx === parentRows.length - 1) {
          // Put remainder on last row to guarantee exact 100 sum
          const lastCount = Math.max(0, 100 - allocatedCount);
          return { ...row, transactionCount: lastCount };
        }
        const proportion = (row.transactionCount / curTotalCount) * 100;
        const rounded = Math.round(proportion);
        allocatedCount += rounded;
        return { ...row, transactionCount: rounded };
      });
    } else if (curTotalCount === 0) {
      // Distribute evenly
      const countShare = Math.floor(100 / parentRows.length);
      const rem = 100 % parentRows.length;
      let pIdx = 0;
      updated = updated.map((row) => {
        if (row.isIB) return row;
        const val = countShare + (pIdx === 0 ? rem : 0);
        pIdx++;
        return { ...row, transactionCount: val };
      });
    }

    // 2. Balance Value Percentages
    const nonIbRows = updated.filter((r) => !r.isIB);
    const postTotalVal = nonIbRows.reduce((sum, r) => sum + (r.transactionValue || 0), 0);

    if (postTotalVal > 0 && postTotalVal !== 100) {
      let allocatedVal = 0;
      updated = updated.map((row, idx) => {
        if (row.isIB) return row;
        if (idx === nonIbRows.length - 1) {
          const lastVal = Math.max(0, 100 - allocatedVal);
          return { ...row, transactionValue: lastVal };
        }
        const proportion = (row.transactionValue / postTotalVal) * 100;
        const rounded = Math.round(proportion);
        allocatedVal += rounded;
        return { ...row, transactionValue: rounded };
      });
    } else if (postTotalVal === 0) {
      const valShare = Math.floor(100 / nonIbRows.length);
      const rem = 100 % nonIbRows.length;
      let pIdx = 0;
      updated = updated.map((row) => {
        if (row.isIB) return row;
        const val = valShare + (pIdx === 0 ? rem : 0);
        pIdx++;
        return { ...row, transactionValue: val };
      });
    }

    setAllCharges(updated);
    successNotification('Percentages normalized to exactly 100%.');
  };

  // ---------------------- Totals & Live Metrics ----------------------
  const visibleCharges = useMemo(() => allCharges.filter((r) => !r.isIB), [allCharges]);
  const totalCount = useMemo(() => visibleCharges.reduce((sum, r) => sum + (r.transactionCount || 0), 0), [visibleCharges]);
  const totalValue = useMemo(() => visibleCharges.reduce((sum, r) => sum + (r.transactionValue || 0), 0), [visibleCharges]);

  const isCountValid = totalCount === 100;
  const isValueValid = totalValue === 100;
  const isFormValid = isCountValid && isValueValid;

  // ---------------------- Save & Process Step ----------------------
  const saveAllCharges = async () => {
    if (!isFormValid) {
      errorNotification(
        `Total Count must equal 100% (currently ${totalCount}%) and Total Value must equal 100% (currently ${totalValue}%). Click "Auto-Balance Percentages" to fix automatically.`
      );
      return;
    }

    setLoading(true);
    try {
      // Format charges with % suffix for DB compatibility
      const formattedCharges = allCharges.map((item) => ({
        ...item,
        transactionCount: item.isIB ? '' : `${item.transactionCount}%`,
        transactionValue: item.isIB ? '' : `${item.transactionValue}%`,
      }));

      // Generate projection details payload
      const updatedPayload = calculateProjectionDetails({
        projectionDetails: formattedCharges,
        avgTransactionYearly: totalTxns,
        aggregateDepositAmt: totalVolume,
        applicationId,
      });

      try {
        await aggregatorProjections.updateProjectionByApplication(applicationId, updatedPayload);
      } catch (dbErr) {
        console.warn('Projection DB update warning:', dbErr);
      }

      // Advance workflow to Step 2 ("Add Aggregator")
      await dispatch(
        updateApplicationWorkflow({
          applicationId,
          payload: { isProjectionAdded: true },
        })
      );

      successNotification('Projections saved successfully! Advancing to Step 2: Add Payment Aggregators.');
    } catch (err) {
      console.error('Error saving projections:', err);
      errorNotification(err?.response?.data?.message || err?.message || 'Failed to save projections.');
    } finally {
      setLoading(false);
    }
  };

  // Skip Step with standard defaults
  const handleSkip = async () => {
    setLoading(true);
    try {
      const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
      const defaultPayload = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly: totalTxns,
        aggregateDepositAmt: totalVolume,
        applicationId,
      });

      try {
        await aggregatorProjections.updateProjectionByApplication(applicationId, defaultPayload);
      } catch (dbErr) {
        console.warn('Projection skip DB warning:', dbErr);
      }

      await dispatch(
        updateApplicationWorkflow({
          applicationId,
          payload: { isProjectionAdded: true },
        })
      );

      successNotification('Default projections applied. Advancing to next step.');
    } catch (err) {
      console.error('Error in handleSkip:', err);
      errorNotification('Failed to apply default projections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minWidth: 0, p: 1 }}>
      {loading && <FullScreenLoader />}

      {/* ── Guidance Banner ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: '#f0f7ff',
          border: '1px solid #bae6fd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: '#176FC1',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrendingUpRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D">
              Step 1: Configure Channel Projections & Transaction Volume Distribution
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Merchant Annual Volume: <b>₹ {formatNumber(totalVolume)}</b> &bull; Expected Txns: <b>{totalTxns.toLocaleString()}</b>
            </Typography>
          </Box>
        </Box>

        {/* Live Allocation Indicator Badges */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={isCountValid ? <CheckCircleRounded /> : <WarningAmberRounded />}
            label={`Total Count: ${totalCount}%`}
            size="small"
            color={isCountValid ? 'success' : 'warning'}
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />
          <Chip
            icon={isValueValid ? <CheckCircleRounded /> : <WarningAmberRounded />}
            label={`Total Value: ${totalValue}%`}
            size="small"
            color={isValueValid ? 'success' : 'warning'}
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />
        </Stack>
      </Paper>

      {/* ── Table Action Control Bar ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8} flexWrap="wrap" gap={1.2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setAddModalOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              bgcolor: '#176FC1',
              borderRadius: '6px',
            }}
          >
            Add Project / Channel
          </Button>

          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<AutoFixHighRounded />}
            onClick={handleAutoBalance}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: '6px',
            }}
          >
            Auto-Balance to 100%
          </Button>

          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<RestartAltRounded />}
            onClick={initializeBaseline}
            sx={{ textTransform: 'none', fontSize: '0.80rem', color: 'text.secondary' }}
          >
            Reset Defaults
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={handleSkip}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', borderRadius: '6px' }}
          >
            Skip with Defaults
          </Button>

          <Button
            size="small"
            variant="contained"
            color="success"
            disabled={!isFormValid}
            onClick={saveAllCharges}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              borderRadius: '6px',
              px: 2.5,
              boxShadow: '0 2px 8px rgba(46, 125, 50, 0.25)',
            }}
          >
            Save & Proceed to Step 2
          </Button>
        </Stack>
      </Box>

      {/* ── Clean Column-Structured Projection Table ── */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
          width: '100%',
          boxShadow: 'none',
          mb: 4,
        }}
      >
        <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)', borderBottom: '2px solid #062545' }}>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, width: 45, py: 1.2, px: 1.2, fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                #
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, px: 1.5, fontSize: '11.5px', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                Transaction Type / Payment Channel
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, px: 1.5, fontSize: '11.5px', textAlign: 'center', width: 160, borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                Share Txn Count (%)
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, px: 1.5, fontSize: '11.5px', textAlign: 'center', width: 160, borderRight: '1px solid rgba(255,255,255,0.25)' }}>
                Share Txn Value (%)
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 1.2, px: 1, fontSize: '11px', textAlign: 'center', width: 80 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleCharges.length > 0 ? (
              visibleCharges.map((row, idx) => {
                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: '#f8fafc' },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '11.5px', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                      {idx + 1}
                    </TableCell>

                    <TableCell sx={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', py: 0.8 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '12.5px' }}>
                          {row.transactionType}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', p: '6px' }}>
                      <TextField
                        size="small"
                        type="text"
                        value={row.transactionCount}
                        onChange={(e) => handleNumericChange(row.id, 'transactionCount', e.target.value)}
                        inputProps={{
                          style: { textAlign: 'right', padding: '4px 8px', fontSize: '12px', fontWeight: 700 },
                        }}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', ml: 0.5 }}>
                              %
                            </Typography>
                          ),
                        }}
                        sx={{
                          width: 85,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '6px',
                            bgcolor: '#ffffff',
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', p: '6px' }}>
                      <TextField
                        size="small"
                        type="text"
                        value={row.transactionValue}
                        onChange={(e) => handleNumericChange(row.id, 'transactionValue', e.target.value)}
                        inputProps={{
                          style: { textAlign: 'right', padding: '4px 8px', fontSize: '12px', fontWeight: 700 },
                        }}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 700, color: '#64748b', ml: 0.5 }}>
                              %
                            </Typography>
                          ),
                        }}
                        sx={{
                          width: 85,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '6px',
                            bgcolor: '#ffffff',
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ borderBottom: '1px solid #cbd5e1', p: '4px' }}>
                      {row.isCustom ? (
                        <Tooltip title="Delete custom projection channel" arrow>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No projection channels configured
                </TableCell>
              </TableRow>
            )}

            {/* ── Total Allocation Summary Row ── */}
            <TableRow sx={{ bgcolor: '#f8fafc', borderTop: '2px solid #64748b', borderBottom: '2px solid #64748b' }}>
              <TableCell sx={{ borderRight: '1px solid #94a3b8' }} />
              <TableCell sx={{ fontWeight: 800, fontSize: '12px', color: '#0E4F8D', borderRight: '1px solid #94a3b8' }}>
                TOTAL PROJECTIONS
              </TableCell>

              <TableCell align="center" sx={{ borderRight: '1px solid #94a3b8', p: '6px' }}>
                <Typography
                  fontWeight={800}
                  sx={{
                    fontSize: '12.5px',
                    color: isCountValid ? '#15803d' : '#b91c1c',
                    bgcolor: isCountValid ? '#dcfce7' : '#fee2e2',
                    py: 0.3,
                    px: 1,
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {totalCount}%
                </Typography>
              </TableCell>

              <TableCell align="center" sx={{ borderRight: '1px solid #94a3b8', p: '6px' }}>
                <Typography
                  fontWeight={800}
                  sx={{
                    fontSize: '12.5px',
                    color: isValueValid ? '#15803d' : '#b91c1c',
                    bgcolor: isValueValid ? '#dcfce7' : '#fee2e2',
                    py: 0.3,
                    px: 1,
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  {totalValue}%
                </Typography>
              </TableCell>

              <TableCell sx={{ borderRight: 'none' }} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Add Project / Channel Modal ── */}
      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
          }}
        >
          Add Projection Channel
          <IconButton size="small" onClick={() => setAddModalOpen(false)} sx={{ color: '#ffffff' }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Payment Channel</InputLabel>
              <Select
                value={newChannelType}
                label="Select Payment Channel"
                onChange={(e) => setNewChannelType(e.target.value)}
              >
                {PRESET_CHANNELS.map((ch) => (
                  <MenuItem key={ch} value={ch}>
                    {ch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {newChannelType === 'Custom Channel' && (
              <TextField
                label="Custom Channel Name"
                placeholder="e.g. International Diners / Forex"
                fullWidth
                size="small"
                required
                value={customChannelName}
                onChange={(e) => setCustomChannelName(e.target.value)}
              />
            )}

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Share Count (%)"
                placeholder="0"
                type="number"
                fullWidth
                size="small"
                value={newCountPercent}
                onChange={(e) => setNewCountPercent(e.target.value)}
                InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
              />

              <TextField
                label="Share Value (%)"
                placeholder="0"
                type="number"
                fullWidth
                size="small"
                value={newValuePercent}
                onChange={(e) => setNewValuePercent(e.target.value)}
                InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
              />
            </Stack>

            <Alert severity="info" sx={{ fontSize: '0.78rem', borderRadius: '6px' }}>
              After adding, you can click <b>"Auto-Balance to 100%"</b> to re-normalize all channel percentages automatically.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setAddModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmAddChannel}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#176FC1', borderRadius: '6px' }}
          >
            Add Channel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpdateProjectionPercentage;
