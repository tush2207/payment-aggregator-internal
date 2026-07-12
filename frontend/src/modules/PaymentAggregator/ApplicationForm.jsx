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
} from "@mui/material";
import useApplicationForm from "&src/hooks/useApplicationForm";

const ApplicationForm = ({ updateDetails, handleClose, formClosed, fetchAllApplications }) => {
  let message = "";

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
  const approvedByCO = updateDetails?.isReviewByCO
  const disabled = user_role !== 'CO' && updateDetails?.applicationId || approvedByCO;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* User Type */}
          <Grid item xs={12}>
            <RadioGroup row name="userType" value={values?.userType} onChange={handleChange}>
              <FormControlLabel value="existing" control={<Radio />} label="Existing" disabled={disabled} />
              {/* <FormControlLabel value="new" control={<Radio />} label="New" disabled={disabled} /> */}
            </RadioGroup>
          </Grid>

          {/* Customer Name */}
          <Grid item xs={12}>
            <FormField
              required
              disabled={disabled}
              name="customerName"
              label="Name of the customer / Institution"
              value={values?.customerName}
              onChange={handleChange}
              onBlur={handleBlur}
              helperText={touched?.customerName && errors?.customerName}
            />
          </Grid>

          {/* Account No - only for existing */}
          {values?.userType !== "new" && (
            <Grid item xs={12}>
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
            </Grid>
          )}

          {/* Financial Inputs */}
          {[
            { name: "averageBalance", label: "Average Balance (Last 6 Months)" },
            { name: "accountBalanceToday", label: "Account Balance as on Today" },
            { name: "avgTransactionYearly", label: "Expected No. of Transactions (Yearly)" },
            { name: "avgTransactionSize", label: "Average Ticket Size" },
          ].map((field) => (
            <Grid item xs={12} key={field.name}>
              <NumberField
                required
                disabled={disabled}
                name={field.name}
                label={field.label}
                type="number"
                value={values?.[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched?.[field.name] && Boolean(errors?.[field.name])}
                helperText={touched?.[field.name] && errors?.[field.name]}
              />
            </Grid>
          ))}

          {/* Integrate With */}
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

          {/* Category */}
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

          {/* Projections */}
          <Grid item xs={12}>
            <AutocompleteDropdown
              label="Payment Projections"
              disabled={disabled}
              name="projection"
              multiple
              options={PAYMENT_PROJECTIONS}
              value={values?.projection ? values?.projection?.split("|") : []}
              setFieldValue={(event, newValue) => {
                setFieldValue('projection', newValue?.join("|"));
              }}
              setFieldTouched={setFieldTouched}
              handleBlur={handleBlur}
              touched={touched}
              errors={errors}
              required
            />
          </Grid>

          {/* Contact Details */}
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

          {/* Address */}
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

          {/* File Uploads */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <FileUploadOrView
                appId={updateDetails?.kycFile}
                touched={touched}
                helperText={errors}
                canUpload={isBO}
                name="kycFile"
                label="KYC Document"
                value={values?.kycFile}
                setFieldValue={setFieldValue}
                required
                formClosed={formClosed}
              />
              <FileUploadOrView
                appId={updateDetails?.customerApplicationFile}
                touched={touched}
                helperText={errors}
                canUpload={isBO}
                name="customerApplicationFile"
                label="Customer Application"
                value={values?.customerApplicationFile}
                setFieldValue={setFieldValue}
                required
                formClosed={formClosed}
              />
              {(isRO || isZO || user_role === "CO") && (
                <FileUploadOrView
                  appId={updateDetails?.rhRecommendationFile}
                  touched={touched}
                  helperText={errors}
                  canUpload={isRO && !approvedByCO}
                  name="rhRecommendationFile"
                  label="RH Recommendation"
                  value={values?.rhRecommendationFile}
                  setFieldValue={setFieldValue}
                  // required
                  formClosed={formClosed}
                />
              )}
              {(isZO || user_role === "CO") && (
                <FileUploadOrView
                  appId={updateDetails?.zhRecommendationFile}
                  touched={touched}
                  helperText={errors}
                  canUpload={isZO && !approvedByCO}
                  name="zhRecommendationFile"
                  label="ZO Recommendation"
                  value={values?.zhRecommendationFile}
                  setFieldValue={setFieldValue}
                  formClosed={formClosed}
                />
              )}

              {(isRO || isZO || user_role === "CO") && values?.customerAcceptanceFile && (
                <FileUploadOrView
                  appId={updateDetails?.customerAcceptanceFile}
                  canUpload={isRO && !approvedByCO}
                  name="customerAcceptanceFile"
                  label="Customer Acceptance"
                  value={values?.customerAcceptanceFile}
                  setFieldValue={setFieldValue}
                  required
                  direct
                />
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

      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={(reason) => handleAction(values, "reject", reason)}
        reason={reason}
        setReason={setReason}
        isLoading={isLoading}
      // description="Please confirm rejection and provide reason for rejecting this quotation."
      />

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default ApplicationForm;
