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
  ENTITY_BUSINESS_CATEGORIES,
  CONSENT_TEXT,
  CONSENT_TEXT_FOR_BR,
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
import {
  Add as AddIcon,
  Close as CloseIcon,
  AccountBalanceRounded,
  ContactMailRounded,
  LanguageRounded,
  AssessmentRounded,
  FolderSharedRounded,
} from "@mui/icons-material";
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

const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Grid item xs={12} sx={{ mt: 1.5, mb: 0.5 }}>
    <Box sx={{ pb: 1, borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box sx={{
        width: 30,
        height: 30,
        borderRadius: "8px",
        bgcolor: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#176FC1",
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D" sx={{ fontSize: "0.92rem", lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", display: "block" }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

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
  const currentRole = sessionStorage.getItem('role') || user_role || 'CO';
  const isBO = currentRole === 'BO';
  const isRO = currentRole === 'RO';
  const isZO = currentRole === 'ZO';
  const isCO = currentRole === 'CO' || currentRole === 'ADMIN';

  const approvedByCO = Boolean(updateDetails?.isReviewByCO);
  const isExistingApp = Boolean(updateDetails?.applicationId || values?.applicationId);
  const isAdminViewMode = currentRole === 'ADMIN' || sessionStorage.getItem('adminViewMode') === 'true';

  // Disabled when reviewing an existing application for audit/higher tiers or when already approved by CO
  const disabled = isAdminViewMode || (isExistingApp && isBO && Boolean(updateDetails?.isApplicationSubmittedBR)) || Boolean(approvedByCO);

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
          {/* Admin View Mode Notice Banner */}
          {isAdminViewMode && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: "8px", bgcolor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", py: 0.8 }}>
                🔒 <strong>Admin View Mode (Read-Only Audit):</strong> You are reviewing this application in central admin view. All applications across branches are visible. Operational actions (Submit / Approve / Reject) are restricted to designated office roles.
              </Alert>
            </Grid>
          )}

          {/* ── Section 1: Customer & Entity Profile ── */}
          <FormSectionHeader
            icon={<AccountBalanceRounded sx={{ fontSize: 18 }} />}
            title="1. Customer & Entity Profile"
            subtitle="Customer onboarding category, institution name, Central Bank of India account details, and address."
          />

          {/* User Type */}
          <Grid item xs={12}>
            <RadioGroup
              row
              name="userType"
              value={values?.userType || "existing"}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value === "new") {
                  setFieldValue("accountNo", "");
                  setFieldValue("averageBalance", "");
                  setFieldValue("accountBalanceToday", "");
                  setFieldTouched("accountNo", false, false);
                  setFieldTouched("averageBalance", false, false);
                  setFieldTouched("accountBalanceToday", false, false);
                }
              }}
            >
              <FormControlLabel value="existing" control={<Radio />} label="Existing Customer" disabled={disabled} />
              <FormControlLabel value="new" control={<Radio />} label="New Customer" disabled={disabled} />
            </RadioGroup>

            {/* Informative Guidance Banner */}
            <Box sx={{ mt: 1 }}>
              {values?.userType === "new" ? (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    py: 0.5,
                    px: 1.5,
                    bgcolor: "#f0fdf4",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    "& .MuiAlert-icon": { color: "#16a34a" }
                  }}
                >
                  <strong>New Merchant Onboarding:</strong> Account number is optional. Projections and merchant details can be submitted directly. A Central Bank of India current account will be opened/linked during final sanctioning.
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    py: 0.5,
                    px: 1.5,
                    bgcolor: "#eff6ff",
                    color: "#1e40af",
                    border: "1px solid #bfdbfe",
                    "& .MuiAlert-icon": { color: "#2563eb" }
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
              value={values?.customerName || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              helperText={touched?.customerName && errors?.customerName}
            />
          </Grid>

          {/* Account No */}
          <Grid item xs={12} sm={6}>
            <NumberField
              required={values?.userType !== "new"}
              disabled={disabled}
              name="accountNo"
              label={values?.userType === "new" ? "Account Number (Optional)" : "Account Number"}
              value={values?.accountNo || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched?.accountNo && errors?.accountNo)}
              helperText={touched?.accountNo && errors?.accountNo ? errors?.accountNo : ""}
            />
          </Grid>

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

          {/* Business Category */}
          <Grid item xs={12} sm={6}>
            <AutocompleteDropdown
              name="businessCategory"
              label="Business Category"
              disabled={disabled}
              options={ENTITY_BUSINESS_CATEGORIES}
              value={values?.businessCategory || ""}
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
              value={values?.address || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched?.address && Boolean(errors?.address)}
              helperText={touched?.address && errors?.address}
            />
          </Grid>

          {/* ── Section 2: Contact & Communication Coordinates ── */}
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

          {/* ── Section 3: Web Portal & Technical Integration ── */}
          <FormSectionHeader
            icon={<LanguageRounded sx={{ fontSize: 18 }} />}
            title="3. Web Portal & Technical Integration"
            subtitle="Merchant website, app checkout URL, or host environment for Payment Gateway integration."
          />

          {/* Portal / URL / Integrate With */}
          <Grid item xs={12}>
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

          {/* ── Section 4: Commercial Projections & Banking Business ── */}
          <FormSectionHeader
            icon={<AssessmentRounded sx={{ fontSize: 18 }} />}
            title="4. Commercial Projections & Banking Business"
            subtitle="Channel breakdown, expected transaction volumes, ticket sizes, and deposit relationship."
          />

          {/* Payment Projections - Full Length */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
              <TextFieldLabel label="Payment Projections" required />
              {!disabled && (
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                  onClick={() => setAddProjModalOpen(true)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.74rem",
                    py: 0.2,
                    px: 1,
                    borderRadius: "6px",
                    borderColor: "#176FC1",
                    color: "#176FC1",
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: alpha("#176FC1", 0.08) }
                  }}
                >
                  Add Projection
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
                  ? (Array.isArray(values.projection) ? values.projection : values.projection.split("|").map(s => s.trim()).filter(Boolean))
                  : []
              }
              setFieldValue={(name, newValue) => {
                setFieldValue("projection", Array.isArray(newValue) ? newValue.join("|") : newValue);
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
              value={values?.avgTransactionYearly || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched?.avgTransactionYearly && errors?.avgTransactionYearly)}
              helperText={touched?.avgTransactionYearly && errors?.avgTransactionYearly ? errors?.avgTransactionYearly : ""}
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
              value={values?.avgTransactionSize || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched?.avgTransactionSize && errors?.avgTransactionSize)}
              helperText={touched?.avgTransactionSize && errors?.avgTransactionSize ? errors?.avgTransactionSize : ""}
            />
          </Grid>

          {/* Average Balance */}
          <Grid item xs={12} sm={6}>
            <NumberField
              required={values?.userType !== "new"}
              disabled={disabled}
              name="averageBalance"
              label="Average Balance (Last 6 Months)"
              type="number"
              value={values?.averageBalance || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(values?.userType !== "new" && touched?.averageBalance && errors?.averageBalance)}
              helperText={values?.userType !== "new" && touched?.averageBalance && errors?.averageBalance ? errors?.averageBalance : ""}
            />
          </Grid>

          {/* Account Balance as on Today */}
          <Grid item xs={12} sm={6}>
            <NumberField
              required={values?.userType !== "new"}
              disabled={disabled}
              name="accountBalanceToday"
              label="Account Balance as on Today"
              type="number"
              value={values?.accountBalanceToday || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(values?.userType !== "new" && touched?.accountBalanceToday && errors?.accountBalanceToday)}
              helperText={values?.userType !== "new" && touched?.accountBalanceToday && errors?.accountBalanceToday ? errors?.accountBalanceToday : ""}
            />
          </Grid>

          {/* ── Section 5: Compliance & Verification Documents ── */}
          <FormSectionHeader
            icon={<FolderSharedRounded sx={{ fontSize: 18 }} />}
            title="5. Compliance & Verification Documents"
            subtitle="Mandatory KYC documentation, customer onboarding forms, and internal hierarchy recommendations."
          />

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
            // Case 1: If application is rejected
            const isRejected = updateDetails?.status?.toLowerCase()?.includes('reject') || Boolean(updateDetails?.reasonOfRejection);
            if (isRejected) {
              return (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mb: 1, fontWeight: 600 }}>
                    This application has been rejected. Reason: {updateDetails?.reasonOfRejection || 'Rejected during review'}
                  </Alert>
                </Grid>
              );
            }

            const roApproved = Boolean(updateDetails?.isReviewByRO);
            const zoApproved = Boolean(updateDetails?.isReviewByZO);
            const coApproved = Boolean(updateDetails?.isReviewByCO);

            // Case 2: For existing submitted applications, check hierarchy
            if (isExistingApp) {
              // If Branch Office opens an existing submitted application
              if (isBO) {
                return (
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                      Application has been submitted by Branch. It is currently under review by Regional Office (RO).
                    </Alert>
                  </Grid>
                );
              }

              // If Regional Office (RO)
              if (isRO) {
                if (roApproved) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                        Application has been approved by Regional Office (RO). Currently pending higher tier review.
                      </Alert>
                    </Grid>
                  );
                }
              }

              // If Zonal Office (ZO)
              if (isZO) {
                if (!roApproved) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                        Application Approval is pending with Regional Office (RO). Zonal Office review will unlock after RO approval.
                      </Alert>
                    </Grid>
                  );
                }
                if (zoApproved) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                        Application has been approved by Zonal Office (ZO). Currently pending Central Office review.
                      </Alert>
                    </Grid>
                  );
                }
              }

              // If Central Office (CO) or Admin
              if (isCO) {
                if (coApproved) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                        Application has been approved by Central Office (CO).
                      </Alert>
                    </Grid>
                  );
                }
                if (!roApproved) {
                  return (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                        Application Approval is pending with Regional Office (RO). Central Office review will unlock after RO approval.
                      </Alert>
                    </Grid>
                  );
                }
                // When roApproved is true, CO can directly approve (ZO is optional)!
              }
            }

            // Case 3: Action Buttons (Submit for new application, Approve/Reject for reviewers)
            return (
              <>
                {/* Consent Checkbox */}
                <Grid item xs={12}>
                  <FormControlLabel
                    sx={{ mb: 1 }}
                    control={
                      <Checkbox
                        checked={consentChecked}
                        onChange={(e) => setConsentChecked(e.target.checked)}
                      />
                    }
                    label={isBO || !isExistingApp ? CONSENT_TEXT_FOR_BR : CONSENT_TEXT}
                  />
                  {(isBO || !isExistingApp) && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      <b>Note:</b> Please review all information carefully before submitting. This action is irreversible.
                    </Typography>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12} sm={4} />
                <Grid item xs={6} sm={4}>
                  {!isExistingApp || isBO ? (
                    <Button
                      fullWidth
                      type="button"
                      variant="outlined"
                      onClick={() => resetForm()}
                    >
                      Reset
                    </Button>
                  ) : (
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
                <Grid item xs={6} sm={4}>
                  {!isExistingApp || isBO ? (
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!consentChecked || Boolean(updateDetails?.isReviewByCO)}
                    >
                      Submit
                    </Button>
                  ) : (
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
            );
          })()}


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
