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
} from "@mui/material";
import { Download } from "@mui/icons-material";
import {
  selectApplicationDetails,
  selectCurrentStep,
  selectUserRole,
} from "&src/store/applicationFlowSlice";

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

  const { poFormDetails, poLoading, generatePO } = usePOGenerator(selectedApplication);

  if (!selectedApplication) {
    return <Typography sx={{ p: 2 }}>No application details loaded.</Typography>;
  }

  // Active step details helper
  const getStepHeader = () => {
    switch (currentStep) {
      case 0:
        return { num: 1, title: "Update Projection", role: "CO" };
      case 1:
        return { num: 2, title: "Add Aggregator", role: "CO" };
      case 2:
        return { num: 3, title: "Add Markup", role: "CO" };
      case 3:
        return { num: 4, title: "Quotation Preview & Acceptance", role: "RO / CO" };
      case 4:
        return { num: 5, title: "Add PO Details", role: "CO" };
      default:
        return { num: 5, title: "PO Finalized & Complete", role: "CO" };
    }
  };

  const stepHeader = getStepHeader();
  const canEdit =
    currentStep < 5 &&
    (userRole === "CO" ||
      userRole === stepHeader.role ||
      (currentStep === 3 && (userRole === "RO" || userRole === "CO")));

  return (
    <Box sx={{ width: "100%" }}>
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

                    <Box display="flex" justifyContent="flex-start">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setShowPOFormFields(true)}
                        sx={{ fontWeight: 700, px: 4, py: 1.2, borderRadius: "8px" }}
                      >
                        Add PO Details & Generate PO
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
                ℹ️ PO details generation is completed.
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
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3, borderColor: "success.light", bgcolor: "success.50" }}>
              <Typography variant="h6" color="success.dark" fontWeight={700} gutterBottom>
                Purchase Order Finalized & Completed
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} sm={2.5}>
                  <Typography variant="caption" color="text.secondary">PO Number</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedApplication.purchaseOrderId || `PO-${selectedApplication.applicationId}`}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.5}>
                  <Typography variant="caption" color="text.secondary">PO Date</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {new Date(selectedApplication.updatedAt || selectedApplication.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.5}>
                  <Typography variant="caption" color="text.secondary">Finalized Vendor</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedApplication.finalizedAggregatorName || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={2.5}>
                  <Typography variant="caption" color="text.secondary">PO Volume Amount</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₹ {selectedApplication.totalAnnualTransaction?.toLocaleString() || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Download />}
                    onClick={() =>
                      generatePO({
                        applicationId: selectedApplication.applicationId,
                        aggregatorId: selectedApplication.finalizedAggregatorId,
                        customerName: selectedApplication.customerName,
                        isFinalApproved: selectedApplication.isFinalApproved,
                      })
                    }
                    sx={{ fontWeight: 700, borderRadius: "8px", textTransform: "none", width: "100%" }}
                  >
                    Download PO
                  </Button>
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
