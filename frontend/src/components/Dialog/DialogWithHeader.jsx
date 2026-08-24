import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Slide,
  DialogActions
} from '@mui/material';
import { forwardRef } from 'react';

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
        boxShadow: '0 25px 50px -12px rgba(10, 35, 66, 0.25)',
        border: '1px solid #cbd5e1',
        ...(PaperProps?.sx || {})
      },
      ...PaperProps
    }}
    {...props}
  >
    {/* ================= CONSISTENT PREMIUM HEADER ================= */}
    <DialogTitle
      sx={{
        p: 2.2,
        px: 3,
        background: headerBg || 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
        color: headerColor || '#ffffff',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1.5}>
          {HeaderIcon && <HeaderIcon sx={{ fontSize: 24, color: '#f6d365' }} />}
          <Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: '1.05rem',
                letterSpacing: '0.3px',
                color: 'inherit',
                lineHeight: 1.3
              }}
            >
              {headerText}
            </Typography>
            {subHeaderText && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.75rem',
                  display: 'block',
                  mt: 0.2
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
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'rotate(90deg)'
              }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
    </DialogTitle>

    {/* Brand Accent Stripe */}
    <Box sx={{ height: '3px', background: 'linear-gradient(90deg, #CE0F3E, #176FC1, #CE0F3E)' }} />

    {/* Content */}
    <DialogContent sx={{ p: 3, bgcolor: '#ffffff' }}>{children}</DialogContent>

    {/* Optional Footer Actions */}
    {actions && (
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        {actions}
      </DialogActions>
    )}
  </Dialog>
);

export default DialogWithHeader;

