import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Alert,
} from '@mui/material';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { PAYMENT_PROJECTIONS } from '&src/constants/PaymentAggregratorConstant';
import useApplicationForm from '&src/hooks/useApplicationForm';
import { isUserAdmin } from '&src/utils';

import MerchantEntityProfileSection from './MerchantEntityProfileSection';
import MerchantContactSection from './MerchantContactSection';
import MerchantIntegrationSection from './MerchantIntegrationSection';
import MerchantProjectionsSection from './MerchantProjectionsSection';
import MerchantDocumentsSection from './MerchantDocumentsSection';
import ApplicationFormActionButtons from './ApplicationFormActionButtons';

/**
 * Main Customer Application Form Component.
 * Modular, theme-driven, decomposed into 5 dedicated domain sections.
 */
export const ApplicationForm = ({
  updateDetails,
  handleClose,
  formClosed,
  fetchAllApplications,
}) => {
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

  const { values, resetForm } = formik;

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = isUserAdmin(userDetails);
  const currentRole = (sessionStorage.getItem('role') || userDetails?.role || userDetails?.LocationType || 'CO').toUpperCase();
  const isBO = currentRole === 'BO';
  const isRO = currentRole === 'RO';
  const isZO = currentRole === 'ZO';
  const isCO = currentRole === 'CO' || currentRole === 'ADMIN';
  const isCOViewOnly = isCO && !isAdmin;

  const approvedByCO = Boolean(updateDetails?.isReviewByCO);
  const isExistingApp = Boolean(updateDetails?.applicationId || values?.applicationId);
  const isAdminViewMode = currentRole === 'ADMIN' || sessionStorage.getItem('adminViewMode') === 'true' || isCOViewOnly;

  // Disabled when reviewing an existing application for audit/higher tiers, view mode, or when already approved by CO
  const disabled = isAdminViewMode || (isExistingApp && isBO && Boolean(updateDetails?.isApplicationSubmittedBR)) || Boolean(approvedByCO);

  // Dynamic Projections Options State
  const [projectionOptions, setProjectionOptions] = useState(() => {
    const existing = values?.projection
      ? values.projection.split('|').filter(Boolean)
      : (updateDetails?.projection ? updateDetails.projection.split('|').filter(Boolean) : []);
    return Array.from(new Set([...PAYMENT_PROJECTIONS, ...existing]));
  });

  useEffect(() => {
    const raw = values?.projection || updateDetails?.projection;
    if (raw) {
      const parsed = typeof raw === 'string'
        ? raw.split('|').map((s) => s.trim()).filter(Boolean)
        : (Array.isArray(raw) ? raw : []);
      if (parsed.length > 0) {
        setProjectionOptions((prev) => Array.from(new Set([...prev, ...parsed])));
      }
    }
  }, [values?.projection, updateDetails?.projection]);

  return (
    <>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={2}>
          {/* Admin View Mode Notice Banner */}
          {isAdminViewMode && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: '8px', bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', py: 0.8 }}>
                <strong>Admin View Mode (Read-Only Audit):</strong> You are reviewing this application in central admin view. Operational actions are restricted to designated office roles.
              </Alert>
            </Grid>
          )}

          {/* Section 1: Customer & Entity Profile */}
          <MerchantEntityProfileSection
            formik={formik}
            disabled={disabled}
          />

          {/* Section 2: Contact & Authorized Coordinates */}
          <MerchantContactSection
            formik={formik}
            disabled={disabled}
          />

          {/* Section 3: Web Portal & Technical Integration */}
          <MerchantIntegrationSection
            formik={formik}
            disabled={disabled}
          />

          {/* Section 4: Commercial Projections & Banking Business */}
          <MerchantProjectionsSection
            formik={formik}
            disabled={disabled}
            projectionOptions={projectionOptions}
            setProjectionOptions={setProjectionOptions}
          />

          {/* Section 5: Compliance & Verification Documents */}
          <MerchantDocumentsSection
            formik={formik}
            updateDetails={updateDetails}
            disabled={disabled}
            formClosed={formClosed}
            isBO={isBO}
            isRO={isRO}
            isZO={isZO}
            isCO={isCO}
            approvedByCO={approvedByCO}
          />

          {/* Workflow Status Alerts & Action Buttons */}
          <ApplicationFormActionButtons
            formik={formik}
            updateDetails={updateDetails}
            consentChecked={consentChecked}
            setConsentChecked={setConsentChecked}
            confirmDialogOpen={confirmDialogOpen}
            setConfirmDialogOpen={setConfirmDialogOpen}
            reason={reason}
            setReason={setReason}
            handleAction={handleAction}
            isLoading={isLoading}
            isBO={isBO}
            isRO={isRO}
            isZO={isZO}
            isCO={isCO}
            isCOViewOnly={isCOViewOnly}
            isExistingApp={isExistingApp}
            resetForm={resetForm}
          />
        </Grid>
      </form>

      {isLoading && <FullScreenLoader />}
    </>
  );
};

export default ApplicationForm;
