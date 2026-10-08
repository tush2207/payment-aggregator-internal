import React from 'react';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography, Chip } from '@mui/material';
import { CommonAppTable } from '&src/components/Tables/common';
import { formatNumber } from '&src/utils';

/**
 * Presentational multi-aggregator comparison matrix table.
 */
export const CostBenefitComparisonTable = ({
  activeAggs = [],
  baseRows = [],
  allProjections = {},
  aggTotalsMap = {},
  finalizedAggregatorId,
  tableRef,
}) => {
  if (!activeAggs.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary">
          No active aggregator quotes available for Cost Benefit comparison.
        </Typography>
      </Box>
    );
  }

  // Calculate overall base totals
  const totalBaseGross = baseRows.reduce((s, r) => s + (Number(r.grossAmount) || 0), 0);

  return (
    <div ref={tableRef}>
      <CommonAppTable sx={{ borderRadius: '0 0 10px 10px', borderTop: 'none' }}>
        <Table size="small" sx={{ minWidth: 900, borderCollapse: 'collapse' }}>
          <TableHead>
            {/* Top Aggregator Grouping Row */}
            <TableRow
              sx={(theme) => ({
                background: theme.palette.cbi?.gradients?.tableHeader || 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)',
              })}
            >
              <TableCell
                colSpan={4}
                align="center"
                sx={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12px',
                  py: 1,
                  borderRight: '2px solid rgba(255, 255, 255, 0.4)',
                }}
              >
                BASELINE PROJECTION & PROPOSED CHARGES
              </TableCell>

              {activeAggs.map((agg, idx) => {
                const isFinal = Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                const isL1 = idx === 0;
                return (
                  <TableCell
                    key={agg.aggregatorId || idx}
                    colSpan={3}
                    align="center"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '12px',
                      py: 1,
                      borderRight: idx < activeAggs.length - 1 ? '2px solid rgba(255, 255, 255, 0.4)' : 'none',
                      bgcolor: isL1 ? 'rgba(246, 211, 101, 0.25)' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                      <Typography variant="subtitle2" fontWeight={800} fontSize="12px" color="#ffffff">
                        {agg.aggregatorName || `Aggregator ${idx + 1}`}
                      </Typography>
                      {isL1 && (
                        <Chip
                          label="L1"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 800,
                            bgcolor: '#f6d365',
                            color: '#062545',
                          }}
                        />
                      )}
                      {isFinal && (
                        <Chip
                          label="FINALIZED"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '10px',
                            fontWeight: 800,
                            bgcolor: '#22c55e',
                            color: '#ffffff',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Sub Column Headers */}
            <TableRow
              sx={(theme) => ({
                background: theme.palette.primary.dark || '#0E4F8D',
                borderBottom: `2px solid ${theme.palette.primary[900] || '#062545'}`,
              })}
            >
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', width: 40, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                #
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                Payment Channel
              </TableCell>
              <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', width: 110, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                Proposed
              </TableCell>
              <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', width: 120, borderRight: '2px solid rgba(255,255,255,0.4)' }}>
                Gross (₹)
              </TableCell>

              {activeAggs.map((agg, idx) => (
                <React.Fragment key={agg.aggregatorId || idx}>
                  <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', width: 90, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                    Rate
                  </TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px', width: 110, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                    Vendor Share (₹)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '11px',
                      width: 110,
                      borderRight: idx < activeAggs.length - 1 ? '2px solid rgba(255,255,255,0.4)' : 'none',
                    }}
                  >
                    Bank Share (₹)
                  </TableCell>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {baseRows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                hover
                sx={(theme) => ({
                  bgcolor: idx % 2 === 1 ? theme.palette.background.default || '#f8fafc' : '#ffffff',
                  '&:hover': { bgcolor: theme.palette.action.hover || '#f1f5f9' },
                })}
              >
                <TableCell sx={(theme) => ({ fontSize: '11.5px', color: 'text.secondary', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                  {idx + 1}
                </TableCell>
                <TableCell sx={(theme) => ({ fontSize: '12px', fontWeight: 700, color: 'text.primary', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                  {row.transactionType}
                </TableCell>
                <TableCell align="center" sx={(theme) => ({ fontSize: '11.5px', color: 'text.secondary', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                  {row.chargesProposed ? `${row.chargesProposed} ${row.bankUnit || '%'}` : '—'}
                </TableCell>
                <TableCell align="right" sx={(theme) => ({ fontSize: '12px', fontWeight: 600, borderRight: `2px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                  ₹ {formatNumber(row.grossAmount || 0)}
                </TableCell>

                {/* Aggregator columns */}
                {activeAggs.map((agg, aIdx) => {
                  const p = (allProjections[agg.aggregatorId] || []).find(
                    (item) => (item.transactionType || '').trim().toLowerCase() === (row.transactionType || '').trim().toLowerCase()
                  );
                  return (
                    <React.Fragment key={agg.aggregatorId || aIdx}>
                      <TableCell align="center" sx={(theme) => ({ fontSize: '11.5px', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                        {p?.rate !== undefined && p?.rate !== null && p?.rate !== '' ? `${p.rate} ${p.unit || '%'}` : '—'}
                      </TableCell>
                      <TableCell align="right" sx={(theme) => ({ fontSize: '12px', fontWeight: 600, color: '#b45309', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
                        ₹ {formatNumber(p?.vendorShare || 0)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={(theme) => ({
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#15803d',
                          borderRight: aIdx < activeAggs.length - 1 ? `2px solid ${theme.palette.divider}` : 'none',
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        })}
                      >
                        ₹ {formatNumber(p?.expectedRevenue || 0)}
                      </TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}

            {/* Total Summary Row */}
            <TableRow
              sx={(theme) => ({
                bgcolor: theme.palette.background.default || '#f8fafc',
                borderTop: `2px solid ${theme.palette.text.secondary || '#64748b'}`,
                borderBottom: `2px solid ${theme.palette.text.secondary || '#64748b'}`,
              })}
            >
              <TableCell colSpan={3} sx={(theme) => ({ fontWeight: 800, fontSize: '12px', color: theme.palette.primary.dark, borderRight: `1px solid ${theme.palette.divider}`, py: 1.2 })}>
                TOTAL PROJECTIONS & REVENUE
              </TableCell>
              <TableCell align="right" sx={(theme) => ({ fontWeight: 800, fontSize: '12.5px', borderRight: `2px solid ${theme.palette.divider}` })}>
                ₹ {formatNumber(totalBaseGross)}
              </TableCell>

              {activeAggs.map((agg, aIdx) => {
                const totals = aggTotalsMap[agg.aggregatorId] || {};
                return (
                  <React.Fragment key={agg.aggregatorId || aIdx}>
                    <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}` })} />
                    <TableCell align="right" sx={(theme) => ({ fontWeight: 800, fontSize: '12.5px', color: '#b45309', borderRight: `1px solid ${theme.palette.divider}` })}>
                      ₹ {formatNumber(totals.totalVendorShare || 0)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={(theme) => ({
                        fontWeight: 800,
                        fontSize: '12.5px',
                        color: '#15803d',
                        borderRight: aIdx < activeAggs.length - 1 ? `2px solid ${theme.palette.divider}` : 'none',
                      })}
                    >
                      ₹ {formatNumber(totals.totalExpectedRevenue || 0)}
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </CommonAppTable>
    </div>
  );
};

export default CostBenefitComparisonTable;
