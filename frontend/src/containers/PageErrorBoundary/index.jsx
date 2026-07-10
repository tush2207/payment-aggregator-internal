import React from 'react';
import palette from '&src/theme/palette';
import { ErrorOutline } from '@mui/icons-material';
import { Container, Paper, Typography, Box } from '@mui/material';
class PageErrorBoundary extends React.Component {
  // Constructor initializes the component's state
  constructor(props) {
    super(props);
    this.state = {
      hasError: false, // Tracks if an error has occurred
      error: null, // Holds the error object
      errorInfo: null, // Holds additional information about the error
    };
  }

  // getDerivedStateFromError is called when an error is thrown in a child component
  static getDerivedStateFromError(error) {
    // This updates the state to show the fallback UI (the error message)
    return { hasError: true, error }; // Set hasError to true and store the error
  }

  // componentDidCatch is called after an error is thrown and caught by the error boundary
  componentDidCatch(error, errorInfo) {
    // Here, you can log the error to an external service for tracking
    this.setState({ errorInfo }); // Save the errorInfo in the state for rendering details
    console.error('Error Boundary caught an error:', error, errorInfo); // Log the error details to the console
  }

  // This lifecycle method is called when the component updates due to a change in props or state
  componentDidUpdate(prevProps) {
    // Check if the pageName prop has changed since the last render
    if (prevProps.pageName !== this.props.pageName) {
      // Reset the error state if the pageName prop has changed
      this.setState({
        hasError: false, // Reset hasError to false so the component renders normally
        error: null, // Clear the stored error
        errorInfo: null, // Clear the stored error info
      });
    }
  }

  render() {
    // If the state indicates an error has occurred, render the error UI
    if (this.state.hasError) {
      return (
        <Container
          component={Paper}
          style={{
            padding: '50px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: `1px solid ${palette.error.main}`,
            overflowWrap: 'break-word',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
          }}>
          <ErrorOutline fontSize="large" color="error" />
          <Typography variant="h4" color="error">
            Something went wrong.
          </Typography>
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography fontWeight={700}>
              Error in: {this.props.pageName || 'Unknown Page'}
            </Typography>
          </Box>

          <details style={{ whiteSpace: 'pre-wrap', width: '100%' }}>
            <Typography
              variant="body2" component="div"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
              }}
            >
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </Typography>
          </details>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
