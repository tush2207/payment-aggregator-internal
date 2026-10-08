/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Page: NotFound (404)
 * Purpose: Friendly, theme-compliant 404 page for missing portal routes.
 * ============================================================================
 */

import React from 'react';
import { Box, Button, Container, Paper, Typography, Stack, useTheme } from '@mui/material';
import { Home, ArrowBack, SearchOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark || theme.palette.primary.main} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.secondary.main} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 4, sm: 6 },
            borderRadius: 4,
            textAlign: 'center',
            bgcolor: 'background.paper',
            boxShadow: 8,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: 'action.hover',
              color: 'primary.main',
              mb: 3,
            }}
          >
            <SearchOff sx={{ fontSize: 64 }} />
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            color="primary.main"
            sx={{ letterSpacing: '-1px', mb: 1 }}
          >
            404
          </Typography>

          <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
            Page Not Found
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="primary"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              color="inherit"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Go Back
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default NotFound;
