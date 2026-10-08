import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Tooltip,
  StepConnector,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import { TouchAppRounded } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUserRole } from '&src/store/applicationFlowSlice';

// ------------------------------------------------------
//  Animations & Visual Dynamics
// ------------------------------------------------------
const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
`;

const activeFilterGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
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
//  CBI Premium Gradient Connector (Properly Aligned)
// ------------------------------------------------------
const CBIConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 24,
    left: 'calc(-50% + 28px)',
    right: 'calc(50% + 28px)',
    position: 'absolute',
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    borderRadius: 2,
    margin: 0,
    background: theme.palette.divider || '#e2e8f0',
    transition: '0.4s ease',
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    background: `linear-gradient(270deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    backgroundSize: '200% 200%',
    animation: `${flowingLine} 3s ease infinite`,
    boxShadow: `0 0 10px ${alpha(theme.palette.secondary.main, 0.4)}`,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    background: `linear-gradient(90deg, ${theme.palette.success.main || '#16a34a'}, ${theme.palette.success.light || '#22c55e'})`,
    boxShadow: `0 0 10px ${alpha(theme.palette.success.main, 0.4)}`,
  },
}));

// ------------------------------------------------------
//  MAIN ROLE BASED STEPPER COMPONENT
// ------------------------------------------------------
export default function RoleBasedStepper({
  steps = [],
  showDescription = false,
  showTimestamp = true,
  allActive = false,
  showTooltip = false,
  interactiveFilter = false,
  selectedStepIndex = null,
  onStepClick = null,
  stepCounts = [],
}) {
  const theme = useTheme();
  const [activeStep] = useState(0);

  // Fetch the current user role
  let userRole = 'CO';
  try {
    const reduxRole = useSelector(selectUserRole);
    userRole = reduxRole || sessionStorage.getItem('role') || 'CO';
  } catch {
    userRole = sessionStorage.getItem('role') || 'CO';
  }

  // Filter steps based on role mapping
  const filteredSteps = useMemo(() => {
    if (!steps || steps.length === 0) return [];

    return steps.filter((step) => {
      if (!step.role) return true;

      const roleUpper = step.role.toUpperCase();
      const userUpper = userRole.toUpperCase();

      if (userUpper === 'BO') {
        return roleUpper.includes('BO');
      }
      if (userUpper === 'RO') {
        return roleUpper.includes('RO') || roleUpper.includes('BO');
      }
      if (userUpper === 'ZO') {
        return (
          roleUpper.includes('ZO') ||
          roleUpper.includes('RO') ||
          roleUpper.includes('BO')
        );
      }
      return true; // CO and Super Admin see all stages
    });
  }, [steps, userRole]);

  // Determine if entire workflow is fully completed
  const isAllCompleted = useMemo(() => {
    if (allActive) return true;
    if (!filteredSteps || filteredSteps.length === 0) return false;
    return filteredSteps.every((step) => Boolean(step.status));
  }, [allActive, filteredSteps]);

  // Determine current in-progress active step index
  const currentActiveStepIndex = useMemo(() => {
    if (isAllCompleted) return -1;
    const firstIncomplete = filteredSteps.findIndex((step) => !step.status);
    return firstIncomplete === -1 ? 0 : firstIncomplete;
  }, [isAllCompleted, filteredSteps]);

  // Handler for clicking a step
  const handleStepClick = (idx, step) => {
    if (interactiveFilter && onStepClick) {
      onStepClick(idx, step);
    }
  };

  // Render individual step node
  const renderStepLabel = (step, idx) => {
    const isCompleted = isAllCompleted || Boolean(step.status);
    const isCurrentStep = !isAllCompleted && idx === currentActiveStepIndex;
    const isPendingStep = !isAllCompleted && !isCompleted && !isCurrentStep;
    const isFilterSelected = interactiveFilter && selectedStepIndex === idx;
    const count = stepCounts && stepCounts[idx] !== undefined ? stepCounts[idx] : null;

    const labelContent = (
      <Box
        onClick={() => handleStepClick(idx, step)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.25s ease',
          cursor: interactiveFilter ? 'pointer' : 'default',
          p: interactiveFilter ? '6px 4px' : 0,
          borderRadius: '12px',
          bgcolor: isFilterSelected ? alpha(theme.palette.success.main, 0.08) : 'transparent',
          border: isFilterSelected ? `1.5px dashed ${theme.palette.success.main}` : '1.5px solid transparent',
          '&:hover': {
            transform: interactiveFilter ? 'translateY(-3px)' : 'none',
            bgcolor: interactiveFilter ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
          },
        }}
      >
        <StepLabel
          StepIconComponent={() => (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                overflow: 'hidden',
                background: isCompleted
                  ? alpha(theme.palette.success.light || '#86efac', 0.15)
                  : isCurrentStep
                  ? alpha(theme.palette.warning.light || '#fde68a', 0.2)
                  : theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isFilterSelected
                  ? `2.5px solid ${theme.palette.success.main}`
                  : isCompleted
                  ? `2px solid ${theme.palette.success.main}`
                  : isCurrentStep
                  ? `2px solid ${theme.palette.warning.main}`
                  : `1px solid ${theme.palette.divider}`,
                boxShadow: isFilterSelected
                  ? `0 0 16px ${alpha(theme.palette.success.main, 0.55)}`
                  : isCompleted
                  ? `0 0 12px ${alpha(theme.palette.success.main, 0.35)}`
                  : isCurrentStep
                  ? `0 0 14px ${alpha(theme.palette.warning.main, 0.50)}`
                  : '0 2px 6px rgba(0,0,0,0.06)',
                transform: isFilterSelected
                  ? 'scale(1.1)'
                  : isCompleted
                  ? 'scale(1.02)'
                  : isCurrentStep
                  ? 'scale(1.04)'
                  : 'scale(0.95)',
                transition: 'all 0.25s ease',
                animation: isFilterSelected
                  ? `${activeFilterGlow} 2s infinite ease-in-out`
                  : isCurrentStep
                  ? `${pulseGlow} 2s infinite ease-in-out`
                  : 'none',

                color: isFilterSelected
                  ? theme.palette.success.dark
                  : isCompleted
                  ? theme.palette.success.dark
                  : isCurrentStep
                  ? theme.palette.warning.dark
                  : theme.palette.text.disabled,
              }}
            >
              {React.isValidElement(step.icon) ? (
                React.cloneElement(step.icon, {
                  sx: {
                    fontSize: 22,
                    color: 'inherit',
                    transition: '0.25s ease',
                  },
                })
              ) : typeof step.icon === 'function' ? (
                React.createElement(step.icon, {
                  sx: {
                    fontSize: 22,
                    color: 'inherit',
                  },
                })
              ) : (
                <img
                  src={step.icon}
                  alt={step.label}
                  style={{
                    width: 30,
                    height: 30,
                    objectFit: 'contain',
                    filter: isCompleted || isFilterSelected || isCurrentStep
                      ? 'none'
                      : 'grayscale(100%) opacity(0.6)',
                    transition: '0.25s ease',
                  }}
                />
              )}
            </Box>
          )}
          sx={{
            textAlign: 'center',
            m: 0,
            p: 0,
            '& .MuiStepLabel-labelContainer': {
              width: '100%',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              minWidth: { xs: 95, sm: 115 },
              maxWidth: 140,
              mt: 1,
            }}
          >
            {/* Step Label / Title */}
            <Typography
              fontSize="11.5px"
              fontWeight={700}
              sx={{
                color: isFilterSelected
                  ? theme.palette.success.dark
                  : isCompleted
                  ? theme.palette.success.dark
                  : isCurrentStep
                  ? theme.palette.warning.dark
                  : theme.palette.text.secondary,
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1.25,
                transition: '0.25s',
              }}
            >
              {step.label}
            </Typography>

            {/* Live Count Pill in Dashboard Filter Mode */}
            {interactiveFilter && count !== null && (
              <Chip
                label={`${count} ${count === 1 ? 'App' : 'Apps'}`}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: isFilterSelected
                    ? theme.palette.success.main
                    : count > 0
                    ? alpha(theme.palette.primary.main, 0.12)
                    : theme.palette.action.hover,
                  color: isFilterSelected
                    ? theme.palette.common.white
                    : count > 0
                    ? theme.palette.primary.main
                    : theme.palette.text.disabled,
                  borderRadius: '4px',
                }}
              />
            )}

            {/* Description (When Requested) */}
            {showDescription && step.description && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '9.5px',
                  lineHeight: 1.25,
                  mt: 0.4,
                  minHeight: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                {step.description}
              </Typography>
            )}

            {/* 1. Completed State: Clean Timestamp & Actor Capsule */}
            {showTimestamp && isCompleted && (step.date || step.approvedBy) && (
              <Box
                sx={{
                  mt: 0.6,
                  px: 0.8,
                  py: 0.4,
                  borderRadius: '6px',
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.22)}`,
                  textAlign: 'center',
                  width: '100%',
                  minHeight: 32,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {step.date && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.success.dark,
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'block',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {step.date}
                  </Typography>
                )}

                {step.approvedBy && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      fontSize: '8.5px',
                      fontWeight: 700,
                      display: 'block',
                      lineHeight: 1.2,
                      mt: 0.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    By: {step.approvedBy}
                  </Typography>
                )}
              </Box>
            )}

            {/* 2. In-Progress State (Not fully completed application): Glowing In Progress Pill */}
            {!isAllCompleted && isCurrentStep && (
              <Box
                sx={{
                  mt: 0.6,
                  px: 0.9,
                  py: 0.35,
                  borderRadius: '6px',
                  bgcolor: alpha(theme.palette.warning.main, 0.12),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.6)}`,
                  boxShadow: `0 0 10px ${alpha(theme.palette.warning.main, 0.35)}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.6,
                  minHeight: 24,
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: theme.palette.warning.main,
                    animation: `${pulseGlow} 1.5s infinite ease-in-out`,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.warning.dark,
                    fontSize: '9px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  In Progress
                </Typography>
              </Box>
            )}

            {/* 3. Pending State (Not fully completed application): Neutral Pending Pill */}
            {!isAllCompleted && isPendingStep && (
              <Box
                sx={{
                  mt: 0.6,
                  px: 0.8,
                  py: 0.3,
                  borderRadius: '6px',
                  bgcolor: theme.palette.action.hover,
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 24,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.disabled,
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Pending
                </Typography>
              </Box>
            )}
          </Box>
        </StepLabel>
      </Box>
    );

    const tooltipTitle = (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" display="block" fontWeight={700}>
          {step.label}
        </Typography>
        {step.description && (
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 0.3 }}>
            {step.description}
          </Typography>
        )}
        {showTimestamp && step.date && (
          <Typography variant="caption" display="block" sx={{ color: 'success.light', mt: 0.3 }}>
            Date: {step.date}
          </Typography>
        )}
        {showTimestamp && step.approvedBy && (
          <Typography variant="caption" display="block" sx={{ color: 'info.light' }}>
            Approved By: {step.approvedBy}
          </Typography>
        )}
      </Box>
    );

    if (showTooltip) {
      return (
        <Tooltip key={idx} title={tooltipTitle} arrow placement="top">
          {labelContent}
        </Tooltip>
      );
    }

    return labelContent;
  };

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        overflowY: 'hidden',
        py: 1,
        px: { xs: 0.5, sm: 1 },
      }}
    >
      {/* Optional Interactive Filter Header */}
      {interactiveFilter && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pb: 1.2,
            mb: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TouchAppRounded sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontSize: '0.82rem' }}>
            Workflow Pipeline Stage Filter (Click any stage to filter records)
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          minWidth: 700,
          py: 0.5,
          position: 'relative',
        }}
      >
        <Stepper
          activeStep={isAllCompleted ? filteredSteps.length : currentActiveStepIndex}
          alternativeLabel
          nonLinear
          connector={<CBIConnector />}
        >
          {filteredSteps.map((step, idx) => (
            <Step
              key={step.label || idx}
              completed={isAllCompleted ? true : Boolean(step.status)}
              active={!isAllCompleted && idx === currentActiveStepIndex}
              sx={{
                '& .MuiStepLabel-root': {
                  alignItems: 'center',
                },
              }}
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
  showTimestamp: PropTypes.bool,
  allActive: PropTypes.bool,
  showTooltip: PropTypes.bool,
  interactiveFilter: PropTypes.bool,
  selectedStepIndex: PropTypes.number,
  onStepClick: PropTypes.func,
  stepCounts: PropTypes.array,
};
