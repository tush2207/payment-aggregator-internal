import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid,
  Chip,
  Alert
} from "@mui/material";
import {
  Close,
  ForwardOutlined,
  CheckCircleOutline,
  InfoOutlined,
} from "@mui/icons-material";
import { formatNumber } from "&src/utils";

const WaiverForwardDialog = ({
  open,
  onClose,
  targetAggregator,
  applicationDetails,
  waiverSubmitting,
  onConfirm
}) => {
  const [confirmedConsent, setConfirmedConsent] = useState(true);

  const applicationId = applicationDetails?.applicationId || targetAggregator?.applicationId;

  useEffect(() => {
    if (open) {
      setConfirmedConsent(true);
    }
  }, [open]);

  const handleExecute = () => {
    if (onConfirm) {
      onConfirm({
        waiverChoice: "YES",
        waiverDocument: null,
        waiverRemarks: ""
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !waiverSubmitting && onClose()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)",
          backgroundColor: "#176FC1",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          borderBottom: "3px solid #CE0F3E",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <ForwardOutlined sx={{ color: "#ffffff", fontSize: 24 }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: "#ffffff !important", fontSize: "16px", letterSpacing: "0.2px" }}
          >
            Forward for Customer Acceptance
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          {applicationId && (
            <Chip
              label={`App ID: #${applicationId}`}
              size="small"
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.75rem",
                border: "1px solid rgba(255, 255, 255, 0.35)",
              }}
            />
          )}
          <IconButton
            size="small"
            onClick={onClose}
            disabled={waiverSubmitting}
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 3, bgcolor: "#ffffff" }}>
        {/* Aggregator Overview Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            bgcolor: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #e2e8f0"
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Selected Aggregator & Commercial Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5} flexWrap="wrap" gap={1}>
            <Typography variant="subtitle1" fontWeight={800} color="#0E4F8D" sx={{ fontSize: "15px" }}>
              {targetAggregator?.aggregatorName || "Aggregator"}
            </Typography>
            {targetAggregator?.aggregatorId && (
              <Chip
                label={`AGG000${targetAggregator.aggregatorId}`}
                size="small"
                sx={{
                  bgcolor: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  fontSize: "11px",
                  border: "1px solid #bfdbfe"
                }}
              />
            )}
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "#e2e8f0" }} />

          {/* Commercial Totals */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Total Gross Amount
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                ₹{formatNumber(targetAggregator?.totalGrossAmount || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Vendor Share
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                ₹{formatNumber(targetAggregator?.totalVendorShare || 0)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Bank Expected Revenue
              </Typography>
              <Typography
                variant="body2"
                fontWeight={800}
                color={(targetAggregator?.totalExpectedRevenue || 0) >= 0 ? "#16a34a" : "#dc2626"}
              >
                ₹{formatNumber(targetAggregator?.totalExpectedRevenue || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Informative Alert */}
        <Alert
          severity="info"
          icon={<InfoOutlined fontSize="small" />}
          sx={{
            mb: 2.5,
            borderRadius: "8px",
            fontSize: "12.5px",
            "& .MuiAlert-message": { color: "#1e3a8a", fontWeight: 500 }
          }}
        >
          Forwarding this finalized quote to the <b>Regional Office (RO)</b>. The RO will obtain signed customer acceptance from the merchant and upload the required acceptance document.
        </Alert>

        {/* Consent Checkbox */}
        <Box sx={{ px: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmedConsent}
                onChange={(e) => setConfirmedConsent(e.target.checked)}
                size="small"
                sx={{
                  color: "#0E4F8D",
                  "&.Mui-checked": { color: "#0E4F8D" }
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#1e293b", userSelect: "none" }}>
                I confirm the commercial terms and finalize {targetAggregator?.aggregatorName || "this aggregator"} for customer acceptance.
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions
        sx={{
          py: 1.8,
          px: 3,
          bgcolor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={waiverSubmitting}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12.5px",
            borderRadius: "8px",
            px: 2.5,
            py: "6px",
            color: "#64748b",
            borderColor: "#cbd5e1",
            "&:hover": { bgcolor: "#f1f5f9", borderColor: "#94a3b8" }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}
          disabled={waiverSubmitting || !confirmedConsent}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12.5px",
            borderRadius: "8px",
            px: 3,
            py: "6px",
            bgcolor: "#0E4F8D !important",
            color: "#ffffff !important",
            boxShadow: "0 2px 8px rgba(14,79,141,0.25)",
            "&:hover": { bgcolor: "#0b3d6d !important" },
            "&.Mui-disabled": { bgcolor: "#cbd5e1 !important", color: "#94a3b8 !important" }
          }}
        >
          {waiverSubmitting ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} color="inherit" />
              <span>Processing...</span>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.8} alignItems="center">
              <CheckCircleOutline sx={{ fontSize: 17 }} />
              <span>Confirm & Send to RO</span>
            </Stack>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WaiverForwardDialog;
