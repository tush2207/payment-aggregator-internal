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
  Checkbox
} from '@mui/material';

// Dummy aggregators for selection
const AVAILABLE_AGGREGATORS = [
  { id: 1, name: 'PayU' },
  { id: 2, name: 'Razorpay' },
  { id: 3, name: 'BillDesk' },
  { id: 4, name: 'CCAvenue' }
];

const AggregatorSelection = ({ application, userRole, onAddAggregator }) => {
  const [selectedAggregators, setSelectedAggregators] = useState([]);

  const handleToggle = (id) => {
    setSelectedAggregators((prev) => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSendForQuote = () => {
    if (selectedAggregators.length > 0) {
      onAddAggregator(application.applicationId, selectedAggregators);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fff' }}>
      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Select Aggregators for Quotes
      </Typography>
      
      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
            <TableRow>
              <TableCell padding="checkbox">Select</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Aggregator Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {AVAILABLE_AGGREGATORS.map((agg) => (
              <TableRow key={agg.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={selectedAggregators.includes(agg.id)}
                    onChange={() => handleToggle(agg.id)}
                    disabled={userRole !== 'CO'}
                  />
                </TableCell>
                <TableCell>{agg.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {userRole === 'CO' && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            disabled={selectedAggregators.length === 0}
            onClick={handleSendForQuote}
          >
            Send for Quote
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AggregatorSelection;
