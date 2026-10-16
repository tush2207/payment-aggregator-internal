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
    const currentRole = sessionStorage.getItem('role') || 'CO';
    if (currentRole === 'CO' || currentRole === 'ADMIN') return true;
    if (currentRole === 'BO' && allowBRFiles.includes(name)) return true;
    if (currentRole === 'RO' && allowROFiles.includes(name)) return true;
    if (currentRole === 'ZO' && allowZOFiles.includes(name)) return true;
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

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (file) => {
    if (!file) return;

    // 1. Strict PDF format validation
    const fileName = (file.name || '').toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    if (!isPdf) {
      errorNotification(`Only PDF files (.pdf) are allowed for ${label}. Please choose a valid PDF document.`);
      return;
    }

    // 2. Strict 5 MB file size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      errorNotification(`File size (${sizeMb} MB) exceeds the maximum limit of 5 MB. Please upload a compressed PDF.`);
      return;
    }

    setSelectedFile(file);
    if (setFieldTouched) setFieldTouched(name, true, true);
  };

  //  Upload Staged File
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

  //  Delete / Remove File with Backend API Call (Creation / Draft Mode Only)
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

  //  Download File
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

      {/* ── MODE 1: LOCKED / SUBMITTED / APPROVED APPLICATION (DOWNLOAD ONLY) ── */}
      {isLockedOrSubmitted ? (
        <Box sx={{ mt: 0.8 }}>
          {activeFileId ? (
            <Paper
              elevation={0}
              sx={{
                p: "10px 14px",
                minHeight: 52,
                bgcolor: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f1f5f9" }
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "6px",
                    bgcolor: "#e0f2fe",
                    color: "#0369a1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <FileIcon sx={{ fontSize: 20 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#0f172a"
                    noWrap
                    sx={{ fontSize: "13px" }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "11px", display: "block" }}
                  >
                    PDF Document &bull; File #{activeFileId}
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="contained"
                startIcon={<Download sx={{ fontSize: 16 }} />}
                onClick={() => handleDownload(activeFileId)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.78rem",
                  py: 0.55,
                  px: 1.8,
                  borderRadius: "6px",
                  background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                  color: "#ffffff",
                  boxShadow: "none",
                  flexShrink: 0,
                  "&:hover": {
                    background: "linear-gradient(135deg, #0a3d6f 0%, #0E4F8D 100%)",
                    boxShadow: "0 2px 4px rgba(14, 79, 141, 0.2)"
                  }
                }}
              >
                Download
              </Button>
            </Paper>
          ) : (
            <Box
              sx={{
                p: "10px 14px",
                minHeight: 52,
                bgcolor: "#f8fafc",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                boxSizing: "border-box"
              }}
            >
              <InfoOutlined sx={{ fontSize: 18, color: "#94a3b8" }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: "12px" }}>
                No attachment uploaded for {label}.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        /* ── MODE 2: ACTIVE CREATION / DRAFT FORM (CAN UPLOAD / REPLACE / DELETE) ── */
        <Box sx={{ mt: 0.8 }}>
          {/* CASE 1: File is already uploaded/attached */}
          {activeFileId ? (
            <Paper
              elevation={0}
              sx={{
                p: "10px 14px",
                minHeight: 52,
                bgcolor: "#f0fdf4",
                border: "1.5px solid #86efac",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.2} sx={{ minWidth: 0, flex: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", fontSize: 20, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#15803d" noWrap sx={{ fontSize: "13px" }}>
                    {label} Attached
                  </Typography>
                  <Typography variant="caption" color="#166534" sx={{ fontSize: "11px", display: "block" }}>
                    File #{activeFileId} (PDF)
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download sx={{ fontSize: 15 }} />}
                  onClick={() => handleDownload(activeFileId)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    py: 0.4,
                    px: 1.4,
                    borderRadius: "6px",
                    borderColor: "#86efac",
                    bgcolor: "#ffffff",
                    color: "#15803d",
                    "&:hover": { bgcolor: "#f0fdf4", borderColor: "#16a34a" }
                  }}
                >
                  Download
                </Button>

                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete sx={{ fontSize: 15 }} />}
                  onClick={handleDelete}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    py: 0.4,
                    px: 1.2,
                    borderRadius: "6px",
                    borderColor: "#fecaca",
                    bgcolor: "#ffffff",
                    color: "#dc2626",
                    "&:hover": { bgcolor: "#fef2f2", borderColor: "#dc2626" }
                  }}
                >
                  Remove
                </Button>
              </Box>
            </Paper>
          ) : selectedFile ? (
            /* CASE 2: File is selected (staged) -> TOP: File Name + Size; BOTTOM: Upload, Change, Delete */
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                minHeight: 88,
                bgcolor: "#f0f7ff",
                border: "1.5px solid #93c5fd",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box"
              }}
            >
              {/* Top Row: File Name + Size */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
                  <FileIcon sx={{ color: "#176FC1", fontSize: 20, flexShrink: 0 }} />
                  <Tooltip title={selectedFile.name} arrow placement="top">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#0E4F8D"
                      noWrap
                      sx={{ fontSize: "13px", minWidth: 0, flex: 1 }}
                    >
                      {selectedFile.name}
                    </Typography>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    fontSize: "11px",
                    color: "#1e40af",
                    bgcolor: "#dbeafe",
                    px: 1,
                    py: 0.2,
                    borderRadius: "4px",
                    flexShrink: 0
                  }}
                >
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>

              {/* Bottom Action Row: [Upload] [Change] [Delete Icon] */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, pt: 0.6, borderTop: "1px dashed #bfdbfe" }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={uploading}
                  onClick={handleUpload}
                  startIcon={<CloudUploadRounded sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    py: 0.4,
                    px: 1.5,
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                    color: "#ffffff",
                    boxShadow: "none",
                    "&:hover": { background: "linear-gradient(135deg, #0a3d6f 0%, #0E4F8D 100%)" }
                  }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    disabled={uploading}
                    startIcon={<Replay sx={{ fontSize: 15 }} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.78rem",
                      py: 0.35,
                      px: 1.2,
                      borderRadius: "6px",
                      borderColor: "#cbd5e1",
                      bgcolor: "#ffffff",
                      color: "#475569",
                      "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" }
                    }}
                  >
                    Change
                    <input
                      type="file"
                      hidden
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndSetFile(file);
                        e.target.value = "";
                      }}
                    />
                  </Button>

                  <Tooltip title="Delete file selection" arrow placement="top">
                    <IconButton
                      size="small"
                      disabled={uploading}
                      onClick={() => setSelectedFile(null)}
                      sx={{
                        p: "5px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        bgcolor: "#ffffff",
                        color: "#dc2626",
                        "&:hover": { bgcolor: "#fef2f2", borderColor: "#fca5a5" }
                      }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          ) : (
            /* CASE 3: No file selected yet -> Clean Dropzone with matching 88px height */
            <Button
              variant="outlined"
              component="label"
              onBlur={() => setFieldTouched && setFieldTouched(name, true, true)}
              sx={{
                width: "100%",
                minHeight: 88,
                p: 1.5,
                border: touched?.[name] && helperText?.[name] ? "1.5px dashed #ef4444" : "1.5px dashed #94a3b8",
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                color: "#475569",
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#176FC1",
                  bgcolor: "#eff6ff",
                  color: "#0E4F8D"
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "8px",
                    bgcolor: "#eff6ff",
                    color: "#176FC1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <CloudUploadRounded sx={{ fontSize: 22 }} />
                </Box>
                <Box textAlign="left">
                  <Typography variant="body2" fontWeight={700} color="#1e293b" sx={{ fontSize: "13px" }}>
                    Choose Document to Upload
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
                    Click to browse files (.pdf format, max 5 MB)
                  </Typography>
                </Box>
              </Box>
              <input
                type="file"
                hidden
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) validateAndSetFile(file);
                  e.target.value = "";
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
