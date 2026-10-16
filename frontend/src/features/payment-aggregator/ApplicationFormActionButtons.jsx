import React from 'react';
import {
  Grid,
  Alert,
  FormControlLabel,
  Checkbox,
  Typography,
  Button,
} from '@mui/material';
import ConfirmationDialogWithReason from '&src/components/Dialog/ConfirmationDialogWithReason';
import { CONSENT_TEXT, CONSENT_TEXT_FOR_BR } from '&src/constants/PaymentAggregratorConstant';

/**
 * Workflow status alert messages, consent checkbox, and dynamic role-based Action Buttons
 */
export const ApplicationFormActionButtons = ({
  formik,
  updateDetails,
  consentChecked,
  setConsentChecked,
  confirmDialogOpen,
  setConfirmDialogOpen,
  reason,
  setReason,
  handleAction,
  isLoading,
  isBO,
  isRO,
  isZO,
  isCO,
  isCOViewOnly,
  isExistingApp,
  resetForm,
}) => {
  const { values } = formik;
  const isRejected = (updateDetails?.status || '').toLowerCase().includes('reject') || Boolean(updateDetails?.reasonOfRejection);
  const roApproved = Boolean(updateDetails?.isReviewByRO);
  const zoApproved = Boolean(updateDetails?.isReviewByZO);
  const coApproved = Boolean(updateDetails?.isReviewByCO);

  return (
    <>
      {/* ── Status Alerts ── */}
      {isRejected && (
        <Grid item xs={12}>
          <Alert severity="error" sx={{ mb: 1, fontWeight: 600 }}>
            This application has been rejected. Reason: {updateDetails?.reasonOfRejection || 'Rejected during review'}
          </Alert>
        </Grid>
      )}

      {isExistingApp && !isRejected && (
        <>
          {isBO && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                {roApproved || coApproved
                  ? "Application has been submitted and is under administrative review."
                  : "Application has been submitted and is currently under review."}
              </Alert>
            </Grid>
          )}

          {isRO && (
            <Grid item xs={12}>
              {roApproved ? (
                <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                  Application has been reviewed and recommended by Regional Office (RO).
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                  Please review the application and compliance documents to proceed with recommendation or rejection.
                </Alert>
              )}
            </Grid>
          )}

          {isZO && (
            <Grid item xs={12}>
              {zoApproved ? (
                <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                  Application has been reviewed and recommended by Zonal Office (ZO).
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                  Please review the application and compliance documents to proceed with recommendation or rejection.
                </Alert>
              )}
            </Grid>
          )}

          {isCO && (
            <Grid item xs={12}>
              {coApproved ? (
                <Alert severity="success" sx={{ mb: 1, fontWeight: 600 }}>
                  Application has been sanctioned and approved by Central Office (CO).
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mb: 1, fontWeight: 600 }}>
                  Please review the application details, aggregator quotations, and commercial terms to proceed with evaluation and sanction.
                </Alert>
              )}
            </Grid>
          )}
        </>
      )}

      {isCOViewOnly && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ borderRadius: '8px', bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', py: 0.8 }}>
            ℹ <strong>View-Only Inspection Mode:</strong> You are reviewing this application in read-only mode. Approval, rejection, and submission actions are restricted to Central Office Admin.
          </Alert>
        </Grid>
      )}

      {/* ── Consent Checkbox & Action Buttons ── */}
      {!isCOViewOnly && (!isExistingApp || (!coApproved && !isRejected && (isRO || isZO || isCO))) && (
        <>
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

          <Grid item xs={12} sm={4} />
          <Grid item xs={6} sm={4}>
            {!isExistingApp || isBO ? (
              <Button fullWidth type="button" variant="outlined" onClick={() => resetForm()}>
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
                onClick={() => handleAction(values, 'approve')}
                disabled={!consentChecked}
              >
                Approve
              </Button>
            )}
          </Grid>
        </>
      )}

      {/* Rejection Confirmation Reason Modal */}
      <ConfirmationDialogWithReason
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={(reasonText) => handleAction(values, 'reject', reasonText)}
        reason={reason}
        setReason={setReason}
        isLoading={isLoading}
      />
    </>
  );
};

export default ApplicationFormActionButtons;
