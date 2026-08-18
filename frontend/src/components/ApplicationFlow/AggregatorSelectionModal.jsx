import React, { useState, useEffect } from 'react';
import { 
  Button, Typography, Box, Checkbox, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';

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
    setSelectedIds(prev => [...prev, newAgg.id]);
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
    <DialogWithHeader
      open={open}
      onClose={onClose}
      maxWidth="md"
      headerText="Select Aggregators for Quotation"
      subHeaderText="Choose the payment aggregators to invite for quote submission."
      icon={GroupsIcon}
      actions={
        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {selectedIds.length} aggregator(s) selected
          </Typography>
          <Box display="flex" gap={1.5}>
            <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary" 
              disabled={isSubmitting || selectedIds.length === 0}
              sx={{ px: 3, fontWeight: 700 }}
            >
              {isSubmitting ? 'Sending...' : 'Send for Quote'}
            </Button>
          </Box>
        </Box>
      }
    >
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', borderColor: '#cbd5e1', overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#0f172a' }}>
              <TableCell padding="checkbox">
                <Checkbox 
                  indeterminate={selectedIds.length > 0 && selectedIds.length < aggregators.length}
                  checked={selectedIds.length === aggregators.length && aggregators.length > 0}
                  onChange={handleSelectAll}
                  sx={{ color: '#ffffff', '&.Mui-checked': { color: '#f6d365' } }}
                />
              </TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>Aggregator Name</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>Supported Services</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {aggregators.map((agg) => (
              <TableRow key={agg.id} hover onClick={() => handleToggle(agg.id)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedIds.includes(agg.id)} onChange={() => handleToggle(agg.id)} />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '11px', color: '#0f172a' }}>{agg.name}</TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#475569' }}>{agg.services}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showAddNew ? (
        <Box sx={{ mt: 2, p: 2, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1} color="#0f172a">Add New Aggregator</Typography>
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
          sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add New Aggregator
        </Button>
      )}
    </DialogWithHeader>
  );
}
