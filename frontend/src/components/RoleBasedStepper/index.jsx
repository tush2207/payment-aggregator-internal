import React, { useEffect, useState, useMemo } from 'react';
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
import { styled, keyframes } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import { selectUserRole } from '&src/store/applicationFlowSlice';
import StatusChipOrSelect from '../StatusChipOrSelect';

// ------------------------------------------------------
// 🌀 CBI Premium Keyframe Animations
// ------------------------------------------------------
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

// ------------------------------------------------------
// 🌈 CBI Premium Gradient Connector (OUTSIDE BOX)
// ------------------------------------------------------
const CBIConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24, // Pull connector OUTSIDE the box
    position: 'relative',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 8,
    margin: '0px',
    background: 'linear-gradient(90deg, #003A8C, #005FCC)',
    backgroundSize: '200% 200%',
    opacity: 0.4,
    transition: '0.4s ease',
    boxShadow: '0 0 8px rgba(0, 90, 255, 0.25)',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(270deg, #003A8C, #D32F2F, #003A8C)',
    backgroundSize: '200% 200%',
    animation: `${flowingLine} 3s ease infinite`,
    boxShadow: '0 0 10px rgba(0, 70, 200, 0.4)',
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    opacity: 1,
    background: 'linear-gradient(270deg, #003A8C, #4CAF50, #003A8C)',
    backgroundSize: '200% 200%',
    animation: `${flowingLine} 3s ease infinite`,
    boxShadow: '0 0 12px rgba(0, 200, 100, 0.4)',
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

  // Fetch the current user role
  let userRole = 'CO';
  try {
    const reduxRole = useSelector(selectUserRole);
    userRole = reduxRole || sessionStorage.getItem('role') || 'CO';
  } catch (e) {
    userRole = sessionStorage.getItem('role') || 'CO';
  }

  // Filter steps based on role mapping
  const filteredSteps = useMemo(() => {
    if (!steps || steps.length === 0) return [];
    
    return steps.filter(step => {
      if (!step.role) return true; // fallback
      
      const roleUpper = step.role.toUpperCase();
      const userUpper = userRole.toUpperCase();
      
      if (userUpper === 'BO') {
        return roleUpper.includes('BO');
      }
      if (userUpper === 'ZO') {
        return roleUpper.includes('ZO');
      }
      if (userUpper === 'RO') {
        return roleUpper.includes('RO');
      }
      if (userUpper === 'CO') {
        // CO drives the quotes submission and analysis, so they see CO steps and AEPA (Aggregator) steps
        return roleUpper.includes('CO') || roleUpper.includes('AEPA');
      }
      return true;
    });
  }, [steps, userRole]);

  // ✔ Auto-detect active step
  useEffect(() => {
    if (!allActive && filteredSteps?.length > 0) {
      const currentIndex = filteredSteps.findIndex((step) => !step.status);
      setActiveStep(currentIndex === -1 ? filteredSteps.length : currentIndex);
    } else {
      setActiveStep(0);
    }
  }, [filteredSteps, allActive]);

  // ------------------------------------------------------
  // 🎨 Premium Step Label Renderer
  // ------------------------------------------------------
  const renderStepLabel = (step, index) => {
    const isCompleted = allActive || step.status;
    const isCurrentStep = !isCompleted && index === activeStep;

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
                width: 48,
                height: 48,
                borderRadius: "12px",
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isCompleted
                  ? "0 0 12px rgba(0, 120, 255, 0.40)"
                  : isCurrentStep
                    ? "0 0 14px rgba(255, 152, 0, 0.60)"
                    : "0 0 8px rgba(0,0,0,0.15)",
                transform: isCompleted ? "scale(1.05)" : "scale(0.92)",
                transition: "0.35s ease",
                animation: isCurrentStep ? `${pulseGlow} 2s infinite ease-in-out` : "none",

                color: isCompleted ? "#003A8C" : isCurrentStep ? "#ff9800" : "#777",
                "&:hover": {
                  transform: "scale(1.1)",
                  boxShadow:
                    "0 0 16px rgba(0, 100, 255, 0.45), 0 4px 8px rgba(0,0,0,0.1)",
                },
              }}
            >
              {React.isValidElement(step.icon) ? (
                React.cloneElement(step.icon, {
                  sx: {
                    fontSize: 22,
                    color: "inherit",
                    transition: "0.3s ease",
                  }
                })
              ) : typeof step.icon === "function" ? (
                React.createElement(step.icon, {
                  sx: {
                    fontSize: 22,
                    color: "inherit",
                  }
                })
              ) : (
                <img
                  src={step.icon}
                  alt={step.label}
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: "contain",
                    filter: isCompleted
                      ? "none"
                      : isActive
                        ? "none"
                        : "grayscale(100%) opacity(0.6)",
                    transition: "0.3s ease",
                  }}
                />
              )}
            </Box>
          )}
          sx={{
            textAlign: "center",
            m: 0,
          }}
        >
          <Typography
            fontSize="11px"
            fontWeight={700}
            sx={{
              color: isCompleted ? "#003A8C" : "#777",
              mt: 0.5,
              transition: "0.3s",

              "&:hover": {
                color: "#003A8C",
                textShadow: "0 0 4px rgba(0, 80, 200, 0.35)",
              },
            }}
          >
            {step.label}
          </Typography>

          {showDescription && step.description && (
            <Typography
              variant="caption"
              sx={{ color: "#555", fontSize: "9px", transition: "0.3s", "&:hover": { color: "#003A8C" } }}
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
              fontSize: '11px',
              p: 1,
              boxShadow: '0 0 8px rgba(0, 60, 150, 0.25)',
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
          py: 1,
          position: 'relative',
        }}
      >
        <Stepper
          activeStep={allActive ? -1 : activeStep}
          alternativeLabel
          nonLinear
          connector={<CBIConnector />}
        >
          {filteredSteps.map((step, idx) => (
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
