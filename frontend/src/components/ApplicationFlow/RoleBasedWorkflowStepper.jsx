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
import { styled, keyframes } from "@mui/material/styles";
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

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 6px rgba(255, 152, 0, 0.3);
    transform: scale(0.92);
  }
  50% {
    box-shadow: 0 0 14px rgba(255, 152, 0, 0.65);
    transform: scale(1.04);
  }
  100% {
    box-shadow: 0 0 6px rgba(255, 152, 0, 0.3);
    transform: scale(0.92);
  }
`;

const flowingLine = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const WorkflowConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24, // Pull connector OUTSIDE the box
    left: 'calc(-50% + 14px)',
    right: 'calc(50% + 14px)',
    position: 'relative',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 0,
    margin: '0px',
    background: 'linear-gradient(90deg, #0E4F8D, #176FC1)',
    backgroundSize: '200% 200%',
    opacity: 0.4,
    transition: '0.4s ease',
    boxShadow: '0 0 8px rgba(23, 111, 193, 0.25)',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(270deg, #176FC1, #CE0F3E, #176FC1)',
    backgroundSize: '200% 200%',
    animation: `${flowingLine} 3s ease infinite`,
    boxShadow: '0 0 10px rgba(206, 15, 62, 0.4)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(270deg, #176FC1, #2E7D32, #176FC1)',
    backgroundSize: '200% 200%',
    animation: `${flowingLine} 3s ease infinite`,
    boxShadow: '0 0 12px rgba(46, 125, 50, 0.4)',
  },
}));

const ICONS_MAP = {
  0: <DescriptionIcon />,
  1: <HubIcon />,
  2: <PercentIcon />,
  3: <ThumbsUpDownIcon />,
  4: <AssignmentTurnedInIcon />,
};

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
              <StepLabel
                StepIconComponent={() => {
                  const StepIcon = ICONS_MAP[index] || <DescriptionIcon />;
                  return (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: isCompleted
                          ? "0 0 12px rgba(23, 111, 193, 0.40)"
                          : isActive
                            ? "0 0 14px rgba(255, 152, 0, 0.60)"
                            : "0 0 8px rgba(0,0,0,0.15)",
                        transform: isCompleted ? "scale(1.05)" : "scale(0.92)",
                        transition: "0.35s ease",
                        animation: isActive ? `${pulseGlow} 2s infinite ease-in-out` : "none",
                        color: isCompleted ? "#176FC1" : isActive ? "#ff9800" : "#777",
                        "&:hover": {
                          transform: "scale(1.1)",
                          boxShadow: "0 0 16px rgba(23, 111, 193, 0.45), 0 4px 8px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      {React.cloneElement(StepIcon, {
                        sx: {
                          fontSize: 22,
                          color: "inherit",
                          transition: "0.3s ease",
                        }
                      })}
                    </Box>
                  );
                }}
              >
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
                    color={statusColor}
                    fontWeight={700}
                    display="block"
                    sx={{ mt: 0.2, textTransform: "uppercase", fontSize: "9px" }}
                  >
                    {stepStatusText}
                  </Typography>

                  {step.date && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      fontWeight={600}
                      display="block"
                      sx={{ fontSize: "9px", mt: 0.2 }}
                    >
                      {step.date}
                    </Typography>
                  )}

                  {step.approvedBy && (
                    <Typography
                      variant="caption"
                      color="primary.main"
                      fontWeight={700}
                      display="block"
                      sx={{ fontSize: "9px" }}
                    >
                      By: {step.approvedBy}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}
