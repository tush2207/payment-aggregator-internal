import { centralbanklogo } from "&src/assets";
import {
  ACCEPTED_PROJECTION_COLUMNS_FOR_RO,
  isRO,
  user_Id
} from "&src/constants/PaymentAggregratorConstant";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { PERCENTAGE } from "&src/utils";
import { Download } from "@mui/icons-material";
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
  Typography
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmationDialogWithReason from "../Dialog/ConfirmationDialogWithReason";
import FileUploadOrView from "../FileUploadOrView";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import NoData from "../NoData";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";

// ---------------- COMPONENTS ----------------
const QuoteTableRO = ({ quoteDetails }) => (
  <Table size="small" sx={{ border: "1px solid #e0e0e0", mb: 2 }}>
    <TableHead>
      <TableRow>
        {ACCEPTED_PROJECTION_COLUMNS_FOR_RO.map((col, idx) => (
          <TableCell key={idx} sx={{ fontWeight: 600, fontSize: "14px" }}>
            {col}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {quoteDetails?.length ? (
        quoteDetails.map((row, i) => (
          <TableRow key={i}>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{row.transactionType}</TableCell>
            <TableCell sx={{ fontWeight: '600' }}>
              {!["Internet banking", "Debit card - Rupay", "UPI"].includes(row.transactionType) && row.chargesProposed}{row.unit === PERCENTAGE && row.unit}
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={ACCEPTED_PROJECTION_COLUMNS_FOR_RO.length} align="center">
            <NoData />
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

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

  // ⬇️ Get user details from session storage
  const userDetails = useMemo(() => {
    const stored = sessionStorage.getItem('userDetails');
    return stored && JSON.parse(stored)
  }, []);

  const { employeeName, pfId, department, branchName, branchLocation, role: userRole } = userDetails || {};
  const pdfRef = useRef();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [customerAcceptanceFile, setCustomerAcceptanceFile] = useState(customer?.customerAcceptanceFile);
  const [rhRecommendationFile, setRhRecommendationFile] = useState(customer?.rhRecommendationFile);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [showQuotation, setShowQuotation] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [accepted, setAccepted] = useState(false);
  const [fileError, SetFileError] = useState({});
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [showDownload, setShowDownload] = useState(false)


  console.log('customerAcceptanceFile', customerAcceptanceFile)
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
      window.location.reload();
    } catch {
      errorNotification("Failed to update application");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (customerAcceptanceFile === null || !rhRecommendationFile === null) {
      SetFileError('Please upload RH Recommendation / Customer Acceptance')
      errorNotification("Please upload RH Recommendation / Customer Acceptance")
      return;
    };

    if (!accepted) return errorNotification("Please accept before proceeding");

    if (customer?.approvedByROId !== user_Id) return errorNotification("You are not the authorised person to approve this quotation.");

    await updateApplicationFlow({ isQuoteAcceptRO: true, reasonOfRejection: "", status: 'quoteaccepted', approvedByQuoteId: user_Id, customerAcceptanceFile: customerAcceptanceFile, rhRecommendationFile: rhRecommendationFile });

  };

  const handleReject = () => {
    if (!accepted) return errorNotification("Please check acceptance before rejecting");
    setConfirmDialogOpen(true);
  };

  const handleConfirmReject = async (reasonText) => {
    console.log(reasonText, 'reasonText')
    if (reasonText === '') return errorNotification('Reason of rejection is required.')
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

      {/* Toggle Line */}
      <Box display="flex" gap={2} justifyContent={showQuotation ? "space-between" : "center"} m="12px 0">
        <Typography variant="body1" color="green" border="1px solid green" p={1} borderRadius={2}>
          Quotation has been prepared based on transaction projections.&nbsp;
          <Typography
            component="span"
            sx={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setShowQuotation(!showQuotation)}
          >
            {showQuotation ? "Hide Quotation" : "View Quotation"}
          </Typography>
        </Typography>
        {showQuotation && !customer?.isQuoteAcceptRO && (
          <Typography
            component="span"
            sx={{ color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
            onClick={handleDownloadPDF}
          >
            Download Quotation <Download />
          </Typography>
        )}
      </Box>

      {showQuotation && customer?.isQuoteAcceptRO &&
        <Container sx={{ position: 'relative' }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
            Quotation Document
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1"><b>Customer Name:</b> {customer?.customerName}</Typography>
          <Typography variant="body1" color="blue" sx={{ mt: 2, mb: 2 }}>
            <b>Note:</b> This quotation has been prepared based on transaction projections and may vary as per actual usage.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
            Projection Quote Details
          </Typography>
          <Box
            sx={{
              position: "absolute",
              top: "65%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-30deg)",
              fontSize: "70px",
              fontWeight: 900,
              color: "rgba(0, 128, 0, 0.2)",
              zIndex: 0,
            }}
          >
            ACCEPTED
          </Box>
          <QuoteTableRO quoteDetails={quoteDetails} />
        </Container>
      }

      {/* Quotation */}
      {showQuotation && !customer?.isQuoteAcceptRO && (
        <Container maxWidth='md'
          component={Paper} mt={2} mb={4}
          sx={{ p: 5, pl: '50px', borderRadius: 3, position: "relative", overflow: "hidden" }}
        >
          <Container
            maxWidth='md'
            component={Paper}
            elevation={3}
            ref={pdfRef}
            sx={{ p: 5, pl: '50px', borderRadius: 3, position: "relative", overflow: "hidden", }}
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
                <Typography>{branchName} Branch</Typography>
                <Typography>Mumbai</Typography>
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
              {/* ——— THIS IS THE TABLE BLOCK FROM STEP 1 ——— */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Quotation Details (As Accepted):
                </Typography>

                <QuoteTableRO quoteDetails={quoteDetails} />

              </Box>

              {/* DECLARATION */}
              <Typography sx={{ mt: 3 }}>
                I/We understand that the final charges may vary based on the actual transactions,
                and hereby authorize the Bank to proceed with the implementation accordingly.
              </Typography>

              {/* SIGNATURE SECTION */}
              <Box sx={{ mt: 5 }}>
                {/* Customer Signature */}
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Customer Signature:</Typography>
                  <Box sx={{ border: "1px solid #000", height: 70, width: "30%", borderRadius: 1 }} />
                </Box>
                {/* Date */}
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Date:</Typography>
                  <Box sx={{ borderBottom: "1px solid #000", width: "25%", height: 25 }} />
                </Box>
              </Box>

            </Box>
          </Container>


          <Grid container spacing={1} mt={2}>
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

          {!customer?.isQuoteAcceptRO &&
            <AcceptanceSection
              accepted={accepted}
              customerDetails={customer}
              setAccepted={setAccepted}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          }
        </Container>
      )}
    </>
  );
};

export default AcceptedQuoteTable;
