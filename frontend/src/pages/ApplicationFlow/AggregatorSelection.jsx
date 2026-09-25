import React, { useState, useEffect } from 'react';
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
  Checkbox,
  CircularProgress
} from '@mui/material';
import manageAggregatorServices from '&src/services/manageAggregator';

const AggregatorSelection = ({ application, userRole, onAddAggregator, aggregators: propAggregators }) => {
  const [aggregators, setAggregators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAggregators, setSelectedAggregators] = useState([]);

  useEffect(() => {
    if (Array.isArray(propAggregators) && propAggregators.length > 0) {
      setAggregators(propAggregators);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await manageAggregatorServices.getAllAggregators();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setAggregators(list.map((a) => ({
          id: a.aggregatorId || a.id,
          name: a.aggregatorName || a.name || 'Aggregator',
        })));
      } catch (e) {
        setAggregators([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [propAggregators]);

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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={26} />
        </Box>
      ) : aggregators.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No registered aggregators available.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f9f9f9' }}>
              <TableRow>
                <TableCell padding="checkbox">Select</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Aggregator Name</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregators.map((agg) => (
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
      )}

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
