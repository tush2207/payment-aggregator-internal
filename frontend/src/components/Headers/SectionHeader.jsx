import React from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
  Alert,
  Stack,
} from '@mui/material';
import { isRO, isZO } from '&src/constants/PaymentAggregratorConstant';

const SectionHeader = ({
  title = 'Section Title',
  subtitle = '',
  description = '',
  icon: Icon = null,
  buttonText = '',
  onButtonClick,
  showButton = false,
  buttonProps = {},
  actions = [],
  subComponent,
  color,
}) => {
  const theme = useTheme();
  const primaryColor = color || theme.palette.primary.main || '#176FC1';
  const descText = description || subtitle;

  // Build combined actions list if buttonText provided
  const combinedActions = [...actions];
  if (showButton && buttonText) {
    combinedActions.push({
      label: buttonText,
      onClick: onButtonClick,
      variant: 'contained',
      color: 'primary',
      ...buttonProps,
    });
  }

  return (
    <Box sx={{ width: '100%', mb: 2.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          minHeight: 48,
        }}
      >
        {/* ── LEFT: ICON + TITLE + DESCRIPTION ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, flex: 1, minWidth: '260px' }}>
          {Icon && (
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: '12px',
                background: alpha(primaryColor, 0.08),
                border: `1px solid ${alpha(primaryColor, 0.18)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  background: alpha(primaryColor, 0.14),
                },
              }}
            >
              {React.isValidElement(Icon) ? (
                React.cloneElement(Icon, { sx: { fontSize: 24, color: primaryColor } })
              ) : (
                <Icon sx={{ fontSize: 24, color: primaryColor }} />
              )}
            </Box>
          )}

          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: '#0E4F8D',
                fontSize: { xs: '1.25rem', sm: '1.35rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
                m: 0,
                p: 0,
              }}
            >
              {title}
            </Typography>

            {descText && (
              <Typography
                variant="body2"
                sx={{
                  color: '#637381',
                  mt: 0.3,
                  fontWeight: 500,
                  fontSize: { xs: '0.80rem', sm: '0.85rem' },
                  lineHeight: 1.35,
                }}
              >
                {descText}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── RIGHT: ACTION BUTTONS / ALERTS ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!showButton && (isRO || isZO) && (
            <Alert severity="info" sx={{ py: 0.2, px: 1.5, fontSize: '12px', borderRadius: '8px' }}>
              Note: Click <b>Verify</b> button to review and <b>Approve or Reject</b> application.
            </Alert>
          )}

          {combinedActions.map((action, index) => (
            <Button
              key={index}
              variant={action?.variant || 'contained'}
              color={action?.color || 'primary'}
              startIcon={action?.icon || action?.startIcon}
              endIcon={action?.endIcon}
              onClick={action?.onClick}
              disabled={action?.disabled}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderRadius: '8px',
                px: 2,
                py: 0.8,
                boxShadow: action?.variant === 'contained' ? '0 2px 8px rgba(23,111,193,0.25)' : 'none',
                ...action?.sx,
              }}
            >
              {action?.label || action?.text}
            </Button>
          ))}
        </Box>
      </Box>

      {subComponent}

      {/* ── BOTTOM DUAL-TONE ACCENT LINE ── */}
      <Box
        sx={{
          height: '3px',
          width: '100%',
          background: `linear-gradient(90deg, ${theme.palette.primary.dark || '#0E4F8D'} 0%, ${theme.palette.primary.main || '#176FC1'} 40%, ${theme.palette.secondary.main || '#CE0F3E'} 100%)`,
          borderRadius: '2px',
          mt: 1.5,
        }}
      />
    </Box>
  );
};

export default SectionHeader;
