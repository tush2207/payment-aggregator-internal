import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { PO_FORM_VALUES } from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import { poFormSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useEffect, useState } from "react";

const usePOGenerator = (applicationDetails, setOpenPOModal, openPOModal) => {
  console.log(applicationDetails, 'applicationDetails')
  const { successNotification, errorNotification } = useStatusWiseAlert();
  const [poLoading, setLoading] = useState(false);

  const poFormDetails = useFormik({
    initialValues: PO_FORM_VALUES,
    validationSchema: poFormSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      // ✅ Validate before calling API
      console.log('values', values)
      await poFormDetails.validateForm(values);
      if (Object.keys(poFormDetails.errors)?.length > 0) {
        errorNotification("Please fix the errors before submitting.");
        return;
      }
      await generatePO();
    },
  });
  const { values } = poFormDetails;

  const generatePO = async ({ applicationId, aggregatorId, customerName, isFinalApproved }) => {
    try {
      const currentFinalApproved = (applicationDetails?.isFinalApproved || isFinalApproved) === true
      setLoading(true);

      // Step 1: Update Application Flow
      const updatePayload = {
        ...values,
        isQuoteAcceptReviewByCO: true,
        isFinalApproved: true,
        status: 'completed'
      };

      // if (!currentFinalApproved) {
        await applicationServices.updateApplication(applicationId, updatePayload);
      // }

      // Step 2: Generate PO PDF
      const res = await applicationServices.generatePO(applicationId, aggregatorId, {
        responseType: "blob",
      });
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
      window.location.reload();
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
