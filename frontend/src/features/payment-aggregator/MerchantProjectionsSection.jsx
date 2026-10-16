import React, { useState } from 'react';
import {
  Grid,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  alpha,
} from '@mui/material';
import {
  AssessmentRounded,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { NumberField } from '&src/components/form/FormFields';
import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import TextFieldLabel from '&src/components/Label';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import { FormSectionHeader } from './FormSectionHeader';

/**
 * Section 4: Commercial Projections & Banking Business
 */
export const MerchantProjectionsSection = ({
  formik,
  disabled,
  projectionOptions,
  setProjectionOptions,
}) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched } = formik;
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const [addProjModalOpen, setAddProjModalOpen] = useState(false);
  const [customProjName, setCustomProjName] = useState('');

  const handleAddProjection = () => {
    const channelName = customProjName.trim();
    if (!channelName) {
      errorNotification('Please enter a payment mode name.');
      return;
    }

    if (setProjectionOptions && !projectionOptions.some((p) => p.toLowerCase() === channelName.toLowerCase())) {
      setProjectionOptions((prev) => [...prev, channelName]);
    }

    const currentSelected = values?.projection ? values.projection.split('|').filter(Boolean) : [];
    if (!currentSelected.includes(channelName)) {
      setFieldValue('projection', [...currentSelected, channelName].join('|'));
    }

    setAddProjModalOpen(false);
    setCustomProjName('');
    successNotification(`Added and selected "${channelName}" in payment modes.`);
  };

  return (
    <>
      <FormSectionHeader
        icon={<AssessmentRounded sx={{ fontSize: 18 }} />}
        title="4. Commercial Projections & Banking Business"
        subtitle="Channel breakdown, expected transaction volumes, ticket sizes, and deposit relationship."
      />

      {/* Payment Modes - Full Length */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <TextFieldLabel label="Payment Modes" required />
          {!disabled && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<AddIcon sx={{ fontSize: 13 }} />}
              onClick={() => setAddProjModalOpen(true)}
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
              Add Payment Mode
            </Button>
          )}
        </Box>
        <AutocompleteDropdown
          label=""
          disabled={disabled}
          name="projection"
          multiple
          limitTags={10}
          options={projectionOptions}
          value={
            values?.projection
              ? (Array.isArray(values.projection) ? values.projection : values.projection.split('|').map((s) => s.trim()).filter(Boolean))
              : []
          }
          setFieldValue={(name, newValue) => {
            setFieldValue('projection', Array.isArray(newValue) ? newValue.join('|') : newValue);
          }}
          setFieldTouched={setFieldTouched}
          handleBlur={handleBlur}
          touched={touched}
          errors={errors}
          required
        />
      </Grid>

      {/* Expected No. of Transactions (Yearly) */}
      <Grid item xs={12} sm={6}>
        <NumberField
          required
          disabled={disabled}
          name="avgTransactionYearly"
          label="Expected No. of Transactions (Yearly)"
          type="number"
          value={values?.avgTransactionYearly || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(touched?.avgTransactionYearly && errors?.avgTransactionYearly)}
          helperText={touched?.avgTransactionYearly && errors?.avgTransactionYearly ? errors?.avgTransactionYearly : ''}
        />
      </Grid>

      {/* Average Ticket Size */}
      <Grid item xs={12} sm={6}>
        <NumberField
          required
          disabled={disabled}
          name="avgTransactionSize"
          label="Average Ticket Size"
          type="number"
          value={values?.avgTransactionSize || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(touched?.avgTransactionSize && errors?.avgTransactionSize)}
          helperText={touched?.avgTransactionSize && errors?.avgTransactionSize ? errors?.avgTransactionSize : ''}
        />
      </Grid>

      {/* Average Balance (Last 6 Months) */}
      <Grid item xs={12} sm={6}>
        <NumberField
          required={values?.userType !== 'new'}
          disabled={disabled}
          name="averageBalance"
          label="Average Balance (Last 6 Months)"
          type="number"
          value={values?.averageBalance || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(touched?.averageBalance && errors?.averageBalance)}
          helperText={touched?.averageBalance && errors?.averageBalance ? errors?.averageBalance : ''}
        />
      </Grid>

      {/* Account Balance as on Today */}
      <Grid item xs={12} sm={6}>
        <NumberField
          required={values?.userType !== 'new'}
          disabled={disabled}
          name="accountBalanceToday"
          label="Account Balance as on Today"
          type="number"
          value={values?.accountBalanceToday || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(touched?.accountBalanceToday && errors?.accountBalanceToday)}
          helperText={touched?.accountBalanceToday && errors?.accountBalanceToday ? errors?.accountBalanceToday : ''}
        />
      </Grid>

      {/* ── Add New Payment Mode Dialog ── */}
      <Dialog
        open={addProjModalOpen}
        onClose={() => setAddProjModalOpen(false)}
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
          Add New Payment Mode
          <IconButton
            size="small"
            onClick={() => setAddProjModalOpen(false)}
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
            label="Payment Mode Name"
            placeholder="e.g. Wallets & Prepaid, Corporate Net Banking, Bharat QR, International Cards"
            value={customProjName}
            onChange={(e) => setCustomProjName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddProjection();
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
          <Button onClick={() => setAddProjModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddProjection}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#176FC1', borderRadius: '6px' }}
          >
            Add & Select
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MerchantProjectionsSection;
