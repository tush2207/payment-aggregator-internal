import React from 'react';
import { TableRow, TableCell, Box, Typography, Button } from '@mui/material';
import { InboxRounded } from '@mui/icons-material';

/**
 * Clean empty state placeholder for tables.
 */
export const CommonTableEmptyState = ({
  colSpan = 6,
  message = 'No records available',
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction,
}) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} align="center" sx={{ py: 6, borderBottom: 'none' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box
            sx={(theme) => ({
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: `${theme.palette.primary.main}10`,
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1,
            })}
          >
            <InboxRounded sx={{ fontSize: 30 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            {message}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
            {description}
          </Typography>
          {actionLabel && onAction && (
            <Button
              size="small"
              variant="outlined"
              onClick={onAction}
              sx={{ mt: 1.5, textTransform: 'none', borderRadius: '6px' }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default CommonTableEmptyState;
