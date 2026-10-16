import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";
import { PO_FORM_VALUES } from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import { poFormSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { closeWorkflowDialog, fetchApplicationDetails } from "&src/store/applicationFlowSlice";

const usePOGenerator = (applicationDetails, setOpenPOModal, openPOModal) => {
  const { successNotification, errorNotification } = useStatusWiseAlert();
  const [poLoading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const initialValues = {
    branchName: applicationDetails?.branchName || PO_FORM_VALUES.branchName || '',
    regionName: applicationDetails?.regionName || PO_FORM_VALUES.regionName || '',
    rccMailId: applicationDetails?.rccMailId || PO_FORM_VALUES.rccMailId || '',
    rccMobileNo: applicationDetails?.rccMobileNo ? String(applicationDetails.rccMobileNo) : (PO_FORM_VALUES.rccMobileNo || ''),
    rccContactPersonName: applicationDetails?.rccContactPersonName || PO_FORM_VALUES.rccContactPersonName || '',
    authorisedPersonName: applicationDetails?.authorisedPersonName || PO_FORM_VALUES.authorisedPersonName || '',
    authorisedPersonDesignation: applicationDetails?.authorisedPersonDesignation || PO_FORM_VALUES.authorisedPersonDesignation || ''
  };

  const poFormDetails = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: poFormSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      console.log('PO Form Submitting values:', values);
      await generatePO({
        applicationId: applicationDetails?.applicationId,
        aggregatorId: applicationDetails?.finalizedAggregatorId,
        customerName: applicationDetails?.customerName,
        isFinalApproved: applicationDetails?.isFinalApproved,
        poDetails: values
      });
    }
  });

  const generatePO = async ({ applicationId, aggregatorId, customerName, isFinalApproved, poDetails }) => {
    setLoading(true);
    try {
      const targetAppId = applicationId || applicationDetails?.applicationId;
      const targetAggId = aggregatorId || applicationDetails?.finalizedAggregatorId;
      const currentFinalApproved = applicationDetails?.isFinalApproved || isFinalApproved;

      if (!targetAppId) {
        throw new Error("Application ID is missing");
      }

      if (poDetails) {
        const updatePayload = {
          ...poDetails,
          isQuoteAcceptReviewByCO: true,
          isFinalApproved: true,
          status: 'finalapproval'
        };
        await applicationServices.updateApplication(targetAppId, updatePayload);
      }

      const res = await applicationServices.generatePO(
        targetAppId,
        targetAggId || 0,
        poDetails || null,
        {
          responseType: "blob",
        }
      );
      if (setOpenPOModal) setOpenPOModal(false);

      const rawData = res?.data || res;
      const blob = new Blob([rawData], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      if (!blob) throw new Error("Invalid file data");
      const poCustomerName = (applicationDetails?.customerName || customerName || "Merchant").replace(/\s+/g, '_');
      const fileName = `PO_${targetAppId}_${poCustomerName}`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${fileName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      successNotification(`Purchase Order generated successfully. Confirmation emails sent to vendors.`);
      
      // Refresh application details to sync step state
      if (targetAppId) {
        dispatch(fetchApplicationDetails(targetAppId));
      }
      dispatch(closeWorkflowDialog());
    } catch (err) {
      console.error(" Error generating PO:", err);
      errorNotification("Failed to generate Purchase Order. Please check the form fields and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!openPOModal) {
      poFormDetails?.resetForm();
    }
  }, [openPOModal]);

  return {
    poLoading,
    generatePO,
    poFormDetails,
  };
};

export default usePOGenerator;
