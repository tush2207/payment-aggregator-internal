import React from 'react';
import {
  TableRow,
  TableCell,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';

/**
 * Single editable channel row for projection table.
 */
export const ProjectionTableRow = ({
  row,
  idx,
  onChangeNumeric,
  onBlurField,
  onDeleteRow,
}) => {
  return (
    <TableRow
      hover
      sx={(theme) => ({
        bgcolor: idx % 2 === 1 ? theme.palette.background.default || '#f8fafc' : '#ffffff',
        '&:hover': { bgcolor: theme.palette.action.hover || '#f1f5f9' },
        transition: 'background-color 0.15s ease',
      })}
    >
      <TableCell sx={(theme) => ({ fontWeight: 600, color: 'text.secondary', fontSize: '11.5px', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
        {idx + 1}
      </TableCell>

      <TableCell sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 0.8 })}>
        <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontSize: '12.5px' }}>
          {row.transactionType}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, p: '6px' })}>
        <TextField
          size="small"
          type="text"
          placeholder="0"
          value={row.transactionCount ?? ''}
          onChange={(e) => onChangeNumeric(row.id, 'transactionCount', e.target.value)}
          onBlur={() => onBlurField(row.id, 'transactionCount')}
          inputProps={{
            style: { textAlign: 'right', padding: '4px 8px', fontSize: '12px', fontWeight: 700 },
          }}
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 700, color: 'text.secondary', ml: 0.5 }}>
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

      <TableCell align="center" sx={(theme) => ({ borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, p: '6px' })}>
        <TextField
          size="small"
          type="text"
          placeholder="0"
          value={row.transactionValue ?? ''}
          onChange={(e) => onChangeNumeric(row.id, 'transactionValue', e.target.value)}
          onBlur={() => onBlurField(row.id, 'transactionValue')}
          inputProps={{
            style: { textAlign: 'right', padding: '4px 8px', fontSize: '12px', fontWeight: 700 },
          }}
          InputProps={{
            endAdornment: (
              <Typography variant="caption" sx={{ fontSize: '11px', fontWeight: 700, color: 'text.secondary', ml: 0.5 }}>
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

      <TableCell align="center" sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}`, p: '4px' })}>
        {row.isCustom ? (
          <Tooltip title="Delete custom projection channel" arrow>
            <IconButton size="small" color="error" onClick={() => onDeleteRow(row.id)}>
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
};

export default ProjectionTableRow;
