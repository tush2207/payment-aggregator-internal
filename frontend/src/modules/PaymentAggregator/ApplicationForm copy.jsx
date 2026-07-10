import AutocompleteDropdown from '&src/components/AutocompleteDropdown';
import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import FileUploadOrView from '&src/components/FileUploadOrView';
import {
  EmailField,
  FormField,
  MobileNoField,
  NumberField,
  TextAreaField
} from '&src/components/FormFields';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { APPLICATION_FORM_VALUES, BUSINESS_CATEGORIES, CONSENT_TEXT, CONSENT_TEXT_FOR_BR, PAYMENT_PROJECTIONS, user_role, WORK_FLOW_OPTIONS } from '&src/constants/PaymentAggregratorConstant';
import applicationServices from '&src/services/applications';
import { applicationFormSchema } from '&src/utils/validationSchemas';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup
} from '@mui/material';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';

const ApplicationForm = ({ updateDetails, handleClose, formClosed, fetchAllApplications }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setShowLoader] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [reason, setReason] = useState('');
  const disabled = updateDetails?.applicationId;

  const addAndUpdateEmployeeDetails = async (values) => {
    const payload = {
      ...values,
      totalAnnualTransaction: values?.avgTransactionYearly * values?.avgTransactionSize,
      totalBankCollection: values?.avgTransactionYearly * values?.avgTransactionSize,
      aggregateDepositAmt: values?.avgTransactionYearly * values?.avgTransactionSize,
      status: 'pending',
      isApplicationSubmittedBR: true,
      isReviewByRO: false,
      isReviewByZO: false,
      isReviewByCO: false,
      isAggregatorAdded: false,
      isQuoteAddedPA: false,
      isQuoteReviewCO: false,
      isMarkUpAddedCO: false,
      isQuoteAcceptRO: false,
      isQuoteAcceptReviewByCO: false,
      isFinalApproved: false,
    };
    const isUpdate = Boolean(values?.applicationId);
    try {
      setShowLoader(true);
      const response = isUpdate
        ? await applicationServices.updateApplication(values?.applicationId, values)
        : await applicationServices.addApplication(payload);

      if (response?.status === 200 || response?.status === 201) {
        fetchAllApplications();

        handleClose();
        resetForm()
        successNotification(isUpdate ? 'Application updated successfully' : 'Application added successfully');
      } else {
        errorNotification(response?.data?.message || "Operation failed, please try again later.");
      }
    } catch (err) {
      errorNotification(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setShowLoader(false);
    }
  };

  const formik = useFormik({
    initialValues: APPLICATION_FORM_VALUES,
    validationSchema: applicationFormSchema,
    onSubmit: addAndUpdateEmployeeDetails,
    validateOnBlur: true,
    validateOnChange: true,
  });

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    resetForm,
  } = formik;

  useEffect(() => {
    if (updateDetails) {
      const newValues = {
        ...APPLICATION_FORM_VALUES,
        ...updateDetails,
      };
      formik.setValues(newValues);
    }
  }, [updateDetails]);

  useEffect(() => {
    if (!formClosed) resetForm();
  }, [formClosed]);

  const handleAction = async (values, actionType, reasonOfRejection = '') => {
    if (!values) return;

    const isApprove = actionType === "approve";
    const isReject = actionType === "reject";

    const payload = { ...values };

    if (isReject) {
      payload.reasonOfRejection = reasonOfRejection; // attach rejection reason
    }

    // Role-based review flags
    switch (user_role) {
      case "RO":
        payload.isReviewByRO = isApprove;
        break;
      case "ZO":
        payload.isReviewByZO = isApprove;
        break;
      default:
        break;
    }

    // Status handling
    if (user_role === "RO") {
      payload.status = isApprove ? WORK_FLOW_OPTIONS.APPROVED_BY_RO
        : WORK_FLOW_OPTIONS.REJECTED_BY_RO;
    }
    if (user_role === "ZO") {
      payload.status = isApprove ? WORK_FLOW_OPTIONS.APPROVED_BY_ZO
        : WORK_FLOW_OPTIONS.REJECTED_BY_ZO;
    }

    const isUpdate = Boolean(values?.applicationId);

    try {
      setShowLoader(true);  // ✅ Loader now works

      const response = await applicationServices.updateApplication(values?.applicationId, payload);

      if (response?.status === 200 || response?.status === 201) {
        fetchAllApplications();
        handleClose();
        resetForm();
        setConfirmDialogOpen(false);

        successNotification(
          isApprove
            ? isUpdate
              ? "Application approved and updated successfully."
              : "Application approved successfully."
            : isUpdate
              ? "Application rejected and updated successfully."
              : "Application rejected successfully."
        );
      } else {
        errorNotification(
          response?.data?.message ||
          (isApprove
            ? "Approval failed. Please check the details and try again."
            : "Rejection failed. Please check the details and try again.")
        );
      }
    } catch (err) {
      errorNotification(
        err?.response?.data?.message ||
        (isApprove
          ? "Something went wrong while approving the application. Please try again."
          : "Something went wrong while rejecting the application. Please try again.")
      );
    } finally {
      setShowLoader(false); // ✅ Loader will always stop
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <RadioGroup
              row
              name="userType"
              value={values?.userType}
              onChange={handleChange}
            >
              <FormControlLabel value="existing" control={<Radio />} label="Existing" disabled={disabled} />
              <FormControlLabel value="new" control={<Radio />} label="New" disabled={disabled} />
            </RadioGroup>
          </Grid>

          <Grid item xs={12}>
            <FormField
              required
              disabled={disabled}
              name="customerName"
              label="Name of the customer / Institution"
              value={values?.customerName}
              onChange={handleChange}
              onBlur={handleBlur}
              // error={touched?.customerName && Boolean(errors?.customerName)}
              helperText={touched?.customerName && errors?.customerName}
            />
          </Grid>

          {values?.userType !== 'new' && <Grid item xs={12}>
            <NumberField
              required
              disabled={disabled}
              name="accountNo"
              label="Account Number"
              value={values?.accountNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.accountNo && Boolean(errors?.accountNo)}
              helperText={touched?.accountNo && errors?.accountNo}
            />
          </Grid>}

          <Grid item xs={12}>
            <NumberField
              required
              disabled={disabled}
              name="averageBalance"
              label="Average Balance (Last 6 Months)"
              type="number"
              value={values?.averageBalance}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.averageBalance && Boolean(errors?.averageBalance)}
              helperText={touched?.averageBalance && errors?.averageBalance}
            />
          </Grid>

          <Grid item xs={12}>
            <NumberField
              required
              disabled={disabled}
              name="accountBalanceToday"
              label="Account Balance as on Today"
              type="number"
              value={values?.accountBalanceToday}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.accountBalanceToday && Boolean(errors?.accountBalanceToday)}
              helperText={touched?.accountBalanceToday && errors?.accountBalanceToday}
            />
          </Grid>

          <Grid item xs={12}>
            <NumberField
              required
              disabled={disabled}
              name="avgTransactionYearly"
              label="Average No. of Transactions (Yearly)"
              type="number"
              value={values?.avgTransactionYearly}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.avgTransactionYearly && Boolean(errors?.avgTransactionYearly)}
              helperText={touched?.avgTransactionYearly && errors?.avgTransactionYearly}
            />
          </Grid>

          <Grid item xs={12}>
            <NumberField
              required
              disabled={disabled}
              name="avgTransactionSize"
              label="Average Ticket Size (Yearly)"
              type="number"
              value={values?.avgTransactionSize}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.avgTransactionSize && Boolean(errors?.avgTransactionSize)}
              helperText={touched?.avgTransactionSize && errors?.avgTransactionSize}
            />
          </Grid>

          <Grid item xs={12}>
            <FormField
              required
              disabled={disabled}
              name="integrateWith"
              label="Portal / URL / Integrate With"
              value={values?.integrateWith}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.integrateWith && Boolean(errors?.integrateWith)}
              helperText={touched?.integrateWith && errors?.integrateWith}
            />
          </Grid>

          <Grid item xs={12}>
            <AutocompleteDropdown
              name="category"
              label="Category"
              disabled={disabled}
              options={BUSINESS_CATEGORIES}
              value={values.category}
              setFieldValue={setFieldValue}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
              required
            />

          </Grid>

          <Grid item xs={12}>
            <AutocompleteDropdown
              label="Payment Projections"
              disabled={disabled}
              name="projection"
              multiple
              options={PAYMENT_PROJECTIONS}
              value={values?.projection}
              setFieldValue={setFieldValue}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <EmailField
              required
              disabled={disabled}
              name="email"
              label="Email"
              value={values?.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.email && Boolean(errors?.email)}
              helperText={touched?.email && errors?.email}
            />
          </Grid>

          <Grid item xs={12}>
            <MobileNoField
              required
              disabled={disabled}
              name="mobileNo"
              label="Mobile Number"
              value={values?.mobileNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.mobileNo && Boolean(errors?.mobileNo)}
              helperText={touched?.mobileNo && errors?.mobileNo}
            />
          </Grid>

          <Grid item xs={12}>
            <TextAreaField
              required
              disabled={disabled}
              name="address"
              label="Address"
              multiline
              rows={2}
              value={values?.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.address && Boolean(errors?.address)}
              helperText={touched?.address && errors?.address}
            />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              < Grid item xs={12}>
                <Grid container spacing={2}>
                  {/* Always show KYC and Customer Application */}
                  <FileUploadOrView
                    canUpload={user_role === 'BR'}
                    name="kycFile"
                    label="KYC Document"
                    value={values?.kycFile}
                    setFieldValue={setFieldValue}
                    required
                  />
                  <FileUploadOrView
                    canUpload={user_role === 'BR'}
                    name="customerApplicationFile"
                    label="Customer Application"
                    value={values?.customerApplicationFile}
                    setFieldValue={setFieldValue}
                    required
                  />

                  {/* RH Recommendation - Only for RO and ZO */}
                  {(user_role == 'RO' || user_role === 'ZO' || user_role === 'CO' || user_role === 'PO') && (
                    <FileUploadOrView
                      canUpload={user_role === 'RO'}
                      name="rhRecommendationFile"
                      label="RH Recommendation"
                      value={values?.rhRecommendationFile}
                      setFieldValue={setFieldValue}
                      required
                    />
                  )}

                  {/* ZO Recommendation - Only for ZO */}
                  {(user_role === 'ZO' || user_role === 'CO' || user_role === 'PO') && (
                    <FileUploadOrView
                      canUpload={user_role === 'ZO'}
                      name="zhRecommendationFile"
                      label="ZO Recommendation"
                      value={values?.zhRecommendationFile}
                      setFieldValue={setFieldValue}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {(user_role !== 'CO') && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                  />
                }
                label={user_role === 'BR' ? CONSENT_TEXT_FOR_BR : CONSENT_TEXT}
              />
            </Grid>
          )}
          <Grid item xs={4} />
          <Grid item xs={4}>

            {user_role === "BR" && !values?.applicationId && (
              <Button
                fullWidth
                type="button"
                variant="outlined"
                onClick={() => resetForm()}
                disabled={(user_role === "RO" || user_role === "ZO") && !consentChecked} // keep earlier rule

              >
                Reset
              </Button>
            )}
            {(user_role !== "BR" && user_role !== "CO") && (
              < Button
                fullWidth
                variant="outlined"
                color="error"
                onClick={() => setConfirmDialogOpen(true)}
                disabled={(user_role === "RO" || user_role === "ZO") && !consentChecked}
              >
                Reject
              </Button>
            )}
          </Grid>
          <Grid item xs={4}>
            {user_role === "BR" && (
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={!consentChecked}   // ✅ disabled until checked

              >
                Submit
              </Button>
            )}
            {(user_role !== "BR" && user_role !== "CO") && (
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={() => handleAction(values, "approve")}
                disabled={(user_role === "RO" || user_role === "ZO") && !consentChecked}
              >
                Approve
              </Button>
            )}
          </Grid>
        </Grid>
      </form >

      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={(reason) => {
          handleAction(values, 'reject', reason);
        }}
        reason={reason}
        setReason={setReason}
        isLoading={isLoading}
      />

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default ApplicationForm;
