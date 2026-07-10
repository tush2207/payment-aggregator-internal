import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, IconButton, Grid, TextField 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PO_FORM_VALUES } from '&src/constants/PaymentAggregratorConstant';

export default function POFreezeModal({ open, onClose, applicationData, onFinalizePO }) {
  const [poDetails, setPoDetails] = useState({ ...PO_FORM_VALUES });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPoDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onFinalizePO(applicationData.applicationId, poDetails);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Final Approval & Freeze PO Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter the required Purchase Order (PO) details to freeze the application and generate the PO document.
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              label="Branch Name" 
              name="branchName"
              value={poDetails.branchName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              label="Region Name" 
              name="regionName"
              value={poDetails.regionName}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>RCC Contact Details</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              fullWidth 
              size="small" 
              label="Contact Person Name" 
              name="rccContactPersonName"
              value={poDetails.rccContactPersonName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              fullWidth 
              size="small" 
              label="Mobile Number" 
              name="rccMobileNo"
              value={poDetails.rccMobileNo || ''}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField 
              fullWidth 
              size="small" 
              label="Email ID" 
              name="rccMailId"
              value={poDetails.rccMailId}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Authorised Person Details</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              label="Authorised Person Name" 
              name="authorisedPersonName"
              value={poDetails.authorisedPersonName}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField 
              fullWidth 
              size="small" 
              label="Designation" 
              name="authorisedPersonDesignation"
              value={poDetails.authorisedPersonDesignation}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Freezing...' : 'Freeze & Generate PO'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
