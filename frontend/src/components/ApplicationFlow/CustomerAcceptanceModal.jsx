import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, IconButton, Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function CustomerAcceptanceModal({ open, onClose, applicationData, onSubmitAcceptance }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsSubmitting(true);
    await onSubmitAcceptance(applicationData.applicationId, { file: selectedFile });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Customer Acceptance</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please upload the signed customer acceptance document to proceed with the final approval and PO generation.
        </Typography>
        
        <Box 
          sx={{ 
            border: '2px dashed', 
            borderColor: 'grey.300', 
            borderRadius: 2, 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'grey.50',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'grey.100' }
          }}
          component="label"
        >
          <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="subtitle1" gutterBottom>
            {selectedFile ? selectedFile.name : "Click or drag file to upload"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: PDF, JPG, PNG (Max 5MB)
          </Typography>
          <input
            type="file"
            hidden
            accept=".pdf, image/*"
            onChange={handleFileChange}
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={isSubmitting || !selectedFile}
        >
          {isSubmitting ? 'Uploading...' : 'Submit Acceptance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
