import { Button, Grid } from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';

import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import { EmailField, FormField, MobileNoField, TextAreaField } from '&src/components/FormFields';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { AGGREGATOR_FORM_VALUES, PAYMENT_PROJECTIONS } from '&src/constants/PaymentAggregratorConstant';
import manageAggregatorServices from '&src/services/manageAggregator';
import { preparePayload } from '&src/utils';
import { aggregatorFormSchema } from '&src/utils/validationSchemas';

const ManageAggregatorForm = ({
  updateDetails,
  fetchAllAggregators,
  handleClose,
  formClosed,
  isViewOnly = false,
} = {}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setLoading] = useState(false);

  const addAndUpdateAggregatorDetails = async (values, { resetForm }) => {
    const isUpdate = Boolean(values?.aggregatorId);
    const payload = {
      ...preparePayload(values),
      ...(isUpdate && { aggregatorId: values.aggregatorId }),
    };
    console.log(payload, 'payloadpayload')
    setLoading(true);
    try {
      const response = isUpdate
        ? await manageAggregatorServices.updateAggregator(values.aggregatorId, payload)
        : await manageAggregatorServices.addAggregator(payload);

      if (response?.status === 200 || response?.status === 201) {
        setLoading(false);
        fetchAllAggregators?.();
        handleClose?.();
        resetForm();
        successNotification(isUpdate ? 'Aggregator updated successfully' : 'Aggregator added successfully');
      } else {
        setLoading(false);
        errorNotification(response?.data?.message || 'Operation failed, please try again later.');
      }
    } catch (err) {
      setLoading(false);
      console.error('[ERROR] API Error:', err);
      errorNotification(err?.response?.data?.message || 'Something went wrong.');
    }
  };

  const formik = useFormik({
    initialValues: AGGREGATOR_FORM_VALUES,
    validationSchema: aggregatorFormSchema,
    onSubmit: addAndUpdateAggregatorDetails,
    validateOnBlur: true,
    validateOnChange: true,
  });

  useEffect(() => {
    if (updateDetails) {
      formik.setValues({
        ...AGGREGATOR_FORM_VALUES,
        ...updateDetails,
      });
    }
  }, [updateDetails]);

  useEffect(() => {
    if (!formClosed) {
      formik.resetForm();
    }
  }, [formClosed]);

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
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Full Name */}
          <Grid item xs={12}>
            <FormField
              required
              disabled={isViewOnly}
              name="aggregatorName"
              label="Organization Name (Aggregator Name)"
              value={values.aggregatorName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.aggregatorName && Boolean(errors.aggregatorName)}
              helperText={touched.aggregatorName && errors.aggregatorName}
            />
          </Grid>

          {/* Contact Person Name */}
          <Grid item xs={12}>
            <FormField
              required
              disabled={isViewOnly}
              name="contactPersonName"
              label="Contact Person Name"
              value={values.contactPersonName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.contactPersonName && Boolean(errors.contactPersonName)}
              helperText={touched.contactPersonName && errors.contactPersonName}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12}>
            <EmailField
              required
              disabled={isViewOnly}
              name="email"
              label="Contact Person Email Id"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
            />
          </Grid>

          {/* Alternate Email */}
          <Grid item xs={12}>
            <EmailField
              disabled={isViewOnly}
              name="alternateEmail"
              label="Alternate Email Id (Optional)"
              value={values.alternateEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.alternateEmail && Boolean(errors.alternateEmail)}
              helperText={touched.alternateEmail && errors.alternateEmail}
            />
          </Grid>

          {/* Mobile Number */}
          <Grid item xs={12}>
            <MobileNoField
              required
              disabled={isViewOnly}
              name="mobileNo"
              label="Mobile Number"
              value={values.mobileNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.mobileNo && Boolean(errors.mobileNo)}
              helperText={touched.mobileNo && errors.mobileNo}
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12}>
            <TextAreaField
              fullWidth
              required
              disabled={isViewOnly}
              name="location"
              label="Address"
              multiline
              rows={2}
              value={values.location}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.location && Boolean(errors.location)}
              helperText={touched.location && errors.location}
            />
          </Grid>
          <Grid item xs={12}>
            <AutocompleteDropdown
              disabled={isViewOnly}
              label="Services"
              name="services"
              multiple
              options={PAYMENT_PROJECTIONS}
              value={values?.services ? values?.services?.split("|") : []}
              setFieldValue={(event, newValue) => {
                setFieldValue('services', newValue?.join("|"));
              }}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
            />
          </Grid>
          {/* Buttons */}
          {isViewOnly ? (
            <Grid item xs={12} display="flex" justifyContent="flex-end" mt={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClose}
                sx={{ px: 4, borderRadius: '8px', textTransform: 'none' }}
              >
                Close
              </Button>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} md={4} />
              <Grid item xs={12} md={4}>
                {!updateDetails?.aggregatorId && (
                  <Button
                    fullWidth
                    type="button"
                    variant="outlined"
                    onClick={() => resetForm()}
                    disabled={isLoading}
                  >
                    Reset
                  </Button>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  Submit
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </form>
      {isLoading && <FullScreenLoader />}

    </>
  );
};

export default ManageAggregatorForm;
