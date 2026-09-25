import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Paper,
  Chip,
  CircularProgress,
  Stack,
  Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import RefreshIcon from "@mui/icons-material/Refresh";
import auditLogsService from "&src/services/auditLogs";
import { formatDateAndTime } from "&src/utils";

export default function ApplicationAuditTrailModal({ open, onClose, application }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!application?.applicationId) return;
    setLoading(true);
    try {
      const response = await auditLogsService.getAuditTrailByApplication(application.applicationId);
      const fetchedData = response?.data || response;
      if (Array.isArray(fetchedData)) {
        setLogs(fetchedData);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.warn("Failed to fetch application audit trail:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, application]);

  const getActionColor = (action) => {
    if (action.includes("REJECT")) return "error";
    if (action.includes("FINALIZE") || action.includes("ACCEPT")) return "success";
    if (action.includes("UPDATE") || action.includes("MARKUP")) return "warning";
    return "primary";
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#0a2342", color: "#ffffff" }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <HistoryIcon />
          <Typography variant="h6" fontWeight={700}>
            Application Audit Trail & Activity Logs
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={fetchLogs} size="small" sx={{ color: "#fff" }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: "#f8fafc" }}>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            App ID: <strong>{application?.applicationId}</strong> | Customer: <strong>{application?.customerName}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Log Entries: <strong>{logs.length}</strong>
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={32} />
          </Box>
        ) : logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" py={4}>
            No audit trail records found for this application.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {logs.map((log, index) => (
              <Paper
                key={log.id || index}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  bgcolor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  transition: "0.2s ease",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                  }
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={log.stage || log.action}
                      color={getActionColor(log.action)}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "11px" }}
                    />
                    <Typography variant="subtitle2" fontWeight={700}>
                      {log.action}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {formatDateAndTime(log.createdAt)}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.primary" sx={{ mb: 1.5 }}>
                  {log.details}
                </Typography>

                <Divider sx={{ my: 1 }} />

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    Performed By: <strong>{log.performedBy || 'User'}</strong> ({log.userRole || 'Role'})
                  </Typography>
                  {log.ipAddress && (
                    <Typography variant="caption" color="text.disabled">
                      IP: {log.ipAddress}
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#ffffff" }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close Audit History
        </Button>
      </DialogActions>
    </Dialog>
  );
}
