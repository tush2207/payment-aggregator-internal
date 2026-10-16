import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add,
  Send,
  InfoOutlined,
  Groups2,
  CheckCircleRounded,
  EmailOutlined,
  PhoneAndroid,
  PersonOutline,
  ArrowBack,
  HelpOutlineRounded,
} from '@mui/icons-material';
import {
  CommonAppTable,
} from '&src/components/table/common';
import DatePicker from '&src/components/DatePicker';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ManageAggregatorForm from '&src/features/manage-aggregator/ManageAggregatorForm';
import StatusChipOrSelect from '&src/components/table/common/StatusChipOrSelect';

/**
 * AggregatorSelectionView
 * Step 2 view allowing CO / Admin to choose payment aggregators to invite for quotation,
 * set quote submission deadline date, and dispatch official RFPs.
 */
export const AggregatorSelectionView = ({
  masterAggregators = [],
  selectedAggregators = [],
  onSelectionChange,
  endDate,
  onEndDateChange,
  onSendForQuote,
  loading = false,
  fetchAllAggregators,
  isAddingMore = false,
  onCancelAddMore,
}) => {
  const theme = useTheme();
  const [openAddModal, setOpenAddModal] = useState(false);

  const activeAggregators = useMemo(() => {
    return (masterAggregators || []).filter(
      (agg) => !agg.isDeleted && String(agg.status || 'active').toLowerCase() === 'active'
    );
  }, [masterAggregators]);

  const isAllSelected =
    activeAggregators.length > 0 &&
    activeAggregators.every((agg) =>
      selectedAggregators.some((s) => Number(s.aggregatorId) === Number(agg.aggregatorId))
    );

  const isIndeterminate =
    selectedAggregators.length > 0 && !isAllSelected;

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(activeAggregators);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleToggleRow = (agg) => {
    const isSelected = selectedAggregators.some(
      (s) => Number(s.aggregatorId) === Number(agg.aggregatorId)
    );
    if (isSelected) {
      onSelectionChange?.(
        selectedAggregators.filter(
          (s) => Number(s.aggregatorId) !== Number(agg.aggregatorId)
        )
      );
    } else {
      onSelectionChange?.([...selectedAggregators, agg]);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Top Header & Actions Bar ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          mb: 2,
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`,
              color: '#ffffff',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <Groups2 sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2, fontSize: '1.02rem' }}>
              Select Payment Aggregators for Quotation Request
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.4, fontSize: '0.8rem' }}>
              Select aggregators from the approved panel, configure quotation deadline, and dispatch official RFPs.
            </Typography>
          </Box>
        </Box>

        {/* Action Controls - Perfectly aligned single row */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {isAddingMore && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={onCancelAddMore}
              size="small"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', height: 40 }}
            >
              Back to Quotes
            </Button>
          )}

          <Button
            variant="outlined"
            color="primary"
            startIcon={<Add />}
            onClick={() => setOpenAddModal(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              height: 40,
              fontSize: '12.5px',
              whiteSpace: 'nowrap',
            }}
          >
            Add New Aggregator
          </Button>

          <Box sx={{ minWidth: 170, display: 'flex', alignItems: 'center' }}>
            <DatePicker
              value={endDate}
              onChange={onEndDateChange}
              disablePast
              fullWidth={false}
            />
          </Box>

          <Tooltip title="Choose the desired quotation submission deadline date for aggregators" arrow placement="top">
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <InfoOutlined fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            endIcon={<Send />}
            disabled={loading || selectedAggregators.length === 0}
            onClick={onSendForQuote}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: '8px',
              height: 40,
              px: 2.8,
              fontSize: '13px',
              whiteSpace: 'nowrap',
              background: selectedAggregators.length > 0
                ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`
                : undefined,
              boxShadow: selectedAggregators.length > 0
                ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`
                : 'none',
            }}
          >
            {selectedAggregators.length > 0
              ? `Send for Quote (${selectedAggregators.length})`
              : 'Select Aggregators'}
          </Button>
        </Stack>
      </Paper>

      {/* ── Helpful Step 2 Guidance Banner ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          px: 2,
          mb: 2,
          borderRadius: '10px',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <HelpOutlineRounded sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontSize: '12.5px', color: 'text.primary', fontWeight: 500 }}>
            Select the payment aggregators to receive this customer's RFP. Once dispatched, aggregators can quote rates or CO can enter vendor quotes directly in Step 3.
          </Typography>
        </Box>
        <Chip
          label={`${selectedAggregators.length} of ${activeAggregators.length} Aggregators Selected`}
          size="small"
          color={selectedAggregators.length > 0 ? "primary" : "default"}
          sx={{ fontWeight: 700, fontSize: '11px', height: 24 }}
        />
      </Paper>

      {/* ── Selection Table ── */}
      <CommonAppTable>
        <Table size="small" sx={{ minWidth: 800, borderCollapse: 'collapse' }}>
          <TableHead
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.dark || '#0A3B6A'} 0%, ${theme.palette.primary.main || '#0E4F8D'} 100%)`,
            }}
          >
            <TableRow>
              <TableCell align="center" sx={{ color: '#fff', width: 50, py: 1 }}>
                <Checkbox
                  size="small"
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-checked': { color: '#fff' },
                    '&.MuiCheckbox-indeterminate': { color: '#fff' },
                  }}
                />
              </TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '12px', width: 50 }}>
                #
              </TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '12px', width: 220 }}>
                Aggregator Name
              </TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '12px', width: 180 }}>
                Contact Person
              </TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}>
                Email Address
              </TableCell>
              <TableCell sx={{ color: '#fff', fontWeight: 700, fontSize: '12px', width: 160 }}>
                Mobile Number
              </TableCell>
              <TableCell align="center" sx={{ color: '#fff', fontWeight: 700, fontSize: '12px', width: 120 }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {activeAggregators.length > 0 ? (
              activeAggregators.map((agg, idx) => {
                const isSelected = selectedAggregators.some(
                  (s) => Number(s.aggregatorId) === Number(agg.aggregatorId)
                );

                return (
                  <TableRow
                    key={agg.aggregatorId || idx}
                    hover
                    onClick={() => handleToggleRow(agg)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'inherit',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.14)
                          : alpha(theme.palette.action.hover, 0.08),
                      },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <TableCell align="center" sx={{ py: 1 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => handleToggleRow(agg)}
                        onClick={(e) => e.stopPropagation()}
                        color="primary"
                      />
                    </TableCell>

                    <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                      {idx + 1}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700, color: 'primary.dark', fontSize: '13px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {agg.aggregatorName}
                        </Typography>
                        {isSelected && (
                          <Chip
                            icon={<CheckCircleRounded sx={{ fontSize: '14px !important' }} />}
                            label="Selected"
                            size="small"
                            color="primary"
                            sx={{ height: 20, fontSize: '10px', fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: '12px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <PersonOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <span>{agg.contactPersonName || '—'}</span>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: '12px' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <EmailOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '12.5px', fontWeight: 600 }}>
                            {agg.email || '—'}
                          </Typography>
                        </Box>
                        {agg.alternateEmail && (
                          <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.secondary', display: 'block', pl: 2.8, mt: 0.2 }}>
                            Alt: {agg.alternateEmail}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: '12px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <PhoneAndroid sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <span>{agg.mobileNo || '—'}</span>
                      </Box>
                    </TableCell>

                    <TableCell align="center">
                      <StatusChipOrSelect value={agg.status || 'active'} type="status" size="small" />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    No payment aggregators configured in the system.
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setOpenAddModal(true)}
                    sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
                  >
                    Add Aggregator to Panel
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CommonAppTable>

      {/* ── Dialog for Adding New Aggregator to Master Panel ── */}
      <DialogWithHeader
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="md"
        headerText="Add New Payment Aggregator"
        subHeaderText="Register and configure a new payment aggregator partner in the Central Bank of India panel."
      >
        <ManageAggregatorForm
          fetchAllAggregators={() => {
            fetchAllAggregators?.();
            setOpenAddModal(false);
          }}
          handleClose={() => setOpenAddModal(false)}
          formClosed={openAddModal}
        />
      </DialogWithHeader>
    </Box>
  );
};

export default AggregatorSelectionView;
