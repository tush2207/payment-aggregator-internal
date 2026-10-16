import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { Close, CancelOutlined } from '@mui/icons-material';

/**
 * Rejection reason modal for application workflow.
 */
export const ApplicationFlowRejectDialog = ({
  open,
  onClose,
  selectedApp,
  reason,
  onChangeReason,
  onConfirm,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '14px', overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
          backgroundColor: '#176FC1',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.8,
          px: 2.5,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          borderBottom: '3px solid #CE0F3E',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <CancelOutlined sx={{ fontSize: 24, color: '#ffffff' }} />
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.05rem', color: '#ffffff' }}>
            Reject Application
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#ffffff',
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Are you sure you want to reject application{' '}
          <b>{selectedApp?.applicationId}</b> ({selectedApp?.customerName || 'Merchant'})? Please specify the reason below.
        </Typography>

        <TextField
          label="Reason for Rejection"
          placeholder="e.g. Incomplete KYC documentation or high risk merchant profile..."
          fullWidth
          multiline
          rows={3}
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          required
          autoFocus
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading || !reason.trim()}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
        >
          {loading ? 'Rejecting...' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationFlowRejectDialog;
