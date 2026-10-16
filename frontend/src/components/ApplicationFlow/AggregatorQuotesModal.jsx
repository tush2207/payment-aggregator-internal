import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, IconButton, Box, TextField, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import aggregatorByApplication from '&src/services/aggregatorByApplication';

export default function AggregatorQuotesModal({ open, onClose, applicationData, onAddMarkup }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markup, setMarkup] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && applicationData?.applicationId) {
      setMarkup('');
      const fetchQuotes = async () => {
        setLoading(true);
        try {
          const res = await aggregatorByApplication.getAllAggregatorsByApplication(applicationData.applicationId);
          const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          const mapped = list.map((q) => ({
            id: String(q.aggregatorId || q.id),
            aggregator: q.aggregatorName || q.name || 'Payment Aggregator',
            quoteRate: Number(q.quoteRate || q.baseRate || 0),
          }));
          setQuotes(mapped);
        } catch (err) {
          console.error('Failed to fetch aggregator quotes:', err);
          setQuotes([]);
        } finally {
          setLoading(false);
        }
      };
      fetchQuotes();
    }
  }, [open, applicationData]);

  const lowestQuote = useMemo(() => {
    if (!quotes.length) return null;
    return quotes.reduce((prev, curr) => (prev.quoteRate < curr.quoteRate && prev.quoteRate > 0 ? prev : curr));
  }, [quotes]);

  const handleSubmit = async () => {
    if (!markup || !lowestQuote) return;
    setIsSubmitting(true);
    await onAddMarkup(applicationData.applicationId, {
      selectedAggregatorId: lowestQuote.id,
      markupAdded: markup,
      finalRate: lowestQuote.quoteRate + parseFloat(markup)
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}>
      <DialogTitle
        sx={{
          background: "linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)",
          backgroundColor: "#176FC1",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.8,
          px: 3,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          borderBottom: "3px solid #CE0F3E",
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", color: "#ffffff" }}>
          Analyze Quotes & Add Markup
        </Typography>
        <Box display="flex" alignItems="center" gap={1.5}>
          {applicationData?.applicationId && (
            <Typography
              variant="subtitle2"
              sx={{
                backgroundColor: "rgba(255,255,255,0.15)",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "12px",
                color: "#ffffff",
              }}
            >
              App ID: {applicationData.applicationId}
            </Typography>
          )}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Review the quotes received from aggregators. The lowest and best quote is automatically highlighted. Add bank's markup before sending for Customer Acceptance.
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} />
          </Box>
        ) : quotes.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', color: 'text.secondary', mb: 3 }}>
            <Typography variant="body2">No quotes received yet for this application.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell>Aggregator</TableCell>
                  <TableCell>Received Quote Rate (%)</TableCell>
                  <TableCell align="center">Recommendation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((quote) => {
                  const isLowest = lowestQuote && lowestQuote.id === quote.id;
                  return (
                    <TableRow key={quote.id} hover selected={isLowest}>
                      <TableCell sx={{ fontWeight: isLowest ? 600 : 400 }}>{quote.aggregator}</TableCell>
                      <TableCell>{quote.quoteRate.toFixed(2)}%</TableCell>
                      <TableCell align="center">
                        {isLowest && (
                          <Chip 
                            icon={<StarIcon sx={{ fontSize: 16 }} />} 
                            label="Best & Lowest" 
                            color="success" 
                            size="small" 
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {lowestQuote && (
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="primary.900" gutterBottom>
              Selected Aggregator: {lowestQuote.aggregator} ({lowestQuote.quoteRate.toFixed(2)}%)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <TextField
                size="small"
                label="Bank Markup (%)"
                type="number"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                sx={{ width: '150px', bgcolor: 'background.paper' }}
              />
              <Typography variant="body2" fontWeight={500}>
                Final Rate offered to Customer: {markup ? (lowestQuote.quoteRate + parseFloat(markup)).toFixed(2) : lowestQuote.quoteRate.toFixed(2)}%
              </Typography>
            </Box>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={isSubmitting || !markup}
        >
          {isSubmitting ? 'Processing...' : 'Add Markup & Send to RO'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
