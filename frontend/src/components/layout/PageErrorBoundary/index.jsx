/**
 * ============================================================================
 * Central Bank of India (CBI) - Payment Aggregator Portal
 * Component: PageErrorBoundary
 * Purpose: Catches unhandled JavaScript runtime exceptions in page hierarchies,
 *          logs security diagnostics, and presents a CenEODS-compliant graceful fallback.
 * Compliance: Bank Resilience & High Availability Standard.
 * ============================================================================
 */

import React from 'react';
import palette from '&src/theme/palette';
import { ErrorOutline, Refresh, Home } from '@mui/icons-material';
import { Container, Paper, Typography, Box, Button, Stack } from '@mui/material';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('PageErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pageName !== this.props.pageName) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container
          maxWidth="md"
          sx={{ py: 6, display: 'flex', justifyContent: 'center' }}
        >
          <Paper
            elevation={4}
            sx={{
              p: { xs: 3, sm: 5 },
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'error.light',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: '50%',
                bgcolor: 'error.lighter',
                color: 'error.main',
                mb: 2,
              }}
            >
              <ErrorOutline sx={{ fontSize: 56 }} />
            </Box>

            <Typography variant="h5" fontWeight={700} color="error.main" gutterBottom>
              Something went wrong on this page.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred while rendering <strong>{this.props.pageName || 'this component'}</strong>.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Refresh />}
                onClick={() => window.location.reload()}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Reload Page
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Home />}
                onClick={() => (window.location.href = '/dashboard')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Go to Dashboard
              </Button>
            </Stack>

            {/* Error stack collapsible details */}
            <Box
              component="details"
              sx={{
                width: '100%',
                textAlign: 'left',
                bgcolor: 'action.hover',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
              }}
            >
              <summary style={{ fontWeight: 600, color: palette?.text?.primary || '#212B36', fontSize: '0.85rem' }}>
                View Error Details (Technical Diagnostics)
              </summary>
              <Box
                component="pre"
                sx={{
                  mt: 1.5,
                  fontSize: '0.75rem',
                  color: 'error.main',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </Box>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
