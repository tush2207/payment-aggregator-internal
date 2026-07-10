import {
  Box,
  Button,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import TextFieldLabel from "../Label";
import { Delete, Replay, UploadFile, Download } from "@mui/icons-material";
import { user_role } from "&src/constants/PaymentAggregratorConstant";
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
  console.log(appId,
    value,
    // setFieldValue
    'FileUploadOrView')
  const { errorNotification, successNotification } = useStatusWiseAlert();

  // Role-based allowed upload permissions
  const allowBRFiles = ["kycFile", "customerApplicationFile"];
  const allowROFiles = ["rhRecommendationFile", "customerAcceptanceFile"];
  const allowZOFiles = ["zhRecommendationFile"];

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [alreadyUploadedFile, setAlreadyUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 Reset when form is closed
  useEffect(() => {
    if (formClosed) {
      handleDelete()
    }
  }, [formClosed]);

  // 🔹 If backend sends value, preload it
  useEffect(() => {
    if (value) setAlreadyUploadedFile(value);
  }, [value]);

  // 🔹 Check if user can upload/replace
  const canCurrentUserManage = () => {
    if (user_role === "BO" && allowBRFiles.includes(name)) return true;
    if (user_role === "RO" && allowROFiles.includes(name)) return true;
    if (user_role === "ZO" && allowZOFiles.includes(name)) return true;
    return false;
  };

  const userCanManage = canUpload && canCurrentUserManage();

  // ✅ Upload handler
  const handleUpload = async () => {
    if (!selectedFile)
      return errorNotification(`Please select a file to upload for ${label}`);

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await applicationServices.uploadFile(formData);
      const fileData = res?.data;
      // ✅ Store fileId in both local and formik
      setUploadedFileId(fileData.fileId);
      if (direct) {
        setFieldValue(fileData.fileId);

      } else {
        setFieldValue(name, fileData.fileId);
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

  // ✅ Delete handler
  const handleDelete = () => {
    setUploadedFileId(null);
    setAlreadyUploadedFile(null);
    setSelectedFile(null);
    setFieldValue(name, "");
  };

  // ✅ Download handler
  const handleDownload = async (fileId) => {
    if (!fileId) return errorNotification("File not available for download");

    try {
      const res = await applicationServices.downloadFile(fileId, {
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

  return (
    <Grid item xs={12}>
      {uploading && <FullScreenLoader />}
      <TextFieldLabel required={required} label={label} />

      {/* ========== CASE 1: Upload New File ========== */}
      {userCanManage && !alreadyUploadedFile && !uploadedFileId && (
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={3.5}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              color={touched && touched[name] && helperText?.[name] ? "error" : "primary"}
              onBlur={() => setFieldTouched(name, true, true)}
            >
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSelectedFile(file || null);
                  setFieldTouched(name, true, true);
                }}
              />
            </Button>
          </Grid>

          <Grid item xs={8.5}>
            {selectedFile && (
              <div style={{ fontSize: "0.85rem" }}>
                Selected: {selectedFile.name}
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  sx={{ ml: 2 }}
                  size="small"
                  disabled={uploading}
                  endIcon={<UploadFile />}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            )}
          </Grid>
        </Grid>
      )}

      {/* ========== CASE 2: File Exists (Editable Mode for Allowed Roles) ========== */}
      {userCanManage && uploadedFileId && !appId && (
        <Box
          fontSize="0.85rem"
          display="flex"
          alignItems="center"
        >
          <Button
            variant="text"
            size="small"
            startIcon={<Download />}
            onClick={() => handleDownload(alreadyUploadedFile)}
          >
            Download
          </Button>

          <Button
            variant="outlined"
            size="small"
            sx={{ ml: 1 }}
            component="label"
            startIcon={<Replay />}
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

          <IconButton
            size="small"
            color="error"
            sx={{ ml: 1 }}
            onClick={handleDelete}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* ========== CASE 3: File Exists (Read-Only for Viewers) ========== */}
      {alreadyUploadedFile && appId && (
        <Button
          size="small"
          startIcon={<Download />}
          onClick={() => handleDownload(alreadyUploadedFile)}
        >
          Download {label}
        </Button>
      )}
      {!uploadedFileId && !appId &&
        < Typography
          sx={{
            mt: '8px',
            border: "1px dashed #ccc",
            borderRadius: "8px",
            padding: "12px 16px",
            textAlign: "center",
            color: "#666",
            fontSize: "0.95rem",
            backgroundColor: "#fafafa",
          }}
        >
          No attachment available.
        </Typography>
      }

      {/* ========== Error Message (Formik Validation) ========== */}
      {
        helperText?.[name] && (
          <Typography
            sx={{
              fontWeight: 400,
              fontSize: "0.75rem",
              lineHeight: 1.66,
              textAlign: "left",
              mr: "14px",
              mb: 0,
              ml: "14px",
              color: "error.main",
              minHeight: "1em",
            }}
          >
            {touched?.[name] && helperText?.[name] ? helperText[name] : ""}
          </Typography>
        )
      }
    </Grid >
  );
};

export default FileUploadOrView;
