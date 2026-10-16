import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';

const PRESET_CHANNELS = [
  'Internet banking',
  'UPI',
  'Debit card - Rupay',
  'Debit card - Master/Visa (Above 2000)',
  'Debit card - Master/Visa (Upto 2000)',
  'Credit cards',
  'Corporate Net Banking',
  'Wallets & Prepaid Cards',
  'Bharat QR / Dynamic QR',
  'International Cards & Forex',
  'BNPL & EMI Payments',
  'Custom Channel',
];

/**
 * Modal to add a new projection channel.
 */
export const AddChannelModal = ({
  open,
  onClose,
  onAddChannel,
}) => {
  const [channelType, setChannelType] = useState('UPI');
  const [customName, setCustomName] = useState('');
  const [countPercent, setCountPercent] = useState('');
  const [valuePercent, setValuePercent] = useState('');

  const handleSubmit = () => {
    const finalName = channelType === 'Custom Channel' ? customName.trim() : channelType;
    if (!finalName) return;
    onAddChannel({
      channelName: finalName,
      countPercent,
      valuePercent,
    });
    setCustomName('');
    setCountPercent('');
    setValuePercent('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
          backgroundColor: '#176FC1',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.8,
          px: 2.5,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          borderBottom: '3px solid #CE0F3E',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <Add sx={{ color: '#ffffff', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
            Add Projection Channel
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
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
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Select Payment Channel</InputLabel>
            <Select
              value={channelType}
              label="Select Payment Channel"
              onChange={(e) => setChannelType(e.target.value)}
            >
              {PRESET_CHANNELS.map((ch) => (
                <MenuItem key={ch} value={ch}>
                  {ch}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {channelType === 'Custom Channel' && (
            <TextField
              label="Custom Channel Name"
              placeholder="e.g. International Diners / Forex"
              fullWidth
              size="small"
              required
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          )}

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Share Count (%)"
              placeholder="0"
              type="number"
              fullWidth
              size="small"
              value={countPercent}
              onChange={(e) => setCountPercent(e.target.value)}
              InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
            />

            <TextField
              label="Share Value (%)"
              placeholder="0"
              type="number"
              fullWidth
              size="small"
              value={valuePercent}
              onChange={(e) => setValuePercent(e.target.value)}
              InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
            />
          </Stack>

          <Alert severity="info" sx={{ fontSize: '0.78rem', borderRadius: '6px' }}>
            After adding, you can click <b>"Auto-Balance to 100%"</b> to re-normalize all channel percentages automatically.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
        >
          Add Channel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddChannelModal;
