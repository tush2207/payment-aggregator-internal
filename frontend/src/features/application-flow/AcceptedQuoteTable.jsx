import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { centralbanklogo } from "&src/assets";
import {
  ACCEPTED_PROJECTION_COLUMNS_FOR_RO,
  isRO,
  isAdmin,
  user_Id,
  PROJECTION_CAL_DETAILS
} from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import applicationServices from "&src/services/applications";
import { PERCENTAGE, formatNumber } from "&src/utils";
import { calculateTotals, getProjectionsForCustomer, getChannelOrder } from "&src/utils/calculation";
import { Download, InfoOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { fetchApplicationDetails, closeWorkflowDialog } from "&src/store/applicationFlowSlice";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack,
  TableContainer
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ConfirmationDialogWithReason from "&src/components/Dialog/ConfirmationDialogWithReason";
import FileUploadOrView from "&src/components/FileUploadOrView";
import FullScreenLoader from "&src/components/feedback/FullScreenLoader";
import NoData from "&src/components/feedback/NoData";
import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";

// ---------------- COMPONENTS ----------------
const AcceptedQuotationTable = ({ quoteDetails, compact = false }) => {
  const headerCellSx = {
    fontWeight: 700,
    fontSize: compact ? "11px" : "12px",
    padding: compact ? "6px 8px !important" : "10px 14px !important",
    color: "#ffffff !important",
    backgroundColor: "#0E4F8D !important",
    borderRight: "1px solid rgba(255, 255, 255, 0.25) !important",
    borderBottom: "2px solid #062545 !important",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    textAlign: "center",
    verticalAlign: "middle !important",
    lineHeight: "1.2 !important"
  };

  const cellSx = {
    fontSize: compact ? "11px" : "12.5px",
    padding: compact ? "5px 8px !important" : "9px 14px !important",
    borderBottom: "1px solid #e2e8f0",
    borderRight: "1px solid #e2e8f0",
    color: "#1e293b",
    verticalAlign: "middle !important",
    lineHeight: "1.2 !important"
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        overflowX: "auto",
        maxWidth: "100%",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        mt: compact ? 0.8 : 1.5,
        mb: compact ? 1 : 2,
        boxShadow: compact ? "none" : "0 1px 3px rgba(0,0,0,0.05)"
      }}
    >
      <Table size="small" sx={{ width: "100%", borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow
            sx={{
              background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)",
              backgroundColor: "#0E4F8D"
            }}
          >
            <TableCell sx={{ ...headerCellSx, width: "12%" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: compact ? "20px" : "24px" }}>
                SR NO
              </Box>
            </TableCell>
            <TableCell sx={{ ...headerCellSx, width: "58%", textAlign: "left" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", minHeight: compact ? "20px" : "24px" }}>
                TYPE OF TRANSACTION
              </Box>
            </TableCell>
            <TableCell sx={{ ...headerCellSx, width: "30%", borderRight: "none !important" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: compact ? "20px" : "24px" }}>
                CHARGES PROPOSED
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quoteDetails?.length ? (
            (() => {
              let parentCounter = 0;
              return quoteDetails.map((row, idx) => {
                const isSubBank = row.isIB;
                const srNo = !isSubBank ? ++parentCounter : "";
                const isAllowed =
                  row.allow === undefined ||
                  row.allow === null ||
                  row.allow === true ||
                  row.allow === 1 ||
                  row.allow === "true" ||
                  row.allow === "1";
                const unitDisplay = row.bankUnit || row.chargeType || row.unit || PERCENTAGE;
                const isPct = unitDisplay === PERCENTAGE || unitDisplay === "%" || unitDisplay === "Percentage";
                const hasCharges =
                  row.chargesProposed !== undefined &&
                  row.chargesProposed !== null &&
                  row.chargesProposed !== "" &&
                  !isNaN(Number(row.chargesProposed));
                const numCharges = hasCharges ? Number(row.chargesProposed) : null;

                let chargesDisplay = "—";
                if (isAllowed) {
                  let val = numCharges;
                  if (val === null || val <= 0) {
                    const g = Number(row?.grossAmount) || 0;
                    const est = Number(row?.estimatedTransactions) || 0;
                    const agg = Number(row?.aggregateAmount) || 0;
                    if (g > 0) {
                      val = isPct && agg > 0 ? (g * 100) / agg : (est > 0 ? g / est : null);
                    }
                  }
                  if (val !== null && !Number.isNaN(Number(val)) && Number(val) > 0) {
                    chargesDisplay = isPct ? `${parseFloat(Number(val).toFixed(3))}%` : `₹${parseFloat(Number(val).toFixed(3))}`;
                  }
                }

                return (
                  <TableRow
                    key={idx}
                    sx={{
                      "&:hover": { bgcolor: "#f8fafc" },
                      bgcolor: isSubBank ? "#fafcff" : "#ffffff",
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    <TableCell sx={{ ...cellSx, textAlign: "center", color: "text.secondary" }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: compact ? "20px" : "24px" }}>
                        {srNo}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        ...cellSx,
                        pl: isSubBank ? (compact ? 2.5 : 4) : (compact ? 1.5 : 2),
                        fontWeight: isSubBank ? 500 : 700,
                        color: isSubBank ? "#475569" : "#0f172a"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", minHeight: compact ? "20px" : "24px" }}>
                        {row.transactionType}
                        {row.transactionTypePercent && isSubBank ? ` (${row.transactionTypePercent})` : ""}
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{
                        ...cellSx,
                        textAlign: "center",
                        fontWeight: 800,
                        color: "#0E4F8D",
                        borderRight: "none"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: compact ? "20px" : "24px" }}>
                        {chargesDisplay}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              });
            })()
          ) : (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={cellSx}>
                <NoData />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ---------------- MAIN ----------------
export const AcceptedQuoteTable = ({
  customer,
  applicationDetails,
  applicationId,
  aggregatorId,
  isViewOnly = false
}) => {
  const currentApp = applicationDetails || customer || {};
  const effectiveAppId = applicationId || currentApp.applicationId;
  const effectiveAggId = aggregatorId || currentApp.finalizedAggregatorId;
  const dispatch = useDispatch();

  // Get user details from session storage
  const userDetails = useMemo(() => {
    const stored = sessionStorage.getItem("userDetails");
    return stored && JSON.parse(stored);
  }, []);

  const { employeeName, pfId, department, branchName, branchLocation, role: userRole } = userDetails || {};
  const pdfRef = useRef();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [customerAcceptanceFile, setCustomerAcceptanceFile] = useState(currentApp?.customerAcceptanceFile);
  const [rhRecommendationFile, setRhRecommendationFile] = useState(currentApp?.rhRecommendationFile);
  const [isWaived, setIsWaived] = useState(currentApp?.customerAcceptanceRequired === false);

  const isRejected =
    currentApp?.status?.toLowerCase()?.includes("reject") ||
    Boolean(currentApp?.reasonOfRejection) ||
    Boolean(currentApp?.rejectedDate);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showQuotation, setShowQuotation] = useState(true);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showDownload, setShowDownload] = useState(false);

  useEffect(() => {
    if (!effectiveAppId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let targetAgg = effectiveAggId;
        if (!targetAgg) {
          try {
            const aggRes = await aggregatorByApplication.getAllAggregatorsByApplication(effectiveAppId);
            const aggList = Array.isArray(aggRes?.data) ? aggRes.data : Array.isArray(aggRes) ? aggRes : [];
            const found = aggList.find((a) => a.isFinalApproved || a.isCustomerAccepted || a.isQuoteAcceptRO) || aggList[0];
            if (found) targetAgg = found.aggregatorId;
          } catch (e) {
            console.warn("Could not find aggregator:", e);
          }
        }

        // Benchmark charges at aggregatorId = 0
        let benchmarkCharges = [];
        try {
          const benchRes = await aggregatorProjections.getAllProjections(effectiveAppId, 0);
          benchmarkCharges = Array.isArray(benchRes?.data) ? benchRes.data : Array.isArray(benchRes) ? benchRes : [];
        } catch (benchErr) {
          console.warn("Could not load benchmark charges:", benchErr);
        }

        const benchMap = new Map();
        benchmarkCharges.forEach((b) => {
          const k = (b.transactionType || "").trim().toLowerCase();
          if (
            k &&
            b.chargesProposed !== undefined &&
            b.chargesProposed !== null &&
            b.chargesProposed !== "" &&
            Number(b.chargesProposed) > 0
          ) {
            benchMap.set(k, {
              chargesProposed: b.chargesProposed,
              bankUnit: b.chargeType || b.bankUnit || b.unit || "%"
            });
          }
        });

        let rawData = [];
        if (targetAgg) {
          try {
            const res = await aggregatorProjections.getAllProjections(effectiveAppId, targetAgg);
            rawData = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          } catch (err) {
            console.warn("Could not fetch projections:", err);
          }
        }

        const baselineProjs = getProjectionsForCustomer(
          PROJECTION_CAL_DETAILS,
          currentApp?.projection,
          currentApp?.avgTransactionSize,
          effectiveAppId
        );

        let merged = [];
        if (rawData.length > 0) {
          merged = rawData.map((row, idx) => {
            const k = (row.transactionType || "").trim().toLowerCase();
            let charges = row.chargesProposed;
            let unit = row.chargeType || row.bankUnit || row.unit || "%";
            if (
              (charges === undefined || charges === null || charges === "" || Number(charges) === 0) &&
              benchMap.has(k)
            ) {
              const b = benchMap.get(k);
              charges = b.chargesProposed;
              unit = b.bankUnit;
            }
            return {
              id: row.id || row.projectionId || idx + 1,
              transactionType: row.transactionType,
              isIB: row.isIB,
              chargesProposed:
                charges !== undefined && charges !== null && charges !== "" && Number(charges) > 0
                  ? charges
                  : "",
              bankUnit: unit
            };
          });
        } else {
          merged = baselineProjs.map((row, idx) => {
            const k = (row.transactionType || "").trim().toLowerCase();
            let charges = "";
            let unit = row.chargeType || row.bankUnit || row.unit || "%";
            if (benchMap.has(k)) {
              const b = benchMap.get(k);
              charges = b.chargesProposed;
              unit = b.bankUnit;
            }
            return {
              id: row.id || idx + 1,
              transactionType: row.transactionType,
              isIB: row.isIB,
              chargesProposed: charges,
              bankUnit: unit
            };
          });
        }

        merged.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
        setQuoteDetails(merged);
      } catch {
        errorNotification("Failed to fetch projections");
        setQuoteDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveAppId, effectiveAggId, currentApp?.projection, currentApp?.avgTransactionSize]);

  const updateApplicationFlow = async (payload) => {
    setLoading(true);
    try {
      await applicationServices.updateApplication(effectiveAppId, payload);
      successNotification("Application updated successfully");
      if (effectiveAppId) {
        dispatch(fetchApplicationDetails(effectiveAppId));
      }
    } catch {
      errorNotification("Failed to update application");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (isWaived) {
      if (!rhRecommendationFile && !currentApp?.rhRecommendationFile) {
        errorNotification("Please upload RH Recommendation file to proceed with waiver");
        return;
      }
    } else {
      if (
        (!customerAcceptanceFile && !currentApp?.customerAcceptanceFile) ||
        (!rhRecommendationFile && !currentApp?.rhRecommendationFile)
      ) {
        errorNotification("Please upload both Signed Customer Acceptance and RH Recommendation documents");
        return;
      }
    }

    if (!accepted) return errorNotification("Please accept before proceeding");

    if (currentApp?.approvedByROId && currentApp?.approvedByROId !== user_Id && !isAdmin) {
      return errorNotification("You are not the authorised person to approve this quotation.");
    }

    await updateApplicationFlow({
      isQuoteAcceptRO: true,
      customerAcceptanceRequired: !isWaived,
      reasonOfRejection: "",
      status: "quoteaccepted",
      approvedByQuoteId: user_Id,
      customerAcceptanceFile: customerAcceptanceFile || null,
      rhRecommendationFile: rhRecommendationFile || null
    });
    dispatch(closeWorkflowDialog());
  };

  const handleReject = () => {
    if (!accepted) return errorNotification("Please check acceptance before rejecting");
    setConfirmDialogOpen(true);
  };

  const handleConfirmReject = async (reasonText) => {
    if (reasonText === "") return errorNotification("Reason of rejection is required.");
    setConfirmDialogOpen(false);
    await updateApplicationFlow({
      isQuoteAcceptRO: false,
      reasonOfRejection: reasonText || null,
      isQuoteReviewCO: false,
      status: "quoterejected"
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setShowDownload(true);

      // Wait for table + content to fully render
      await new Promise((res) => setTimeout(res, 350));

      const pdfElement = pdfRef.current;
      if (!pdfElement) return;

      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
        logging: false
      });

      // Using high quality JPEG compression keeps PDF size well under 4.5 MB (~300-600 KB) while preserving sharp typography
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const marginX = 12;
      const marginY = 12;
      const maxPdfWidth = pageWidth - marginX * 2; // 186mm
      const maxPdfHeight = pageHeight - marginY * 2; // 273mm

      let pdfWidth = maxPdfWidth;
      let pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Ensure content fits strictly on 1 single page without vertical clipping
      if (pdfHeight > maxPdfHeight) {
        const scaleFactor = maxPdfHeight / pdfHeight;
        pdfWidth = pdfWidth * scaleFactor;
        pdfHeight = maxPdfHeight;
      }

      const posX = (pageWidth - pdfWidth) / 2;
      const posY = marginY;

      pdf.addImage(imgData, "JPEG", posX, posY, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`Quotation_${currentApp?.customerName || "Customer"}.pdf`);

      successNotification("Downloaded successfully");
    } catch (err) {
      console.error(err);
      errorNotification("Failed to generate PDF");
    }
  };

  return (
    <>
      {loading && <FullScreenLoader />}

      {/* Confirmation Dialog for Rejection */}
      <ConfirmationDialogWithReason
        showReasonSec={true}
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmReject}
        reason={reason}
        setReason={setReason}
        isLoading={loading}
        title="Reject Quotation"
        description="Please confirm rejection and provide reason for rejecting this quotation."
      />

      {/* Info Banner & Download Action */}
      {!currentApp?.isQuoteAcceptRO && (
        <Box sx={{ mb: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "12px",
              borderColor: "#93c5fd",
              bgcolor: "#eff6ff",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2
            }}
          >
            <Box display="flex" gap={2} alignItems="flex-start">
              <Typography color="#1d4ed8" sx={{ mt: 0.5 }}>
                <InfoOutlined fontSize="large" />
              </Typography>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#1e3a8a" gutterBottom>
                  Quotation Prepared Successfully
                </Typography>
                <Typography variant="body2" color="#334155" sx={{ maxWidth: "750px", lineHeight: 1.4 }}>
                  The quotation has been prepared based on the finalized transaction projections.
                  Please <strong>download the quotation letter</strong>, obtain the customer's signature/stamp,
                  and upload it back in the <strong>Customer Acceptance</strong> section below along with the
                  <strong>RH Recommendation</strong> file.
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={showQuotation ? <VisibilityOff /> : <Visibility />}
                onClick={() => setShowQuotation((prev) => !prev)}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  borderRadius: "8px",
                  borderColor: "#0E4F8D",
                  color: "#0E4F8D",
                  bgcolor: "#ffffff",
                  "&:hover": { bgcolor: "#f0f9ff", borderColor: "#0a3866" },
                  whiteSpace: "nowrap"
                }}
              >
                {showQuotation ? "Hide Quotation Details" : "Show Quotation Details"}
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadPDF}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  borderRadius: "8px",
                  bgcolor: "#0E4F8D !important",
                  color: "#ffffff !important",
                  boxShadow: "0 4px 12px rgba(14, 79, 141, 0.25)",
                  "&:hover": { bgcolor: "#0a3866 !important" },
                  whiteSpace: "nowrap"
                }}
              >
                Download Quotation
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Hidden printable container for PDF generation - Perfectly fitted for single A4 page */}
      <Box sx={{ position: "absolute", top: -9999, left: -9999, width: "794px", zIndex: -1 }}>
        <Box
          ref={pdfRef}
          sx={{
            width: "794px",
            bgcolor: "#ffffff",
            p: "24px 36px",
            boxSizing: "border-box",
            color: "#1e293b",
            fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          }}
        >
          {/* Top Centered Central Bank Logo & Header */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderBottom: "2px solid #0E4F8D", pb: 1, mb: 1.5 }}>
            <img src={centralbanklogo} alt="Central Bank of India" style={{ height: 50, objectFit: "contain", marginBottom: "4px" }} />
            <Typography sx={{ fontSize: "11px", fontWeight: 800, color: "#0E4F8D", letterSpacing: "1px", textTransform: "uppercase" }}>
              CENTRAL BANK OF INDIA
            </Typography>
            <Typography sx={{ fontSize: "9.5px", color: "#64748b", fontWeight: 600 }}>
              Payment Aggregator Commercial Proposal
            </Typography>
          </Box>

          {/* Date Row */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Typography sx={{ fontSize: "10.5px", color: "#334155", fontWeight: 600 }}>
              Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </Typography>
          </Box>

          {/* LETTER TO SECTION */}
          <Box sx={{ mb: 1.2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "11px", color: "#0f172a" }}>To,</Typography>
            <Typography sx={{ fontSize: "11px", color: "#334155" }}>The Regional Office / Branch Manager</Typography>
            <Typography sx={{ fontSize: "11px", color: "#334155" }}>
              Central Bank of India, {branchName || "Branch Name"} Branch ({branchLocation || "Mumbai"})
            </Typography>
          </Box>

          {/* SUBJECT */}
          <Box sx={{ mb: 1.2, p: 0.7, bgcolor: "#f8fafc", borderRadius: "4px", borderLeft: "3.5px solid #0E4F8D" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "11px", color: "#0E4F8D" }}>
              Subject: Acceptance of Commercial Quotation for Payment Aggregator Services – {currentApp?.customerName || "Customer"}
            </Typography>
          </Box>

          {/* BODY PARAGRAPH */}
          <Typography sx={{ fontSize: "10.5px", lineHeight: 1.4, color: "#334155", mb: 1 }}>
            Dear Sir/Madam,
            <br />
            I/We hereby confirm that the commercial quotation provided by Central Bank of India for Payment Aggregator services has been reviewed, verified, and accepted. Below are the agreed commercial charges applicable for our onboarding:
          </Typography>

          {/* QUOTATION TABLE (COMPACT DENSE) */}
          <Box sx={{ mb: 1 }}>
            <AcceptedQuotationTable quoteDetails={quoteDetails} compact={true} />
          </Box>

          {/* DECLARATION */}
          <Typography sx={{ fontSize: "10px", lineHeight: 1.35, color: "#475569", mb: 1.5 }}>
            <strong>Declaration:</strong> I/We understand and agree that the commercial terms mentioned above are as mutually agreed with the Bank. I/We hereby authorize Central Bank of India and its authorized aggregator partners to proceed with technical integration and merchant onboarding.
          </Typography>

          {/* SIGNATURE SECTION */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 1, borderTop: "1px dashed #cbd5e1" }}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "10.5px", color: "#0f172a", mb: 0.4 }}>
                Authorized Signatory & Stamp:
              </Typography>
              <Box
                sx={{
                  border: "1px solid #94a3b8",
                  height: 44,
                  width: 200,
                  borderRadius: "4px",
                  bgcolor: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Typography sx={{ fontSize: "9px", color: "#94a3b8" }}>Customer Signature & Stamp</Typography>
              </Box>
              <Typography sx={{ fontSize: "9.5px", color: "#64748b", mt: 0.3 }}>
                Name: {currentApp?.customerName || ""}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Box sx={{ mb: 0.8 }}>
                <Typography sx={{ fontSize: "10px", color: "#334155", fontWeight: 600 }}>
                  Date: ____________________
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: "10px", color: "#334155", fontWeight: 600 }}>
                  Place: ____________________
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Visible Screen */}
      <Box p={2.5} component={Paper} variant="outlined" sx={{ borderRadius: "12px", border: "1px solid #cbd5e1", mb: 3 }}>
        {/* Visible Quotation Details Table Toggle */}
        {showQuotation && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "15px", color: "#0E4F8D", mb: 1.2 }}>
              Quotation Details (Commercial Proposals):
            </Typography>
            <AcceptedQuotationTable quoteDetails={quoteDetails} />
          </Box>
        )}

        {currentApp?.isQuoteAcceptRO ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={3} gap={2}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Box
                sx={{
                  bgcolor: "#dcfce7",
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: "18px",
                  px: 3.5,
                  py: 1,
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                  display: "inline-block"
                }}
              >
                Quotation Accepted
              </Box>
              {currentApp?.customerAcceptanceRequired === false && (
                <Chip
                  label="Customer Acceptance Waived"
                  color="warning"
                  variant="filled"
                  sx={{ fontWeight: 600, fontSize: "13px", height: "34px" }}
                />
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={currentApp?.customerAcceptanceFile}
                  canUpload={false}
                  name="customerAcceptanceFile"
                  label={
                    currentApp?.customerAcceptanceRequired === false
                      ? "Customer Acceptance (Waived)"
                      : "Customer Acceptance"
                  }
                  value={customerAcceptanceFile || currentApp?.customerAcceptanceFile}
                  setFieldValue={setCustomerAcceptanceFile}
                  direct
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={currentApp?.rhRecommendationFile}
                  canUpload={false}
                  name="rhRecommendationFile"
                  label="RH Recommendation"
                  value={rhRecommendationFile || currentApp?.rhRecommendationFile}
                  setFieldValue={setRhRecommendationFile}
                  direct
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 2.5, p: 2, bgcolor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" gutterBottom>
                Acceptance Mode:
              </Typography>
              <RadioGroup
                row
                value={isWaived ? "waived" : "standard"}
                onChange={(e) => setIsWaived(e.target.value === "waived")}
              >
                <FormControlLabel
                  value="standard"
                  control={<Radio size="small" sx={{ color: "#0E4F8D", "&.Mui-checked": { color: "#0E4F8D" } }} />}
                  label={<Typography variant="body2" fontWeight={500}>Standard Acceptance (Upload Signed Documents)</Typography>}
                />
                <FormControlLabel
                  value="waived"
                  control={<Radio size="small" sx={{ color: "#0E4F8D", "&.Mui-checked": { color: "#0E4F8D" } }} />}
                  label={
                    <Typography variant="body2" color="#0E4F8D" fontWeight={700}>
                      Waive Customer Acceptance (Approved at RO Level)
                    </Typography>
                  }
                />
              </RadioGroup>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.8,
                  mt: 1,
                  p: 1,
                  bgcolor: isWaived ? "#eff6ff" : "#f1f5f9",
                  borderRadius: "6px",
                  border: isWaived ? "1px solid #bfdbfe" : "1px solid #e2e8f0"
                }}
              >
                <InfoOutlined sx={{ fontSize: 18, color: isWaived ? "#1d4ed8" : "#64748b" }} />
                <Typography variant="caption" sx={{ color: isWaived ? "#1e40af" : "#475569", fontWeight: isWaived ? 600 : 500, fontSize: "12px" }}>
                  {isWaived
                    ? "Waiver Active: RH Recommendation document is required to approve waiver. Customer Acceptance is optional."
                    : "Standard Mode: Signed Customer Acceptance and RH Recommendation documents are required to proceed."}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} mb={1}>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={currentApp?.customerAcceptanceFile}
                  canUpload={isRO || isAdmin}
                  name="customerAcceptanceFile"
                  label={isWaived ? "Customer Acceptance (Optional)" : "Customer Acceptance"}
                  value={customerAcceptanceFile || currentApp?.customerAcceptanceFile}
                  setFieldValue={setCustomerAcceptanceFile}
                  required={!isWaived}
                  direct
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={currentApp?.rhRecommendationFile}
                  canUpload={isRO || isAdmin}
                  name="rhRecommendationFile"
                  label="RH Recommendation"
                  value={rhRecommendationFile || currentApp?.rhRecommendationFile}
                  setFieldValue={setRhRecommendationFile}
                  required={true}
                  direct
                />
              </Grid>
            </Grid>

            <Box display="flex" flexDirection="column" gap={2} mb={3} mt={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    sx={{ color: "#0E4F8D", "&.Mui-checked": { color: "#0E4F8D" } }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    I hereby accept the above quotation details.
                  </Typography>
                }
              />
            </Box>

            {isRejected ? (
              <Box mt={2}>
                <Typography
                  variant="body2"
                  sx={{
                    p: 2,
                    bgcolor: "#fef2f2",
                    color: "#991b1b",
                    fontWeight: 700,
                    borderRadius: "8px",
                    border: "1.5px solid #ef4444"
                  }}
                >
                  This application is REJECTED. Quotation acceptance, revisions, and approvals are disabled.
                  {currentApp?.reasonOfRejection ? ` (Reason: ${currentApp.reasonOfRejection})` : ""}
                </Typography>
              </Box>
            ) : (
              <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleReject}
                  sx={{ px: 4, borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                >
                  Reject Quotation
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleAccept}
                  sx={{ px: 4, borderRadius: "8px", textTransform: "none", fontWeight: 700 }}
                >
                  Accept Quotation
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default AcceptedQuoteTable;