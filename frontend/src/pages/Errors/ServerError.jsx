/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Page: ServerError (500)
 * Purpose: Theme-compliant 500 error page for backend outages or exceptions.
 * ============================================================================
 */

import React from 'react';
import { Box, Button, Container, Paper, Typography, Stack, useTheme } from '@mui/material';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ServerError = () => {
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
              bgcolor: 'error.lighter',
              color: 'error.main',
              mb: 3,
            }}
          >
            <ErrorOutline sx={{ fontSize: 64 }} />
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            color="error.main"
            sx={{ letterSpacing: '-1px', mb: 1 }}
          >
            500
          </Typography>

          <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
            Internal Server Error
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            Something went wrong while processing your request on the server. Please try refreshing or return to the dashboard.
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
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Refresh
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ServerError;
