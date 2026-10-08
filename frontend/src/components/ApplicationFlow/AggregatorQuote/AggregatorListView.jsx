import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  IconButton,
  Tooltip,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Visibility,
  RateReview,
  ForwardToInboxOutlined,
  Close,
} from '@mui/icons-material';
import { CommonAppTable, CommonTableHeader, CommonTableRow, CommonTableCell, CommonTableEmptyState } from '&src/components/Tables/common';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import { formatNumber } from '&src/utils';
import QuoteTable from '../QuoteTable';
import GetRates from '../GetRates';

const LIST_COLUMNS = [
  { label: '#', width: 45 },
  { label: 'Aggregator Name', minWidth: 160 },
  { label: 'Merchant Category', width: 140 },
  { label: 'Quote Status', align: 'center', width: 120 },
  { label: 'Total Gross (₹)', align: 'right', width: 130 },
  { label: 'Vendor Share (₹)', align: 'right', width: 130 },
  { label: 'Bank Revenue (₹)', align: 'right', width: 130 },
  { label: 'Actions', align: 'center', width: 120 },
];

/**
 * Aggregator Quote List View.
 * Strict < 200 lines, theme-driven.
 */
export const AggregatorListView = ({
  customerDetails = {},
  aggregatorsList = [],
  allProjections = {},
  finalizedAggregatorId,
  isAdmin = false,
  onFinalizeQuote,
  onOpenForwardModal,
  onRefresh,
}) => {
  const [modalAggregator, setModalAggregator] = useState(null);
  const [rateModalAggregator, setRateModalAggregator] = useState(null);

  return (
    <Box sx={{ width: '100%' }}>
      <CommonAppTable>
        <Table size="small" sx={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <CommonTableHeader columns={LIST_COLUMNS} />

          <TableBody>
            {aggregatorsList && aggregatorsList.length > 0 ? (
              aggregatorsList.map((agg, idx) => {
                const isFinal = Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                const projs = allProjections[agg.aggregatorId] || [];
                const gross = projs.reduce((s, r) => s + (Number(r.grossAmount) || 0), 0);
                const vendor = projs.reduce((s, r) => s + (Number(r.vendorShare) || 0), 0);
                const rev = projs.reduce((s, r) => s + (Number(r.expectedRevenue) || 0), 0);

                return (
                  <CommonTableRow key={agg.aggregatorId || idx} selected={isFinal}>
                    <CommonTableCell sx={{ color: 'text.secondary', width: 45 }}>
                      {idx + 1}
                    </CommonTableCell>

                    <CommonTableCell sx={{ fontWeight: 700 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {agg.aggregatorName || `Aggregator ${idx + 1}`}
                        </Typography>
                        {isFinal && (
                          <Chip label="FINALIZED" size="small" color="success" sx={{ height: 18, fontSize: '10px', fontWeight: 800 }} />
                        )}
                      </Box>
                    </CommonTableCell>

                    <CommonTableCell sx={{ color: 'text.secondary', fontSize: '11.5px' }}>
                      {agg.category || customerDetails?.category || 'Standard'}
                    </CommonTableCell>

                    <CommonTableCell align="center">
                      <StatusChipOrSelect status={agg.status || 'Pending'} size="small" />
                    </CommonTableCell>

                    <CommonTableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹ {formatNumber(gross || agg.totalGrossAmount || 0)}
                    </CommonTableCell>

                    <CommonTableCell align="right" sx={{ fontWeight: 700, color: '#b45309' }}>
                      ₹ {formatNumber(vendor || agg.totalVendorShare || 0)}
                    </CommonTableCell>

                    <CommonTableCell align="right" sx={{ fontWeight: 700, color: '#15803d' }}>
                      ₹ {formatNumber(rev || agg.totalExpectedRevenue || 0)}
                    </CommonTableCell>

                    <CommonTableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="View Detailed Quote Matrix" arrow>
                          <IconButton size="small" color="primary" onClick={() => setModalAggregator(agg)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {isAdmin && (
                          <Tooltip title="Enter / Edit Quoted Rates" arrow>
                            <IconButton size="small" color="info" onClick={() => setRateModalAggregator(agg)}>
                              <RateReview fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {onOpenForwardModal && (
                          <Tooltip title="Forward for Commercial Approval" arrow>
                            <IconButton size="small" color="warning" onClick={() => onOpenForwardModal(agg)}>
                              <ForwardToInboxOutlined fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CommonTableCell>
                  </CommonTableRow>
                );
              })
            ) : (
              <CommonTableEmptyState colSpan={LIST_COLUMNS.length} message="No Payment Aggregators Assigned" />
            )}
          </TableBody>
        </Table>
      </CommonAppTable>

      {/* ── Quote Table Details Dialog ── */}
      {modalAggregator && (
        <Dialog open={Boolean(modalAggregator)} onClose={() => setModalAggregator(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Aggregator Quote: {modalAggregator.aggregatorName}
            </Typography>
            <IconButton onClick={() => setModalAggregator(null)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <QuoteTable
              applicationDetails={customerDetails}
              aggregatorId={modalAggregator.aggregatorId}
              aggregatorName={modalAggregator.aggregatorName}
              disabled={true}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Rates Entry Dialog ── */}
      {rateModalAggregator && (
        <Dialog open={Boolean(rateModalAggregator)} onClose={() => setRateModalAggregator(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800}>
              Enter Rates: {rateModalAggregator.aggregatorName}
            </Typography>
            <IconButton onClick={() => setRateModalAggregator(null)}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>
            <GetRates
              applicationDetails={customerDetails}
              aggregatorId={rateModalAggregator.aggregatorId}
              onCloseModal={() => {
                setRateModalAggregator(null);
                if (onRefresh) onRefresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default AggregatorListView;
