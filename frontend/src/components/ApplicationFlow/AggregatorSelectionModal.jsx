import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, IconButton, Box, Checkbox, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

// Mock aggregators for UI demonstration
const INITIAL_MOCK_AGGREGATORS = [
  { id: '1', name: 'BillDesk', services: 'Internet banking, UPI' },
  { id: '2', name: 'Razorpay', services: 'UPI, Credit card, Debit card' },
  { id: '3', name: 'PayU', services: 'Internet banking, Credit card' },
  { id: '4', name: 'CCAvenue', services: 'All' },
];

export default function AggregatorSelectionModal({ open, onClose, applicationData, onSendForQuote }) {
  const [aggregators, setAggregators] = useState([...INITIAL_MOCK_AGGREGATORS]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAggName, setNewAggName] = useState('');
  const [newAggServices, setNewAggServices] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
    }
  }, [open]);

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(aggregators.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleAddNew = () => {
    if (!newAggName.trim()) return;
    const newAgg = {
      id: Date.now().toString(),
      name: newAggName,
      services: newAggServices || 'Various'
    };
    setAggregators(prev => [...prev, newAgg]);
    setSelectedIds(prev => [...prev, newAgg.id]); // auto-select the new one
    setNewAggName('');
    setNewAggServices('');
    setShowAddNew(false);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    await onSendForQuote(applicationData.applicationId, selectedIds);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Select Aggregators for Quotation</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the aggregators you want to invite for quoting on this application.
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    indeterminate={selectedIds.length > 0 && selectedIds.length < aggregators.length}
                    checked={selectedIds.length === aggregators.length && aggregators.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Aggregator Name</TableCell>
                <TableCell>Supported Services</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregators.map((agg) => (
                <TableRow key={agg.id} hover onClick={() => handleToggle(agg.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(agg.id)} onChange={() => handleToggle(agg.id)} />
                  </TableCell>
                  <TableCell fontWeight={500}>{agg.name}</TableCell>
                  <TableCell>{agg.services}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {showAddNew ? (
          <Box sx={{ mt: 2, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
            <Typography variant="subtitle2" mb={1}>Add New Aggregator</Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField 
                size="small" 
                label="Aggregator Name" 
                value={newAggName}
                onChange={(e) => setNewAggName(e.target.value)}
              />
              <TextField 
                size="small" 
                label="Services (Optional)" 
                value={newAggServices}
                onChange={(e) => setNewAggServices(e.target.value)}
              />
              <Button variant="contained" onClick={handleAddNew} disabled={!newAggName.trim()}>
                Add
              </Button>
              <Button variant="text" color="inherit" onClick={() => setShowAddNew(false)}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Button 
            startIcon={<AddIcon />} 
            onClick={() => setShowAddNew(true)} 
            sx={{ mt: 1 }}
          >
            Add New Aggregator
          </Button>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {selectedIds.length} aggregator(s) selected
        </Typography>
        <Box>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting || selectedIds.length === 0}
          >
            {isSubmitting ? 'Sending...' : 'Send for Quote'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
