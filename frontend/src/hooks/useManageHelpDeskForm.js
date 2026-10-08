import { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import axios from 'axios';
import { HELP_DESK_FORM_VALUES } from '&src/constants/PaymentAggregratorConstant';
import applicationServices from '&src/services/applications';
import HelpdeskServices from '&src/services/helpdesk';
import { helpDeskFormSchema } from '&src/utils/validationSchemas';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

/**
 * Custom hook encapsulating helpdesk ticket creation, editing,
 * live application autofill, and attachment management.
 */
export const useManageHelpDeskForm = ({ details, isEdit = false, onClose, onRefresh }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const userDetails = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  })();

  const currentRole = userDetails.role || sessionStorage.getItem('role') || 'CO';
  const currentUserName = userDetails.userName || userDetails.name || `${currentRole} Official`;

  const formik = useFormik({
    initialValues: details ? { ...HELP_DESK_FORM_VALUES, ...details } : HELP_DESK_FORM_VALUES,
    validationSchema: helpDeskFormSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const payload = {
          ...values,
          attachments: JSON.stringify(fileList),
          senderRole: currentRole,
          senderName: currentUserName,
        };

        if (isEdit && (details?.ticketId || details?.id)) {
          const id = details.ticketId || details.id;
          await HelpdeskServices.updateTicket(id, payload);
          successNotification('Ticket updated successfully.');
        } else {
          await HelpdeskServices.createTicket(payload);
          successNotification('Ticket created successfully.');
        }

        if (onClose) onClose();
        if (onRefresh) onRefresh();
      } catch (err) {
        errorNotification(err?.response?.data?.message || 'Failed to save ticket.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle Application ID Auto-fill
  const handleAppLookup = async (appId) => {
    if (!appId) return;
    try {
      const res = await applicationServices.getApplicationById(appId);
      const app = res?.data?.data || res?.data || res;
      if (app) {
        formik.setFieldValue('merchantName', app.customerName || '');
        formik.setFieldValue('zoneName', app.zoneName || '');
        formik.setFieldValue('regionName', app.regionName || '');
        formik.setFieldValue('branchName', app.branchName || '');
        formik.setFieldValue('contactNumber', app.mobileNo || app.contactNumber || '');
        formik.setFieldValue('emailId', app.emailId || '');
      }
    } catch (e) {
      console.debug('Application lookup note:', e);
    }
  };

  // Upload attachment
  const handleUploadAttachment = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingFile(true);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.url || res?.data?.fileUrl || URL.createObjectURL(file);
      const newFile = { fileId: Date.now(), fileName: file.name, url, size: file.size };
      setFileList((p) => [...p, newFile]);
      successNotification(`Uploaded ${file.name}`);
    } catch (e) {
      const fallback = { fileId: Date.now(), fileName: file.name, url: URL.createObjectURL(file), size: file.size };
      setFileList((p) => [...p, fallback]);
    } finally {
      setUploadingFile(false);
    }
  };

  // Add comment to ticket
  const handleAddComment = async () => {
    if (!newComment.trim() || !details?.ticketId) return;
    setSendingComment(true);
    try {
      const existing = formik.values.comments || '';
      const entry = `${currentUserName} (${currentRole}): ${newComment.trim()}`;
      const updated = existing ? `${existing} | ${entry}` : entry;

      const id = details.ticketId || details.id;
      await HelpdeskServices.updateTicket(id, { comments: updated });
      formik.setFieldValue('comments', updated);
      setNewComment('');
      successNotification('Message sent.');
    } catch (err) {
      errorNotification('Failed to send message.');
    } finally {
      setSendingComment(false);
    }
  };

  return {
    formik,
    loading,
    fileList,
    setFileList,
    uploadingFile,
    handleUploadAttachment,
    newComment,
    setNewComment,
    sendingComment,
    handleAddComment,
    handleAppLookup,
    currentRole,
    currentUserName,
  };
};

export default useManageHelpDeskForm;
