import React from 'react';
import {
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
} from '@mui/material';
import { AccountBalanceRounded } from '@mui/icons-material';
import { FormField, NumberField, TextAreaField } from '&src/components/FormFields';
import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import { BUSINESS_CATEGORIES, ENTITY_BUSINESS_CATEGORIES } from '&src/constants/PaymentAggregratorConstant';
import { FormSectionHeader } from './FormSectionHeader';

/**
 * Section 1: Customer & Entity Profile
 */
export const MerchantEntityProfileSection = ({
  formik,
  disabled,
}) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched } = formik;

  return (
    <>
      <FormSectionHeader
        icon={<AccountBalanceRounded sx={{ fontSize: 18 }} />}
        title="1. Customer & Entity Profile"
        subtitle="Customer onboarding category, institution name, Central Bank of India account details, and address."
      />

      {/* User Type Radio Group */}
      <Grid item xs={12}>
        <RadioGroup
          row
          name="userType"
          value={values?.userType || 'existing'}
          onChange={(e) => {
            handleChange(e);
            if (e.target.value === 'new') {
              setFieldValue('accountNo', '');
              setFieldValue('averageBalance', '');
              setFieldValue('accountBalanceToday', '');
              setFieldTouched('accountNo', false, false);
              setFieldTouched('averageBalance', false, false);
              setFieldTouched('accountBalanceToday', false, false);
            }
          }}
        >
          <FormControlLabel value="existing" control={<Radio />} label="Existing Customer" disabled={disabled} />
          <FormControlLabel value="new" control={<Radio />} label="New Customer" disabled={disabled} />
        </RadioGroup>

        {/* Guidance Alert */}
        <Box sx={{ mt: 1 }}>
          {values?.userType === 'new' ? (
            <Alert
              severity="info"
              sx={{
                borderRadius: '8px',
                fontSize: '0.82rem',
                py: 0.5,
                px: 1.5,
                bgcolor: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                '& .MuiAlert-icon': { color: '#16a34a' },
              }}
            >
              <strong>New Merchant Onboarding:</strong> Account number is optional. Projections and merchant details can be submitted directly. A Central Bank of India current account will be opened/linked during final sanctioning.
            </Alert>
          ) : (
            <Alert
              severity="info"
              sx={{
                borderRadius: '8px',
                fontSize: '0.82rem',
                py: 0.5,
                px: 1.5,
                bgcolor: '#eff6ff',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                '& .MuiAlert-icon': { color: '#2563eb' },
              }}
            >
              <strong>Existing Bank Customer:</strong> Account number is mandatory to verify relationship, customer profile, and historical banking balances with Central Bank of India.
            </Alert>
          )}
        </Box>
      </Grid>

      {/* Customer Name */}
      <Grid item xs={12} sm={6}>
        <FormField
          required
          disabled={disabled}
          name="customerName"
          label="Name of the customer / Institution"
          value={values?.customerName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          helperText={touched?.customerName && errors?.customerName}
        />
      </Grid>

      {/* Account No */}
      <Grid item xs={12} sm={6}>
        <NumberField
          required={values?.userType !== 'new'}
          disabled={disabled}
          name="accountNo"
          label={values?.userType === 'new' ? 'Account Number (Optional)' : 'Account Number'}
          value={values?.accountNo || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(touched?.accountNo && errors?.accountNo)}
          helperText={touched?.accountNo && errors?.accountNo ? errors?.accountNo : ''}
        />
      </Grid>

      {/* Category */}
      <Grid item xs={12} sm={6}>
        <AutocompleteDropdown
          name="category"
          label="Category"
          disabled={disabled}
          options={BUSINESS_CATEGORIES}
          value={values?.category || ''}
          setFieldValue={setFieldValue}
          handleBlur={handleBlur}
          touched={touched}
          errors={errors}
          required
        />
      </Grid>

      {/* Business Category */}
      <Grid item xs={12} sm={6}>
        <AutocompleteDropdown
          name="businessCategory"
          label="Business Category"
          disabled={disabled}
          options={ENTITY_BUSINESS_CATEGORIES}
          value={values?.businessCategory || ''}
          setFieldValue={setFieldValue}
          handleBlur={handleBlur}
          touched={touched}
          errors={errors}
          required
        />
      </Grid>

      {/* Address */}
      <Grid item xs={12}>
        <TextAreaField
          required
          disabled={disabled}
          name="address"
          label="Operating Address"
          multiline
          rows={2}
          value={values?.address || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched?.address && Boolean(errors?.address)}
          helperText={touched?.address && errors?.address}
        />
      </Grid>
    </>
  );
};

export default MerchantEntityProfileSection;
