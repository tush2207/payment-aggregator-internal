import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import {
  FormField,
  EmailField,
  MobileNoField,
  TextAreaField,
} from '&src/components/form/FormFields';

export const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Grid item xs={12} sx={{ mt: 1, mb: 0.5 }}>
    <Box sx={{ pb: 0.8, borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.2 }}>
      <Box
        sx={(theme) => ({
          width: 30,
          height: 30,
          borderRadius: '8px',
          bgcolor: `${theme.palette.primary.main}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.primary.main,
          flexShrink: 0,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary.dark" sx={{ fontSize: '0.92rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  </Grid>
);

export const HelpDeskTicketFields = ({ formik, onAppLookup }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormField
          name="applicationId"
          label="Application ID"
          placeholder="e.g. APP-1002"
          formik={formik}
          onBlur={() => onAppLookup(formik.values.applicationId)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField
          name="merchantName"
          label="Merchant / Business Name"
          placeholder="e.g. ABC Retail Ltd"
          formik={formik}
          required
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="zoneName" label="Zone" placeholder="e.g. WEST ZONE" formik={formik} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="regionName" label="Region" placeholder="e.g. MUMBAI REGION" formik={formik} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="branchName" label="Branch" placeholder="e.g. CHEMBUR" formik={formik} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <MobileNoField name="contactNumber" label="Contact Mobile" formik={formik} required />
      </Grid>
      <Grid item xs={12} sm={6}>
        <EmailField name="emailId" label="Email Address" formik={formik} required />
      </Grid>
      <Grid item xs={12}>
        <FormField
          name="querySubject"
          label="Query Subject / Title"
          placeholder="e.g. Technical integration inquiry with Aggregator"
          formik={formik}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextAreaField
          name="queryDescription"
          label="Detailed Description"
          placeholder="Type the full issue description or query details..."
          formik={formik}
          rows={3}
          required
        />
      </Grid>
    </Grid>
  );
};

export default HelpDeskTicketFields;
