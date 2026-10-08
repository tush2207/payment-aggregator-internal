import React from 'react';
import { TableRow } from '@mui/material';

/**
 * Reusable table row with consistent hover effects, zebra striping, and theme transitions.
 */
export const CommonTableRow = ({
  children,
  hover = true,
  selected = false,
  isEven = false,
  sx = {},
  ...props
}) => {
  return (
    <TableRow
      hover={hover}
      selected={selected}
      sx={(theme) => ({
        bgcolor: isEven ? theme.palette.background.default || '#f8fafc' : 'transparent',
        transition: 'background-color 0.15s ease',
        '&:hover': {
          bgcolor: theme.palette.action?.hover || '#f1f5f9',
        },
        '&.Mui-selected, &.Mui-selected:hover': {
          bgcolor: `${theme.palette.primary.main}14`,
        },
        ...sx,
      })}
      {...props}
    >
      {children}
    </TableRow>
  );
};

export default CommonTableRow;
