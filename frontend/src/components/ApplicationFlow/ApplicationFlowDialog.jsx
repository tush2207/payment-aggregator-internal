import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
  Box,
  Container,
  Paper,
  Button,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TimelineIcon from "@mui/icons-material/Timeline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import {
  selectDialogOpen,
  selectApplicationDetails,
  selectFlowLoading,
  selectUserRole,
  closeWorkflowDialog,
  selectCurrentStep,
  updateApplicationWorkflow,
} from "&src/store/applicationFlowSlice";
import RoleBasedWorkflowStepper from "./RoleBasedWorkflowStepper";
import WorkflowTabs from "./WorkflowTabs";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";

// Slide transition from bottom for full-screen dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ApplicationFlowDialog() {
  const dispatch = useDispatch();
  const open = useSelector(selectDialogOpen);
  const application = useSelector(selectApplicationDetails);
  const currentStep = useSelector(selectCurrentStep);
  const isLoading = useSelector(selectFlowLoading);
  const userRole = useSelector(selectUserRole) || sessionStorage.getItem('role') || 'CO';
  const isCO = userRole === 'CO';

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);
  const { successNotification, errorNotification } = useStatusWiseAlert();

  const handleClose = () => {
    dispatch(closeWorkflowDialog());
  };

  const handleOpenReject = () => {
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      errorNotification("Please enter a reason for rejection.");
      return;
    }
    setSubmittingReject(true);
    try {
      const userDetails = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      const approverId = userDetails.pfNumber || userDetails.employeeId || 'CO User';
      await dispatch(updateApplicationWorkflow({
        applicationId: application.applicationId,
        payload: {
          status: "rejected",
          reasonOfRejection: rejectReason,
          approvedByCOId: approverId
        }
      })).unwrap();
      successNotification("Application rejected successfully");
      setRejectModalOpen(false);
      handleClose();
    } catch (err) {
      errorNotification(err || "Failed to reject application");
    } finally {
      setSubmittingReject(false);
    }
  };

  if (!application) return null;

  const canCOReject = isCO && application.status !== 'rejected' && !application.isFinalApproved;

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            backgroundColor: "#f4f6f8",
          },
        }}
      >
        {/* Sticky Premium Header */}
        <AppBar
          position="sticky"
          sx={{
            background: "linear-gradient(135deg, #0a2342 0%, #0d3b6e 60%, #071830 100%)",
            boxShadow: "0 4px 20px rgba(10,35,66,0.2)",
            borderBottom: "2px solid rgba(246, 211, 101, 0.4)",
            borderRadius: 0,
          }}
        >
          <Toolbar>
            <TimelineIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography sx={{ flex: 1, fontWeight: 700 }} variant="h6" component="div">
              Application Workflow: {application.customerName}
            </Typography>

            {canCOReject && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<CancelOutlinedIcon />}
                onClick={handleOpenReject}
                sx={{ mr: 2, textTransform: "none", fontWeight: 700 }}
              >
                Reject Application (CO)
              </Button>
            )}

            <Typography
              variant="subtitle2"
              sx={{
                mr: 3,
                backgroundColor: "rgba(255,255,255,0.15)",
                px: 1.5,
                py: 0.5,
                borderRadius: 0,
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              App ID: {application.applicationId}
            </Typography>
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          {/* Horizontal Workflow Stepper */}
          {currentStep !== 3 && !application?.isFinalApproved && <RoleBasedWorkflowStepper />}

          {/* Dynamic Workflow Tabs */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
              boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
            }}
          >
            <WorkflowTabs />
          </Paper>
        </Container>

        {/* Sticky Footer */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            py: 2,
            px: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {application.reasonOfRejection && (
              <Typography variant="body2" color="error.main" fontWeight={700}>
                Rejection Reason: {application.reasonOfRejection}
              </Typography>
            )}
          </Box>
          <Box display="flex" gap={2}>
            {canCOReject && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon />}
                onClick={handleOpenReject}
              >
                Reject Application
              </Button>
            )}
            <Button variant="outlined" color="inherit" onClick={handleClose}>
              Close Workflow
            </Button>
          </Box>
        </Box>

        {/* Loading Overlay */}
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={isLoading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Dialog>

      {/* 🔹 CO REJECTION MODAL */}
      <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CancelOutlinedIcon color="error" /> Reject Application (CO)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" mb={2}>
            Are you sure you want to reject application <strong>#{application?.applicationId}</strong> ({application?.customerName})?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Rejection"
            placeholder="Enter reason for rejecting this application..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectModalOpen(false)} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={submittingReject}>
            {submittingReject ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
