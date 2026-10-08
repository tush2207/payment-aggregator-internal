import React from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { formatNumber } from '&src/utils';

export const QuoteChannelRow = ({
  row,
  idx,
  disabled = false,
  onChangeRate,
  isError = false,
}) => {
  return (
    <TableRow
      hover
      sx={(theme) => ({
        bgcolor: isError ? `${theme.palette.error.main}14` : idx % 2 === 1 ? theme.palette.background.default : '#ffffff',
      })}
    >
      <TableCell sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontSize: '11.5px', color: 'text.secondary' })}>
        {idx + 1}
      </TableCell>

      <TableCell sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 700, fontSize: '12px' })}>
        {row.transactionType}
      </TableCell>

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontSize: '11.5px' })}>
        {row.transactionCount || '0%'}
      </TableCell>

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontSize: '11.5px' })}>
        {row.transactionValue || '0%'}
      </TableCell>

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontSize: '11.5px' })}>
        {row.chargesProposed ? `${row.chargesProposed} ${row.bankUnit || '%'}` : '—'}
      </TableCell>

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, p: '6px' })}>
        <TextField
          size="small"
          type="text"
          value={row.rate ?? ''}
          disabled={disabled}
          onChange={(e) => onChangeRate(row.id, 'rate', e.target.value)}
          inputProps={{ style: { textAlign: 'right', padding: '4px 8px', fontSize: '12px', fontWeight: 700 } }}
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 700, color: 'text.secondary', ml: 0.5 }}>
                {row.unit || '%'}
              </Typography>
            ),
          }}
          sx={{ width: 85, '& .MuiOutlinedInput-root': { borderRadius: '6px', bgcolor: '#ffffff' } }}
        />
      </TableCell>

      <TableCell align="right" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 600, fontSize: '12px' })}>
        ₹ {formatNumber(row.grossAmount || 0)}
      </TableCell>

      <TableCell align="right" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 700, fontSize: '12px', color: '#b45309' })}>
        ₹ {formatNumber(row.vendorShare || 0)}
      </TableCell>

      <TableCell align="right" sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}`, fontWeight: 700, fontSize: '12px', color: '#15803d' })}>
        ₹ {formatNumber(row.expectedRevenue || 0)}
      </TableCell>
    </TableRow>
  );
};

export default QuoteChannelRow;
