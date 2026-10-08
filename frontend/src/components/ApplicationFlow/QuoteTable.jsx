import React from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import { CommonAppTable, CommonTableHeader, CommonTableTotalRow, CommonTableEmptyState } from '&src/components/Tables/common';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { formatNumber } from '&src/utils';
import { useQuoteTable } from '&src/hooks/useQuoteTable';
import QuoteChannelRow from './QuoteChannelRow';

const QUOTE_COLUMNS = [
  { label: '#', width: 45 },
  { label: 'Payment Channel', minWidth: 160 },
  { label: 'Txn Count %', align: 'center', width: 100 },
  { label: 'Txn Value %', align: 'center', width: 100 },
  { label: 'Proposed', align: 'center', width: 110 },
  { label: 'Quoted Rate', align: 'center', width: 130 },
  { label: 'Gross (₹)', align: 'right', width: 120 },
  { label: 'Vendor Share (₹)', align: 'right', width: 130 },
  { label: 'Bank Share (₹)', align: 'right', width: 130 },
];

/**
 * Quote Table Commercial Matrix View.
 * Strict < 200 lines, modular, theme-driven.
 */
export const QuoteTable = ({
  applicationDetails,
  aggregatorId,
  aggregatorName,
  isRateAdded = false,
  onSaveSuccess,
  disabled = false,
}) => {
  const {
    quoteDetails,
    loading,
    errorRowIds,
    handleRateChange,
    totals,
  } = useQuoteTable({ applicationDetails, aggregatorId, onSaveSuccess });

  return (
    <Box sx={{ width: '100%' }}>
      {loading && <FullScreenLoader />}

      <CommonAppTable>
        <Table size="small" sx={{ minWidth: 980, borderCollapse: 'collapse' }}>
          <CommonTableHeader columns={QUOTE_COLUMNS} />

          <TableBody>
            {quoteDetails.length > 0 ? (
              quoteDetails.map((row, idx) => (
                <QuoteChannelRow
                  key={row.id || idx}
                  row={row}
                  idx={idx}
                  disabled={disabled}
                  onChangeRate={handleRateChange}
                  isError={errorRowIds.includes(row.id)}
                />
              ))
            ) : (
              <CommonTableEmptyState
                colSpan={QUOTE_COLUMNS.length}
                message="No Commercial Projections Available"
              />
            )}

            {/* Total Row */}
            <CommonTableTotalRow colSpan={6} label="TOTAL COMMERCIALS">
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '12.5px', borderRight: '1px solid #94a3b8' }}>
                ₹ {formatNumber(totals.totalGrossAmount || 0)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '12.5px', color: '#b45309', borderRight: '1px solid #94a3b8' }}>
                ₹ {formatNumber(totals.totalVendorShare || 0)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '12.5px', color: '#15803d' }}>
                ₹ {formatNumber(totals.totalExpectedRevenue || 0)}
              </TableCell>
            </CommonTableTotalRow>
          </TableBody>
        </Table>
      </CommonAppTable>
    </Box>
  );
};

export default QuoteTable;