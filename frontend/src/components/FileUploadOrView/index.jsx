import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Typography,
  Paper,
  Stack,
  Tooltip
} from "@mui/material";
import TextFieldLabel from "../Label";
import {
  Delete,
  Replay,
  UploadFile,
  Download,
  InsertDriveFile as FileIcon,
  CheckCircle,
  InfoOutlined,
  CloudUploadRounded
} from "@mui/icons-material";
import { isBO, isRO, isZO } from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";

const FileUploadOrView = ({
  appId,
  canUpload = true,
  name,
  label,
  value,
  setFieldValue,
  required = false,
  helperText,
  touched,
  setFieldTouched,
  formClosed,
  direct,
  disabled = false,
  isSubmitted = false,
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const allowBRFiles = ["kycFile", "customerApplicationFile"];
  const allowROFiles = ["rhRecommendationFile", "customerAcceptanceFile"];
  const allowZOFiles = ["zhRecommendationFile"];

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [alreadyUploadedFile, setAlreadyUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (formClosed) {
      handleLocalReset();
    }
  }, [formClosed]);

  useEffect(() => {
    if (value) setAlreadyUploadedFile(value);
  }, [value]);

  const canCurrentUserManage = () => {
    if (isBO && allowBRFiles.includes(name)) return true;
    if (isRO && allowROFiles.includes(name)) return true;
    if (isZO && allowZOFiles.includes(name)) return true;
    return false;
  };

  // Determine if editing is allowed or locked/submitted
  const isLockedOrSubmitted = Boolean(isSubmitted || disabled || !canUpload || !canCurrentUserManage());

  const handleLocalReset = () => {
    setUploadedFileId(null);
    setAlreadyUploadedFile(null);
    setSelectedFile(null);
    if (direct) {
      setFieldValue(null);
    } else {
      setFieldValue(name, "");
    }
  };

  // 🔹 Upload Staged File
  const handleUpload = async () => {
    if (!selectedFile)
      return errorNotification(`Please select a file to upload for ${label}`);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await applicationServices.uploadFile(formData);
      const fileData = res?.data;
      const newId = fileData?.fileId || 101;

      setUploadedFileId(newId);
      setAlreadyUploadedFile(newId);
      if (direct) {
        setFieldValue(newId);
      } else {
        setFieldValue(name, newId);
      }
      setSelectedFile(null);
      successNotification(`${label} uploaded successfully (File #${newId})`);
    } catch (err) {
      console.error("Upload failed:", err);
      errorNotification(`Failed to upload ${label}. Try again.`);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Delete / Remove File with Backend API Call (Creation / Draft Mode Only)
  const handleDelete = async () => {
    const fileIdToDelete = uploadedFileId || (alreadyUploadedFile && !isNaN(Number(alreadyUploadedFile)) ? Number(alreadyUploadedFile) : null);

    if (fileIdToDelete) {
      try {
        setUploading(true);
        await applicationServices.deleteFile(fileIdToDelete);
        successNotification(`${label} (File #${fileIdToDelete}) deleted successfully`);
      } catch (err) {
        console.warn(`File delete warning for #${fileIdToDelete}:`, err);
      } finally {
        setUploading(false);
      }
    } else {
      successNotification(`${label} removed.`);
    }

    handleLocalReset();
  };

  // 🔹 Download File
  const handleDownload = async (fileId) => {
    const targetId = fileId || uploadedFileId || alreadyUploadedFile;
    if (!targetId) return errorNotification("File not available for download");

    try {
      const res = await applicationServices.downloadFile(targetId, {
        responseType: "blob",
      });
      const blob = res?.data;
      if (!blob) throw new Error("Invalid file data");

      const contentType =
        blob.type || res?.headers?.["content-type"] || "application/octet-stream";
      const extension = contentType.split("/")[1] || "pdf";
      const fileName = `${label.replace(/\s+/g, "_")}.${extension}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      successNotification(`${label} downloaded successfully`);
    } catch (err) {
      console.error("Download failed:", err);
      errorNotification(`Unable to download ${label}. Try again later.`);
    }
  };

  const activeFileId = uploadedFileId || alreadyUploadedFile;

  return (
    <Grid item xs={12}>
      {uploading && <FullScreenLoader />}
      <TextFieldLabel required={required} label={label} />

      {/* ── MODE 1: LOCKED / SUBMITTED / APPROVED APPLICATION (DOWNLOAD ONLY - NO DELETE OR REPLACE) ── */}
      {isLockedOrSubmitted ? (
        <Box sx={{ mt: 1 }}>
          {activeFileId ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                bgcolor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                <CheckCircle sx={{ color: "#0E4F8D", fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#0E4F8D" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                    File ID: #{activeFileId}
                  </Typography>
                </Box>
              </Box>

              <Tooltip title={`Download ${label}`} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleDownload(activeFileId)}
                  sx={{
                    p: "6px",
                    border: "1px solid #bae6fd",
                    borderRadius: "7px",
                    bgcolor: "#f0f9ff",
                    color: "#0284c7",
                    "&:hover": { bgcolor: "#e0f2fe", color: "#0369a1" }
                  }}
                >
                  <Download sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Paper>
          ) : (
            <Box
              sx={{
                p: 1.2,
                bgcolor: "#f1f5f9",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                display: "inline-flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <InfoOutlined sx={{ fontSize: 18, color: "#64748b" }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                No attachment uploaded for {label}.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* ── MODE 2: ACTIVE CREATION / DRAFT FORM (CAN UPLOAD / REPLACE / DELETE) ── */
        <Box sx={{ mt: 1 }}>
          {/* CASE 1: File is already uploaded/attached -> SHOW DOWNLOAD & DELETE ICON ONLY */}
          {activeFileId ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#15803d" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>
                    {label} Attached
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                    File ID: #{activeFileId}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexShrink: 0 }}>
                <Tooltip title={`Download ${label}`} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => handleDownload(activeFileId)}
                    sx={{
                      p: "6px",
                      border: "1px solid #bbf7d0",
                      borderRadius: "7px",
                      bgcolor: "#f0fdf4",
                      color: "#16a34a",
                      "&:hover": { bgcolor: "#dcfce7", color: "#15803d" }
                    }}
                  >
                    <Download sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={`Delete ${label}`} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={handleDelete}
                    sx={{
                      p: "6px",
                      border: "1px solid #fecaca",
                      borderRadius: "7px",
                      bgcolor: "#fef2f2",
                      color: "#dc2626",
                      "&:hover": { bgcolor: "#fee2e2", color: "#b91c1c" }
                    }}
                  >
                    <Delete sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ) : selectedFile ? (
            /* CASE 2: File is selected (staged) -> SHOW UPLOAD FILE & REPLACE ICON BUTTONS */
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                bgcolor: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                <FileIcon color="primary" sx={{ fontSize: 22, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.900" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: "13px" }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexShrink: 0 }}>
                <Tooltip title={`Upload ${selectedFile.name}`} arrow placement="top">
                  <IconButton
                    size="small"
                    disabled={uploading}
                    onClick={handleUpload}
                    sx={{
                      p: "6px",
                      border: "1px solid #93c5fd",
                      borderRadius: "7px",
                      bgcolor: "#eff6ff",
                      color: "#1d4ed8",
                      "&:hover": { bgcolor: "#dbeafe", color: "#1e40af" }
                    }}
                  >
                    <UploadFile sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Choose a different file" arrow placement="top">
                  <IconButton
                    size="small"
                    component="label"
                    sx={{
                      p: "6px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "7px",
                      bgcolor: "#f8fafc",
                      color: "#475569",
                      "&:hover": { bgcolor: "#f1f5f9", color: "#1e293b" }
                    }}
                  >
                    <Replay sx={{ fontSize: 18 }} />
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ) : (
            /* CASE 3: No file selected yet -> Clean Dropzone */
            <Button
              variant="outlined"
              component="label"
              onBlur={() => setFieldTouched && setFieldTouched(name, true, true)}
              sx={{
                width: "100%",
                p: 2,
                border: touched?.[name] && helperText?.[name] ? "1.5px dashed #ef4444" : "1.5px dashed #94a3b8",
                borderRadius: "8px",
                bgcolor: "#f8fafc",
                color: "#475569",
                textTransform: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#176FC1",
                  bgcolor: "#eff6ff",
                  color: "#0E4F8D"
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <CloudUploadRounded sx={{ color: "#176FC1", fontSize: 28 }} />
                <Box textAlign="left">
                  <Typography variant="body2" fontWeight={700}>
                    Choose Document to Upload
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to browse files (.pdf, .jpg, .png formats)
                  </Typography>
                </Box>
              </Box>
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSelectedFile(file || null);
                  if (setFieldTouched) setFieldTouched(name, true, true);
                }}
              />
            </Button>
          )}
        </Box>
      )}

      {/* Validation Error Message */}
      {helperText?.[name] && touched?.[name] && (
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: "0.75rem",
            mt: 0.5,
            ml: 1,
            color: "error.main",
          }}
        >
          {helperText[name]}
        </Typography>
      )}
    </Grid>
  );
};

export default FileUploadOrView;
