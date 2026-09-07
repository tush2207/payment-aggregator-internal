import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

const NetworkStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: '20px !important' }}
      >
        <Alert
          severity="error"
          variant="filled"
          icon={<WifiOff fontSize="inherit" />}
          action={
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          }
          sx={{
            width: '100%',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          No Internet Connection. You are currently offline.
        </Alert>
      </Snackbar>

      {/* Online Restored Alert */}
      <Snackbar
        open={showRestored}
        autoHideDuration={4000}
        onClose={() => setShowRestored(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: '20px !important' }}
      >
        <Alert
          severity="success"
          variant="filled"
          icon={<Wifi fontSize="inherit" />}
          sx={{
            width: '100%',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          Internet Connection Restored.
        </Alert>
      </Snackbar>
    </>
  );
};

export default NetworkStatusBanner;
