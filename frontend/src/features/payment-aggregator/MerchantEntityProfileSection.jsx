import React, { useState } from 'react';
import {
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import { AccountBalanceRounded, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { FormField, NumberField, TextAreaField } from '&src/components/form/FormFields';
import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import TextFieldLabel from '&src/components/Label';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
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
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const [addCatModalOpen, setAddCatModalOpen] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [categoryOptions, setCategoryOptions] = useState(() => {
    const defaultList = BUSINESS_CATEGORIES.filter((c) => c !== 'All');
    if (values?.category && !defaultList.includes(values.category)) {
      return [...defaultList, values.category];
    }
    return defaultList;
  });

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryName.trim();
    if (!trimmed) {
      errorNotification('Please enter a category name.');
      return;
    }

    if (!categoryOptions.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryOptions((prev) => [...prev, trimmed]);
    }

    setFieldValue('category', trimmed);
    setAddCatModalOpen(false);
    setCustomCategoryName('');
    successNotification(`Added and selected category "${trimmed}".`);
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <TextFieldLabel label="Category" required />
          {!disabled && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddIcon sx={{ fontSize: 13 }} />}
              onClick={() => setAddCatModalOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.74rem',
                py: 0.2,
                px: 1,
                borderRadius: '6px',
                borderColor: '#176FC1',
                color: '#176FC1',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: alpha('#176FC1', 0.08) },
              }}
            >
              Add Category
            </Button>
          )}
        </Box>
        <AutocompleteDropdown
          label=""
          name="category"
          disabled={disabled}
          options={categoryOptions}
          creatable={true}
          onNewOptionCreated={(newCat) => {
            setCategoryOptions((prev) => Array.from(new Set([...prev, newCat])));
          }}
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

      {/* ── Add Custom Category Dialog ── */}
      <Dialog
        open={addCatModalOpen}
        onClose={() => setAddCatModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
            backgroundColor: '#176FC1',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1.05rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.8,
            px: 2.5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            borderBottom: '3px solid #CE0F3E',
          }}
        >
          Add New Business Category
          <IconButton
            size="small"
            onClick={() => setAddCatModalOpen(false)}
            sx={{
              color: '#ffffff',
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: '8px',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Category Name"
            placeholder="e.g. Healthcare Devices, EdTech, Fintech Services"
            value={customCategoryName}
            onChange={(e) => setCustomCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomCategory();
              }
            }}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setAddCatModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddCustomCategory}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#176FC1', borderRadius: '6px' }}
          >
            Add & Select
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MerchantEntityProfileSection;
