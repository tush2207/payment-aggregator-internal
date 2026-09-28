import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  Stack,
  styled,
  Tooltip,
  Typography,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useFormik } from 'formik';
import axios from 'axios';
import {
  EmailField,
  FormField,
  MobileNoField,
  NumberField,
  TextAreaField,
} from '&src/components/FormFields';
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { HELP_DESK_FORM_VALUES, isCO, isBO, user_Id } from '&src/constants/PaymentAggregratorConstant';
import applicationServices from '&src/services/applications';
import HelpdeskServices from '&src/services/helpdesk';
import { helpDeskFormSchema } from '&src/utils/validationSchemas';
import {
  InfoOutlined,
  VerifiedRounded,
  FolderSharedRounded,
  ContactMailRounded,
  AccountBalanceRounded,
  AttachFileRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  DownloadRounded,
  InsertDriveFileRounded,
  PictureAsPdfRounded,
  ImageRounded,
  TableChartRounded,
  DescriptionRounded,
  FolderZipRounded,
  ChatBubbleOutlineRounded,
  CheckCircleRounded,
} from '@mui/icons-material';

const PriorityChip = styled(Chip)(({ theme }) => ({
  padding: "16px 20px",
  fontSize: "0.9rem",
  borderRadius: "10px",
  fontWeight: 600,
  cursor: "pointer",
  minWidth: "100px",
  justifyContent: "center",
  transition: "0.2s ease",
  border: "1px solid transparent",

  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
  },

  "&.selected": {
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transform: "translateY(-1px)",
    fontWeight: 700,
  }
}));

const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Grid item xs={12} sx={{ mt: 1.5, mb: 0.5 }}>
    <Box sx={{ pb: 1, borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box sx={{
        width: 30,
        height: 30,
        borderRadius: "8px",
        bgcolor: "#eff6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#176FC1",
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D" sx={{ fontSize: "0.92rem", lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem", display: "block" }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  </Grid>
);

export const getFileIconComponent = (fileName) => {
  if (!fileName) return <InsertDriveFileRounded sx={{ fontSize: 20, color: '#64748b' }} />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdfRounded sx={{ fontSize: 20, color: '#ef4444' }} />;
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return <ImageRounded sx={{ fontSize: 20, color: '#3b82f6' }} />;
  if (['xlsx', 'xls', 'csv'].includes(ext)) return <TableChartRounded sx={{ fontSize: 20, color: '#10b981' }} />;
  if (['doc', 'docx'].includes(ext)) return <DescriptionRounded sx={{ fontSize: 20, color: '#2563eb' }} />;
  if (['zip', 'rar', '7z'].includes(ext)) return <FolderZipRounded sx={{ fontSize: 20, color: '#f59e0b' }} />;
  return <InsertDriveFileRounded sx={{ fontSize: 20, color: '#64748b' }} />;
};

const parseAttachmentsList = (details) => {
  if (!details) return [];
  const list = [];
  if (details.attachments) {
    try {
      const parsed = typeof details.attachments === 'string' ? JSON.parse(details.attachments) : details.attachments;
      if (Array.isArray(parsed)) {
        list.push(...parsed);
      }
    } catch (e) {
      console.warn("Failed to parse attachments JSON", e);
    }
  }
  if (list.length === 0 && details.attachmentUrl) {
    list.push({
      fileId: null,
      fileName: details.attachmentName || 'Attachment',
      url: details.attachmentUrl,
      size: null,
    });
  }
  return list;
};

const parseChatMessages = (chatStr) => {
  if (!chatStr) return [];
  return chatStr
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "")
    .map((c) => {
      const firstColon = c.indexOf(":");
      if (firstColon === -1) {
        return { senderLabel: "User", msg: c };
      }
      const label = c.substring(0, firstColon).trim();
      const msg = c.substring(firstColon + 1).trim();
      return { senderLabel: label || "User", msg };
    });
};

const ManageHelpDeskForm = ({ updateDetails, fetchAllTickets, formClosed, handleClose } = {}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attachmentsList, setAttachmentsList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isViewOrEdit = Boolean(updateDetails?.id);
  const disabled = Boolean(updateDetails?.id) && !isCO;

  const formik = useFormik({
    initialValues: HELP_DESK_FORM_VALUES,
    validationSchema: helpDeskFormSchema,
    onSubmit: async (values) => {
      const isUpdate = Boolean(values?.id);
      setLoading(true);
      try {
        const payload = {
          ...values,
          attachments: JSON.stringify(attachmentsList),
          attachmentUrl: attachmentsList.length > 0 ? attachmentsList[0].url : values.attachmentUrl || null,
          attachmentName: attachmentsList.length > 0 ? attachmentsList[0].fileName : values.attachmentName || null,
        };

        const response = isUpdate
          ? await HelpdeskServices.updateHelpdesk(values.id, payload)
          : await HelpdeskServices.addHelpdesk(payload);

        if (response?.status === 200 || response?.status === 201) {
          setLoading(false);
          fetchAllTickets?.();
          resetForm();
          successNotification(isUpdate ? 'Ticket updated successfully' : 'Ticket submitted successfully');
          handleClose?.();
        } else {
          setLoading(false);
          errorNotification(response?.data?.message || 'Operation failed, please try again later.');
        }
      } catch (err) {
        setLoading(false);
        console.error('[ERROR] API Error:', err);
        errorNotification(err?.response?.data?.message || 'Something went wrong.');
      }
    },
    validateOnBlur: true,
    validateOnChange: true,
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, setFieldValue } = formik;

  useEffect(() => {
    if (updateDetails) {
      formik.setValues({
        ...HELP_DESK_FORM_VALUES,
        ...updateDetails,
        priority: updateDetails.priority ? updateDetails.priority.toLowerCase() : 'low',
      });
      setAttachmentsList(parseAttachmentsList(updateDetails));
      setVerified(Boolean(updateDetails.applicationNo));
    } else {
      setAttachmentsList([]);
      setVerified(false);
    }
  }, [updateDetails]);

  useEffect(() => {
    if (!formClosed) {
      formik.resetForm();
      setVerified(false);
      setAttachmentsList([]);
    }
  }, [formClosed]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      const token = sessionStorage.getItem("accessToken");
      const uploadedResults = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post("/api/files/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res?.data?.fileId) {
          uploadedResults.push({
            fileId: res.data.fileId,
            fileName: file.name,
            url: `/api/files/download/${res.data.fileId}`,
            size: file.size,
          });
        }
      }

      setAttachmentsList((prev) => [...prev, ...uploadedResults]);
      successNotification(`Uploaded ${uploadedResults.length} file(s) successfully.`);
    } catch (err) {
      console.error("File upload error:", err);
      errorNotification("Failed to upload attachment(s).");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (indexToRemove) => {
    setAttachmentsList((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const fetchAllApplicationDetails = async () => {
    if (!values.applicationNo) {
      return errorNotification('Application Number is required to fetch details.');
    }
    setLoading(true);
    try {
      const response = await applicationServices.getApplicationById(values.applicationNo);
      if (response?.data) {
        const { customerName, mobileNo, email, accountNo, branchName, regionName, zoneName } = response.data;
        formik.setValues({
          ...values,
          customerName: customerName || '',
          customerEmail: email || '',
          customerMobileNo: mobileNo || '',
          accountNo: accountNo || '',
          branchName: branchName || values.branchName || '',
          regionName: regionName || values.regionName || '',
          zoneName: zoneName || values.zoneName || '',
        });
        setVerified(true);
        successNotification('Application details fetched and autofilled successfully.');
      } else {
        setVerified(false);
        errorNotification("Invalid Application Number. Please verify and try again.");
      }
    } catch (err) {
      console.error('[ERROR] API Error:', err);
      setVerified(false);
      errorNotification("Invalid Application Number or failed to load details.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        status: newStatus,
        attachments: JSON.stringify(attachmentsList),
      };
      const response = await HelpdeskServices.updateHelpdesk(values.id, payload);
      if (response?.status === 200 || response?.status === 201) {
        successNotification(`Status updated to ${newStatus}`);
        fetchAllTickets?.();
        handleClose?.();
      }
    } catch (err) {
      console.error("Status update error:", err);
      errorNotification("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const chats = parseChatMessages(updateDetails?.chats);

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {isLoading && <FullScreenLoader />}
        <Grid container spacing={2.5} sx={{ p: 1 }}>

          {/* ── SECTION 1: APPLICATION & TICKET OVERVIEW ── */}
          <FormSectionHeader
            icon={<FolderSharedRounded sx={{ fontSize: 18 }} />}
            title="Application & Ticket Overview"
            subtitle="Core identification and details for this query"
          />

          <Grid item xs={12} md={isViewOrEdit ? 12 : 8}>
            <NumberField
              required
              name="applicationNo"
              label="Application Number"
              value={values.applicationNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.applicationNo && Boolean(errors.applicationNo)}
              helperText={touched.applicationNo && errors.applicationNo}
              disabled={disabled}
            />
          </Grid>

          {!isViewOrEdit && (
            <Grid item xs={12} md={4}>
              <Box height="100%" display="flex" alignItems="center" gap={1.5} pt={2}>
                {verified ? (
                  <Chip
                    icon={<VerifiedRounded sx={{ color: '#16a34a !important' }} />}
                    label="Application Verified"
                    sx={{
                      bgcolor: '#f0fdf4',
                      color: '#16a34a',
                      fontWeight: 700,
                      borderColor: '#bbf7d0',
                      border: '1px solid',
                      height: 38,
                      px: 1,
                    }}
                  />
                ) : (
                  <>
                    <Button
                      color="primary"
                      variant="outlined"
                      fullWidth
                      onClick={fetchAllApplicationDetails}
                      sx={{ height: 40, fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
                    >
                      Verify & Fetch
                    </Button>
                    <Tooltip
                      title={
                        <Typography variant="caption">
                          Click <b>Verify & Fetch</b> to autofill merchant information directly from the application records.
                        </Typography>
                      }
                      placement="top"
                      arrow
                    >
                      <IconButton color="primary" size="small">
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={12}>
            <FormField
              required
              name="ticketName"
              label="Query / Issue Title"
              disabled={disabled}
              value={values.ticketName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.ticketName && Boolean(errors.ticketName)}
              helperText={touched.ticketName && errors.ticketName}
            />
          </Grid>

          <Grid item xs={12} md={12}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              PRIORITY LEVEL *
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <PriorityChip
                disabled={disabled}
                label="Low"
                onClick={() => setFieldValue("priority", "low")}
                className={values.priority === "low" ? "selected" : ""}
                sx={{
                  background: values.priority === "low"
                    ? "linear-gradient(45deg,#4caf50,#2e7d32)"
                    : "#e8f5e9",
                  color: values.priority === "low" ? "#fff" : "#2e7d32",
                }}
              />

              <PriorityChip
                disabled={disabled}
                label="Medium"
                onClick={() => setFieldValue("priority", "medium")}
                className={values.priority === "medium" ? "selected" : ""}
                sx={{
                  background: values.priority === "medium"
                    ? "linear-gradient(45deg,#2196f3,#1565c0)"
                    : "#e3f2fd",
                  color: values.priority === "medium" ? "#fff" : "#1565c0",
                }}
              />

              <PriorityChip
                disabled={disabled}
                label="High"
                onClick={() => setFieldValue("priority", "high")}
                className={values.priority === "high" ? "selected" : ""}
                sx={{
                  background: values.priority === "high"
                    ? "linear-gradient(45deg,#f44336,#b71c1c)"
                    : "#ffebee",
                  color: values.priority === "high" ? "#fff" : "#b71c1c",
                }}
              />
            </Stack>
            {touched.priority && errors.priority && (
              <Typography color="error" variant="caption">
                {errors.priority}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={12}>
            <TextAreaField
              required
              disabled={disabled}
              name="description"
              label="Query Description & Details"
              multiline
              rows={3}
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.description && Boolean(errors.description)}
              helperText={touched.description && errors.description}
            />
          </Grid>

          {/* ── SECTION 2: CUSTOMER INFORMATION ── */}
          <FormSectionHeader
            icon={<ContactMailRounded sx={{ fontSize: 18 }} />}
            title="Customer & Merchant Details"
            subtitle="Merchant contact and account credentials"
          />

          <Grid item xs={12} md={6}>
            <FormField
              required
              disabled={disabled}
              name="customerName"
              label="Name of Customer / Institution"
              value={values.customerName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.customerName && Boolean(errors.customerName)}
              helperText={touched.customerName && errors.customerName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <NumberField
              disabled={disabled}
              name="accountNo"
              label="Account Number (Optional)"
              value={values.accountNo || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.accountNo && Boolean(errors.accountNo)}
              helperText={touched.accountNo && errors.accountNo}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <EmailField
              required
              disabled={disabled}
              name="customerEmail"
              label="Customer Email"
              value={values.customerEmail}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.customerEmail && Boolean(errors.customerEmail)}
              helperText={touched.customerEmail && errors.customerEmail}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <MobileNoField
              required
              disabled={disabled}
              name="customerMobileNo"
              label="Customer Mobile Number"
              value={values.customerMobileNo}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.customerMobileNo && Boolean(errors.customerMobileNo)}
              helperText={touched.customerMobileNo && errors.customerMobileNo}
            />
          </Grid>

          {/* ── SECTION 3: OFFICE & BRANCH DETAILS ── */}
          <FormSectionHeader
            icon={<AccountBalanceRounded sx={{ fontSize: 18 }} />}
            title="Office & Routing Details"
            subtitle="Branch, Region, and Zone hierarchy"
          />

          <Grid item xs={12} md={4}>
            <FormField
              required
              disabled={disabled}
              name="branchName"
              label="Branch Name"
              value={values.branchName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.branchName && Boolean(errors.branchName)}
              helperText={touched.branchName && errors.branchName}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormField
              required
              disabled={disabled}
              name="regionName"
              label="Region Name"
              value={values.regionName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.regionName && Boolean(errors.regionName)}
              helperText={touched.regionName && errors.regionName}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormField
              required
              disabled={disabled}
              name="zoneName"
              label="Zone Name"
              value={values.zoneName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.zoneName && Boolean(errors.zoneName)}
              helperText={touched.zoneName && errors.zoneName}
            />
          </Grid>

          {/* ── SECTION 4: ATTACHMENTS & SUPPORTING DOCUMENTS ── */}
          <FormSectionHeader
            icon={<AttachFileRounded sx={{ fontSize: 18 }} />}
            title="Attachments & Supporting Documents"
            subtitle="Uploaded files, screenshots, and reference documents"
          />

          <Grid item xs={12}>
            {/* Display list of attachments */}
            {attachmentsList.length > 0 ? (
              <Stack spacing={1.2} sx={{ mb: 2 }}>
                {attachmentsList.map((file, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: '#f8fafc',
                      borderColor: '#e2e8f0',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                      <Box sx={{ flexShrink: 0 }}>
                        {getFileIconComponent(file.fileName)}
                      </Box>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Tooltip title={file.fileName || 'Attachment'} arrow placement="top">
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              color: '#0f172a',
                              fontSize: '13px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {file.fileName || 'Supporting Document'}
                          </Typography>
                        </Tooltip>
                        {file.size && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {file.url && (
                        <Tooltip title={`Download ${file.fileName}`} arrow>
                          <Button
                            size="small"
                            variant="outlined"
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={file.fileName || 'attachment'}
                            startIcon={<DownloadRounded sx={{ fontSize: 14 }} />}
                            sx={{
                              textTransform: 'none',
                              fontSize: '12px',
                              py: 0.4,
                              px: 1.2,
                              borderRadius: '6px',
                            }}
                          >
                            Download
                          </Button>
                        </Tooltip>
                      )}

                      {!disabled && (
                        <Tooltip title="Remove file" arrow>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAttachment(idx)}
                            sx={{ border: '1px solid #fee2e2' }}
                          >
                            <DeleteOutlineRounded fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            ) : (
              isViewOrEdit && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                  No attachments provided for this ticket.
                </Typography>
              )
            )}

            {/* Upload Box for Creating / Editing */}
            {!disabled && (
              <Box>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outlined"
                  startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadRounded />}
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    color: '#0284c7',
                    borderStyle: 'dashed',
                    borderWidth: '1.5px',
                    py: 1.2,
                    px: 2.5,
                    '&:hover': {
                      borderColor: '#0284c7',
                      bgcolor: '#f0f9ff',
                      borderStyle: 'dashed',
                    },
                  }}
                >
                  {isUploading ? 'Uploading attachments...' : '+ Attach Supporting Files (PDF, Images, Excel)'}
                </Button>
              </Box>
            )}
          </Grid>

          {/* ── SECTION 5: REMARKS & RESOLUTION (CO ONLY OR VIEW MODE) ── */}
          {isCO && (
            <>
              <FormSectionHeader
                icon={<ChatBubbleOutlineRounded sx={{ fontSize: 18 }} />}
                title="Resolution & Central Office Remarks"
                subtitle="Official remarks and status updates from Central Office"
              />

              <Grid item xs={12}>
                <TextAreaField
                  name="remark"
                  label="Central Office Remarks"
                  multiline
                  rows={2.5}
                  value={values.remark || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.remark && Boolean(errors.remark)}
                  helperText={touched.remark && errors.remark}
                  disabled={values.status === 'resolved'}
                />
              </Grid>
            </>
          )}

          {/* Discussion / Chat Timeline if available */}
          {chats.length > 0 && (
            <>
              <FormSectionHeader
                icon={<ChatBubbleOutlineRounded sx={{ fontSize: 18 }} />}
                title="Discussion & Communication History"
                subtitle="Timeline of messages exchanged between Offices"
              />

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    bgcolor: '#f8fafc',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  <Stack spacing={1.5}>
                    {chats.map((c, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1.2,
                          borderRadius: '8px',
                          bgcolor: '#ffffff',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color="#0E4F8D">
                          {c.senderLabel}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '12.5px', mt: 0.3, color: '#334155' }}>
                          {c.msg}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </>
          )}

          {/* ── FORM ACTION BUTTONS ── */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {!isViewOrEdit ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      resetForm();
                      setAttachmentsList([]);
                      setVerified(false);
                    }}
                    sx={{ textTransform: 'none', px: 3, borderRadius: '8px', fontWeight: 600 }}
                  >
                    Reset Form
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{
                      textTransform: 'none',
                      px: 3.5,
                      borderRadius: '8px',
                      fontWeight: 700,
                      background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)',
                    }}
                  >
                    Submit Query
                  </Button>
                </>
              ) : (
                <>
                  {isCO && (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        disabled={values.status === 'inprogress' || values.status === 'resolved'}
                        onClick={() => updateStatus("inprogress")}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                      >
                        Mark In Progress
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        disabled={values.status === 'resolved'}
                        onClick={() => updateStatus("resolved")}
                        sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 700 }}
                      >
                        Mark Resolved
                      </Button>
                    </>
                  )}
                </>
              )}
            </Stack>
          </Grid>

        </Grid>
      </form>
    </>
  );
};

export default ManageHelpDeskForm;
