import React from 'react';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/**
 * A visually appealing vertical stepper to track application progress.
 * @param {Array} steps - The workflow steps generated from PAYMENT_AGGREGATOR_WORKFLOW
 */
export default function ApplicationFlowStepper({ steps }) {
  return (
    <Paper elevation={0} sx={{ p: 3, backgroundColor: 'transparent' }}>
      <Stepper orientation="vertical">
        {steps.map((step, index) => {
          const isCompleted = step.status === true;
          const isRejected = step.status === false;
          const isPending = step.status === null || step.status === undefined;
          
          let color = 'text.secondary';
          if (isCompleted) color = 'success.main';
          if (isRejected) color = 'error.main';

          return (
            <Step key={index} active={true} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => (
                  isCompleted ? (
                    <CheckCircleIcon color="success" />
                  ) : isRejected ? (
                    <CheckCircleIcon color="error" />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" />
                  )
                )}
              >
                <Typography variant="subtitle1" fontWeight={isCompleted ? 600 : 400} color={color}>
                  {step.label} ({step.role})
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                
                {isCompleted && (
                  <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'success.light', color: 'success.dark', fontSize: '0.75rem', fontWeight: 600 }}>
                    Completed
                  </Box>
                )}
                {isRejected && (
                  <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'error.light', color: 'error.dark', fontSize: '0.75rem', fontWeight: 600 }}>
                    Rejected
                  </Box>
                )}
                {isPending && (
                  <Box sx={{ display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.200', color: 'grey.700', fontSize: '0.75rem', fontWeight: 600 }}>
                    Pending
                  </Box>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}
