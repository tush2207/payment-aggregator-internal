import React from 'react';
import { TableCell } from '@mui/material';

/**
 * Reusable table cell with clean borders, padding, and theme typography.
 */
export const CommonTableCell = ({
  children,
  align = 'left',
  isHeader = false,
  isLast = false,
  sx = {},
  ...props
}) => {
  return (
    <TableCell
      align={align}
      sx={(theme) => ({
        fontSize: '12px',
        py: 1,
        px: 1.5,
        color: theme.palette.text.primary || '#1e293b',
        borderBottom: `1px solid ${theme.palette.divider || '#cbd5e1'}`,
        borderRight: isLast ? 'none' : `1px solid ${theme.palette.divider || '#cbd5e1'}`,
        ...sx,
      })}
      {...props}
    >
      {children}
    </TableCell>
  );
};

export default CommonTableCell;
