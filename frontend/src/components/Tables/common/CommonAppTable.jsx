import React from 'react';
import { TableContainer, Paper } from '@mui/material';

/**
 * Reusable container wrapper for all data tables across the CBI portal.
 * Standardizes border radius, borders, overflow, and theme background.
 */
export const CommonAppTable = ({
  children,
  elevation = 0,
  sx = {},
  maxHeight,
  minWidth = '100%',
  ...props
}) => {
  return (
    <TableContainer
      component={Paper}
      elevation={elevation}
      sx={(theme) => ({
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider || '#cbd5e1'}`,
        width: '100%',
        minWidth: minWidth,
        maxHeight: maxHeight,
        bgcolor: theme.palette.background.paper || '#ffffff',
        boxShadow: 'none',
        ...sx,
      })}
      {...props}
    >
      {children}
    </TableContainer>
  );
};

export default CommonAppTable;
