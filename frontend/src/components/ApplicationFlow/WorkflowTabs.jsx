import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Tabs,
  Tab,
  Stack,
  Chip
} from "@mui/material";
import { Download, DescriptionOutlined, CheckCircle } from "@mui/icons-material";
import {
  selectApplicationDetails,
  selectCurrentStep,
  selectUserRole,
} from "&src/store/applicationFlowSlice";
import applicationServices from "&src/services/applications";
import { isUserAdmin } from "&src/utils";

// Reusable child components
import ProjectDetailsTable from "./ProjectDetailsTable";
import UpdateProjectionPercentage from "./UpdateProjectionPercentage";
import AggregatorDetails from "./AggregatorQuoteTable";
import AcceptedQuoteTable from "./AcceptedQuoteTable";
import POForm from "./POForm";
import usePOGenerator from "&src/hooks/usePOGenerator";

export default function WorkflowTabs() {
  const selectedApplication = useSelector(selectApplicationDetails);
  const currentStep = useSelector(selectCurrentStep);
  const userRole = useSelector(selectUserRole);
  const [showPOFormFields, setShowPOFormFields] = useState(false);
  const [finalizedTab, setFinalizedTab] = useState("finalized");
  const [downloadingSanction, setDownloadingSanction] = useState(false);

  const { poFormDetails, poLoading, generatePO } = usePOGenerator(selectedApplication);

  const handleDownloadSanctionLetter = async () => {
    if (!selectedApplication?.applicationId) return;
    setDownloadingSanction(true);
    try {
      const response = await applicationServices.generateSanctionLetter(selectedApplication.applicationId);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Sanction_Letter_${selectedApplication.applicationId}_${(selectedApplication.customerName || 'Merchant').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download sanction letter:', err);
    } finally {
      setDownloadingSanction(false);
    }
  };

  if (!selectedApplication) {
    return <Typography sx={{ p: 2 }}>No application details loaded.</Typography>;
  }

  // Active step details helper with full title and description
  const getStepHeader = () => {
    switch (currentStep) {
      case 0:
        return {
          num: 1,
          title: "Projection & Volume Estimation",
          description: "Define annual transaction volumes, average ticket sizes, and payment mode distributions.",
          role: "Central Office (CO)",
          status: "Active"
        };
      case 1:
        return {
          num: 2,
          title: "Aggregator Selection & RFP Dispatch",
          description: "Select payment aggregators, set submission deadlines, and dispatch official RFP quotation request emails.",
          role: "Central Office (CO)",
          status: "Active"
        };
      case 2:
        return {
          num: 3,
          title: "Add Markup & Commercial Quote Evaluation",
          description: "Enter proposed bank markup charges, evaluate aggregator quotes, and compare Cost-Benefit Analysis (CBA).",
          role: "Central Office (CO)",
          status: "Active"
        };
      case 3:
        return {
          num: 4,
          title: "Quotation Preview & Merchant Acceptance",
          description: "Review finalized quotation, obtain customer acceptance or process merchant rate negotiation.",
          role: "Regional Office (RO) / CO",
          status: "Active"
        };
      case 4:
        return {
          num: 5,
          title: "Purchase Order (PO) Details & Sanction Letter",
          description: "Generate official Central Bank Sanction Letter and issue finalized Purchase Order.",
          role: "Central Office (CO)",
          status: "Active"
        };
      default:
        return {
          num: 5,
          title: "Workflow Completed & Purchase Order Issued",
          description: "Sanction letter and Purchase Order generated for finalized payment aggregator.",
          role: "Central Office (CO)",
          status: "Completed"
        };
    }
  };

  const stepHeader = getStepHeader();
  const userDetails = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);
  const isAdmin = isUserAdmin(userDetails);
  const currentUserId = sessionStorage.getItem('userId') || sessionStorage.getItem('user_id') || userDetails.employeeId || userDetails.pfNumber;
  const isReadOnlyUser = String(currentUserId) === '115019' || !isAdmin;
  const isRejected = selectedApplication?.status?.toLowerCase()?.includes('reject') || Boolean(selectedApplication?.reasonOfRejection) || Boolean(selectedApplication?.rejectedDate);

  const canEdit =
    !isRejected &&
    !isReadOnlyUser &&
    isAdmin &&
    currentStep < 5;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Show Step Banner only for CO and ADMIN when workflow is still active (Hidden for RO and once completed) */}
      {userRole !== "RO" && currentStep < 5 && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 1.5,
            px: 2,
            borderRadius: "8px",
            background: "linear-gradient(90deg, #f0f7ff 0%, #ffffff 100%)",
            border: "1px solid #bfdbfe",
            borderLeft: "5px solid #0E4F8D",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "6px",
                background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: "0 2px 6px rgba(14,79,141,0.25)",
              }}
            >
              {stepHeader.num}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a", fontSize: "14px", lineHeight: 1.2 }}>
                Step {stepHeader.num}: {stepHeader.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontSize: "11.5px", mt: 0.2, display: "block" }}>
                {stepHeader.description}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={`Role: ${stepHeader.role}`}
              sx={{
                bgcolor: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 700,
                fontSize: "11px",
                height: "24px",
                border: "1px solid #bae6fd",
              }}
            />
            <Chip
              size="small"
              label={currentStep >= 5 ? "Completed" : `Step ${stepHeader.num} of 5 Active`}
              sx={{
                bgcolor: currentStep >= 5 ? "#dcfce7" : "#fef3c7",
                color: currentStep >= 5 ? "#15803d" : "#92400e",
                fontWeight: 800,
                fontSize: "11px",
                height: "24px",
                border: currentStep >= 5 ? "1px solid #bbf7d0" : "1px solid #fde68a",
              }}
            />
          </Stack>
        </Paper>
      )}

      {/* Render active screen only */}
      <Box>
        {/* ========================================================
            STEP 1: UPDATE PROJECTION
            ======================================================== */}
        {currentStep === 0 && (
          <Box>
            {canEdit ? (
              <UpdateProjectionPercentage customerDetails={selectedApplication} />
            ) : (
              <ProjectDetailsTable application={selectedApplication} />
            )}
          </Box>
        )}

        {/* ========================================================
            STEP 2: ADD AGGREGATOR
            ======================================================== */}
        {currentStep === 1 && (
          <Box>
            <AggregatorDetails customerDetails={selectedApplication} />
          </Box>
        )}

        {/* ========================================================
            STEP 3: ADD MARKUP
            ======================================================== */}
        {currentStep === 2 && (
          <Box>
            <AggregatorDetails customerDetails={selectedApplication} />
          </Box>
        )}

        {/* ========================================================
            STEP 4: QUOTATION PREVIEW & ACCEPTANCE
            ======================================================== */}
        {/* ========================================================
            STEP 4: QUOTATION PREVIEW & ACCEPTANCE
            ======================================================== */}
        {currentStep === 3 && (
          <Box>
            {userRole === "RO" ? (
              <AcceptedQuoteTable
                customer={selectedApplication}
                applicationId={selectedApplication.applicationId}
              />
            ) : (
              <AggregatorDetails customerDetails={selectedApplication} />
            )}
          </Box>
        )}

        {/* ========================================================
            STEP 5: ADD PO DETAILS
            ======================================================== */}
        {currentStep === 4 && (
          <Box>
            {canEdit ? (
              !showPOFormFields ? (
                <Box>
                  <Paper variant="outlined" sx={{ p: 4, borderRadius: "12px", border: "1px solid #cbd5e1", mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" gutterBottom>
                      Finalized Aggregator Details
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Finalized Aggregator</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {selectedApplication.finalizedAggregatorName || "N/A"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          Quote Accepted & Finalized
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" color="text.secondary">Expected Volume</Typography>
                        <Typography variant="body1" fontWeight={600}>
                          ₹ {selectedApplication.totalAnnualTransaction?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box display="flex" justifyContent="flex-start" gap={2} flexWrap="wrap">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowPOFormFields(true)}
                        sx={{ fontWeight: 700, px: 4, py: 1.2, borderRadius: "8px" }}
                      >
                        Add PO Details & Generate PO
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<DescriptionOutlined />}
                        disabled={downloadingSanction}
                        onClick={handleDownloadSanctionLetter}
                        sx={{ fontWeight: 700, px: 3, py: 1.2, borderRadius: "8px", textTransform: "none" }}
                      >
                        {downloadingSanction ? "Downloading..." : "Download Sanction Letter (.docx)"}
                      </Button>
                    </Box>
                  </Paper>

                  <AggregatorDetails customerDetails={selectedApplication} />
                </Box>
              ) : (
                <POForm
                  poFormDetails={poFormDetails}
                  generatePO={generatePO}
                  applicationId={selectedApplication.applicationId}
                  aggregatorId={selectedApplication.finalizedAggregatorId}
                  isLoading={poLoading}
                  inline={true}
                  onCancel={() => setShowPOFormFields(false)}
                />
              )
            ) : (
              <Typography color="text.secondary" align="center" py={4}>
                ℹ PO details generation is completed.
              </Typography>
            )}
          </Box>
        )}

        {/* ========================================================
            COMPLETED: PO FINALIZED SUMMARY & COST BENEFIT ANALYSIS
            ======================================================== */}
        {currentStep >= 5 && (
          <Box>
            {/* Purchase Order Summary Card */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: "10px",
                mb: 2.5,
                border: "1.5px solid #86efac",
                background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle sx={{ color: "#16a34a", fontSize: 24 }} />
                  <Typography variant="h6" sx={{ color: "#15803d", fontWeight: 800, fontSize: "16px" }}>
                    Purchase Order Finalized & Completed
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<DescriptionOutlined />}
                    disabled={downloadingSanction}
                    onClick={handleDownloadSanctionLetter}
                    sx={{
                      fontWeight: 700,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "12.5px",
                      px: 2,
                      py: 0.8,
                      borderColor: "#0E4F8D",
                      color: "#0E4F8D",
                      bgcolor: "#ffffff",
                      "&:hover": { bgcolor: "#f0f7ff", borderColor: "#0B3D6D" },
                    }}
                  >
                    {downloadingSanction ? "Downloading..." : "Sanction Letter"}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<Download />}
                    onClick={() =>
                      generatePO({
                        applicationId: selectedApplication.applicationId,
                        aggregatorId: selectedApplication.finalizedAggregatorId,
                        customerName: selectedApplication.customerName,
                        isFinalApproved: selectedApplication.isFinalApproved,
                      })
                    }
                    sx={{
                      fontWeight: 700,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "12.5px",
                      px: 2.5,
                      py: 0.8,
                      bgcolor: "#16a34a",
                      "&:hover": { bgcolor: "#15803d" },
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                    }}
                  >
                    Download PO
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 1.5, borderColor: "#dcfce7" }} />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Number
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700, fontSize: "13px" }}>
                    {selectedApplication.purchaseOrderId || `PO-${selectedApplication.applicationId}`}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700, fontSize: "13px" }}>
                    {new Date(selectedApplication.updatedAt || selectedApplication.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.2 }}>
                    Finalized Vendor
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#15803d", fontWeight: 800, fontSize: "13.5px" }}>
                    {selectedApplication.finalizedAggregatorName || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Volume Amount
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 800, fontSize: "13.5px" }}>
                    ₹ {selectedApplication.totalAnnualTransaction?.toLocaleString() || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <AggregatorDetails customerDetails={selectedApplication} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
