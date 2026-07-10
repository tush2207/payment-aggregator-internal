import React from 'react';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import usePOGenerator from '&src/hooks/usePOGenerator';

const DownloadPOModal = ({ open, onClose, applicationDetails }) => {
  const { generatePO, isGenerating } = usePOGenerator();

  const handleDownload = () => {
    if (!applicationDetails) return;
    
    // In actual implementation, we might need aggregatorId and other fields
    generatePO({
      applicationId: applicationDetails.applicationId,
      aggregatorId: applicationDetails.finalizedAggregatorId || 101, // Mock
      customerName: applicationDetails.customerName,
      isFinalApproved: applicationDetails.isFinalApproved
    });
    
    onClose();
  };

  return (
    <DialogWithHeader
      open={open}
      onClose={onClose}
      headerText="Purchase Order Details"
      maxWidth="sm"
    >
      <Box p={2}>
        <Typography variant="body1" mb={3}>
          The application for <strong>{applicationDetails?.customerName}</strong> (App ID: {applicationDetails?.applicationId}) has been successfully approved. 
          You can now download the Purchase Order document.
        </Typography>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={onClose} disabled={isGenerating}>
            Close
          </Button>
          <Button variant="contained" onClick={handleDownload} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Download PO'}
          </Button>
        </Box>
      </Box>
    </DialogWithHeader>
  );
};

export default DownloadPOModal;
