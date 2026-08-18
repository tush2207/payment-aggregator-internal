import { centralbanklogo } from "&src/assets";
import {
  ACCEPTED_PROJECTION_COLUMNS_FOR_RO,
  isRO,
  user_Id
} from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { PERCENTAGE, formatNumber } from "&src/utils";
import { calculateTotals } from "&src/utils/calculation";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download, InfoOutlined } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { fetchApplicationDetails, closeWorkflowDialog } from "&src/store/applicationFlowSlice";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
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
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmationDialogWithReason from "&src/components/Dialog/ConfirmationDialogWithReason";
import FileUploadOrView from "&src/components/FileUploadOrView";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import NoData from "&src/components/NoData";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";

// ---------------- COMPONENTS ----------------
const AcceptedQuotationTable = ({ quoteDetails }) => {
  const headerCellSx = {
    fontWeight: 700,
    fontSize: "12px",
    py: "10px !important",
    px: "12px !important",
    color: "#ffffff",
    bgcolor: "#002060",
    border: "1px solid #cbd5e1",
    textTransform: "uppercase",
    textAlign: "center"
  };

  const cellSx = {
    fontSize: "12px",
    py: "8px !important",
    px: "12px !important",
    border: "1px solid #cbd5e1",
    color: "#000000"
  };

  return (
    <TableContainer sx={{ overflowX: "auto", maxWidth: "100%", border: "1px solid #cbd5e1", borderRadius: "4px", mt: 2, mb: 2 }}>
      <Table size="small" sx={{ width: "100%", borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, width: "15%" }}>SR NO</TableCell>
            <TableCell sx={{ ...headerCellSx, width: "55%", textAlign: "left" }}>TYPE OF TRANSACTION</TableCell>
            <TableCell sx={{ ...headerCellSx, width: "30%" }}>CHARGES PROPOSED</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quoteDetails?.length ? (
            quoteDetails.map((row, idx) => {
              const isSubBank = row.isIB;
              return (
                <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                  <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, pl: isSubBank ? 5 : 2, fontStyle: isSubBank ? "italic" : "normal", fontWeight: isSubBank ? 500 : 700 }}>
                    {row.transactionType}
                    {row.transactionTypePercent && isSubBank ? ` (${row.transactionTypePercent})` : ""}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, textAlign: "center", fontWeight: 700 }}>
                    {row.allow ? (row.unit === PERCENTAGE ? `${row.chargesProposed}${PERCENTAGE}` : `${row.chargesProposed}`) : ""}
                  </TableCell>
                </TableRow>
              );
            })
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

const AcceptanceSection = ({ accepted, onReject, setAccepted, onAccept }) => (
  <Box mt={4}>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 2 }}>
      Kindly review carefully before final acceptance.
    </Typography>
    <FormControlLabel
      control={
        <Checkbox
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          color="success"
        />
      }
      label="I hereby accept the above quotation details."
    />
    <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
      <Button
        sx={{
          width: 100
        }}
        disabled={!accepted}
        variant="outlined"
        color="error"
        onClick={onReject}
      >
        Reject
      </Button>
      <Button
        sx={{
          width: 100
        }}
        disabled={!accepted}
        variant="contained"
        color="success"
        onClick={onAccept}
      >
        Accept
      </Button>
    </Box>
  </Box>
);

// ---------------- MAIN ----------------
const AcceptedQuoteTable = ({ customer, applicationId }) => {
  const { finalizedAggregatorId: aggregatorId } = customer || {};
  const dispatch = useDispatch();

  // ⬇️ Get user details from session storage
  const userDetails = useMemo(() => {
    const stored = sessionStorage.getItem('userDetails');
    return stored && JSON.parse(stored);
  }, []);

  const { employeeName, pfId, department, branchName, branchLocation, role: userRole } = userDetails || {};
  const pdfRef = useRef();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [customerAcceptanceFile, setCustomerAcceptanceFile] = useState(customer?.customerAcceptanceFile);
  const [rhRecommendationFile, setRhRecommendationFile] = useState(customer?.rhRecommendationFile);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showQuotation, setShowQuotation] = useState(true);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [fileError, SetFileError] = useState({});
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showDownload, setShowDownload] = useState(false);

  console.log('customerAcceptanceFile', customerAcceptanceFile);

  useEffect(() => {
    if (!applicationId || !aggregatorId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await aggregatorProjections.getAllProjections(applicationId, aggregatorId);
        setQuoteDetails(Array.isArray(res?.data) && res.data);
      } catch {
        errorNotification("Failed to fetch projections");
        setQuoteDetails([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId, aggregatorId]);

  const updateApplicationFlow = async (payload) => {
    setLoading(true);
    try {
      await applicationServices.updateApplication(applicationId, payload);
      successNotification("✅ Application updated successfully");
      if (applicationId) {
        dispatch(fetchApplicationDetails(applicationId));
      }
    } catch {
      errorNotification("Failed to update application");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (customerAcceptanceFile === null || rhRecommendationFile === null) {
      SetFileError('Please upload RH Recommendation / Customer Acceptance');
      errorNotification("Please upload RH Recommendation / Customer Acceptance");
      return;
    }

    if (!accepted) return errorNotification("Please accept before proceeding");

    if (customer?.approvedByROId !== user_Id) return errorNotification("You are not the authorised person to approve this quotation.");

    await updateApplicationFlow({
      isQuoteAcceptRO: true,
      reasonOfRejection: "",
      status: 'quoteaccepted',
      approvedByQuoteId: user_Id,
      customerAcceptanceFile: customerAcceptanceFile,
      rhRecommendationFile: rhRecommendationFile
    });
    dispatch(closeWorkflowDialog());
  };

  const handleReject = () => {
    if (!accepted) return errorNotification("Please check acceptance before rejecting");
    setConfirmDialogOpen(true);
  };

  const handleConfirmReject = async (reasonText) => {
    console.log(reasonText, 'reasonText');
    if (reasonText === '') return errorNotification('Reason of rejection is required.');
    setConfirmDialogOpen(false);
    await updateApplicationFlow({
      isQuoteAcceptRO: false,
      reasonOfRejection: reasonText || null,
      isQuoteReviewCO: false,
      status: 'quoterejected'
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setShowDownload(true);

      // Wait for table + content to fully render
      await new Promise((res) => setTimeout(res, 300));

      const pdfElement = pdfRef.current;

      // CLEAN WHITE BACKGROUND
      pdfElement.style.background = "#fff";

      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pdfWidth = pageWidth - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${customer?.customerName || "Customer"}.pdf`);

      successNotification("Downloaded successfully");
    } catch (err) {
      console.log(err);
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
      {!customer?.isQuoteAcceptRO && (
        <Box sx={{ mb: 2 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "12px",
              borderColor: "info.light",
              bgcolor: "info.50",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box display="flex" gap={2} alignItems="flex-start">
              <Typography color="info.main" sx={{ mt: 0.5 }}>
                <InfoOutlined fontSize="large" />
              </Typography>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="info.dark" gutterBottom>
                  Quotation Prepared Successfully
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "750px", lineHeight: 1.4 }}>
                  The quotation has been prepared based on the finalized transaction projections.
                  Please <strong>download the quotation letter</strong>, obtain the customer's signature/stamp,
                  and upload it back in the <strong>Customer Acceptance</strong> section below along with the
                  <strong>RH Recommendation</strong> file.
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              onClick={handleDownloadPDF}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                py: 1,
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                whiteSpace: "nowrap"
              }}
            >
              Download Quotation
            </Button>
          </Paper>
        </Box>
      )}

      {/* Hidden printable container for PDF generation */}
      <Box sx={{ position: "absolute", top: -9999, left: -9999, width: "794px", zIndex: -1 }}>
        <Container
          maxWidth="md"
          component={Paper}
          elevation={3}
          ref={pdfRef}
          sx={{ p: 5, pl: '50px', borderRadius: 3, position: "relative", overflow: "hidden", bgcolor: "#fff" }}
        >
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <img src={centralbanklogo} alt="Logo" style={{ height: 75 }} />
          </Box>

          <Box sx={{ p: 5, mt: 5, color: "#000", fontSize: "14px", lineHeight: 1.7 }}>
            {/* LETTER HEADER */}
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontWeight: 600 }}>To,</Typography>
              <Typography>The Regional Office</Typography>
              <Typography>Central Bank of India</Typography>
              <Typography>{branchName || "Branch Name"} Branch</Typography>
              <Typography>{branchLocation || "Mumbai"}</Typography>
            </Box>

            {/* SUBJECT */}
            <Typography sx={{ fontWeight: 600, mb: 2 }}>
              Subject: Acceptance of Quotation for Payment Aggregator Services
            </Typography>

            {/* BODY PARAGRAPH */}
            <Typography sx={{ mb: 3 }}>
              Dear Sir/Madam,
              <br /><br />
              I/We hereby confirm that the quotation provided by the Bank for Payment Aggregator
              services has been reviewed, verified and accepted. Below are the quotation details
              that have been mutually agreed upon:
            </Typography>

            {/* INSERT QUOTATION TABLE HERE */}
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Quotation Details (As Accepted):
              </Typography>
              <AcceptedQuotationTable quoteDetails={quoteDetails} />
            </Box>

            {/* DECLARATION */}
            <Typography sx={{ mt: 3 }}>
              I/We understand that the final charges may vary based on the actual transactions,
              and hereby authorize the Bank to proceed with the implementation accordingly.
            </Typography>

            {/* SIGNATURE SECTION */}
            <Box sx={{ mt: 5 }}>
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Customer Signature:</Typography>
                <Box sx={{ border: "1px solid #000", height: 70, width: "30%", borderRadius: 1 }} />
              </Box>
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Date:</Typography>
                <Box sx={{ borderBottom: "1px solid #000", width: "25%", height: 25 }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Visible Screen */}
      <Box p={2} component={Paper} variant="outlined" sx={{ borderRadius: "12px", border: "1px solid #cbd5e1", mb: 3 }}>

        {/* Visible Quotation Details Table */}
        {/* <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>
            Quotation Details:
          </Typography>
          <AcceptedQuotationTable quoteDetails={quoteDetails} />
        </Box> */}

        {customer?.isQuoteAcceptRO ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={2}>
            <Box
              sx={{
                bgcolor: "#dcfce7",
                color: "#166534",
                fontWeight: 700,
                fontSize: "24px",
                px: 4,
                py: 1.5,
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                display: "inline-block",
                mb: 3
              }}
            >
              Accepted
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={customer?.customerAcceptanceFile}
                  canUpload={false}
                  name="customerAcceptanceFile"
                  label="Customer Acceptance"
                  value={customerAcceptanceFile || customer?.customerAcceptanceFile}
                  setFieldValue={setCustomerAcceptanceFile}
                  direct
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={customer?.rhRecommendationFile}
                  canUpload={false}
                  name="rhRecommendationFile"
                  label="RH Recommendation"
                  value={rhRecommendationFile || customer?.rhRecommendationFile}
                  setFieldValue={setRhRecommendationFile}
                  direct
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} mb={1}>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={customer?.customerAcceptanceFile}
                  canUpload={isRO}
                  name="customerAcceptanceFile"
                  label="Customer Acceptance"
                  value={customerAcceptanceFile || customer?.customerAcceptanceFile}
                  setFieldValue={setCustomerAcceptanceFile}
                  required
                  direct
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FileUploadOrView
                  appId={customer?.rhRecommendationFile}
                  canUpload={isRO}
                  name="rhRecommendationFile"
                  label="RH Recommendation"
                  value={rhRecommendationFile || customer?.rhRecommendationFile}
                  setFieldValue={setRhRecommendationFile}
                  required
                  direct
                />
              </Grid>
            </Grid>

            <Box display="flex" flexDirection="column" gap={2} mb={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I hereby accept the above quotation details.
                  </Typography>
                }
              />
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                onClick={handleReject}
                sx={{ px: 4, borderRadius: "8px" }}
              >
                Reject Quotation
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleAccept}
                sx={{ px: 4, borderRadius: "8px" }}
              >
                Accept Quotation
              </Button>
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default AcceptedQuoteTable;