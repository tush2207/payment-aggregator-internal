import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Dialog,
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
import {
  selectDialogOpen,
  selectApplicationDetails,
  selectFlowLoading,
  closeWorkflowDialog,
  selectCurrentStep,
} from "&src/store/applicationFlowSlice";
import RoleBasedWorkflowStepper from "./RoleBasedWorkflowStepper";
import WorkflowTabs from "./WorkflowTabs";

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

  const handleClose = () => {
    dispatch(closeWorkflowDialog());
  };

  if (!application) return null;

  return (
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
          background: (theme) => theme.palette.gradients?.accent || "linear-gradient(90deg, #003A8C, #005FCC)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          borderRadius: 0,
        }}
      >
        <Toolbar>
          <TimelineIcon sx={{ mr: 2, fontSize: 28 }} />
          <Typography sx={{ flex: 1, fontWeight: 700 }} variant="h6" component="div">
            Application Workflow: {application.customerName}
          </Typography>
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
          justifyContent: "flex-end",
          zIndex: 1000,
        }}
      >
        <Button variant="outlined" color="inherit" onClick={handleClose} sx={{ mr: 2 }}>
          Close Workflow
        </Button>
      </Box>

      {/* Loading Overlay */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Dialog>
  );
}
