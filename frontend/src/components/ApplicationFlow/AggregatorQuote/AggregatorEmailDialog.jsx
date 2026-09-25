import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Stack,
  Tooltip,
  Grid,
  Checkbox,
  FormControlLabel,
  Button
} from "@mui/material";
import { EmailOutlined, OpenInNew } from "@mui/icons-material";
import { centralbanklogo } from "&src/assets";
import dayjs from "dayjs";

const AggregatorEmailDialog = ({
  open,
  onClose,
  dispatchedAggregators = [],
  applicationId,
  customerDetails,
  endDate,
  requestedChannels = [],
  loading,
  onConfirmSend,

  // Editable state
  emailSubject,
  setEmailSubject,
  emailRecipient,
  setEmailRecipient,
  emailIntroText,
  setEmailIntroText,
  emailModes,
  setEmailModes,
  emailBizType,
  setEmailBizType,
  emailCategory,
  setEmailCategory,
  emailAvgTicket,
  setEmailAvgTicket,
  emailExpectedTxns,
  setEmailExpectedTxns,
  emailWhoBearsCharges,
  setEmailWhoBearsCharges,
  emailAdditionalDetails,
  setEmailAdditionalDetails,
  emailDeadline,
  setEmailDeadline,
  emailSubmissionTo,
  setEmailSubmissionTo,
  emailManagerName,
  setEmailManagerName,
  emailManagerDesig,
  setEmailManagerDesig,
  emailManagerDept,
  setEmailManagerDept,
  emailManagerOffice,
  setEmailManagerOffice,
  emailManagerPhone,
  setEmailManagerPhone,
  emailCustomNotes,
  setEmailCustomNotes,
  quoteConsent,
  setQuoteConsent
}) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "1.05rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2,
          px: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <EmailOutlined />
          <span style={{ color: "#ffffff" }}>Quotation Request Email Preview & Confirmation</span>
        </Box>
        <Chip label="Ready to Dispatch" size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 800, fontSize: "11px" }} />
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: "#f8fafc" }}>
        {/* Recipient Aggregator Chips */}
        <Box sx={{ mb: 2.5, p: 2, bgcolor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5}>
              Target Selected Aggregators ({dispatchedAggregators.length})
            </Typography>
            {dispatchedAggregators.length > 2 && (
              <Typography variant="caption" color="#0369a1" fontWeight={600}>
                Showing 2 of {dispatchedAggregators.length} (hover badge for all)
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            {dispatchedAggregators.slice(0, 2).map((agg) => {
              const emails = [agg.email, agg.alternateEmail].filter(Boolean).join(" | Alt: ");
              return (
                <Chip
                  key={agg.aggregatorId}
                  label={`${agg.aggregatorName} (${emails || "No email configured"})`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: "12px", bgcolor: "#f0f9ff" }}
                />
              );
            })}

            {dispatchedAggregators.length > 2 && (
              <Tooltip
                title={
                  <Box sx={{ p: 0.5, maxWidth: 360 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ display: "block", mb: 0.5, borderBottom: "1px solid rgba(255,255,255,0.2)", pb: 0.5 }}>
                      Additional Selected Aggregators ({dispatchedAggregators.length - 2}):
                    </Typography>
                    {dispatchedAggregators.slice(2).map((agg, idx) => {
                      const emails = [agg.email, agg.alternateEmail].filter(Boolean).join(", ");
                      return (
                        <Typography key={agg.aggregatorId || idx} variant="caption" sx={{ display: "block", py: 0.3, lineHeight: 1.3 }}>
                          • <strong>{agg.aggregatorName}</strong> ({emails || "No email"})
                        </Typography>
                      );
                    })}
                  </Box>
                }
                arrow
                placement="top"
              >
                <Chip
                  label={`+${dispatchedAggregators.length - 2} more`}
                  sx={{
                    fontWeight: 800,
                    fontSize: "12px",
                    bgcolor: "#e0e7ff",
                    color: "#3730a3",
                    border: "1px solid #c7d2fe",
                    cursor: "pointer",
                    "&:hover": { bgcolor: "#c7d2fe" }
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Official Email Template Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            boxShadow: "0 4px 20px rgba(0, 73, 144, 0.08)",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            overflow: "hidden"
          }}
        >
          {/* Top CBI Tricolor Gradient Stripe */}
          <Box sx={{ height: "4px", background: "linear-gradient(90deg, #004990 0%, #176FC1 50%, #C8102E 100%)", mx: -3, mt: -3, mb: 2 }} />

          {/* Header with Central Bank Logo */}
          <Box display="flex" alignItems="center" justifyContent="space-between" pb={2} mb={2} sx={{ borderBottom: "2px solid #004990" }}>
            <Box display="flex" alignItems="center" gap={1.8}>
              <img src={centralbanklogo} alt="Central Bank of India" style={{ height: 46, width: "auto", objectFit: "contain" }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#004990" sx={{ lineHeight: 1.2 }}>
                  सेन्ट्रल बैंक ऑफ़ इण्डिया
                </Typography>
                <Typography variant="body2" fontWeight={800} color="#004990" sx={{ letterSpacing: 0.6, textTransform: "uppercase" }}>
                  Central Bank of India
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", fontSize: "10.5px" }}>
                  1911 से आपके लिए 'केन्द्रित' | 'Central' To You Since 1911
                </Typography>
              </Box>
            </Box>
            <Box textAlign="right">
              <Chip
                label="Neo Banking & Emerging Tech"
                size="small"
                sx={{ bgcolor: "#e0f2fe", color: "#0369a1", fontWeight: 800, fontSize: "11px", border: "1px solid #bae6fd" }}
              />
              <Typography variant="caption" sx={{ color: "#64748b", display: "block", mt: 0.5, fontWeight: 600 }}>
                Central Office, Mumbai
              </Typography>
            </Box>
          </Box>

          {/* Document Reference Notice Bar */}
          <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor="#f8fafc" p={1.2} px={1.8} mb={2} borderRadius="6px" border="1px solid #e2e8f0">
            <Typography variant="subtitle2" fontWeight={800} color="#004990" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Commercial Quotation Request
            </Typography>
            <Chip
              label={`App ID: #${applicationId || ""}`}
              size="small"
              sx={{ bgcolor: "#fef2f2", color: "#C8102E", fontWeight: 800, border: "1px solid #fecaca" }}
            />
          </Box>

          {/* Salutation */}
          <Box sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body1" fontWeight={700} color="#1e293b">Dear</Typography>
              <TextField
                size="small"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                sx={{ minWidth: 280, "& .MuiInputBase-input": { py: 0.5, px: 1, fontSize: "14px", fontWeight: 700, color: "#004990" } }}
              />
              <Typography variant="body1" fontWeight={700} color="#1e293b">,</Typography>
            </Box>
            {dispatchedAggregators.length > 1 && (
              <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 600, display: "block", mt: 0.5 }}>
                ℹ Individual emails will be sent addressing each aggregator by their specific contact person or team name.
              </Typography>
            )}
          </Box>

          {/* Editable Intro Paragraph */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" fontWeight={800} color="#475569" sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.4 }}>
               Introductory Text (Editable):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              value={emailIntroText}
              onChange={(e) => setEmailIntroText(e.target.value)}
              sx={{
                bgcolor: "#f8fafc",
                borderLeft: "4px solid #004990",
                borderRadius: "4px",
                "& .MuiInputBase-input": { fontSize: "13.5px", color: "#334155", lineHeight: 1.5 }
              }}
            />
          </Box>

          {/* Official Table with CBI Theme Styling */}
          <TableContainer sx={{ border: "1px solid #cbd5e1", borderRadius: "8px", mb: 2.5, overflow: "hidden" }}>
            <Table size="small" sx={{ borderCollapse: "collapse" }}>
              <TableHead>
                <TableRow sx={{ background: "linear-gradient(135deg, #004990 0%, #176FC1 100%)" }}>
                  <TableCell sx={{ color: "#ffffff", fontWeight: 800, fontSize: "12px", letterSpacing: 0.5, textTransform: "uppercase", width: "45%", py: 1 }}>
                    Parameter / Field
                  </TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: 800, fontSize: "12px", letterSpacing: 0.5, textTransform: "uppercase", width: "55%", py: 1 }}>
                    Details / Requirement
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Application ID
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={applicationId || ""}
                      disabled
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px", fontWeight: 700, color: "#C8102E !important" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Mode of Collection of Fee/Payment
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={emailModes}
                      onChange={(e) => setEmailModes(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Type of Business / Entity Category
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={emailBizType}
                      onChange={(e) => setEmailBizType(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Category (Private / Govt)
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={emailCategory}
                      onChange={(e) => setEmailCategory(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Average Ticket Size
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={emailAvgTicket}
                      onChange={(e) => setEmailAvgTicket(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px", fontWeight: 700, color: "#004990" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Expected Annual Online Transactions
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={emailExpectedTxns}
                      onChange={(e) => setEmailExpectedTxns(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Who Will Bear Charges
                    <Typography component="span" variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 500 }}>
                      (Optional - excluded from email if left blank)
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Leave blank to omit from email"
                      value={emailWhoBearsCharges}
                      onChange={(e) => setEmailWhoBearsCharges(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell sx={{ fontWeight: 600, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", py: 0.8, fontSize: "13px", color: "#1e293b" }}>
                    Additional Details If Any
                    <Typography component="span" variant="caption" sx={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 500 }}>
                      (Optional - excluded from email if left blank)
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #e2e8f0", py: 0.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Leave blank to omit from email"
                      value={emailAdditionalDetails}
                      onChange={(e) => setEmailAdditionalDetails(e.target.value)}
                      sx={{ "& .MuiInputBase-input": { py: 0.4, px: 1, fontSize: "13px" } }}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Quotation Submission Deadline Callout Box */}
          <Box
            sx={{
              bgcolor: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderLeft: "5px solid #C8102E",
              borderRadius: "8px",
              p: 2,
              mb: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5
            }}
          >
            <Box>
              <Typography variant="caption" fontWeight={800} color="#991b1b" textTransform="uppercase" letterSpacing={0.5}>
                &#9200; Quotation Submission Deadline
              </Typography>
              <Typography variant="body2" color="#374151" sx={{ mt: 0.2 }}>
                Kindly share the competitive quotes on or before:
              </Typography>
            </Box>
            <TextField
              size="small"
              value={emailDeadline}
              onChange={(e) => setEmailDeadline(e.target.value)}
              sx={{
                width: 170,
                bgcolor: "#ffffff",
                borderRadius: "6px",
                "& .MuiInputBase-input": { py: 0.6, px: 1.2, fontSize: "14px", fontWeight: 800, color: "#C8102E", textAlign: "center" }
              }}
            />
          </Box>

          {/* Mandatory Instruction Box */}
          <Box sx={{ bgcolor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", p: 2, mb: 2 }}>
            <Typography variant="caption" fontWeight={800} color="#0369a1" textTransform="uppercase" letterSpacing={0.5} sx={{ display: "block", mb: 0.5 }}>
               Instructions for Submission:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: "13px", color: "#0f172a", mb: 0.5 }}>
              • <strong>System Integration Fee &amp; AMC charges</strong> must be <strong>NIL</strong>. Kindly confirm the same in your quotation.
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Typography variant="body2" sx={{ fontSize: "13px", color: "#0f172a" }}>
                • Submit quotes on email ID:
              </Typography>
              <TextField
                size="small"
                value={emailSubmissionTo}
                onChange={(e) => setEmailSubmissionTo(e.target.value)}
                sx={{ width: 260, bgcolor: "#ffffff", "& .MuiInputBase-input": { py: 0.3, px: 1, fontSize: "13px", fontWeight: 700, color: "#004990" } }}
              />
            </Box>
          </Box>

          {/* Dynamic Custom Remarks / Notes to Aggregator */}
          <Box sx={{ mb: 2.5, p: 2, bgcolor: "#f0f9ff", borderRadius: "8px", border: "1px solid #bae6fd" }}>
            <Typography variant="caption" fontWeight={800} color="#0369a1" sx={{ display: "block", mb: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>
               Additional Remarks / Custom Instructions (Dynamically added to Email):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Type any specific terms, special pricing notes, or custom guidance here..."
              value={emailCustomNotes}
              onChange={(e) => setEmailCustomNotes(e.target.value)}
              size="small"
              sx={{
                bgcolor: "#ffffff",
                "& .MuiInputBase-input": { fontSize: "13px" },
              }}
            />
          </Box>

          {/* Sign-off */}
          <Box sx={{ borderTop: "1px dashed #cbd5e1", pt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: "#000000", fontSize: "13.5px" }}>
              Thanks & Regards,
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name"
                  value={emailManagerName}
                  onChange={(e) => setEmailManagerName(e.target.value)}
                  sx={{ "& .MuiInputBase-input": { py: 0.4, fontSize: "13px", fontWeight: 600 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Designation"
                  value={emailManagerDesig}
                  onChange={(e) => setEmailManagerDesig(e.target.value)}
                  sx={{ "& .MuiInputBase-input": { py: 0.4, fontSize: "13px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Department"
                  value={emailManagerDept}
                  onChange={(e) => setEmailManagerDept(e.target.value)}
                  sx={{ "& .MuiInputBase-input": { py: 0.4, fontSize: "13px" } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Office / Phone"
                  value={`${emailManagerOffice} | ${emailManagerPhone}`}
                  onChange={(e) => {
                    const parts = e.target.value.split("|");
                    setEmailManagerOffice(parts[0]?.trim() || "");
                    if (parts[1]) setEmailManagerPhone(parts[1]?.trim() || "");
                  }}
                  sx={{ "& .MuiInputBase-input": { py: 0.4, fontSize: "13px" } }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Verification & Consent */}
          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={quoteConsent}
                  onChange={(e) => setQuoteConsent(e.target.checked)}
                  color="success"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 22 } }}
                />
              }
              label={
                <Typography variant="body2" fontWeight={700} color="#166534">
                  I verify the official quotation parameters above and approve sending this official request to all selected aggregators.
                </Typography>
              }
            />
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0", justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<OpenInNew />}
          onClick={() => {
            const emails = dispatchedAggregators.map((a) => a.email).filter(Boolean).join(",");
            const dueDateStr = endDate ? (typeof endDate === "string" ? endDate : dayjs(endDate).format("DD/MM/YYYY")) : "Within 48 Hours";
            const subject = encodeURIComponent(`[Action Required] Request for Quotation: Application #${applicationId} (${customerDetails?.category || "General"}) [Due: ${dueDateStr}] - Central Bank of India`);
            const projDetailsText = requestedChannels.map((ch, idx) => `  ${idx + 1}. ${ch}`).join("\n");

            const body = encodeURIComponent(
              `Dear Partner,\n\nCentral Bank of India has initiated a commercial quotation request for Application #${applicationId}.\n\nCOMMERCIAL PARAMETERS:\n- Application ID: #${applicationId}\n- Category: ${customerDetails?.category || "N/A"}\n- Average Ticket Size: ₹ ${Number(customerDetails?.avgTransactionSize || 0).toLocaleString()}\n- Expected Annual Volume: ₹ ${Number(customerDetails?.totalAnnualTransaction || customerDetails?.aggregateDepositAmt || 0).toLocaleString()}\n- Submission Due: ${dueDateStr}\n\nREQUESTED PAYMENT MODES / CHANNELS FOR QUOTATION:\n${projDetailsText}\n\nPlease log in to the Payment Aggregator Portal to submit your quotation rates.\n\nRegards,\nCentral Bank of India\nNeo Banking & Emerging Technologies`
            );
            window.open(`mailto:${emails}?subject=${subject}&body=${body}`, "_blank");
          }}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
        >
          Open in Email Client (mailto:)
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!quoteConsent || loading}
            onClick={onConfirmSend}
            sx={{
              background: quoteConsent ? "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)" : "#cbd5e1",
              textTransform: "none",
              fontWeight: 800,
              px: 3,
              borderRadius: "6px"
            }}
          >
            {loading ? "Sending..." : " Confirm & Dispatch Quotation Requests"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default AggregatorEmailDialog;
