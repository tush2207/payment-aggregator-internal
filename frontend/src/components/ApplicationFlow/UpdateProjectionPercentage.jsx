import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  Typography,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  Add,
  AutoFixHighRounded,
  RestartAltRounded,
  CheckCircleRounded,
  WarningAmberRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import { CommonAppTable, CommonTableHeader, CommonTableTotalRow, CommonTableEmptyState } from '&src/components/table/common';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';
import aggregatorProjections from '&src/services/aggregatorProjections';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import { generateProjectionArray, calculateProjectionDetails, getProjectionsForCustomer } from '&src/utils/calculation';
import { formatNumber } from '&src/utils';
import { useDispatch } from 'react-redux';
import { updateApplicationWorkflow } from '&src/store/applicationFlowSlice';
import ProjectionTableRow from './ProjectionTableRow';
import AddChannelModal from './AddChannelModal';

const PROJECTION_COLUMNS = [
  { label: '#', width: 45 },
  { label: 'Transaction Type / Payment Channel', minWidth: 200 },
  { label: 'Share Txn Count (%)', align: 'center', width: 160 },
  { label: 'Share Txn Value (%)', align: 'center', width: 160 },
  { label: 'Actions', align: 'center', width: 80 },
];

export const UpdateProjectionPercentage = ({ customerDetails }) => {
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

  const initializeBaseline = async () => {
    if (!applicationId) return;
    try {
      const res = await aggregatorProjections.getAllProjections(applicationId, 0);
      const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (rawData.length > 0) {
        setAllCharges(
          rawData.map((p, idx) => ({
            ...p,
            id: p.id || idx + 1,
            transactionCount: parseInt(p.transactionCount, 10) || 0,
            transactionValue: parseInt(p.transactionValue, 10) || 0,
          }))
        );
        return;
      }
    } catch (err) {
      console.warn('Projections fallback:', err);
    }

    const list = getProjectionsForCustomer(PROJECTION_CAL_DETAILS, customerDetails?.projection, avgTransactionSize, applicationId);
    setAllCharges(list);
  };

  useEffect(() => {
    initializeBaseline();
  }, [customerDetails?.applicationId, customerDetails?.projection, customerDetails?.avgTransactionSize]);

  const handleNumericChange = (id, field, value) => {
    if (value === '') {
      setAllCharges((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: '' } : row)));
      return;
    }
    if (/^\d+$/.test(value)) {
      const numVal = Math.min(100, Math.max(0, parseInt(value, 10)));
      setAllCharges((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: numVal } : row)));
    }
  };

  const handleBlurField = (id, field) => {
    setAllCharges((prev) =>
      prev.map((row) => (row.id === id && (row[field] === '' || row[field] == null) ? { ...row, [field]: 0 } : row))
    );
  };

  const handleAddChannelSubmit = ({ channelName, countPercent, valuePercent }) => {
    if (allCharges.some((c) => c.transactionType.toLowerCase() === channelName.toLowerCase())) {
      errorNotification(`Channel "${channelName}" already exists.`);
      return;
    }
    const nextId = allCharges.length > 0 ? Math.max(...allCharges.map((c) => c.id)) + 1 : 1;
    const countVal = Math.min(100, Math.max(0, parseInt(countPercent, 10) || 0));
    const valVal = Math.min(100, Math.max(0, parseInt(valuePercent, 10) || 0));

    setAllCharges((prev) => [
      ...prev,
      {
        id: nextId,
        order: nextId,
        applicationId: applicationId || null,
        transactionType: channelName,
        transactionCount: countVal,
        transactionValue: valVal,
        isIB: false,
        isCustom: true,
      },
    ]);
    setAddModalOpen(false);
    successNotification(`Added "${channelName}".`);
  };

  const handleDeleteRow = (id) => {
    setAllCharges((prev) => prev.filter((row) => row.id !== id));
    successNotification('Channel removed.');
  };

  const handleAutoBalance = () => {
    const parentRows = allCharges.filter((r) => !r.isIB);
    if (!parentRows.length) return;
    const curTotalCount = parentRows.reduce((sum, r) => sum + (Number(r.transactionCount) || 0), 0);
    let updated = [...allCharges];

    if (curTotalCount > 0 && curTotalCount !== 100) {
      let allocated = 0;
      updated = updated.map((row, idx) => {
        if (row.isIB) return row;
        if (idx === parentRows.length - 1) return { ...row, transactionCount: Math.max(0, 100 - allocated) };
        const val = Math.round(((Number(row.transactionCount) || 0) / curTotalCount) * 100);
        allocated += val;
        return { ...row, transactionCount: val };
      });
    }

    const nonIb = updated.filter((r) => !r.isIB);
    const postTotalVal = nonIb.reduce((sum, r) => sum + (Number(r.transactionValue) || 0), 0);
    if (postTotalVal > 0 && postTotalVal !== 100) {
      let allocatedVal = 0;
      updated = updated.map((row, idx) => {
        if (row.isIB) return row;
        if (idx === nonIb.length - 1) return { ...row, transactionValue: Math.max(0, 100 - allocatedVal) };
        const val = Math.round(((Number(row.transactionValue) || 0) / postTotalVal) * 100);
        allocatedVal += val;
        return { ...row, transactionValue: val };
      });
    }
    setAllCharges(updated);
    successNotification('Percentages normalized to exactly 100%.');
  };

  const visibleCharges = useMemo(() => allCharges.filter((r) => !r.isIB), [allCharges]);
  const totalCount = useMemo(() => visibleCharges.reduce((s, r) => s + (Number(r.transactionCount) || 0), 0), [visibleCharges]);
  const totalValue = useMemo(() => visibleCharges.reduce((s, r) => s + (Number(r.transactionValue) || 0), 0), [visibleCharges]);
  const isFormValid = totalCount === 100 && totalValue === 100;

  const saveAllCharges = async () => {
    if (!isFormValid) {
      errorNotification(`Total Count (${totalCount}%) and Total Value (${totalValue}%) must equal 100%.`);
      return;
    }
    setLoading(true);
    try {
      const formatted = allCharges.map((item) => ({
        ...item,
        transactionCount: item.isIB ? '' : `${Number(item.transactionCount) || 0}%`,
        transactionValue: item.isIB ? '' : `${Number(item.transactionValue) || 0}%`,
      }));
      const payload = calculateProjectionDetails({
        projectionDetails: formatted,
        avgTransactionYearly: totalTxns,
        aggregateDepositAmt: totalVolume,
        applicationId,
      });
      try {
        await aggregatorProjections.updateProjectionByApplication(applicationId, payload);
      } catch (e) {
        console.warn('DB update:', e);
      }
      await dispatch(updateApplicationWorkflow({ applicationId, payload: { isProjectionAdded: true } }));
      successNotification('Projections saved successfully! Advancing to Step 2.');
    } catch (err) {
      errorNotification(err?.message || 'Failed to save projections.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const defaultList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
      const payload = calculateProjectionDetails({
        projectionDetails: defaultList,
        avgTransactionYearly: totalTxns,
        aggregateDepositAmt: totalVolume,
        applicationId,
      });
      try {
        await aggregatorProjections.updateProjectionByApplication(applicationId, payload);
      } catch (e) {
        console.warn('Skip DB:', e);
      }
      await dispatch(updateApplicationWorkflow({ applicationId, payload: { isProjectionAdded: true } }));
      successNotification('Default projections applied.');
    } catch (err) {
      errorNotification('Failed to apply defaults.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {loading && <FullScreenLoader />}

      {/* ── Banner ── */}
      <Paper
        elevation={0}
        sx={(theme) => ({
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          bgcolor: theme.palette.cbi?.colors?.lightBlueBg || '#f0f7ff',
          border: `1px solid ${theme.palette.cbi?.colors?.softBlueBorder || '#bae6fd'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={(theme) => ({ width: 36, height: 36, borderRadius: '8px', bgcolor: theme.palette.primary.main, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' })}>
            <TrendingUpRounded sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="primary.dark">
              Step 1: Configure Channel Projections & Volume Distribution
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Annual Volume: <b>₹ {formatNumber(totalVolume)}</b> &bull; Txns: <b>{totalTxns.toLocaleString()}</b>
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip icon={totalCount === 100 ? <CheckCircleRounded /> : <WarningAmberRounded />} label={`Count: ${totalCount}%`} size="small" color={totalCount === 100 ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
          <Chip icon={totalValue === 100 ? <CheckCircleRounded /> : <WarningAmberRounded />} label={`Value: ${totalValue}%`} size="small" color={totalValue === 100 ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
        </Stack>
      </Paper>

      {/* ── Action Toolbar ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.8} flexWrap="wrap" gap={1.2}>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" color="primary" startIcon={<Add />} onClick={() => setAddModalOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}>
            Add Channel
          </Button>
          <Button size="small" variant="outlined" color="secondary" startIcon={<AutoFixHighRounded />} onClick={handleAutoBalance} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}>
            Auto-Balance to 100%
          </Button>
          <Button size="small" variant="text" color="inherit" startIcon={<RestartAltRounded />} onClick={initializeBaseline} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Reset Defaults
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" color="warning" onClick={handleSkip} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '6px' }}>
            Skip with Defaults
          </Button>
          <Button size="small" variant="contained" color="success" disabled={!isFormValid} onClick={saveAllCharges} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', px: 2.5 }}>
            Save & Proceed
          </Button>
        </Stack>
      </Box>

      {/* ── Table ── */}
      <CommonAppTable sx={{ mb: 4 }}>
        <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <CommonTableHeader columns={PROJECTION_COLUMNS} />
          <TableBody>
            {visibleCharges.length > 0 ? (
              visibleCharges.map((row, idx) => (
                <ProjectionTableRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  onChangeNumeric={handleNumericChange}
                  onBlurField={handleBlurField}
                  onDeleteRow={handleDeleteRow}
                />
              ))
            ) : (
              <CommonTableEmptyState colSpan={PROJECTION_COLUMNS.length} message="No projection channels configured" />
            )}
            <CommonTableTotalRow colSpan={2} label="TOTAL PROJECTIONS">
              <TableCell align="center" sx={{ borderRight: '1px solid #94a3b8', p: '6px' }}>
                <Typography fontWeight={800} sx={(theme) => ({ fontSize: '12.5px', color: totalCount === 100 ? theme.palette.success.main : theme.palette.error.main, py: 0.3, px: 1, borderRadius: '4px', display: 'inline-block' })}>
                  {totalCount}%
                </Typography>
              </TableCell>
              <TableCell align="center" sx={{ borderRight: '1px solid #94a3b8', p: '6px' }}>
                <Typography fontWeight={800} sx={(theme) => ({ fontSize: '12.5px', color: totalValue === 100 ? theme.palette.success.main : theme.palette.error.main, py: 0.3, px: 1, borderRadius: '4px', display: 'inline-block' })}>
                  {totalValue}%
                </Typography>
              </TableCell>
              <TableCell />
            </CommonTableTotalRow>
          </TableBody>
        </Table>
      </CommonAppTable>

      <AddChannelModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAddChannel={handleAddChannelSubmit} />
    </Box>
  );
};

export default UpdateProjectionPercentage;
