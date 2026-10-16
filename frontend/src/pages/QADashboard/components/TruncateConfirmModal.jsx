import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { WarningAmberRounded, DeleteForeverRounded } from '@mui/icons-material';

export default function TruncateConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Truncate Table',
  targetName = '',
  targetType = 'table', // 'table' | 'all' | 'application'
  recordCount = 0,
  loading = false,
}) {
  const [confirmInput, setConfirmInput] = useState('');

  const requiredKeyword = targetType === 'all' ? 'DELETE ALL' : 'TRUNCATE';
  const isMatch = targetType === 'application' ? true : confirmInput.trim().toUpperCase() === requiredKeyword;

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  const handleConfirm = () => {
    if (!isMatch) return;
    onConfirm();
    setConfirmInput('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fef2f2', color: '#991b1b', py: 2 }}>
        <WarningAmberRounded sx={{ color: '#dc2626', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px' }}>
          <strong>Warning:</strong> This action is permanent and cannot be undone. It will purge{' '}
          {recordCount > 0 ? `${recordCount} record(s) from ` : ''}
          <strong>{targetName}</strong>.
        </Alert>

        <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
          {targetType === 'all'
            ? 'You are about to completely wipe all test applications, projection quotes, helpdesk queries, and audit logs. Type DELETE ALL below to confirm.'
            : targetType === 'application'
            ? `Are you sure you want to permanently delete application #${targetName} and all its linked records?`
            : `To proceed with truncating table "${targetName}", type TRUNCATE below:`}
        </Typography>

        {targetType !== 'application' && (
          <TextField
            fullWidth
            size="small"
            placeholder={`Type "${requiredKeyword}" to confirm`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            disabled={loading}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontWeight: 700,
              },
            }}
          />
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={handleClose} disabled={loading} sx={{ fontWeight: 700, textTransform: 'none', color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteForeverRounded />}
          onClick={handleConfirm}
          disabled={!isMatch || loading}
          sx={{ fontWeight: 800, textTransform: 'none', px: 3, borderRadius: '8px' }}
        >
          {loading ? 'Deleting...' : targetType === 'all' ? 'Wipe All Data' : 'Truncate Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
