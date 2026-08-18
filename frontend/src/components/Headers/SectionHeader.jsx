import React from 'react';
import { Stack, Typography, Button, Alert, Box } from '@mui/material';
import { isRO, isZO } from '&src/constants/PaymentAggregratorConstant';

const SectionHeader = ({
  title = 'Section Title',
  buttonText = '',
  onButtonClick,
  showButton = false,
  buttonProps = {},
  subComponent,
  color
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography
          fontSize="20px"
          fontWeight="700"
          color={color || "#0a2342"}
          sx={{
            letterSpacing: "-0.2px"
          }}
        >
          {title}
        </Typography>

        {showButton && (
          <Button variant="contained" onClick={onButtonClick} {...buttonProps}>
            {buttonText}
          </Button>
        )}

        {!showButton && (isRO || isZO) && (
          <Alert severity="info" sx={{ py: 0, fontSize: "12px" }}>
            Note: Click <b>Verify</b> button to review and <b>Approve or Reject</b> application.
          </Alert>
        )}
      </Stack>
      {subComponent}
      <Box
        sx={{
          height: "3px",
          width: "100%",
          background: "linear-gradient(90deg, #0a2342 0%, #0d3b6e 40%, #f6d365 100%)",
          borderRadius: "2px",
          mt: 1
        }}
      />
    </Box>
  );
};

export default SectionHeader;

