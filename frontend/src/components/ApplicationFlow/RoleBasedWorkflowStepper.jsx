import React from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import DescriptionIcon from "@mui/icons-material/Description";
import HubIcon from "@mui/icons-material/Hub";
import PercentIcon from "@mui/icons-material/Percent";
import ThumbsUpDownIcon from "@mui/icons-material/ThumbsUpDown";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import {
  selectCurrentStep,
  selectCurrentWorkflow,
} from "&src/store/applicationFlowSlice";
import { formatDateAndTime } from "&src/utils";

// CBI Premium Custom Stepper Connector
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";

const WorkflowConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 15,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 8,
    background: "#e0e0e0",
    transition: "0.4s ease",
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: "linear-gradient(90deg, #1976d2, #ff9800)",
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: "linear-gradient(90deg, #1976d2, #4caf50)",
  },
}));

const CustomStepIconRoot = styled("div")(({ ownerState }) => ({
  color: "#b0bec5",
  display: "flex",
  height: 30,
  width: 30,
  borderRadius: "50%",
  border: "2px solid #b0bec5",
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1,
  transition: "0.3s ease",
  ...(ownerState.active && {
    color: "#ff9800",
    borderColor: "#ff9800",
    transform: "scale(1.1)",
    boxShadow: "0 0 8px rgba(255, 152, 0, 0.4)",
  }),
  ...(ownerState.completed && {
    color: "#4caf50",
    borderColor: "#4caf50",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  }),
}));

const ICONS_MAP = {
  0: <DescriptionIcon sx={{ fontSize: 16 }} />,
  1: <HubIcon sx={{ fontSize: 16 }} />,
  2: <PercentIcon sx={{ fontSize: 16 }} />,
  3: <ThumbsUpDownIcon sx={{ fontSize: 16 }} />,
  4: <AssignmentTurnedInIcon sx={{ fontSize: 16 }} />,
};

function CustomStepIcon(props) {
  const { active, completed, className, icon } = props;
  const stepIndex = icon - 1;
  const StepIcon = ICONS_MAP[stepIndex] || <DescriptionIcon sx={{ fontSize: 16 }} />;

  return (
    <CustomStepIconRoot ownerState={{ active, completed }} className={className}>
      {StepIcon}
    </CustomStepIconRoot>
  );
}

export default function RoleBasedWorkflowStepper() {
  const currentStep = useSelector(selectCurrentStep);
  const workflow = useSelector(selectCurrentWorkflow);

  if (!workflow || workflow.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2,
        backgroundColor: "#fcfcfc",
        border: "1px solid #eaeaea",
        borderRadius: "12px",
      }}
    >
      <Stepper
        activeStep={currentStep}
        alternativeLabel
        connector={<WorkflowConnector />}
      >
        {workflow.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          let stepStatusText = "Pending";
          let statusColor = "text.secondary";
          if (isCompleted) {
            stepStatusText = "Completed";
            statusColor = "success.main";
          } else if (isActive) {
            stepStatusText = "Active";
            statusColor = "warning.main";
          }

          return (
            <Step key={step.name} completed={isCompleted}>
              <StepLabel StepIconComponent={CustomStepIcon}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={isActive ? 700 : 600}
                    color={isActive ? "primary.main" : "text.primary"}
                    sx={{ fontSize: "11px" }}
                  >
                    {step.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 0.2, fontWeight: 500, fontSize: "9px" }}
                  >
                    Role: <b>{step.role}</b>
                  </Typography>

                  <Typography
                    variant="caption"
                    color={statusColor}
                    fontWeight={700}
                    display="block"
                    sx={{ mt: 0.2, textTransform: "uppercase", fontSize: "9px" }}
                  >
                    {stepStatusText}
                  </Typography>
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}
