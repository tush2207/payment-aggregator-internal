import React from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';

/**
 * =========================================================
 * CBI PREMIUM PAGE HEADER (PORTED FROM DIGITAL AMBASSADOR PORTAL)
 * =========================================================
 */
const PageHeader = ({
  title = 'Dashboard',
  subtitle = '',
  description = '',
  icon: Icon = null,
  actions = [],
  badge = '',
  variant = 'default',
}) => {
  const theme = useTheme();

  const getVariantColors = () => {
    const variants = {
      default: {
        primary: theme?.palette?.primary?.main || '#176FC1',
        secondary: theme?.palette?.secondary?.main || '#CE0F3E',
      },
      accent: {
        primary: theme?.palette?.secondary?.main || '#CE0F3E',
        secondary: theme?.palette?.primary?.main || '#176FC1',
      },
      success: {
        primary: theme?.palette?.success?.main || '#2E7D32',
        secondary: theme?.palette?.primary?.main || '#176FC1',
      },
      warning: {
        primary: theme?.palette?.warning?.main || '#ED6C02',
        secondary: theme?.palette?.secondary?.main || '#CE0F3E',
      },
    };
    return variants[variant] || variants.default;
  };

  const colors = getVariantColors();
  const descText = description || subtitle;

  return (
    <Box
      sx={{
        width: '100%',
        mb: 2.5,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          width: '100%',
          minHeight: 48,
        }}
      >
        {/* ── LEFT: ICON + TITLE + DESCRIPTION ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.8,
            flex: 1,
            minWidth: '260px',
          }}
        >
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: alpha(colors.primary, 0.08),
                border: `1px solid ${alpha(colors.primary, 0.18)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  background: alpha(colors.primary, 0.14),
                },
              }}
            >
              <Icon
                sx={{
                  fontSize: 24,
                  color: colors.primary,
                }}
              />
            </Box>
          )}

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#0E4F8D',
                  fontSize: { xs: '1.25rem', sm: '1.4rem' },
                  lineHeight: 1.2,
                  letterSpacing: '-0.3px',
                  m: 0,
                  p: 0,
                }}
              >
                {title}
              </Typography>
              {badge && (
                <Chip
                  label={badge}
                  size="small"
                  sx={{
                    bgcolor: alpha(colors.primary, 0.1),
                    color: colors.primary,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    borderRadius: '6px',
                    height: 22,
                  }}
                />
              )}
            </Box>

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

        {/* ── RIGHT: ACTION BUTTONS ── */}
        {actions?.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {actions.map((action, index) => (
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
        )}
      </Box>

      {/* ── BOTTOM CBI DUAL-TONE ACCENT LINE ── */}
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

export default PageHeader;
