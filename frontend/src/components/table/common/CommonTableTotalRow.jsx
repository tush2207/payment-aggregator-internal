import React from 'react';
import { TableRow, TableCell, Typography } from '@mui/material';

/**
 * Reusable table summary / total footer row with strong theme contrast.
 */
export const CommonTableTotalRow = ({
  label = 'TOTAL',
  children,
  colSpan = 1,
  sx = {},
  ...props
}) => {
  return (
    <TableRow
      sx={(theme) => ({
        bgcolor: theme.palette.background.default || '#f8fafc',
        borderTop: `2px solid ${theme.palette.text.secondary || '#64748b'}`,
        borderBottom: `2px solid ${theme.palette.text.secondary || '#64748b'}`,
        ...sx,
      })}
      {...props}
    >
      {colSpan > 0 && (
        <TableCell
          colSpan={colSpan}
          sx={(theme) => ({
            fontWeight: 800,
            fontSize: '12px',
            color: theme.palette.primary.dark || '#0E4F8D',
            borderRight: `1px solid ${theme.palette.divider || '#94a3b8'}`,
            py: 1.2,
            px: 2,
          })}
        >
          <Typography variant="subtitle2" fontWeight={800} fontSize="12px">
            {label}
          </Typography>
        </TableCell>
      )}
      {children}
    </TableRow>
  );
};

export default CommonTableTotalRow;
