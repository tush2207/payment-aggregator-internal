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
  title,
  subHeaderText,
  subtitle,
  icon: HeaderIcon,
  appId,
  applicationId,
  maxWidth = 'sm',
  headerBg,
  headerColor,
  actions,
  children,
  PaperProps,
  contentSx,
  ...props
}) => {
  const displayTitle = headerText || title;
  const displaySubtitle = subHeaderText || subtitle;
  const currentAppId = appId || applicationId;

  return (
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
        border: '1px solid #cbd5e1',
        ...(PaperProps?.sx || {}),
      },
      ...PaperProps,
    }}
    {...props}
  >
    {/* ================= HEADER ================= */}
    <DialogTitle
      sx={{
        py: 1.8,
        px: 3,
        background: headerBg || 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
        backgroundColor: '#176FC1',
        color: headerColor || '#ffffff',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        borderBottom: '3px solid #CE0F3E',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
          {HeaderIcon && <HeaderIcon sx={{ fontSize: 26, color: '#ffffff', flexShrink: 0 }} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '0.3px',
                color: '#ffffff',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {displayTitle}
            </Typography>
            {displaySubtitle && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.75rem',
                  display: 'block',
                  mt: 0.2,
                }}
              >
                {displaySubtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
          {currentAppId && (
            <Typography
              variant="subtitle2"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                px: 1.5,
                py: 0.5,
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '12px',
                color: '#ffffff',
                whiteSpace: 'nowrap',
              }}
            >
              App ID: {currentAppId}
            </Typography>
          )}

          {onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              size="small"
              sx={{
                color: '#ffffff',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>
    </DialogTitle>

    {/* Content */}
    <DialogContent
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.paper',
        maxHeight: 'calc(85vh - 100px)',
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: '6px', height: '6px' },
        '&::-webkit-scrollbar-track': { background: '#f1f5f9', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px', '&:hover': { background: '#94a3b8' } },
        ...(contentSx || {}),
      }}
    >
      {children}
    </DialogContent>

    {/* Optional Footer Actions */}
    {actions && (
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
  );
};

export default DialogWithHeader;
