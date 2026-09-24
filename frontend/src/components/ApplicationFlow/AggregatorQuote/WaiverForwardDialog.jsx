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
  Grid
} from "@mui/material";
import { Close, ForwardOutlined, CheckCircleOutline, InfoOutlined } from "@mui/icons-material";
import { formatNumber } from "&src/utils";

const WaiverForwardDialog = ({
  open,
  onClose,
  targetAggregator,
  waiverChoice = "YES",
  setWaiverChoice,
  waiverSubmitting,
  onConfirm
}) => {
  const [confirmedConsent, setConfirmedConsent] = useState(true);

  useEffect(() => {
    if (open) {
      setConfirmedConsent(true);
      if (setWaiverChoice) {
        setWaiverChoice("YES");
      }
    }
  }, [open, setWaiverChoice]);

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
          boxShadow: "0 20px 40px rgba(0,0,0,0.18)"
        }
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <ForwardOutlined sx={{ color: "#ffffff", fontSize: 22 }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: "#ffffff !important", fontSize: "16px", letterSpacing: "0.2px" }}
          >
            Forward for Customer Acceptance
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          disabled={waiverSubmitting}
          sx={{
            color: "#ffffff",
            bgcolor: "rgba(255,255,255,0.15)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }
          }}
        >
          <Close fontSize="small" />
        </IconButton>
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
            Selected Aggregator
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5} flexWrap="wrap" gap={1}>
            <Typography variant="subtitle1" fontWeight={800} color="#0E4F8D" sx={{ fontSize: "15px" }}>
              {targetAggregator?.aggregatorName || "Aggregator"}
            </Typography>
            {targetAggregator?.aggregatorId && (
              <span
                style={{
                  fontSize: "11px",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  border: "1px solid #bfdbfe"
                }}
              >
                {`AGG000${targetAggregator.aggregatorId}`}
              </span>
            )}
          </Box>

          <Divider sx={{ my: 1.5, borderColor: "#e2e8f0" }} />

          {/* Commercial Totals */}
          <Grid container spacing={1.5}>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                Total Gross
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a" sx={{ fontSize: "12px" }}>
                ₹{formatNumber(targetAggregator?.totalGrossAmount || 0)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                Vendor Share
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a" sx={{ fontSize: "12px" }}>
                ₹{formatNumber(targetAggregator?.totalVendorShare || 0)}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "11px" }}>
                Bank Revenue
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                color={(targetAggregator?.totalExpectedRevenue || 0) >= 0 ? "#16a34a" : "#dc2626"}
                sx={{ fontSize: "12px" }}
              >
                ₹{formatNumber(targetAggregator?.totalExpectedRevenue || 0)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Confirmation & Consent Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: "10px",
            border: "1px solid #bfdbfe",
            bgcolor: "#f0f9ff"
          }}
        >
          <Box display="flex" gap={1.2} alignItems="flex-start">
            <InfoOutlined sx={{ color: "#0284c7", fontSize: 20, mt: 0.2 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="#0369a1" mb={0.5}>
                Are you sure you want to send this for Customer Acceptance?
              </Typography>
              <Typography variant="body2" sx={{ fontSize: "12px", color: "#334155", lineHeight: 1.5 }}>
                Upon confirmation, this commercial quotation will be forwarded to the <strong>Regional Office (RO)</strong>. The RO team will coordinate with the customer/merchant to obtain their signed acceptance before issuing the final Purchase Order.
              </Typography>
            </Box>
          </Box>
        </Paper>

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
                I confirm that the commercial markup and quotation details are verified and ready for customer sign-off.
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
          onClick={onConfirm}
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
              <span>Forwarding...</span>
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
