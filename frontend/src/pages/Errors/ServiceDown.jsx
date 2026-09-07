import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudOff,
  Refresh,
  CheckCircleOutline,
  ErrorOutline,
  SupportAgent,
  Home,
} from '@mui/icons-material';
import axios from 'axios';

const ServiceDown = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [serverStatus, setServerStatus] = useState(null); // 'online' | 'offline' | null
  const [autoRetry, setAutoRetry] = useState(true);

  const apiBaseUrl = import.meta.env.VITE_BASE_API_URL || 'http://localhost:8000/api';
  const healthUrl = apiBaseUrl.replace(/\/api\/?$/, '') + '/health';

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const response = await axios.get(healthUrl, { timeout: 5000 });
      if (response.status === 200) {
        setServerStatus('online');
        // If server is back up, redirect to dashboard or home after 1.5s
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    } finally {
      setIsChecking(false);
      setCountdown(30);
    }
  };

  useEffect(() => {
    // Initial health ping
    checkHealth();

    // Auto-retry timer
    const interval = setInterval(() => {
      if (autoRetry) {
        setCountdown((prev) => {
          if (prev <= 1) {
            checkHealth();
            return 30;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRetry]);

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
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Animated Icon */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              bgcolor: serverStatus === 'online' ? 'success.light' : 'error.lighter',
              color: serverStatus === 'online' ? 'success.main' : '#d32f2f',
              mb: 3,
              boxShadow: '0 8px 16px rgba(211, 47, 47, 0.15)',
              animation: isChecking ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.08)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            {serverStatus === 'online' ? (
              <CheckCircleOutline sx={{ fontSize: 64, color: '#2e7d32' }} />
            ) : (
              <CloudOff sx={{ fontSize: 64 }} />
            )}
          </Box>

          <Typography
            variant="h4"
            fontWeight={800}
            gutterBottom
            sx={{ color: '#0b1f3a', letterSpacing: '-0.5px' }}
          >
            {serverStatus === 'online'
              ? 'Service Restored!'
              : 'Service Temporarily Unavailable'}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
            {serverStatus === 'online'
              ? 'The backend server is online. Redirecting you to the portal...'
              : 'The Payment Aggregator service is currently experiencing technical maintenance or downtime. Our team is actively working to restore it.'}
          </Typography>

          {/* Status Badge */}
          <Box sx={{ mb: 3 }}>
            {serverStatus === 'online' ? (
              <Chip
                icon={<CheckCircleOutline />}
                label="System Status: Operational"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 600, px: 1 }}
              />
            ) : (
              <Chip
                icon={<ErrorOutline />}
                label="System Status: Server Offline / Unreachable"
                color="error"
                variant="outlined"
                sx={{ fontWeight: 600, px: 1 }}
              />
            )}
          </Box>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={checkHealth}
              disabled={isChecking}
              startIcon={
                isChecking ? <CircularProgress size={20} color="inherit" /> : <Refresh />
              }
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
              {isChecking ? 'Checking Connection...' : `Retry Now (${countdown}s)`}
            </Button>

            <Button
              variant="outlined"
              size="large"
              href="/"
              startIcon={<Home />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.2,
                fontWeight: 600,
                borderColor: '#004c8f',
                color: '#004c8f',
                textTransform: 'none',
              }}
            >
              Go to Home
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Helpdesk / Footer Info */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <SupportAgent fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Need urgent help? Contact Central IT Helpdesk or check internal network connectivity.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ServiceDown;
