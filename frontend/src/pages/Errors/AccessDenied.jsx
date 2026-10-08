/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Page: AccessDenied (403)
 * Purpose: Gracefully notifies unauthorized users when accessing restricted modules.
 * ============================================================================
 */

import React from 'react';
import { Box, Button, Container, Paper, Typography, Stack, useTheme } from '@mui/material';
import { LockOutlined, Home, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { removeCookie } from '&src/utils/cookies';

const AccessDenied = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeCookie('accessToken');
    removeCookie('role');
    removeCookie('username');
    window.location.href = '/login';
  };

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
              bgcolor: 'warning.lighter',
              color: 'warning.main',
              mb: 3,
            }}
          >
            <LockOutlined sx={{ fontSize: 64 }} />
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            color="warning.main"
            sx={{ letterSpacing: '-1px', mb: 1 }}
          >
            403
          </Typography>

          <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
            Access Denied / Unauthorized
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            You do not have the required permissions or role privileges to view this module. Please contact your Central Office administrator.
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
              startIcon={<Logout />}
              onClick={handleLogout}
              color="error"
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Switch Account
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AccessDenied;
