import React from 'react';
import { Stack, Typography, Divider, Button, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { isRO, isZO } from '&src/constants/PaymentAggregratorConstant';
import { ContactMail, People } from '@mui/icons-material';

const SectionHeader = ({
  title = 'Section Title',
  buttonText = '',
  onButtonClick,
  showButton = false,
  buttonProps = {},
  subComponent,
  color
}) => {
  const theme = useTheme();
  return (
    <>
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      // pb={1}
      >
        <Typography
          fontSize='20px'
          fontWeight='700'
          color={color}
          sx={{
            background: theme.custom?.gradients?.main || theme.palette.primary.main,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: !color && 'transparent',
          }}
        >
          {title}
        </Typography>

        {showButton && (
          <Button variant='contained' onClick={onButtonClick} {...buttonProps}>
            {buttonText}
          </Button>
        )}

        {!showButton && (isRO || isZO) && <Alert severity='info'>Note: Click <b>Verify</b> button review and <b>Approve or Reject</b> application. </Alert>}

      </Stack>
      {subComponent}
      <Divider
        sx={{
          borderBottomWidth: 3,
          marginBottom: 2,
          marginTop: 0.5
        }}
      />
    </>
  );
};

export default SectionHeader;
