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
  Chip,
  Button,
  alpha,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { FilterAltOffRounded, TouchAppRounded } from '@mui/icons-material';
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

const activeFilterGlow = keyframes`
  0% {
    box-shadow: 0 0 8px rgba(46, 125, 50, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(46, 125, 50, 0.75);
  }
  100% {
    box-shadow: 0 0 8px rgba(46, 125, 50, 0.4);
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

// ------------------------------------------------------
// ⭐ MAIN COMPONENT
// ------------------------------------------------------
export default function RoleBasedStepper({
  steps = [],
  showDescription = false,
  showTimestamp = false,
  allActive = false,
  showTooltip = false,
  statusChip,
  interactiveFilter = false,
  selectedStepIndex = null,
  onStepClick = null,
  stepCounts = [],
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

    return steps.filter((step) => {
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
    const isFilterSelected = interactiveFilter && selectedStepIndex === index;
    const count = stepCounts && stepCounts[index] !== undefined ? stepCounts[index] : null;

    const labelContent = (
      <Box
        onClick={() => {
          if (interactiveFilter && onStepClick) {
            onStepClick(step, index);
          }
        }}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          cursor: interactiveFilter ? 'pointer' : 'default',
          p: interactiveFilter ? '6px 4px' : 0,
          borderRadius: '12px',
          bgcolor: isFilterSelected ? 'rgba(46, 125, 50, 0.08)' : 'transparent',
          border: isFilterSelected ? '1px dashed #2E7D32' : '1px solid transparent',
          '&:hover': {
            transform: interactiveFilter ? 'translateY(-4px)' : 'none',
            bgcolor: interactiveFilter ? 'rgba(23, 111, 193, 0.04)' : 'transparent',
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
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: isFilterSelected ? '2.5px solid #2E7D32' : '1px solid #e2e8f0',
                boxShadow: isFilterSelected
                  ? '0 0 16px rgba(46, 125, 50, 0.55)'
                  : isCompleted
                  ? '0 0 12px rgba(23, 111, 193, 0.40)'
                  : isCurrentStep
                  ? '0 0 14px rgba(255, 152, 0, 0.60)'
                  : '0 0 8px rgba(0,0,0,0.12)',
                transform: isFilterSelected ? 'scale(1.12)' : isCompleted ? 'scale(1.04)' : 'scale(0.92)',
                transition: 'all 0.3s ease',
                animation: isFilterSelected
                  ? `${activeFilterGlow} 2s infinite ease-in-out`
                  : isCurrentStep
                  ? `${pulseGlow} 2s infinite ease-in-out`
                  : 'none',

                color: isFilterSelected
                  ? '#2E7D32'
                  : isCompleted
                  ? '#176FC1'
                  : isCurrentStep
                  ? '#ff9800'
                  : '#777',
                '&:hover': {
                  transform: 'scale(1.12)',
                  boxShadow: '0 0 16px rgba(23, 111, 193, 0.45), 0 4px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              {React.isValidElement(step.icon) ? (
                React.cloneElement(step.icon, {
                  sx: {
                    fontSize: 22,
                    color: 'inherit',
                    transition: '0.3s ease',
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
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    filter: isCompleted || isFilterSelected
                      ? 'none'
                      : isCurrentStep
                      ? 'none'
                      : 'grayscale(100%) opacity(0.6)',
                    transition: '0.3s ease',
                  }}
                />
              )}
            </Box>
          )}
          sx={{
            textAlign: 'center',
            m: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              minWidth: { xs: 90, sm: 110 },
              maxWidth: 135,
              mt: 0.8,
            }}
          >
            {/* Constant Fixed Height Title */}
            <Typography
              fontSize="11px"
              fontWeight={700}
              sx={{
                color: isFilterSelected ? '#2E7D32' : isCompleted ? '#176FC1' : '#555',
                minHeight: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                lineHeight: 1.25,
                transition: '0.3s',
                '&:hover': {
                  color: isFilterSelected ? '#2E7D32' : '#176FC1',
                  textShadow: isFilterSelected ? '0 0 4px rgba(46, 125, 50, 0.35)' : '0 0 4px rgba(23, 111, 193, 0.35)',
                },
              }}
            >
              {step.label}
            </Typography>

            {/* Live Count Pill in Interactive Mode */}
            {interactiveFilter && count !== null && (
              <Chip
                label={`${count} ${count === 1 ? 'App' : 'Apps'}`}
                size="small"
                sx={{
                  mt: 0.4,
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: isFilterSelected
                    ? '#2E7D32'
                    : count > 0
                    ? alpha('#176FC1', 0.12)
                    : '#f1f5f9',
                  color: isFilterSelected ? '#ffffff' : count > 0 ? '#176FC1' : 'text.disabled',
                  borderRadius: '4px',
                }}
              />
            )}

            {/* Optional Description */}
            {showDescription && step.description && (
              <Typography
                variant="caption"
                sx={{
                  color: '#637381',
                  fontSize: '9px',
                  lineHeight: 1.2,
                  mt: 0.3,
                  minHeight: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transition: '0.3s',
                  '&:hover': { color: '#176FC1' },
                }}
              >
                {step.description}
              </Typography>
            )}

            {/* Clean Structured Timestamp & Actor Pill */}
            {showTimestamp && isCompleted && (step.date || step.approvedBy) && (
              <Box
                sx={{
                  mt: 0.6,
                  px: 0.8,
                  py: 0.4,
                  borderRadius: '6px',
                  bgcolor: 'rgba(46, 125, 50, 0.08)',
                  border: '1px solid rgba(46, 125, 50, 0.18)',
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
                      color: '#2e7d32',
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
                      color: '#176FC1',
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

            {/* Constant Aligned Status Chip */}
            {statusChip && (
              <Box sx={{ mt: 0.8, display: 'flex', justifyContent: 'center' }}>
                <StatusChipOrSelect
                  value={isCompleted ? 'completed' : 'pending'}
                  type="status"
                />
              </Box>
            )}
          </Box>
        </StepLabel>
      </Box>
    );

    const tooltipTitle = (
      <Box>
        <Typography variant="caption" display="block" fontWeight={700}>
          {step.label}
        </Typography>
        {step.description && (
          <Typography variant="caption" display="block">
            {step.description}
          </Typography>
        )}
        {showTimestamp && step.date && (
          <Typography variant="caption" display="block" color="#81c784">
            Date: {step.date}
          </Typography>
        )}
        {showTimestamp && step.approvedBy && (
          <Typography variant="caption" display="block" color="#64b5f6">
            Approved By: {step.approvedBy}
          </Typography>
        )}
      </Box>
    );

    if (!showTooltip) {
      return <Box key={index}>{labelContent}</Box>;
    }

    return (
      <Tooltip
        title={tooltipTitle}
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              background: '#0a2342',
              color: '#fff',
              border: '1px solid #003A8C',
              fontSize: '11px',
              p: 1,
              boxShadow: '0 0 8px rgba(0, 60, 150, 0.25)',
            },
          },
          arrow: { sx: { color: '#0a2342' } },
        }}
      >
        <Box key={index}>{labelContent}</Box>
      </Tooltip>
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        bgcolor: '#ffffff',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.200',
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        overflowX: 'auto',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        '&::-webkit-scrollbar': {
          height: '5px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#d1d5db',
          borderRadius: '4px',
        },
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
            mb: 1,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <TouchAppRounded sx={{ color: 'primary.main', fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700} color="#0E4F8D" sx={{ fontSize: '0.82rem' }}>
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
  interactiveFilter: PropTypes.bool,
  selectedStepIndex: PropTypes.number,
  onStepClick: PropTypes.func,
  stepCounts: PropTypes.array,
};
