import React from 'react';
import { Grid } from '@mui/material';
import { FolderSharedRounded } from '@mui/icons-material';
import FileUploadOrView from '&src/components/FileUploadOrView';
import { FormSectionHeader } from './FormSectionHeader';

/**
 * Section 5: Compliance & Verification Documents
 */
export const MerchantDocumentsSection = ({
  formik,
  updateDetails,
  disabled,
  formClosed,
  isBO,
  isRO,
  isZO,
  isCO,
  approvedByCO,
}) => {
  const { values, errors, touched, setFieldValue } = formik;
  const isExisting = Boolean(updateDetails?.applicationId);

  // Upload permissions per role:
  // - BO can upload KYC & Customer Application only during new creation.
  // - RO can upload RH Recommendation until approved by CO.
  // - ZO can upload ZH Recommendation until approved by CO.
  // - CO can upload/modify until final approval.
  // - Once approved by CO -> completely locked/disabled for all.
  const canBOUpload = Boolean(isBO && !isExisting && !approvedByCO);
  const canROUpload = Boolean(isRO && !approvedByCO);
  const canZOUpload = Boolean(isZO && !approvedByCO);
  const canCOManageDocs = Boolean(isCO && !approvedByCO);

  return (
    <>
      <FormSectionHeader
        icon={<FolderSharedRounded sx={{ fontSize: 18 }} />}
        title="5. Compliance & Verification Documents"
        subtitle="Mandatory KYC documentation, customer onboarding forms, and internal hierarchy recommendations."
      />

      <Grid item xs={12}>
        <Grid container spacing={2}>
          {/* KYC Document */}
          <Grid item xs={12} sm={6}>
            <FileUploadOrView
              appId={updateDetails?.kycFile}
              touched={touched}
              helperText={errors}
              canUpload={canBOUpload || canCOManageDocs}
              disabled={isExisting || approvedByCO || (!canBOUpload && !isCO)}
              isSubmitted={Boolean(isExisting || approvedByCO || (!canBOUpload && !isCO))}
              name="kycFile"
              label="KYC Document"
              value={values?.kycFile}
              setFieldValue={setFieldValue}
              required
              formClosed={formClosed}
            />
          </Grid>

          {/* Customer Application */}
          <Grid item xs={12} sm={6}>
            <FileUploadOrView
              appId={updateDetails?.customerApplicationFile}
              touched={touched}
              helperText={errors}
              canUpload={canBOUpload || canCOManageDocs}
              disabled={isExisting || approvedByCO || (!canBOUpload && !isCO)}
              isSubmitted={Boolean(isExisting || approvedByCO || (!canBOUpload && !isCO))}
              name="customerApplicationFile"
              label="Customer Application"
              value={values?.customerApplicationFile}
              setFieldValue={setFieldValue}
              required
              formClosed={formClosed}
            />
          </Grid>

          {/* RH Recommendation (RO can upload, ZO & CO can view; CO can manage before approval) */}
          {(isRO || isZO || isCO || Boolean(updateDetails?.rhRecommendationFile)) && (
            <Grid item xs={12} sm={6}>
              <FileUploadOrView
                appId={updateDetails?.rhRecommendationFile}
                touched={touched}
                helperText={errors}
                canUpload={canROUpload || canCOManageDocs}
                disabled={Boolean(approvedByCO || (!isRO && !isCO))}
                isSubmitted={Boolean(approvedByCO || (!isRO && !isCO))}
                name="rhRecommendationFile"
                label="RH Recommendation"
                value={values?.rhRecommendationFile}
                setFieldValue={setFieldValue}
                required={false}
                formClosed={formClosed}
              />
            </Grid>
          )}

          {/* ZO Recommendation (ZO can upload, CO can view/manage before approval) */}
          {(isZO || isCO || Boolean(updateDetails?.zhRecommendationFile)) && (
            <Grid item xs={12} sm={6}>
              <FileUploadOrView
                appId={updateDetails?.zhRecommendationFile}
                touched={touched}
                helperText={errors}
                canUpload={canZOUpload || canCOManageDocs}
                disabled={Boolean(approvedByCO || (!isZO && !isCO))}
                isSubmitted={Boolean(approvedByCO || (!isZO && !isCO))}
                name="zhRecommendationFile"
                label="ZO Recommendation"
                value={values?.zhRecommendationFile}
                setFieldValue={setFieldValue}
                required={false}
                formClosed={formClosed}
              />
            </Grid>
          )}

          {/* Customer Acceptance (View/Download only) */}
          {updateDetails?.customerAcceptanceFile && (
            <Grid item xs={12} sm={6}>
              <FileUploadOrView
                appId={updateDetails?.customerAcceptanceFile}
                touched={touched}
                helperText={errors}
                disabled={true}
                isSubmitted={true}
                canUpload={false}
                name="customerAcceptanceFile"
                label="Customer Acceptance"
                value={values?.customerAcceptanceFile}
                setFieldValue={setFieldValue}
                formClosed={formClosed}
              />
            </Grid>
          )}
        </Grid>
      </Grid>
    </>
  );
};

export default MerchantDocumentsSection;
