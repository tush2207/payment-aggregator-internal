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

// ✅ Custom connector (line centered with image)
const CenteredConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: '50%',
    transform: 'translateY(-50%)',
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'dark' ? '#eaeaf0' : '#ccc',
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

export default function ApplicationWorkFlow({
  steps = [],
  showDescription = false,
  allActive = false,
  showTooltip = false,
  statusChip,
}) {
  const [activeStep, setActiveStep] = useState(0);

  // ✅ Handle active step calculation
  useEffect(() => {
    if (!allActive && steps?.length > 0) {
      const currentIndex = steps.findIndex((step) => !step.status);
      setActiveStep(currentIndex === -1 ? steps.length : currentIndex);
    } else {
      setActiveStep(0);
    }
  }, [steps, allActive]);

  // ✅ Step label renderer
  const renderStepLabel = (step, index, isPlaceholder = false) => {
    const labelProps = {};

    const isActive = isPlaceholder || Boolean(step.status);

    const stepLabel = (
      <StepLabel
        StepIconComponent={() => (
          <img
            src={step.icon}
            alt={step.label}
            style={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              opacity: isActive ? 1 : 0.5,
              filter: isActive ? 'none' : 'grayscale(100%)',
              transition: 'all 0.3s ease',
              backgroundColor: 'white',
            }}
          />
        )}
        {...labelProps}
        sx={{
          marginBottom: '16px',
          pointerEvents: step.status ? 'auto' : 'none',
          opacity: step.status ? 1 : 0.6,
        }}
      >
        <Typography fontSize="12px" component="div">
          {step.label}
        </Typography>

        {showDescription && (
          <Typography variant="caption" component="div">
            {step.description}
          </Typography>
        )}

        {statusChip && (
          <>
            {step.status ? (
              <StatusChipOrSelect value="completed" type="status" />
            ) : (
              <StatusChipOrSelect value="pending" type="status" />
            )}
          </>
        )}
      </StepLabel>
    );

    if (showTooltip && step.description) {
      return (
        <Tooltip
          title={step.description}
          placement="top"
          arrow
          componentsProps={{
            tooltip: {
              sx: {
                border: '1px solid blue',
                bgcolor: 'white',
                color: 'blue',
                fontSize: '14px',
                padding: '8px',
                borderRadius: '8px',
                margin: '4px',
                textAlign: 'center',
              },
            },
            arrow: { sx: { color: 'blue' } },
          }}
        >
          <Box>{stepLabel}</Box>
        </Tooltip>
      );
    }

    return stepLabel;
  };

  // ✅ If steps are empty → show default placeholders (all active)
  const displaySteps =
    steps && steps.length > 0
      ? steps
      : [
        { label: 'Step 1', icon: '/images/placeholder1.png', status: true },
        { label: 'Step 2', icon: '/images/placeholder2.png', status: true },
        { label: 'Step 3', icon: '/images/placeholder3.png', status: true },
      ];

  const isPlaceholderMode = !steps || steps.length === 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper
        activeStep={isPlaceholderMode || allActive ? -1 : activeStep}
        alternativeLabel
        nonLinear
        connector={<CenteredConnector />}
        sx={{
          '& .MuiStepConnector-root': {
            top: '30px !important', // keep line centered with images
          },
        }}
      >
        {displaySteps.map((step, index) => (
          <Step
            key={step.label || index}
            completed={isPlaceholderMode || allActive ? true : step.status}
            sx={{ padding: 0 }}
          >
            {renderStepLabel(step, index, isPlaceholderMode)}
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

ApplicationWorkFlow.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.bool,
      optional: PropTypes.bool,
      icon: PropTypes.string.isRequired,
    })
  ),
  showDescription: PropTypes.bool,
  allActive: PropTypes.bool,
  showTooltip: PropTypes.bool,
  statusChip: PropTypes.bool,
};
