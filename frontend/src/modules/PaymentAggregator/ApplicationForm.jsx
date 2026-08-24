import React, { useState, useEffect } from "react";
import AutocompleteDropdown from "&src/components/AutocompleteDropdown";
import ConfirmationDialogWithReason from "&src/components/Dialog/ConfirmationDialogWithReason";
import FileUploadOrView from "&src/components/FileUploadOrView";
import {
  EmailField,
  FormField,
  MobileNoField,
  NumberField,
  TextAreaField,
} from "&src/components/FormFields";
import TextFieldLabel from "&src/components/Label";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import {
  BUSINESS_CATEGORIES,
  CONSENT_TEXT,
  CONSENT_TEXT_FOR_BR,
  isBO,
  isCO,
  isRO,
  isZO,
  PAYMENT_PROJECTIONS,
  user_role,
} from "&src/constants/PaymentAggregratorConstant";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  alpha,
  TextField,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import useApplicationForm from "&src/hooks/useApplicationForm";

const PROJECTION_PRESETS = [
  "Corporate Net Banking",
  "Wallets & Prepaid Cards",
  "Bharat QR / Dynamic QR",
  "International Cards & Forex",
  "BNPL & EMI Payments",
  "Custom Channel",
];

const ApplicationForm = ({ updateDetails, handleClose, formClosed, fetchAllApplications }) => {
  let message = "";
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const {
    formik,
    isLoading,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleAction,
    reason,
    setReason,
    consentChecked,
    setConsentChecked,
  } = useApplicationForm({ updateDetails, handleClose, formClosed, fetchAllApplications });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, resetForm, setFieldTouched } = formik;
  const approvedByCO = updateDetails?.isReviewByCO;
  const disabled = user_role !== 'CO' && updateDetails?.applicationId || approvedByCO;

  // ── Dynamic Projections Options State ──
  const [projectionOptions, setProjectionOptions] = useState(() => {
    const existing = values?.projection ? values.projection.split("|").filter(Boolean) : (updateDetails?.projection ? updateDetails.projection.split("|").filter(Boolean) : []);
    return Array.from(new Set([...PAYMENT_PROJECTIONS, ...existing]));
  });

  useEffect(() => {
    const raw = values?.projection || updateDetails?.projection;
    if (raw) {
      const parsed = typeof raw === 'string' ? raw.split('|').map(s => s.trim()).filter(Boolean) : (Array.isArray(raw) ? raw : []);
      if (parsed.length > 0) {
        setProjectionOptions(prev => Array.from(new Set([...prev, ...parsed])));
      }
    }
  }, [values?.projection, updateDetails?.projection]);

  const [addProjModalOpen, setAddProjModalOpen] = useState(false);
  const [customProjName, setCustomProjName] = useState("");

  const handleAddProjection = () => {
    const channelName = customProjName.trim();

    if (!channelName) {
      errorNotification("Please enter a projection channel name.");
      return;
    }

    // Add to projection options if not present
    if (!projectionOptions.some(p => p.toLowerCase() === channelName.toLowerCase())) {
      setProjectionOptions(prev => [...prev, channelName]);
    }

    // Immediately select it in the form values
    const currentSelected = values?.projection ? values.projection.split("|").filter(Boolean) : [];
    if (!currentSelected.includes(channelName)) {
      setFieldValue("projection", [...currentSelected, channelName].join("|"));
    }

    setAddProjModalOpen(false);
    setCustomProjName("");
    successNotification(`Added and selected "${channelName}" in payment projections.`);
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* User Type */}
          <Grid item xs={12}>
            <RadioGroup row name="userType" value={values?.userType || "existing"} onChange={handleChange}>
              <FormControlLabel value="existing" control={<Radio />} label="Existing Customer" disabled={disabled} />
            </RadioGroup>
          </Grid>

          {/* Customer Name */}
          <Grid item xs={12} sm={6}>
            <FormField
              required
              disabled={disabled}
              name="customerName"
              label="Name of the customer / Institution"
              value={values?.customerName || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              helperText={touched?.customerName && errors?.customerName}
            />
          </Grid>

          {/* Account No */}
          {values?.userType !== "new" && (
            <Grid item xs={12} sm={6}>
              <NumberField
                required
                disabled={disabled}
                name="accountNo"
                label="Account Number"
                value={values?.accountNo || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched?.accountNo && Boolean(errors?.accountNo)}
                helperText={touched?.accountNo && errors?.accountNo}
              />
            </Grid>
          )}

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <AutocompleteDropdown
              name="category"
              label="Category"
              disabled={disabled}
              options={BUSINESS_CATEGORIES}
              value={values?.category || ""}
              setFieldValue={setFieldValue}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
              required
            />
          </Grid>

          {/* Portal / URL / Integrate With */}
          <Grid item xs={12} sm={6}>
            <FormField
              required
              disabled={disabled}
              name="integrateWith"
              label="Portal / URL / Integrate With"
              value={values?.integrateWith || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.integrateWith && Boolean(errors?.integrateWith)}
              helperText={touched?.integrateWith && errors?.integrateWith}
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <EmailField
              required
              disabled={disabled}
              name="email"
              label="Email"
              value={values?.email || ""}
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
              value={values?.mobileNo || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.mobileNo && Boolean(errors?.mobileNo)}
              helperText={touched?.mobileNo && errors?.mobileNo}
            />
          </Grid>

          {/* Financial Inputs */}
          <Grid item xs={12} sm={6}>
            <NumberField
              required
              disabled={disabled}
              name="averageBalance"
              label="Average Balance (Last 6 Months)"
              type="number"
              value={values?.averageBalance || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.averageBalance && Boolean(errors?.averageBalance)}
              helperText={touched?.averageBalance && errors?.averageBalance}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <NumberField
              required
              disabled={disabled}
              name="accountBalanceToday"
              label="Account Balance as on Today"
              type="number"
              value={values?.accountBalanceToday || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.accountBalanceToday && Boolean(errors?.accountBalanceToday)}
              helperText={touched?.accountBalanceToday && errors?.accountBalanceToday}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <NumberField
              required
              disabled={disabled}
              name="avgTransactionYearly"
              label="Expected No. of Transactions (Yearly)"
              type="number"
              value={values?.avgTransactionYearly || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.avgTransactionYearly && Boolean(errors?.avgTransactionYearly)}
              helperText={touched?.avgTransactionYearly && errors?.avgTransactionYearly}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <NumberField
              required
              disabled={disabled}
              name="avgTransactionSize"
              label="Average Ticket Size"
              type="number"
              value={values?.avgTransactionSize || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.avgTransactionSize && Boolean(errors?.avgTransactionSize)}
              helperText={touched?.avgTransactionSize && errors?.avgTransactionSize}
            />
          </Grid>

          {/* Payment Projections */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <TextFieldLabel label="Payment Projections" required />
              {!disabled && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setAddProjModalOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    py: 0.3,
                    px: 1.2,
                    borderRadius: '6px',
                    borderColor: '#176FC1',
                    color: '#176FC1',
                    '&:hover': { bgcolor: alpha('#176FC1', 0.08) }
                  }}
                >
                  Add New Projection
                </Button>
              )}
            </Box>
            <AutocompleteDropdown
              label=""
              disabled={disabled}
              name="projection"
              multiple
              options={projectionOptions}
              value={
                values?.projection
                  ? (Array.isArray(values.projection) ? values.projection : values.projection.split("|").map(s => s.trim()).filter(Boolean))
                  : []
              }
              setFieldValue={(name, newValue) => {
                setFieldValue('projection', Array.isArray(newValue) ? newValue.join("|") : newValue);
              }}
              setFieldTouched={setFieldTouched}
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
              label="Address"
              multiline
              rows={2}
              value={values?.address || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.address && Boolean(errors?.address)}
              helperText={touched?.address && errors?.address}
            />
          </Grid>

          {/* File Uploads */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FileUploadOrView
                  appId={updateDetails?.kycFile}
                  touched={touched}
                  helperText={errors}
                  canUpload={isBO && !updateDetails?.applicationId && !disabled}
                  disabled={disabled || Boolean(updateDetails?.applicationId)}
                  isSubmitted={Boolean(updateDetails?.applicationId)}
                  name="kycFile"
                  label="KYC Document"
                  value={values?.kycFile}
                  setFieldValue={setFieldValue}
                  required
                  formClosed={formClosed}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadOrView
                  appId={updateDetails?.customerApplicationFile}
                  touched={touched}
                  helperText={errors}
                  canUpload={isBO && !updateDetails?.applicationId && !disabled}
                  disabled={disabled || Boolean(updateDetails?.applicationId)}
                  isSubmitted={Boolean(updateDetails?.applicationId)}
                  name="customerApplicationFile"
                  label="Customer Application"
                  value={values?.customerApplicationFile}
                  setFieldValue={setFieldValue}
                  required
                  formClosed={formClosed}
                />
              </Grid>
              {(isRO || isZO || user_role === "CO") && (
                <Grid item xs={12} sm={6}>
                  <FileUploadOrView
                    appId={updateDetails?.rhRecommendationFile}
                    touched={touched}
                    helperText={errors}
                    canUpload={isRO && !approvedByCO}
                    disabled={approvedByCO}
                    isSubmitted={Boolean(approvedByCO)}
                    name="rhRecommendationFile"
                    label="RH Recommendation"
                    value={values?.rhRecommendationFile}
                    setFieldValue={setFieldValue}
                    // required
                    formClosed={formClosed}
                  />
                </Grid>
              )}
              {(isZO || user_role === "CO") && (
                <Grid item xs={12} sm={6}>
                  <FileUploadOrView
                    appId={updateDetails?.zhRecommendationFile}
                    touched={touched}
                    helperText={errors}
                    canUpload={isZO && !approvedByCO}
                    disabled={approvedByCO}
                    isSubmitted={Boolean(approvedByCO)}
                    name="zhRecommendationFile"
                    label="ZO Recommendation"
                    value={values?.zhRecommendationFile}
                    setFieldValue={setFieldValue}
                    formClosed={formClosed}
                  />
                </Grid>
              )}

              {(isRO || isZO || user_role === "CO") && values?.customerAcceptanceFile && (
                <Grid item xs={12} sm={6}>
                  <FileUploadOrView
                    appId={updateDetails?.customerAcceptanceFile}
                    canUpload={isRO && !approvedByCO}
                    disabled={approvedByCO}
                    isSubmitted={Boolean(approvedByCO)}
                    name="customerAcceptanceFile"
                    label="Customer Acceptance"
                    value={values?.customerAcceptanceFile}
                    setFieldValue={setFieldValue}
                    required
                    direct
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
          {/* Consent + Action Buttons */}
          {(() => {
            let shouldShow = true;
            if (approvedByCO) {
              shouldShow = false;
            }
            if (isBO && updateDetails?.isApplicationSubmittedBR) {
              shouldShow = false;
            }
            if (isRO && updateDetails?.isReviewByRO) {
              shouldShow = false;
            }
            if (isZO && updateDetails?.isReviewByZO && updateDetails?.isReviewByRO) {
              shouldShow = false;
            }
            if ((isCO && updateDetails?.isReviewByCO && updateDetails?.isReviewByRO) || isCO && updateDetails?.isReviewByCO && updateDetails?.isReviewByZO && updateDetails?.isReviewByRO) {
              shouldShow = false;
            }

            if (isZO && updateDetails?.isReviewByRO === null) {
              message = `Application Approval is pending by RO`
              shouldShow = false;
            }

            console.log('shouldShow', shouldShow, updateDetails)
            return shouldShow ? (
              <>
                {/* Consent */}
                {/* {user_role !== "CO" && ( */}
                <Grid item xs={12}>
                  <FormControlLabel
                    sx={{
                      mb: 1
                    }}
                    control={
                      <Checkbox
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                      />
                    }
                    label={isBO ? CONSENT_TEXT_FOR_BR : CONSENT_TEXT}
                  />
                  {isBO && <Typography variant="caption" color='text.secondary'>
                    <b>Note:</b> Please review all Information carefully before submitting. This action is irreversible.
                  </Typography>}
                </Grid>
                {/* )} */}

                {/* Action Buttons */}
                <Grid item xs={4} />
                <Grid item xs={4}>
                  {isBO && !values?.applicationId && (
                    <Button
                      fullWidth
                      type="button"
                      variant="outlined"
                      onClick={() => resetForm()}
                    >
                      Reset
                    </Button>
                  )}
                  {!isBO && (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={!consentChecked}
                    >
                      Reject
                    </Button>
                  )}
                </Grid>
                <Grid item xs={4}>
                  {isBO && (
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={(user_role !== "CO" && !consentChecked)
                        || updateDetails?.isReviewByCO
                      }
                    >
                      Submit
                    </Button>
                  )}
                  {!isBO && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      onClick={() => handleAction(values, "approve")}
                      disabled={!consentChecked}
                    >
                      Approve
                    </Button>
                  )}
                </Grid>
              </>
            ) : null;
          })()}


          {/* Consent */}
          {/* {user_role !== "CO" && (
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} />}
                label={isBO ? CONSENT_TEXT_FOR_BR : CONSENT_TEXT}
              />
            </Grid>
          )} */}

          {/* Action Buttons */}
          {/* <Grid item xs={4} />
          <Grid item xs={4}>
            {isBO && !values?.applicationId && (
              <Button fullWidth type="button" variant="outlined" onClick={() => resetForm()}>
                Reset
              </Button>
            )}
            {(!isBO && user_role !== "CO") && (
              <Button fullWidth variant="outlined" color="error" onClick={() => setConfirmDialogOpen(true)} disabled={!consentChecked}>
                Reject
              </Button>
            )}
          </Grid>
          <Grid item xs={4}>
            {isBO && (
              <Button fullWidth type="submit" variant="contained" color="primary" disabled={!consentChecked}>
                Submit
              </Button>
            )}
            {(!isBO && user_role !== "CO") && (
              <Button fullWidth variant="contained" color="success" onClick={() => handleAction(values, "approve")} disabled={!consentChecked}>
                Approve
              </Button>
            )}
          </Grid> */}
          {message && updateDetails?.isReviewByRO === null && <Grid item xs={12}>
            <Typography align="center" variant="subtitle1" color='error'>
              {message}
            </Typography>
          </Grid>}
        </Grid>

      </form>

      {/* ── Add New Projection Dialog ── */}
      <Dialog
        open={addProjModalOpen}
        onClose={() => setAddProjModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.8,
          }}
        >
          Add New Payment Projection
          <IconButton size="small" onClick={() => setAddProjModalOpen(false)} sx={{ color: '#ffffff' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Projection Channel Name"
            placeholder="e.g. Wallets & Prepaid, Corporate Net Banking, Bharat QR"
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
              }
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

      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={(reason) => handleAction(values, "reject", reason)}
        reason={reason}
        setReason={setReason}
        isLoading={isLoading}
      />

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default ApplicationForm;
