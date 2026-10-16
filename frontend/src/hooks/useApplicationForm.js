import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";
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
  // ⬇ Get user details from session storage
  const userDetails = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('userDetails');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const zoneName =
    userDetails?.zoneName ||
    userDetails?.Zone_Name ||
    userDetails?.zone ||
    (userDetails?.zoneId && userDetails.zoneId !== 0 && userDetails.zoneId !== '00000'
      ? `Zone ${userDetails.zoneId}`
      : '');

  const regionName =
    userDetails?.regionName ||
    userDetails?.Region_Name ||
    userDetails?.region ||
    (userDetails?.regionId && userDetails.regionId !== 0
      ? `Region ${userDetails.regionId}`
      : '');

  const branchName =
    userDetails?.branchName ||
    userDetails?.Branch_Name ||
    userDetails?.branch ||
    (userDetails?.branchId && userDetails.branchId !== 0
      ? `Branch ${userDetails.branchId}`
      : '');

  const branchId = userDetails?.branchId || userDetails?.Locationid || null;
  const regionId = userDetails?.regionId || userDetails?.RegionId || null;
  const zoneId = userDetails?.zoneId || userDetails?.ZoneId || null;
  const currentRole = sessionStorage.getItem('role') || user_role || userDetails?.role || 'CO';

  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // ---------------- FORM HANDLING ----------------
  const formik = useFormik({
    initialValues: APPLICATION_FORM_VALUES,
    validationSchema: applicationFormSchema(currentRole),
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      //  Validate before calling API
      await formik.validateForm(values);
      if (Object.keys(formik.errors).length > 0) {
        errorNotification("Please fix the errors before submitting.");
        return;
      }
      await addOrUpdate(values);
    },
  });

  const { resetForm, setValues } = formik;

  // ---------------- EFFECTS ----------------
  useEffect(() => {
    if (updateDetails) {
      setValues({
        ...APPLICATION_FORM_VALUES,
        ...updateDetails,
        email: updateDetails.email || updateDetails.EMAIL || "",
        mobileNo: updateDetails.mobileNo !== null && updateDetails.mobileNo !== undefined ? String(updateDetails.mobileNo) : "",
        address: updateDetails.address || updateDetails.ADDRESS || "",
        category: updateDetails.category || updateDetails.CATEGORY || "",
        integrateWith: updateDetails.integrateWith || "",
        projection: updateDetails.projection || "",
        customerName: updateDetails.customerName || "",
        accountNo: updateDetails.accountNo !== null && updateDetails.accountNo !== undefined ? String(updateDetails.accountNo) : "",
        averageBalance: updateDetails.averageBalance !== null && updateDetails.averageBalance !== undefined ? String(updateDetails.averageBalance) : "",
        accountBalanceToday: updateDetails.accountBalanceToday !== null && updateDetails.accountBalanceToday !== undefined ? String(updateDetails.accountBalanceToday) : "",
        avgTransactionYearly: updateDetails.avgTransactionYearly !== null && updateDetails.avgTransactionYearly !== undefined ? String(updateDetails.avgTransactionYearly) : "",
        avgTransactionSize: updateDetails.avgTransactionSize !== null && updateDetails.avgTransactionSize !== undefined ? String(updateDetails.avgTransactionSize) : "",
        kycFile: updateDetails.kycFile || null,
        customerApplicationFile: updateDetails.customerApplicationFile || null,
        branchName: updateDetails.branchName || userDetails?.branchName || "",
        regionName: updateDetails.regionName || userDetails?.regionName || "",
        zoneName: updateDetails.zoneName || userDetails?.zoneName || "",
      });
    }
  }, [updateDetails, userDetails]);


  console.log(formClosed, 'formClosed');
  useEffect(() => {
    if (!formClosed) {
      resetForm();
      setConsentChecked(false);
    }
  }, [formClosed]);

  // ---------------- BUSINESS LOGIC ----------------
  const buildPayload = (values) => {
    const yearly = Number(values?.avgTransactionYearly) || 0;
    const size = Number(values?.avgTransactionSize) || 0;
    const calculatedTotal = yearly * size;

    return {
      ...values,
      totalAnnualTransaction: calculatedTotal > 0 ? calculatedTotal : null,
      totalBankCollection: calculatedTotal > 0 ? calculatedTotal : null,
      aggregateDepositAmt: calculatedTotal > 0 ? calculatedTotal : null,
      createdByBRId: values?.applicationId ? values?.createdByBRId : (user_Id || userDetails?.userId || userDetails?.id || userDetails?.employeeId),
      branchId: values?.applicationId ? values?.branchId : (branchId ?? userDetails?.branchId),
      regionId: values?.applicationId ? values?.regionId : (regionId ?? userDetails?.regionId),
      zoneId: values?.applicationId ? values?.zoneId : (zoneId ?? userDetails?.zoneId),
      branchName: values?.branchName || (values?.applicationId ? values?.branchName : branchName) || userDetails?.branchName || "",
      regionName: values?.regionName || (values?.applicationId ? values?.regionName : regionName) || userDetails?.regionName || "",
      zoneName: values?.zoneName || (values?.applicationId ? values?.zoneName : zoneName) || userDetails?.zoneName || "",
    };
  };

  const addOrUpdate = async (values) => {
    const payload = buildPayload(values);
    const isUpdate = Boolean(values?.applicationId);

    try {
      setIsLoading(true);
      const response = isUpdate
        ? await applicationServices.updateApplication(values?.applicationId, payload)
        : await applicationServices.addApplication(payload);

      if (response?.status === 200 || response?.status === 201) {
        fetchAllApplications(response?.data);
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

    switch (currentRole) {
      case "RO":
        payload.rhRecommendationFile = values?.rhRecommendationFile;
        payload.isReviewByRO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_RO
          : WORK_FLOW_OPTIONS.REJECTED_BY_RO;
        payload.approvedByROId = user_Id || userDetails?.userId || userDetails?.id || userDetails?.employeeId;
        break;
      case "ZO":
        payload.zhRecommendationFile = values?.zhRecommendationFile;
        payload.isReviewByZO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_ZO
          : WORK_FLOW_OPTIONS.REJECTED_BY_ZO;
        payload.approvedByZOId = user_Id || userDetails?.userId || userDetails?.id || userDetails?.employeeId;
        break;
      case "CO":
      case "ADMIN":
        // CO can edit any merchant or projection fields before final approval
        Object.assign(payload, buildPayload(values));
        payload.isReviewByCO = isApprove;
        payload.status = isApprove
          ? WORK_FLOW_OPTIONS.APPROVED_BY_CO
          : WORK_FLOW_OPTIONS.REJECTED_BY_CO;
        payload.approvedByCOId = user_Id || userDetails?.userId || userDetails?.id || userDetails?.employeeId;
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
