import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper
} from '@mui/material';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import { generateProjectionArray, calculateProjectionDetails } from '&src/utils/calculation';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';

const ProjectionModal = ({ open, onClose, applicationDetails, onSubmitProjections }) => {
  const [projections, setProjections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && applicationDetails) {
      const { avgTransactionSize, avgTransactionYearly, aggregateDepositAmt, applicationId } = applicationDetails;
      // Generate default array
      const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
      
      // Calculate full details
      const payload = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly,
        aggregateDepositAmt,
        applicationId,
      });
      
      setProjections(payload);
    }
  }, [open, applicationDetails]);

  const handleFieldChange = (index, field, value) => {
    setProjections(prev => {
      const newProj = [...prev];
      newProj[index] = {
        ...newProj[index],
        [field]: Number(value) || 0
      };
      return newProj;
    });
  };

  const handleSave = async () => {
    if (!applicationDetails?.applicationId) return;
    setIsLoading(true);
    try {
      const success = await onSubmitProjections(applicationDetails.applicationId, projections);
      if (success) {
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogWithHeader
      open={open}
      onClose={onClose}
      headerText="Edit Projection Details"
      maxWidth="md"
    >
      <Box p={2}>
        <Typography variant="body2" color="textSecondary" mb={2}>
          Adjust the transaction value and count for each projection type. The transaction type and share percentages are fixed.
        </Typography>
        
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Transaction Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Share %</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Transaction Count</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Transaction Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projections.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell>{row.transactionType}</TableCell>
                  <TableCell align="center">{row.transactionTypePercent ? `${row.transactionTypePercent}%` : '-'}</TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      variant="outlined"
                      value={row.transactionCount}
                      onChange={(e) => handleFieldChange(index, 'transactionCount', e.target.value)}
                      sx={{ width: 120 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="number"
                      variant="outlined"
                      value={row.transactionValue}
                      onChange={(e) => handleFieldChange(index, 'transactionValue', e.target.value)}
                      sx={{ width: 120 }}
                      inputProps={{ min: 0 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isLoading}>
            Save Projections
          </Button>
        </Box>
      </Box>
    </DialogWithHeader>
  );
};

export default ProjectionModal;
