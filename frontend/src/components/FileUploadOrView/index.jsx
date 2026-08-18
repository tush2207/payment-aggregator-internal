import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Typography,
  Paper,
  Stack
} from "@mui/material";
import TextFieldLabel from "../Label";
import {
  Delete,
  Replay,
  UploadFile,
  Download,
  InsertDriveFile as FileIcon,
  CheckCircle,
  InfoOutlined
} from "@mui/icons-material";
import { isBO, isRO, isZO } from "&src/constants/PaymentAggregratorConstant";
import applicationServices from "&src/services/applications";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";

const FileUploadOrView = ({
  appId,
  canUpload,
  name,
  label,
  value,
  setFieldValue,
  required = false,
  helperText,
  touched,
  setFieldTouched,
  formClosed,
  direct
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
      handleDelete();
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

  const userCanManage = canUpload && canCurrentUserManage();

  const handleUpload = async () => {
    if (!selectedFile)
      return errorNotification(`Please select a file to upload for ${label}`);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await applicationServices.uploadFile(formData);
      const fileData = res?.data;
      setUploadedFileId(fileData?.fileId || 101);
      if (direct) {
        setFieldValue(fileData?.fileId || 101);
      } else {
        setFieldValue(name, fileData?.fileId || 101);
      }
      setSelectedFile(null);
      successNotification(`${label} uploaded successfully`);
    } catch (err) {
      setSelectedFile(null);
      console.error("Upload failed:", err);
      errorNotification(`Failed to upload ${label}. Try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    setUploadedFileId(null);
    setAlreadyUploadedFile(null);
    setSelectedFile(null);
    if (direct) {
      setFieldValue(null);
    } else {
      setFieldValue(name, "");
    }
  };

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

      {/* USER CAN UPLOAD/MANAGE */}
      {userCanManage ? (
        <Box sx={{ mt: 1 }}>
          {/* CASE 1: File is already uploaded/attached */}
          {activeFileId ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", fontSize: 22, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#15803d" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {label} Attached
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    File ID: #{activeFileId}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  size="small"
                  color="success"
                  startIcon={<Download />}
                  onClick={() => handleDownload(activeFileId)}
                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  Download
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="inherit"
                  component="label"
                  startIcon={<Replay />}
                  sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  Replace
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        setAlreadyUploadedFile(null);
                        setUploadedFileId(null);
                        setFieldValue(name, "");
                      }
                    }}
                  />
                </Button>
                <IconButton size="small" color="error" onClick={handleDelete}>
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ) : selectedFile ? (
            /* CASE 2: File is selected, ready to upload */
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1.5,
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
                <FileIcon color="primary" sx={{ fontSize: 24, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="primary.900" noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<UploadFile />}
                  onClick={handleUpload}
                  disabled={uploading}
                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
                <IconButton size="small" color="error" onClick={() => setSelectedFile(null)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ) : (
            /* CASE 3: No file selected yet -> Clean, styled Dropzone Button */
            <Button
              variant="outlined"
              component="label"
              onBlur={() => setFieldTouched && setFieldTouched(name, true, true)}
              sx={{
                width: "100%",
                p: 2,
                border: touched?.[name] && helperText?.[name] ? "1.5px dashed #ef4444" : "1.5px dashed #94a3b8",
                borderRadius: "10px",
                bgcolor: "#f8fafc",
                color: "#475569",
                textTransform: "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "#2563eb",
                  bgcolor: "#eff6ff",
                  color: "#1d4ed8"
                }
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <UploadFile sx={{ color: "#2563eb", fontSize: 26 }} />
                <Box textAlign="left">
                  <Typography variant="body2" fontWeight={700}>
                    Choose PDF File to Upload
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click to browse files (.pdf format)
                  </Typography>
                </Box>
              </Box>
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSelectedFile(file || null);
                  if (setFieldTouched) setFieldTouched(name, true, true);
                }}
              />
            </Button>
          )}
        </Box>
      ) : (
        /* READ ONLY MODE FOR VIEWERS */
        <Box sx={{ mt: 1 }}>
          {activeFileId ? (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Download />}
              onClick={() => handleDownload(activeFileId)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Download {label}
            </Button>
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
