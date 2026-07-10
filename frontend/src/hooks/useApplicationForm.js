import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import {
  APPLICATION_FORM_VALUES,
  user_Id,
  user_role,
  WORK_FLOW_OPTIONS,
} from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import { applicationFormSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";

const useApplicationForm = ({
  updateDetails,
  handleClose,
  fetchAllApplications,
  formClosed,
}) => {
  // ⬇️ Get user details from session storage
  const userDetails = useMemo(() => {
    const stored = sessionStorage.getItem('userDetails');
    return stored && JSON.parse(stored);
  }, []);

  const { branchId, regionId, zoneId } = userDetails || {};

  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // ---------------- FORM HANDLING ----------------
  const formik = useFormik({
    initialValues: APPLICATION_FORM_VALUES,
    validationSchema: applicationFormSchema(user_role),
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      // ✅ Validate before calling API
      await formik.validateForm(values);
      if (Object.keys(formik.errors).length > 0) {
        errorNotification("Please fix the errors before submitting.");
        return;
      }
      await addOrUpdate(values);
    },
  });

  const { values, resetForm, setValues, setFieldError, errors, setFieldTouched } = formik;

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    if (updateDetails) {
      setValues({
        ...APPLICATION_FORM_VALUES,
        ...updateDetails,
      });
    }
  }, [updateDetails]);


  console.log(formClosed, 'formClosed');
  useEffect(() => {
    if (!formClosed) {
      resetForm();
      setConsentChecked(false);
    }
  }, [formClosed]);

  // ---------------- BUSINESS LOGIC ----------------
  const buildPayload = (values) => ({
    ...values,
    totalAnnualTransaction: values?.avgTransactionYearly * values?.avgTransactionSize,
    totalBankCollection: values?.avgTransactionYearly * values?.avgTransactionSize,
    aggregateDepositAmt: values?.avgTransactionYearly * values?.avgTransactionSize,
    createdByBRId: values?.applicationId ? values?.createdByBRId : user_Id,
    branchId: values?.applicationId ? values?.branchId : branchId,
    regionId: values?.applicationId ? values?.regionId : regionId,
    zoneId: values?.applicationId ? values?.zoneId : zoneId
  });

  const addOrUpdate = async (values) => {
    const payload = buildPayload(values);
    const isUpdate = Boolean(values?.applicationId);

    try {
      setIsLoading(true);
      const response = isUpdate
        ? await applicationServices.updateApplication(values?.applicationId, payload)
        : await applicationServices.addApplication(payload);

      if (response?.status === 200 || response?.status === 201) {
        fetchAllApplications();
        handleClose();
        resetForm();
        successNotification(
          isUpdate
            ? "Application updated successfully"
            : "Application added successfully"
        );
      } else {
        errorNotification(
          response?.data?.message || "Operation failed, please try again later."
        );
      }
    } catch (err) {
      errorNotification(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- APPROVE / REJECT ACTION ----------------
  const handleAction = async (values, actionType, reasonOfRejection = "") => {

    // ---- Field-specific validation ----
    // if (user_role === "RO" && !values?.rhRecommendationFile && reasonOfRejection === '') {
    //   setFieldTouched('rhRecommendationFile', true, true)
    //   setFieldError("rhRecommendationFile", "RH Recommendation File is required.");
    //   return;
    // }

    // ---- Continue only if validation passes ----
    const isApprove = actionType === "approve";
    const isReject = actionType === "reject";
    const payload = {};

    if (isReject) payload.reasonOfRejection = reasonOfRejection;

    switch (user_role) {
      case "RO":
        payload.rhRecommendationFile = values?.rhRecommendationFile
        payload.isReviewByRO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_RO
          : WORK_FLOW_OPTIONS.REJECTED_BY_RO;
        payload.approvedByROId = user_Id;
        break;
      case "ZO":
        payload.zhRecommendationFile = values?.zhRecommendationFile
        payload.isReviewByZO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_ZO
          : WORK_FLOW_OPTIONS.REJECTED_BY_ZO;
        payload.approvedByZOId = user_Id;
      case "CO":
        payload.isReviewByCO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_CO
          : WORK_FLOW_OPTIONS.REJECTED_BY_CO;
        payload.approvedByZOId = user_Id;
        break;
      default:
        break;
    }

    try {
      setIsLoading(true);
      const response = await applicationServices.updateApplication(values?.applicationId, payload);

      if (response?.status === 200 || response?.status === 201) {
        fetchAllApplications();
        handleClose();
        resetForm();
        setConfirmDialogOpen(false);
        successNotification(
          isApprove
            ? "Application approved successfully."
            : "Application rejected successfully."
        );
        setConsentChecked(false);
      } else {
        errorNotification(
          response?.data?.message ||
          (isApprove ? "Approval failed. Please try again." : "Rejection failed. Please try again.")
        );
      }
    } catch (err) {
      errorNotification(
        err?.response?.data?.message ||
        (isApprove ? "Something went wrong while approving." : "Something went wrong while rejecting.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formik,
    isLoading,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleAction,
    reason,
    setReason,
    consentChecked,
    setConsentChecked,
  };
};

export default useApplicationForm;
