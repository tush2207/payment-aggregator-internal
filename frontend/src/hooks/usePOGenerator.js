import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { PO_FORM_VALUES } from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import { poFormSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { closeWorkflowDialog } from "&src/store/applicationFlowSlice";

const usePOGenerator = (applicationDetails, setOpenPOModal, openPOModal) => {
  console.log(applicationDetails, 'applicationDetails')
  const { successNotification, errorNotification } = useStatusWiseAlert();
  const [poLoading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const poFormDetails = useFormik({
    initialValues: PO_FORM_VALUES,
    validationSchema: poFormSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      // ✅ Validate before calling API
      console.log('values', values)
      generatePO({
        applicationId: applicationDetails?.applicationId,
        aggregatorId: applicationDetails?.finalizedAggregatorId,
        customerName: applicationDetails?.customerName,
        isFinalApproved: applicationDetails?.isFinalApproved,
        poDetails: values
      })
    }
  });
  const { values } = poFormDetails;

  const generatePO = async ({ applicationId, aggregatorId, customerName, isFinalApproved, poDetails }) => {
    setLoading(true);
    try {
      const currentFinalApproved = applicationDetails?.isFinalApproved || isFinalApproved;

      if (!currentFinalApproved && poDetails) {
        const updatePayload = {
          ...poDetails,
          isQuoteAcceptReviewByCO: true,
          isFinalApproved: true,
          status: 'completed'
        };
        await applicationServices.updateApplication(applicationId, updatePayload);
      }

      const res = await applicationServices.generatePO(
        applicationId,
        aggregatorId,
        poDetails,
        {
          responseType: "blob",
        }
      );
      setOpenPOModal && setOpenPOModal(false)

      const blob =  new Blob([res?.data],{
        type:'application/vnd.openxmlformats-officedocument.wordprocesssingml.document'
      });
      if (!blob) throw new Error("Invalid file data");
      const poCustomerName = applicationDetails?.customerName || customerName;
      const fileName = `PO for ${poCustomerName}`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      link.download = `${fileName}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      successNotification(`Purchase Order downloaded successfully`);
      // Removed refresh of application details to prevent calling get-single-applications API
      dispatch(closeWorkflowDialog());
    } catch (err) {
      console.error("❌ Error generating PO:", err);
      errorNotification("Failed to generate Purchase Order. Please try again.");
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
