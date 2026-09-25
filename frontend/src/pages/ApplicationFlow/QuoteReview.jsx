import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Chip
} from '@mui/material';
import { isRO } from '&src/constants/PaymentAggregratorConstant';

const QuoteReview = ({ application = {}, userRole, onAcceptQuote, onFinalApproval, quotes = [] }) => {
  const [markupRates, setMarkupRates] = useState({});

  const availableQuotes = useMemo(() => {
    if (Array.isArray(quotes) && quotes.length > 0) return quotes;
    if (Array.isArray(application?.aggregators) && application.aggregators.length > 0) return application.aggregators;
    return [];
  }, [quotes, application]);

  const lowestRate = useMemo(() => {
    if (!availableQuotes.length) return null;
    const validRates = availableQuotes.map((q) => Number(q.baseRate || q.quoteRate || 0)).filter((r) => r > 0);
    return validRates.length > 0 ? Math.min(...validRates) : null;
  }, [availableQuotes]);

  const isQuoteAcceptRO = application.isQuoteAcceptRO;
  const isCustomerAccepted = application.customerAcceptanceFile !== null || application.status === 'customeraccepted';
  const isFinalApproved = application.isFinalApproved;

  const handleMarkupChange = (quoteId, value) => {
    setMarkupRates(prev => ({
      ...prev,
      [quoteId]: value
    }));
  };

  const handleAcceptQuote = (quote) => {
    const markup = markupRates[quote.id] || 0;
    const finalRate = quote.baseRate + Number(markup);

    const quoteDetails = {
      quoteId: quote.id,
      aggregatorName: quote.aggregatorName,
      baseRate: quote.baseRate,
      markup: Number(markup),
      finalRate
    };

    onAcceptQuote(quoteDetails);
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fff' }}>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Aggregator Quotes Review
      </Typography>

      {!isFinalApproved && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Aggregator Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Base Rate (%)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Markup (%)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Final Rate (%)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {availableQuotes.map((quote) => {
                const base = Number(quote.baseRate || quote.quoteRate || 0);
                const isLowest = lowestRate !== null && base === lowestRate;
                const markup = markupRates[quote.id || quote.aggregatorId] || 0;
                const finalRate = (base + Number(markup)).toFixed(2);

                return (
                  <TableRow key={quote.id || quote.aggregatorId} hover sx={{ backgroundColor: isLowest ? '#e8f5e9' : 'inherit' }}>
                    <TableCell>
                      {quote.aggregatorName || quote.name} {isLowest && <Chip label="Lowest Quote" size="small" color="success" sx={{ ml: 1, fontSize: '0.65rem', height: 20 }} />}
                    </TableCell>
                    <TableCell>{base}%</TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        variant="outlined"
                        placeholder="0.00"
                        value={markupRates[quote.id] || ''}
                        onChange={(e) => handleMarkupChange(quote.id, e.target.value)}
                        disabled={userRole !== 'RO' || isQuoteAcceptRO}
                        sx={{ width: 100 }}
                        inputProps={{ step: "0.01", min: 0 }}
                      />
                    </TableCell>
                    <TableCell>{finalRate}%</TableCell>
                    <TableCell>
                      {isRO && !isQuoteAcceptRO && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAcceptQuote(quote)}
                        >
                          Accept & Send
                        </Button>
                      )}
                      {isQuoteAcceptRO && (
                        <Typography variant="caption" color="primary" fontWeight={600}>
                          Accepted
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Final Approval Section */}
      {isQuoteAcceptRO && !isFinalApproved && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" mb={1}>
            Quote has been sent to the customer for acceptance.
          </Typography>

          {isRO && (
            <Box display="flex" gap={2} mt={2}>
              <Button
                variant="contained"
                color="success"
                onClick={() => onFinalApproval(true)}
              >
                Mark Customer Accepted (Final Approval)
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => onFinalApproval(false)}
              >
                Reject / Customer Declined
              </Button>
            </Box>
          )}
        </Box>
      )}

      {isFinalApproved && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" color="success.main" fontWeight={600}>
            Application is Final Approved! You can now download the PO from the actions menu.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default QuoteReview;
