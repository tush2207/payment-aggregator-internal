import React, { useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';

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
    <DialogWithHeader
      open={open}
      onClose={onClose}
      maxWidth="sm"
      headerText="Customer Acceptance Document"
      subHeaderText="Upload the signed customer acceptance document to proceed with final approval."
      icon={UploadFileIcon}
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting || !selectedFile}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {isSubmitting ? 'Uploading...' : 'Submit Acceptance'}
          </Button>
        </>
      }
    >
      <Box 
        sx={{ 
          border: '2px dashed #cbd5e1', 
          borderRadius: 3, 
          p: 4, 
          textAlign: 'center',
          bgcolor: '#f8fafc',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': { bgcolor: '#f1f5f9', borderColor: '#0f766e' }
        }}
        component="label"
      >
        <UploadFileIcon sx={{ fontSize: 44, color: '#0f766e', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600} color="#0f172a" gutterBottom>
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
    </DialogWithHeader>
  );
}
