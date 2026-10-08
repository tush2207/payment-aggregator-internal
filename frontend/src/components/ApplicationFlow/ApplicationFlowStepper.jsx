import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, Paper, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

/**
 * A visually appealing vertical stepper to track stage-by-stage application progress and audit timestamps.
 *
 * @business_rule Stage Timestamps:
 * Each completed stage presents its authentic completion date & time and acting authority.
 *
 * @param {Array} steps - The workflow steps generated from PAYMENT_AGGREGATOR_WORKFLOW
 */
export default function ApplicationFlowStepper({ steps = [] }) {
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {step.description}
                </Typography>

                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
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

                  {/* Stage Completion Timestamp */}
                  {isCompleted && step.date && (
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                      Timestamp: <Box component="span" color="text.primary">{step.date}</Box>
                    </Typography>
                  )}

                  {/* Acting Authority */}
                  {isCompleted && step.approvedBy && (
                    <Typography variant="caption" color="primary.main" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                      By: {step.approvedBy}
                    </Typography>
                  )}
                </Stack>
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
}

ApplicationFlowStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      role: PropTypes.string,
      description: PropTypes.string,
      status: PropTypes.bool,
      date: PropTypes.string,
      approvedBy: PropTypes.string,
    })
  ),
};

