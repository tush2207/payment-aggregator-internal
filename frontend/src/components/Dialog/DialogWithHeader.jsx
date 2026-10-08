/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Component: DialogWithHeader
 * Purpose: Standardized modal dialog with CenEODS brand gradient header
 *          and bank-compliant structure.
 * ============================================================================
 */

import React, { forwardRef } from 'react';
import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Slide,
  DialogActions,
} from '@mui/material';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const DialogWithHeader = ({
  open,
  onClose,
  headerText,
  subHeaderText,
  icon: HeaderIcon,
  maxWidth = 'sm',
  headerBg,
  headerColor,
  actions,
  children,
  PaperProps,
  ...props
}) => (
  <Dialog
    fullWidth
    maxWidth={maxWidth}
    open={open}
    onClose={onClose}
    TransitionComponent={Transition}
    keepMounted
    PaperProps={{
      sx: {
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: (theme) => theme.shadows[8] || '0 25px 50px -12px rgba(10, 35, 66, 0.25)',
        border: '1px solid',
        borderColor: 'divider',
        ...(PaperProps?.sx || {}),
      },
      ...PaperProps,
    }}
    {...props}
  >
    {/* ================= HEADER ================= */}
    <DialogTitle
      sx={{
        p: 2.2,
        px: 3,
        background: (theme) =>
          headerBg ||
          `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 40%, ${theme.palette.secondary.main} 100%)`,
        color: headerColor || 'primary.contrastText',
        position: 'relative',
        boxShadow: (theme) => `0 4px 12px ${theme.palette.action.focus}`,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1.5}>
          {HeaderIcon && <HeaderIcon sx={{ fontSize: 24, color: 'accent.main' }} />}
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '0.3px',
                color: 'inherit',
                lineHeight: 1.3,
              }}
            >
              {headerText}
            </Typography>
            {subHeaderText && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.75rem',
                  display: 'block',
                  mt: 0.2,
                }}
              >
                {subHeaderText}
              </Typography>
            )}
          </Box>
        </Box>

        {onClose && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            sx={{
              color: 'primary.contrastText',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
    </DialogTitle>

    {/* Brand Accent Stripe */}
    <Box
      sx={{
        height: '3px',
        background: (theme) =>
          `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      }}
    />

    {/* Content */}
    <DialogContent sx={{ p: 3, bgcolor: 'background.paper' }}>{children}</DialogContent>

    {/* Optional Footer Actions */}
    {actions && (
      <DialogActions sx={{ px: 3, py: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

export default DialogWithHeader;
