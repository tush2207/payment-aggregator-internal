import React from 'react';
import { Grid } from '@mui/material';
import { LanguageRounded } from '@mui/icons-material';
import { FormField } from '&src/components/FormFields';
import { FormSectionHeader } from './FormSectionHeader';

/**
 * Section 3: Web Portal & Technical Integration
 */
export const MerchantIntegrationSection = ({ formik, disabled }) => {
  const { values, errors, touched, handleChange, handleBlur } = formik;

  return (
    <>
      <FormSectionHeader
        icon={<LanguageRounded sx={{ fontSize: 18 }} />}
        title="3. Web Portal & Technical Integration"
        subtitle="Merchant website, app checkout URL, or host environment for Payment Gateway integration."
      />

      <Grid item xs={12}>
        <FormField
          required
          disabled={disabled}
          name="integrateWith"
          label="Portal / URL / Integrate With"
          value={values?.integrateWith || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched?.integrateWith && Boolean(errors?.integrateWith)}
          helperText={touched?.integrateWith && errors?.integrateWith}
        />
      </Grid>
    </>
  );
};

export default MerchantIntegrationSection;
