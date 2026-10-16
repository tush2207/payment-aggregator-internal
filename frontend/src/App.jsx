import FullScreenLoader from '&src/components/feedback/FullScreenLoader';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import ToastNotificationsProvider from '&src/components/feedback/ToastNotifications/ToastNotificationsProvider';
import ErrorBoundary from '&src/components/layout/ErrorBoundary';
import ScrollTop from './hooks/ScrollTop';
import RoutingProvider from './routes';
import ThemeProvider from './theme';

function App() {
  return (
    <ErrorBoundary>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeProvider>
            <BrowserRouter>
              <ScrollTop />
                  <Suspense fallback={<FullScreenLoader />}>
                    <ToastNotificationsProvider>
                      <RoutingProvider />
                    </ToastNotificationsProvider>
                  </Suspense>
            </BrowserRouter>
          </ThemeProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  );
}

export default App;
