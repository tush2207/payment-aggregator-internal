import React from 'react';
import { Grid } from '@mui/material';
import { ContactMailRounded } from '@mui/icons-material';
import { EmailField, MobileNoField } from '&src/components/form/FormFields';
import { FormSectionHeader } from './FormSectionHeader';

/**
 * Section 2: Contact & Authorized Coordinates
 */
export const MerchantContactSection = ({ formik, disabled }) => {
  const { values, errors, touched, handleChange, handleBlur } = formik;

  return (
    <>
      <FormSectionHeader
        icon={<ContactMailRounded sx={{ fontSize: 18 }} />}
        title="2. Contact & Authorized Coordinates"
        subtitle="Official contact details for correspondence, commercial quotation dispatches, and operational alerts."
      />

      {/* Email */}
      <Grid item xs={12} sm={6}>
        <EmailField
          required
          disabled={disabled}
          name="email"
          label="Email"
          value={values?.email || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched?.email && Boolean(errors?.email)}
          helperText={touched?.email && errors?.email}
        />
      </Grid>

      {/* Mobile Number */}
      <Grid item xs={12} sm={6}>
        <MobileNoField
          required
          disabled={disabled}
          name="mobileNo"
          label="Mobile Number"
          value={values?.mobileNo || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched?.mobileNo && Boolean(errors?.mobileNo)}
          helperText={touched?.mobileNo && errors?.mobileNo}
        />
      </Grid>
    </>
  );
};

export default MerchantContactSection;
