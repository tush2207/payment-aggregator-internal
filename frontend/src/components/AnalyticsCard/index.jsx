/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Component: AnalyticsCard
 * Purpose: High-performance KPI / metric summary card compliant with
 *          CenEODS minimal banking design system.
 * ============================================================================
 */

import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape?.borderRadius ? theme.shape.borderRadius * 1.5 : 12,
  padding: theme.spacing(2.5),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1] || '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'all 0.25s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: theme.shadows[4] || '0 8px 24px rgba(0,0,0,0.12)',
    borderColor: theme.palette.primary.light || theme.palette.primary.main,
  },
}));

const StyledIconContainer = styled(Box)(({ theme, customcolor }) => ({
  width: 58,
  height: 58,
  borderRadius: theme.shape?.borderRadius || 10,
  backgroundColor: theme.palette.action?.hover || 'rgba(0, 0, 0, 0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: customcolor || theme.palette.primary.main,
  fontSize: '28px',
  border: `1px solid ${theme.palette.divider}`,
}));

export default function AnalyticsCard({ title, value, icon, color }) {
  const theme = useTheme();
  const cardColor = color || theme.palette.primary.main;

  return (
    <StyledCard elevation={0}>
      <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
        <Box display="flex" alignItems="center" gap={2}>
          <StyledIconContainer customcolor={cardColor}>
            {icon}
          </StyledIconContainer>

          <Box>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: cardColor,
                mt: 0.3,
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </StyledCard>
  );
}
