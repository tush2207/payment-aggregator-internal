import {
  ACCEPTED_PROJECTION_COLUMNS_FOR_RO,
  isRO,
  PROJECTION_COLUMNS_FOR_CO,
  user_role,
} from "&src/constants/PaymentAggregratorConstant";

import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import NoData from "../NoData";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { PROJECTION_LIST_BASED_ON_AGG } from "&src/data/data";
import { calculateTotals } from "&src/utils/calculation";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AcceptedQuoteTable = ({ customer, applicationId, aggregatorId, applicationDetails }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const pdfRef = useRef(); // 🔹 Ref for capturing PDF

  // 🔹 Fetch Projection Details
  const fetchSelectedAggregatorDetails = async () => {
    setLoading(true);
    try {
      const response = await aggregatorProjections.getAllProjections(
        applicationId,
        aggregatorId
      );
      if (Array.isArray(response?.data)) {
        setQuoteDetails(response.data);
      }
    } catch (error) {
      console.error("[ERROR] Failed to fetch projections:", error);
      errorNotification(
        error?.response?.data?.message || "Failed to fetch projections"
      );
      // TODO: static Data
      // setQuoteDetails(PROJECTION_LIST_BASED_ON_AGG); // fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId && aggregatorId) fetchSelectedAggregatorDetails();
  }, [applicationId, aggregatorId]);

  /* -------------------- TOTALS -------------------- */
  const totals = useMemo(() => calculateTotals(quoteDetails), [quoteDetails]);

  /* -------------------- HELPER: Update Application -------------------- */
  const updateApplicationFlow = async (statusFlags) => {
    try {
      const payload = {
        ...applicationDetails,
        ...statusFlags,
      };

      const response = await applicationServices.updateApplication(
        applicationId,
        payload
      );

      successNotification("✅ Application updated successfully");
      console.log("✅ Updated application:", response);
    } catch (err) {
      console.error("❌ Error updating application:", err);
      errorNotification("Failed to update application");
    }
  };

  /* -------------------- ACTION HANDLERS -------------------- */
  const handleAcceptance = async () => {
    if (!accepted) {
      errorNotification("Please accept the declaration before proceeding");
      return;
    }
    await updateApplicationFlow({
      isQuoteAcceptRO: true,
    });
  };

  /* -------------------- PDF DOWNLOAD -------------------- */
  const handleDownloadPDF = async () => {
    const input = pdfRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth - 20; // padding
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 10;
    pdf.addImage(imgData, "PNG", 10, position, pdfWidth, pdfHeight);
    pdf.save(`Quotation_${customer?.customerName || "Customer"}.pdf`);
  };

  return (
    <Box display="flex" justifyContent="center" mt={4}>
      <Container
        component={Paper}
        elevation={3}
        sx={{
          // maxWidth: "800px",
          p: 4,
          borderRadius: 3,
          background: "#fafafa",
        }}
        ref={pdfRef} // 🔹 This section will be converted into PDF
      >
        {/* Letter Header */}
        <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
          Quotation Document
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Customer Info */}
        <Box mb={2}>
          <Typography variant="body1">
            <b>Customer Name:</b> {customer?.customerName || "N/A"}
          </Typography>
          <Typography variant="body1">
            <b>Application ID:</b> {applicationId || "N/A"}
          </Typography>
          <Typography variant="body1">
            <b>Aggregator ID:</b> {aggregatorId || "N/A"}
          </Typography>
        </Box>

        {/* Note Section */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <b>Note:</b> This quotation has been prepared based on transaction projections and
          may vary as per actual usage.
        </Typography>

        {/* Table Section */}
        <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
          Projection Quote Details
        </Typography>

        <Table size="small" sx={{ border: "1px solid #e0e0e0", mb: 2 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              {ACCEPTED_PROJECTION_COLUMNS_FOR_RO.map((col, idx) => (
                <TableCell key={idx} sx={{ fontWeight: 600, fontSize: "14px" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {quoteDetails && quoteDetails.length > 0 ? (
              <>
                {quoteDetails.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>{rowIndex + 1}</TableCell>
                    <TableCell>{row.transactionType}</TableCell>
                    <TableCell>{row.chargesProposed}</TableCell>
                  </TableRow>
                ))}
                {/* Totals Row */}
                <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                  <TableCell colSpan={2} sx={{ fontWeight: 600 }}>
                    Total
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {totals?.totalCharges || 0}
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={PROJECTION_COLUMNS_FOR_CO.length} align="center">
                  <NoData />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Kindly review carefully before final acceptance.
        </Typography>

        {/* Acceptance Section */}
        <Box mt={2} mb={3}>
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                color="primary"
              />
            }
            label="I hereby accept the above quotation details."
          />
        </Box>
      </Container>

      {/* Buttons Outside PDF */}
      <Box display="flex" gap={2} justifyContent="center" mt={2}>
        {isRO && !customer?.isQuoteAcceptRO && (
          <Button
            variant="contained"
            color="success"
            onClick={handleAcceptance}
          >
            Accept Quote
          </Button>
        )}
        <Button variant="outlined" color="primary" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </Box>
    </Box>
  );
};

export default AcceptedQuoteTable;
