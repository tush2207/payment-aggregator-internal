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
import { Download, DescriptionOutlined, CheckCircle, EmailOutlined } from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";
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
  const { successNotification, errorNotification } = useStatusWiseAlert();
  const [showPOFormFields, setShowPOFormFields] = useState(false);
  const [finalizedTab, setFinalizedTab] = useState("finalized");
  const [downloadingSanction, setDownloadingSanction] = useState(false);
  const [dispatchingOutcomeEmails, setDispatchingOutcomeEmails] = useState(false);

  const { poFormDetails, poLoading, generatePO } = usePOGenerator(selectedApplication);

  const handleDispatchOutcomeEmails = async () => {
    if (!selectedApplication?.applicationId) return;
    setDispatchingOutcomeEmails(true);
    try {
      const response = await applicationServices.resendPOEmail(selectedApplication.applicationId);
      const msg = response?.data?.message || "Acceptance & rejection outcome emails dispatched successfully to respective aggregators!";
      successNotification(msg);
    } catch (err) {
      console.error("Failed to dispatch outcome emails:", err);
      errorNotification(err?.response?.data?.detail || "Failed to dispatch outcome emails. Please verify aggregator email addresses and SMTP settings.");
    } finally {
      setDispatchingOutcomeEmails(false);
    }
  };

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
            background: (theme) => `linear-gradient(90deg, ${theme.palette.action.hover} 0%, ${theme.palette.background.paper} 100%)`,
            border: "1px solid",
            borderColor: "divider",
            borderLeft: (theme) => `5px solid ${theme.palette.primary.main}`,
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
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`,
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "14px",
                boxShadow: (theme) => `0 2px 6px ${theme.palette.action.focus}`,
              }}
            >
              {stepHeader.num}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "text.primary", fontSize: "14px", lineHeight: 1.2 }}>
                Step {stepHeader.num}: {stepHeader.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "11.5px", mt: 0.2, display: "block" }}>
                {stepHeader.description}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              size="small"
              label={`Role: ${stepHeader.role}`}
              color="primary"
              variant="outlined"
              sx={{
                fontWeight: 700,
                fontSize: "11px",
                height: "24px",
              }}
            />
            <Chip
              size="small"
              label={currentStep >= 5 ? "Completed" : `Step ${stepHeader.num} of 5 Active`}
              color={currentStep >= 5 ? "success" : "warning"}
              variant="filled"
              sx={{
                fontWeight: 800,
                fontSize: "11px",
                height: "24px",
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
        {currentStep === 3 && (
          <Box>
            {userRole === "RO" ? (
              <AcceptedQuoteTable
                customer={selectedApplication}
                applicationDetails={selectedApplication}
                applicationId={selectedApplication?.applicationId}
                aggregatorId={selectedApplication?.finalizedAggregatorId}
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
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      px: 2.5,
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      mb: 2,
                      bgcolor: "#ffffff"
                    }}
                  >
                    <Box
                      display="flex"
                      flexDirection={{ xs: "column", lg: "row" }}
                      alignItems={{ xs: "flex-start", lg: "center" }}
                      justifyContent="space-between"
                      gap={2}
                      flexWrap="wrap"
                    >
                      {/* Details in One Line */}
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={{ xs: 2, sm: 3.5 }}
                        alignItems={{ sm: "center" }}
                        divider={<Divider orientation="vertical" flexItem sx={{ height: 28, my: "auto" }} />}
                      >
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "11px", fontWeight: 600 }}>
                            Finalized Aggregator
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: "14px" }}>
                            {selectedApplication.finalizedAggregatorName || "N/A"}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "11px", fontWeight: 600 }}>
                            Status
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="success.main" sx={{ fontSize: "13px" }}>
                            Quote Accepted & Finalized
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "11px", fontWeight: 600 }}>
                            Expected Volume
                          </Typography>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: "14px" }}>
                            ₹ {selectedApplication.totalAnnualTransaction?.toLocaleString() || 0}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Action Buttons in Same Line */}
                      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                        {!Boolean(
                          selectedApplication?.isFinalApproved ||
                          selectedApplication?.isQuoteAcceptReviewByCO ||
                          selectedApplication?.isPOGenerated ||
                          selectedApplication?.status === "finalapproval" ||
                          selectedApplication?.poNumber
                        ) && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setShowPOFormFields(true)}
                            sx={{ fontWeight: 700, px: 2.5, py: 0.9, borderRadius: "6px", textTransform: "none", fontSize: "12.5px" }}
                          >
                            Approve & Add PO Details
                          </Button>
                        )}

                        {Boolean(
                          selectedApplication?.isFinalApproved ||
                          selectedApplication?.isQuoteAcceptReviewByCO ||
                          selectedApplication?.isPOGenerated ||
                          selectedApplication?.status === "finalapproval" ||
                          selectedApplication?.poNumber
                        ) && (
                          <>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<DescriptionOutlined />}
                              disabled={downloadingSanction}
                              onClick={handleDownloadSanctionLetter}
                              sx={{ fontWeight: 700, px: 2, py: 0.9, borderRadius: "6px", textTransform: "none", fontSize: "12px" }}
                            >
                              {downloadingSanction ? "Downloading..." : "Download Sanction Letter (.docx)"}
                            </Button>

                            <Button
                              variant="outlined"
                              color="secondary"
                              size="small"
                              startIcon={dispatchingOutcomeEmails ? <CircularProgress size={14} color="inherit" /> : <EmailOutlined />}
                              disabled={dispatchingOutcomeEmails || !selectedApplication?.finalizedAggregatorId}
                              onClick={handleDispatchOutcomeEmails}
                              sx={{
                                fontWeight: 700,
                                px: 2,
                                py: 0.9,
                                borderRadius: "6px",
                                textTransform: "none",
                                fontSize: "12px",
                                borderColor: "#0E4F8D",
                                color: "#0E4F8D",
                                "&:hover": { borderColor: "#093661", bgcolor: "rgba(14, 79, 141, 0.04)" }
                              }}
                            >
                              {dispatchingOutcomeEmails ? "Sending Emails..." : "Send Acceptance & Rejection Emails"}
                            </Button>
                          </>
                        )}
                      </Stack>
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
                border: "1.5px solid",
                borderColor: "success.light",
                bgcolor: "background.paper",
                boxShadow: (theme) => `0 2px 8px ${theme.palette.action.hover}`,
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={1.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" sx={{ fontSize: 24 }} />
                  <Typography variant="h6" color="success.main" sx={{ fontWeight: 800, fontSize: "16px" }}>
                    Purchase Order Finalized & Completed
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={dispatchingOutcomeEmails ? <CircularProgress size={16} color="inherit" /> : <EmailOutlined />}
                    disabled={dispatchingOutcomeEmails}
                    onClick={handleDispatchOutcomeEmails}
                    sx={{
                      fontWeight: 700,
                      borderRadius: "8px",
                      textTransform: "none",
                      fontSize: "12.5px",
                      px: 2,
                      py: 0.8,
                      borderColor: "#0E4F8D",
                      color: "#0E4F8D",
                      "&:hover": { borderColor: "#093661", bgcolor: "rgba(14, 79, 141, 0.04)" }
                    }}
                  >
                    {dispatchingOutcomeEmails ? "Sending Emails..." : "Send / Resend Outcome Emails"}
                  </Button>
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
                    }}
                  >
                    Download PO
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Number
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700, fontSize: "13px" }}>
                    {selectedApplication.purchaseOrderId || `PO-${selectedApplication.applicationId}`}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Date
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 700, fontSize: "13px" }}>
                    {new Date(selectedApplication.updatedAt || selectedApplication.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.2 }}>
                    Finalized Vendor
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 800, fontSize: "13.5px" }}>
                    {selectedApplication.finalizedAggregatorName || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.2 }}>
                    PO Volume Amount
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 800, fontSize: "13.5px" }}>
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
