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
  Grid,
  Chip,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TimelineIcon from "@mui/icons-material/Timeline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
import ApplicationHelpdeskSection from "./ApplicationHelpdeskSection";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { isUserAdmin } from "&src/utils";

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
  const isCO = userRole === 'CO' || userRole === 'ADMIN';

  const userDetails = React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  }, []);

  const isAdmin = React.useMemo(() => isUserAdmin(userDetails), [userDetails]);

  const [helpdeskOpen, setHelpdeskOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);

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

  const currentUserId = sessionStorage.getItem('userId') || sessionStorage.getItem('user_id') || (JSON.parse(sessionStorage.getItem('userDetails') || '{}')).employeeId || (JSON.parse(sessionStorage.getItem('userDetails') || '{}')).pfNumber;
  const isReadOnlyUser = String(currentUserId) === '115019' || !isAdmin;
  const isRejected = application.status?.toLowerCase()?.includes('reject') || Boolean(application.reasonOfRejection) || Boolean(application.rejectedDate);

  const canCOReject = isAdmin && isCO && !isRejected && !application.isFinalApproved;

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
            background: "linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)",
            backgroundColor: "#176FC1",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            borderBottom: "3px solid #CE0F3E",
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

        {/* Main Content Area - Full Width without bulky bounding box */}
        <Container maxWidth={false} sx={{ mt: 1.5, mb: 10, pb: 4, px: { xs: 1, sm: 2 } }}>
          {/* View-Only Mode Banner */}
          {isReadOnlyUser && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                mb: 2,
                borderRadius: '8px',
                bgcolor: '#eff6ff',
                border: '1.5px solid #93c5fd',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Typography variant="body2" color="#1d4ed8" fontWeight={700}>
                ℹ View-Only Mode Active &bull; You are reviewing this application in read-only inspection mode. All 5 workflow stages, aggregator quotes, CBA comparisons, and document downloads remain active while update/approval controls are restricted to Central Office Admin.
              </Typography>
            </Paper>
          )}

          {/* Rejection Details & Workflow Lockout Banner */}
          {isRejected && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                mb: 2,
                borderRadius: '12px',
                bgcolor: '#fef2f2',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
              }}
            >
              <CancelOutlinedIcon sx={{ color: '#dc2626', fontSize: 36, mt: 0.3, flexShrink: 0 }} />
              <Box flex={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight={800} color="#991b1b">
                      APPLICATION REJECTED &bull; WORKFLOW LOCKED
                    </Typography>
                    <Chip
                      label={(application.status || "REJECTED").toUpperCase()}
                      color="error"
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </Box>
                  <Typography variant="caption" color="#991b1b" fontWeight={700}>
                    Status: Read-Only Archive (Forward Actions Stopped)
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mt: 0.5, bgcolor: '#ffffff', p: 1.5, borderRadius: '8px', border: '1px solid #fee2e2' }}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Rejected By</Typography>
                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                      {application.rejectedBy || application.approvedByCOId || "Central Office User"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Rejected Role / Office</Typography>
                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                      {application.rejectedRole || "CO"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Rejection Date</Typography>
                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                      {application.rejectedDate ? new Date(application.rejectedDate).toLocaleString() : (application.updatedAt ? new Date(application.updatedAt).toLocaleString() : "N/A")}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="text.secondary">Operational State</Typography>
                    <Typography variant="body2" fontWeight={700} color="#dc2626">
                      Locked &bull; Forwarding Disabled
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Reason for Rejection</Typography>
                    <Typography variant="body2" fontWeight={600} color="#b91c1c" sx={{ bgcolor: '#fff1f2', p: 1.2, borderRadius: '6px', border: '1px solid #fecdd3', mt: 0.5 }}>
                      {application.reasonOfRejection || "No specific reason provided."}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          )}

          {/* Dynamic Workflow Content */}
          <Box sx={{ width: "100%", mt: 1 }}>
            <WorkflowTabs />
          </Box>
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

      {/*  CO REJECTION MODAL */}
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
