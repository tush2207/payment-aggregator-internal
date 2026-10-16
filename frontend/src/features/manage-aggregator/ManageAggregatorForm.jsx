import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  MenuItem,
  FormControl,
  Select,
  alpha,
  useTheme,
} from '@mui/material';
import {
  AccountBalanceRounded,
  ContactMailRounded,
  HubRounded,
  CheckCircleRounded,
  Close,
  RestartAlt,
} from '@mui/icons-material';
import { useFormik } from 'formik';

import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import { EmailField, FormField, MobileNoField, TextAreaField } from '&src/components/form/FormFields';
import TextFieldLabel from '&src/components/Label';
import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import { AGGREGATOR_FORM_VALUES, PAYMENT_PROJECTIONS } from '&src/constants/PaymentAggregratorConstant';
import manageAggregatorServices from '&src/services/manageAggregator';
import { preparePayload } from '&src/utils';
import { aggregatorFormSchema } from '&src/utils/validationSchemas';
import { FormSectionHeader } from '../payment-aggregator/FormSectionHeader';

/**
 * ManageAggregatorForm
 * Bank-standard form matching the Application Form layout & design system.
 */
const ManageAggregatorForm = ({
  updateDetails,
  aggregatorData,
  fetchAllAggregators,
  handleClose,
  onClose,
  onSuccess,
  formClosed,
  isViewOnly = false,
  isViewMode = false,
} = {}) => {
  const theme = useTheme();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setLoading] = useState(false);

  const activeData = updateDetails || aggregatorData || null;
  const isReadOnly = isViewOnly || isViewMode;
  const closeAction = handleClose || onClose;

  const addAndUpdateAggregatorDetails = async (values, { resetForm }) => {
    const isUpdate = Boolean(values?.aggregatorId);
    const payload = {
      ...preparePayload(values),
      status: values.status || 'active',
      ...(isUpdate && { aggregatorId: values.aggregatorId }),
    };

    setLoading(true);
    try {
      const response = isUpdate
        ? await manageAggregatorServices.updateAggregator(values.aggregatorId, payload)
        : await manageAggregatorServices.addAggregator(payload);

      if (response?.status === 200 || response?.status === 201) {
        setLoading(false);
        fetchAllAggregators?.();
        onSuccess?.();
        closeAction?.();
        resetForm();
        successNotification(
          isUpdate
            ? `Aggregator "${values.aggregatorName}" updated successfully`
            : `Aggregator "${values.aggregatorName}" onboarded successfully`
        );
      } else {
        setLoading(false);
        errorNotification(response?.data?.message || 'Operation failed, please try again.');
      }
    } catch (err) {
      setLoading(false);
      console.error('[ERROR] ManageAggregatorForm API Error:', err);
      errorNotification(err?.response?.data?.message || err?.message || 'Something went wrong.');
    }
  };

  const formik = useFormik({
    initialValues: {
      ...AGGREGATOR_FORM_VALUES,
      status: 'active',
    },
    validationSchema: aggregatorFormSchema,
    onSubmit: addAndUpdateAggregatorDetails,
    validateOnBlur: true,
    validateOnChange: true,
  });

  useEffect(() => {
    if (activeData) {
      formik.setValues({
        ...AGGREGATOR_FORM_VALUES,
        status: activeData.status || 'active',
        ...activeData,
      });
    }
  }, [activeData]);

  useEffect(() => {
    if (!formClosed && !activeData) {
      formik.resetForm();
    }
  }, [formClosed, activeData]);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
  } = formik;

  return (
    <Box sx={{ width: '100%' }}>
      {isLoading && <FullScreenLoader />}

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2.2}>
          {/* ══════════════════════════════════════════════════════════════
              SECTION 1: AGGREGATOR & ENTITY PROFILE
              ══════════════════════════════════════════════════════════════ */}
          <FormSectionHeader
            icon={<AccountBalanceRounded sx={{ fontSize: 18 }} />}
            title="1. Aggregator & Entity Profile"
            subtitle="Registered company name, partner operational status, and corporate office address."
          />

          {/* Organization Name */}
          <Grid item xs={12} sm={8}>
            <FormField
              required
              disabled={isReadOnly}
              name="aggregatorName"
              label="Organization Name (Payment Aggregator)"
              placeholder="e.g. Razorpay Software Pvt Ltd"
              value={values.aggregatorName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.aggregatorName && Boolean(errors.aggregatorName)}
              helperText={touched.aggregatorName && errors.aggregatorName}
            />
          </Grid>

          {/* Status Select - with matched TextFieldLabel */}
          <Grid item xs={12} sm={4}>
            <TextFieldLabel label="Partner Status" required />
            <FormControl fullWidth size="small" disabled={isReadOnly}>
              <Select
                name="status"
                value={values.status || 'active'}
                onChange={handleChange}
                onBlur={handleBlur}
                sx={{
                  height: 40,
                  bgcolor: 'background.paper',
                }}
              >
                <MenuItem value="active">Active / Operational</MenuItem>
                <MenuItem value="inactive">Inactive / Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Location / Address */}
          <Grid item xs={12}>
            <TextAreaField
              fullWidth
              required
              disabled={isReadOnly}
              name="location"
              label="Corporate Headquarters Address"
              placeholder="Enter complete office address, city, and state"
              multiline
              rows={2}
              value={values.location}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.location && Boolean(errors.location)}
              helperText={touched.location && errors.location}
            />
          </Grid>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 2: AUTHORIZED CONTACT & COMMUNICATION DETAILS
              ══════════════════════════════════════════════════════════════ */}
          <FormSectionHeader
            icon={<ContactMailRounded sx={{ fontSize: 18 }} />}
            title="2. Authorized Nodal Contact Person"
            subtitle="Designated nodal officer for quotation requests, official RFP dispatch, and partner notifications."
          />

          {/* Contact Person Name */}
          <Grid item xs={12} sm={6}>
            <FormField
              required
              disabled={isReadOnly}
              name="contactPersonName"
              label="Contact Person Name"
              placeholder="e.g. Varun Sharma"
              value={values.contactPersonName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.contactPersonName && Boolean(errors.contactPersonName)}
              helperText={touched.contactPersonName && errors.contactPersonName}
            />
          </Grid>

          {/* Primary Email */}
          <Grid item xs={12} sm={6}>
            <EmailField
              required
              disabled={isReadOnly}
              name="email"
              label="Contact Person Official Email ID"
              placeholder="e.g. partner-desk@aggregator.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
            />
          </Grid>

          {/* Mobile Number */}
          <Grid item xs={12} sm={6}>
            <MobileNoField
              required
              disabled={isReadOnly}
              name="mobileNo"
              label="Contact Mobile / Phone Number"
              placeholder="10-digit mobile number"
              value={values.mobileNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.mobileNo && Boolean(errors.mobileNo)}
              helperText={touched.mobileNo && errors.mobileNo}
            />
          </Grid>

          {/* Alternate Email */}
          <Grid item xs={12} sm={6}>
            <EmailField
              disabled={isReadOnly}
              name="alternateEmail"
              label="Alternate RFQ / Escalation Email (Optional)"
              placeholder="e.g. cbi.quotes@aggregator.com"
              value={values.alternateEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.alternateEmail && Boolean(errors.alternateEmail)}
              helperText={touched.alternateEmail && errors.alternateEmail}
            />
          </Grid>

          {/* ══════════════════════════════════════════════════════════════
              SECTION 3: ENABLED PAYMENT CHANNELS & SERVICES
              ══════════════════════════════════════════════════════════════ */}
          <FormSectionHeader
            icon={<HubRounded sx={{ fontSize: 18 }} />}
            title="3. Supported Payment Services & Modes"
            subtitle="Enabled payment rails, cards, net banking, and alternative payment methods."
          />

          <Grid item xs={12}>
            <AutocompleteDropdown
              disabled={isReadOnly}
              label="Enabled Payment Modes & Channels"
              name="services"
              multiple
              options={PAYMENT_PROJECTIONS}
              value={values?.services ? values?.services?.split('|').filter(Boolean) : []}
              setFieldValue={(event, newValue) => {
                setFieldValue('services', (newValue || []).join('|'));
              }}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
            />
          </Grid>

          {/* ══════════════════════════════════════════════════════════════
              ACTION BUTTONS & FOOTER
              ══════════════════════════════════════════════════════════════ */}
          <Grid item xs={12} sx={{ mt: 1.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={closeAction}
                disabled={isLoading}
                startIcon={<Close />}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, height: 38 }}
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </Button>

              {!isReadOnly && (
                <Stack direction="row" spacing={1.5}>
                  {!activeData?.aggregatorId && (
                    <Button
                      type="button"
                      variant="outlined"
                      color="secondary"
                      onClick={() => resetForm()}
                      disabled={isLoading}
                      startIcon={<RestartAlt />}
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2, height: 38 }}
                    >
                      Reset
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isLoading}
                    startIcon={<CheckCircleRounded />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 800,
                      borderRadius: '8px',
                      px: 3.5,
                      height: 38,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {activeData?.aggregatorId ? 'Update Aggregator' : 'Submit & Onboard Partner'}
                  </Button>
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ManageAggregatorForm;
