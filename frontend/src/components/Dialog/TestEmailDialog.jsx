import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  MailRounded,
  Close,
  SendRounded,
  CheckCircleRounded,
  InfoOutlined,
} from '@mui/icons-material';
import manageAggregatorServices from '&src/services/manageAggregator';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

export default function TestEmailDialog({ open, onClose, defaultEmail = '' }) {
  const theme = useTheme();
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const [toEmail, setToEmail] = useState(defaultEmail || '');
  const [recipientName, setRecipientName] = useState('Partner Contact');
  const [aggregatorName, setAggregatorName] = useState('Test Payment Aggregator');
  const [loading, setLoading] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);

  React.useEffect(() => {
    if (open) {
      setToEmail(defaultEmail || '');
      setResultStatus(null);
    }
  }, [open, defaultEmail]);

  const handleSendTestEmail = async () => {
    if (!toEmail.trim() || !toEmail.includes('@')) {
      errorNotification('Please enter a valid recipient email address.');
      return;
    }

    setLoading(true);
    setResultStatus(null);

    try {
      const response = await manageAggregatorServices.testEmail({
        toEmail: toEmail.trim(),
        recipientName: recipientName.trim() || 'Partner POC',
        aggregatorName: aggregatorName.trim() || 'Payment Aggregator',
      });

      if (response && response.data && response.data.success) {
        successNotification(response.data.message || 'Test email dispatched successfully!');
        setResultStatus({
          severity: 'success',
          message: response.data.message || 'Email sent successfully via configured SMTP.',
        });
      } else {
        const msg = response?.data?.message || 'SMTP server connection could not be established.';
        errorNotification(msg);
        setResultStatus({
          severity: 'warning',
          message: msg,
        });
      }
    } catch (err) {
      console.error('Test email failed:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to dispatch test email.';
      errorNotification(errMsg);
      setResultStatus({
        severity: 'error',
        message: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.2,
          background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MailRounded sx={{ color: '#ffffff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              Test Email Dispatch & SMTP Verification
            </Typography>
            <Typography variant="caption" sx={{ color: '#e0f2fe', fontSize: '0.72rem' }}>
              Central Bank of India &bull; Payment Aggregator Quotation Notification
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          disabled={loading}
          sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        <Box sx={{ mb: 2.5, p: 1.8, bgcolor: '#f0f7ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
          <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#0369a1', lineHeight: 1.5 }}>
            <InfoOutlined sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.6 }} />
            This tool sends a sample <b>Quotation Request HTML email</b> to verify your backend SMTP settings (e.g. Host, Port, Credentials, TLS).
          </Typography>
        </Box>

        <Stack spacing={2}>
          <TextField
            label="Recipient Email Address"
            placeholder="e.g. partner.onboarding@aggregator.com"
            type="email"
            fullWidth
            required
            size="small"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            disabled={loading}
            helperText="The email address where the sample quotation notification will be delivered."
          />

          <TextField
            label="Recipient Contact Person Name"
            placeholder="e.g. Rohan Sharma"
            fullWidth
            size="small"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Payment Aggregator Name"
            placeholder="e.g. Razorpay / PayU / BillDesk"
            fullWidth
            size="small"
            value={aggregatorName}
            onChange={(e) => setAggregatorName(e.target.value)}
            disabled={loading}
          />
        </Stack>

        {resultStatus && (
          <Alert severity={resultStatus.severity} sx={{ mt: 2.5, borderRadius: '8px', fontSize: '0.82rem' }}>
            {resultStatus.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} disabled={loading} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendTestEmail}
          disabled={loading || !toEmail.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendRounded />}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5,
            borderRadius: '8px',
            bgcolor: '#176FC1',
            boxShadow: '0 4px 12px rgba(23, 111, 193, 0.25)',
          }}
        >
          {loading ? 'Sending Test Email...' : 'Send Test Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
