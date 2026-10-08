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
              canUpload={isBO && !isExisting && !disabled}
              disabled={disabled || isExisting}
              isSubmitted={isExisting}
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
              canUpload={isBO && !isExisting && !disabled}
              disabled={disabled || isExisting}
              isSubmitted={isExisting}
              name="customerApplicationFile"
              label="Customer Application"
              value={values?.customerApplicationFile}
              setFieldValue={setFieldValue}
              required
              formClosed={formClosed}
            />
          </Grid>

          {/* RH Recommendation */}
          {(isRO || isZO || isCO) && (
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
                formClosed={formClosed}
              />
            </Grid>
          )}

          {/* ZO Recommendation */}
          {(isZO || isCO) && (
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

          {/* Customer Acceptance */}
          {updateDetails?.customerAcceptanceFile && (
            <Grid item xs={12} sm={6}>
              <FileUploadOrView
                appId={updateDetails?.customerAcceptanceFile}
                touched={touched}
                helperText={errors}
                disabled={true}
                isSubmitted={true}
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
