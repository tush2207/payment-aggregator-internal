import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';

const BrandingHeader = ({ isResponsive = true }) => {
  const theme = useTheme();
  const GOLD = theme.palette.accent?.main || '#f6d365';
  const RED = theme.palette.secondary?.main || '#CE0F3E';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* ACCENT BAR */}
      <Box
        sx={{
          width: 3.5,
          height: 36,
          borderRadius: '2px',
          background: `linear-gradient(180deg, ${GOLD} 0%, ${RED} 100%)`,
          display: { xs: 'none', sm: 'block' },
        }}
      />

      {/* TEXT SECTION: Payment Aggregator Portal above Neo Banking & Emerging Technologies */}
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Line 1: Portal Branding */}
        <Typography
          sx={{
            color: GOLD,
            fontWeight: 800,
            fontSize: { xs: '0.88rem', sm: '0.98rem', md: '1.05rem' },
            lineHeight: 1.2,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          }}
        >
          Payment Aggregator Portal
        </Typography>

        {/* Line 2: Department */}
        <Typography
          sx={{
            color: '#ffffff',
            fontWeight: 600,
            fontSize: { xs: '0.70rem', sm: '0.76rem', md: '0.80rem' },
            lineHeight: 1.2,
            letterSpacing: '0.3px',
          }}
        >
          Neo Banking & Emerging Technologies
        </Typography>
      </Box>
    </Box>
  );
};

export default BrandingHeader;
