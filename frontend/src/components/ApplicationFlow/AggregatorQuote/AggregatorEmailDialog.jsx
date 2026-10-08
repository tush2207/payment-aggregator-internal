import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Paper,
  TextField,
  Chip,
  Stack,
  Tooltip,
  Grid,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material';
import { EmailOutlined, Close } from '@mui/icons-material';

/**
 * Official Central Bank of India Quotation Request Email Preview Modal.
 * Strict < 250 lines, theme-driven.
 */
export const AggregatorEmailDialog = ({
  open,
  onClose,
  dispatchedAggregators = [],
  applicationId,
  customerDetails = {},
  loading = false,
  onConfirmSend,
  emailSubject,
  setEmailSubject,
  emailIntroText,
  setEmailIntroText,
  emailModes,
  setEmailModes,
  emailSubmissionTo,
  setEmailSubmissionTo,
  emailManagerName,
  setEmailManagerName,
  quoteConsent,
  setQuoteConsent,
}) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={(theme) => ({
          background: theme.palette.cbi?.gradients?.modalHeader || 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.05rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        })}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <EmailOutlined />
          <span>Quotation Request Email Preview & Confirmation</span>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* Recipient Aggregator Chips */}
        <Paper elevation={0} sx={{ mb: 2.5, p: 2, borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} sx={{ mb: 1, display: 'block' }}>
            Selected Recipient Aggregators ({dispatchedAggregators.length})
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {dispatchedAggregators.map((agg) => (
              <Chip
                key={agg.aggregatorId}
                label={`${agg.aggregatorName} (${agg.email || 'No email configured'})`}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '12px' }}
              />
            ))}
          </Stack>
        </Paper>

        {/* Email Form Fields */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: '10px', border: '1px solid #cbd5e1' }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Email Subject Line"
                fullWidth
                size="small"
                value={emailSubject || `Quotation Request - Merchant Onboarding - ${customerDetails?.customerName || 'Application'}`}
                onChange={(e) => setEmailSubject && setEmailSubject(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Introductory Paragraph"
                fullWidth
                multiline
                rows={2}
                value={emailIntroText || 'We request you to share the quotation for merchant onboarding whose details are mentioned below:'}
                onChange={(e) => setEmailIntroText && setEmailIntroText(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Requested Payment Modes"
                fullWidth
                size="small"
                value={emailModes || 'Credit Cards / Debit Cards / Netbanking / UPI'}
                onChange={(e) => setEmailModes && setEmailModes(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Quotations Submission Email"
                fullWidth
                size="small"
                value={emailSubmissionTo || 'smit1dptb@centralbank.bank.in'}
                onChange={(e) => setEmailSubmissionTo && setEmailSubmissionTo(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Authorized Officer / Manager Name"
                fullWidth
                size="small"
                value={emailManagerName || 'Shraddha Saxena (Manager - Neo Banking)'}
                onChange={(e) => setEmailManagerName && setEmailManagerName(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={quoteConsent} onChange={(e) => setQuoteConsent && setQuoteConsent(e.target.checked)} color="primary" />}
                label={<Typography variant="body2" fontWeight={600}>I confirm that all commercial requirements and projections are accurate for official aggregator quotation dispatch.</Typography>}
              />
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end' }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={loading || !quoteConsent}
          onClick={onConfirmSend}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3 }}
        >
          {loading ? 'Dispatching...' : 'Confirm & Dispatch Emails'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AggregatorEmailDialog;
