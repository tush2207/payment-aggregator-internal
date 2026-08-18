import React, { useState } from 'react';
import { Button, Typography, Grid, TextField } from '@mui/material';
import { PO_FORM_VALUES } from '&src/constants/PaymentAggregratorConstant';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';

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
    <DialogWithHeader
      open={open}
      onClose={onClose}
      maxWidth="md"
      headerText="Final Approval & Freeze PO Details"
      subHeaderText="Enter the required Purchase Order (PO) details to freeze the application and generate the PO document."
      actions={
        <>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={isSubmitting}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {isSubmitting ? 'Freezing...' : 'Freeze & Generate PO'}
          </Button>
        </>
      }
    >
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
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 700, color: "#0f172a" }}>RCC Contact Details</Typography>
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
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1, fontWeight: 700, color: "#0f172a" }}>Authorised Person Details</Typography>
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
    </DialogWithHeader>
  );
}
