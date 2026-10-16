import React from 'react';
import { TableHead, TableRow, TableCell } from '@mui/material';

/**
 * Standardized table header with official CBI gradient background,
 * high-contrast bold white typography, and clean column separators.
 *
 * columns: Array of { label, align, width, minWidth, sx }
 */
export const CommonTableHeader = ({ columns = [], children, sx = {} }) => {
  return (
    <TableHead sx={sx}>
      <TableRow
        sx={(theme) => ({
          background: theme.palette.cbi?.gradients?.tableHeader || 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)',
          borderBottom: `2px solid ${theme.palette.primary?.dark || '#062545'}`,
        })}
      >
        {columns.length > 0
          ? columns.map((col, idx) => (
              <TableCell
                key={col.id || col.key || idx}
                align={col.align || 'left'}
                sx={(theme) => ({
                  color: theme.palette.common.white || '#ffffff',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  letterSpacing: '0.2px',
                  py: 1.2,
                  px: 1.5,
                  width: col.width,
                  minWidth: col.minWidth,
                  borderRight: idx < columns.length - 1 ? '1px solid rgba(255, 255, 255, 0.25)' : 'none',
                  borderBottom: 'none',
                  ...col.sx,
                })}
              >
                {col.label}
              </TableCell>
            ))
          : children}
      </TableRow>
    </TableHead>
  );
};

export default CommonTableHeader;
