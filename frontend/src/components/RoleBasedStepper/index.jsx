import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Tooltip,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StatusChipOrSelect from '../StatusChipOrSelect';

// ------------------------------------------------------
// 🌈 CBI Premium Gradient Connector (OUTSIDE BOX)
// ------------------------------------------------------
const CBIConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 36, // Pull connector OUTSIDE the box
    position: 'relative',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 4,
    border: 0,
    borderRadius: 8,
    margin: '0px',
    background: 'linear-gradient(90deg, #003A8C, #005FCC)',
    opacity: 0.4,
    transition: '0.4s ease',
    boxShadow: '0 0 12px rgba(0, 90, 255, 0.35)',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(90deg, #003A8C, #D32F2F)',
    boxShadow: '0 0 14px rgba(0, 70, 200, 0.6)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(90deg, #003A8C, #4CAF50)',
    boxShadow: '0 0 16px rgba(0, 200, 100, 0.6)',
  },
}));

// ------------------------------------------------------
// ⭐ MAIN COMPONENT
// ------------------------------------------------------
export default function RoleBasedStepper({
  steps = [],
  showDescription = false,
  allActive = false,
  showTooltip = false,
  statusChip,
}) {
  const [activeStep, setActiveStep] = useState(0);

  // ✔ Auto-detect active step
  useEffect(() => {
    if (!allActive && steps?.length > 0) {
      const currentIndex = steps.findIndex((step) => !step.status);
      setActiveStep(currentIndex === -1 ? steps.length : currentIndex);
    } else {
      setActiveStep(0);
    }
  }, [steps, allActive]);

  // ------------------------------------------------------
  // 🎨 Premium Step Label Renderer
  // ------------------------------------------------------
  const renderStepLabel = (step, index) => {
    const isCompleted = allActive || step.status;
    const isActive = Boolean(step.status);

    const labelContent = (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "0.35s ease",
          cursor: "pointer",

          "&:hover": {
            transform: "translateY(-4px)",
          }
        }}
      >
        <StepLabel
          StepIconComponent={() => (
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "18px",
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isCompleted
                  ? "0 0 18px rgba(0, 120, 255, 0.50)"
                  : "0 0 12px rgba(0,0,0,0.25)",
                transform: isCompleted ? "scale(1.07)" : "scale(0.92)",
                transition: "0.35s ease",

                "&:hover": {
                  transform: "scale(1.12)",
                  boxShadow:
                    "0 0 22px rgba(0, 100, 255, 0.55), 0 6px 14px rgba(0,0,0,0.15)",
                },
              }}
            >
              <img
                src={step.icon}
                alt={step.label}
                style={{
                  width: 46,
                  height: 46,
                  objectFit: "contain",
                  filter: isCompleted
                    ? "none"
                    : isActive
                      ? "none"
                      : "grayscale(100%) opacity(0.6)",
                  transition: "0.3s ease",
                }}
              />
            </Box>
          )}
          sx={{
            textAlign: "center",
            m: 0,
          }}
        >
          <Typography
            fontSize="13px"
            fontWeight={700}
            sx={{
              color: isCompleted ? "#003A8C" : "#777",
              mt: 1,
              transition: "0.3s",

              "&:hover": {
                color: "#003A8C",
                textShadow: "0 0 6px rgba(0, 80, 200, 0.45)",
              },
            }}
          >
            {step.label}
          </Typography>

          {showDescription && step.description && (
            <Typography
              variant="caption"
              sx={{ color: "#555", transition: "0.3s", "&:hover": { color: "#003A8C" } }}
            >
              {step.description}
            </Typography>
          )}

          {statusChip && (
            <Box mt={0.5}>
              <StatusChipOrSelect
                value={isCompleted ? "completed" : "pending"}
                type="status"
              />
            </Box>
          )}
        </StepLabel>
      </Box>
    );


    if (!showTooltip) return labelContent;

    return (
      <Tooltip
        title={step.description || ''}
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              background: '#fff',
              color: '#003A8C',
              border: '1px solid #003A8C',
              fontSize: '13px',
              p: 1,
              boxShadow: '0 0 12px rgba(0, 60, 150, 0.35)',
            },
          },
          arrow: { sx: { color: '#003A8C' } },
        }}
      >
        <Box>{labelContent}</Box>
      </Tooltip>
    );
  };

  return (
    <Box>
      {/* ⭐ Outer box with shadow ONLY for icons */}
      <Box
        sx={{
          width: '100%',
          py: 3,
          // background: 'rgba(0, 58, 140, 0.05)',
          // borderRadius: '22px',
          // boxShadow: '0 0 18px rgba(0,0,0,0.10)',
          // zIndex: 2,
          position: 'relative',
        }}
      >
        <Stepper
          activeStep={allActive ? -1 : activeStep}
          alternativeLabel
          nonLinear
          connector={<CBIConnector />}
        >
          {steps.map((step, idx) => (
            <Step
              key={step.label || idx}
              completed={allActive ? true : step.status}
            >
              {renderStepLabel(step, idx)}
            </Step>
          ))}
        </Stepper>
      </Box>
    </Box>
  );
}

RoleBasedStepper.propTypes = {
  steps: PropTypes.array.isRequired,
  showDescription: PropTypes.bool,
  allActive: PropTypes.bool,
  showTooltip: PropTypes.bool,
  statusChip: PropTypes.bool,
};
