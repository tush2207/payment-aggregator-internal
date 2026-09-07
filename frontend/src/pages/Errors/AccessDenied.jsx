import React from 'react';
import { Box, Button, Container, Paper, Typography, Stack } from '@mui/material';
import { LockOutlined, Home, Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { removeCookie } from '&src/utils/cookies';

const AccessDenied = () => {
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
        background: 'linear-gradient(135deg, #0b1f3a 0%, #1a365d 50%, #0d2847 100%)',
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
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: 'rgba(237, 108, 2, 0.1)',
              color: '#ed6c02',
              mb: 3,
            }}
          >
            <LockOutlined sx={{ fontSize: 64 }} />
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            sx={{ color: '#ed6c02', letterSpacing: '-1px', mb: 1 }}
          >
            403
          </Typography>

          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: '#0b1f3a' }}>
            Access Denied / Unauthorized
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            You do not have the required permissions or role privileges to view this module. Please contact your Central Office administrator.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
              sx={{
                bgcolor: '#004c8f',
                '&:hover': { bgcolor: '#003366' },
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
