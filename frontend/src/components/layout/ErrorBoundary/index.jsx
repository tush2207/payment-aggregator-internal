import palette from '&src/theme/palette';
import { ErrorOutline } from '@mui/icons-material';
import { Container, Paper, Stack, Typography } from '@mui/material';
import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Stack display="flex" alignItems="center">
          <Container
            component={Paper}
            style={{
              margin: '24px',
              padding: '50px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: `1px solid ${palette.error.main}`,
            }}>
            <ErrorOutline fontSize="large" color="error" />
            <Typography variant="h4" color="error">
              Something went wrong.
            </Typography>
          </Container>
        </Stack>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
