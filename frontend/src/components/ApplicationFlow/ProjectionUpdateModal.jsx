import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, TextField, Typography, IconButton, Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';

export default function ProjectionUpdateModal({ open, onClose, applicationData, onUpdate }) {
  const [projections, setProjections] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // In a real scenario, this might come from applicationData.projections
      // For now, initializing with constants
      setProjections(JSON.parse(JSON.stringify(PROJECTION_CAL_DETAILS)));
    }
  }, [open, applicationData]);

  const handleChange = (index, field, value) => {
    const updated = [...projections];
    updated[index][field] = value;
    setProjections(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onUpdate(applicationData.applicationId, projections);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
      <DialogTitle
        sx={{
          background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
          backgroundColor: '#176FC1',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.8,
          px: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          borderBottom: '3px solid #CE0F3E',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <TrendingUpIcon sx={{ fontSize: 26, color: '#ffffff' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#ffffff', fontSize: '1.05rem' }}>
            Update Projections
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          {applicationData?.applicationId && (
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
              }}
            >
              App ID: {applicationData.applicationId}
            </Typography>
          )}
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
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Update the transaction count and value below. Transaction types and their base percentages are read-only.
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Type of Transaction</TableCell>
                <TableCell>Base Percent</TableCell>
                <TableCell>Transaction Count</TableCell>
                <TableCell>Transaction Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projections.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={row.isIB ? 500 : 600}>
                      {row.transactionType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {row.transactionTypePercent || '-'}
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Count (e.g., 10%)"
                      value={row.transactionCount || ''}
                      onChange={(e) => handleChange(index, 'transactionCount', e.target.value)}
                      variant="outlined"
                      sx={{ width: '120px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Value (e.g., 27%)"
                      value={row.transactionValue || ''}
                      onChange={(e) => handleChange(index, 'transactionValue', e.target.value)}
                      variant="outlined"
                      sx={{ width: '120px' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update & Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
