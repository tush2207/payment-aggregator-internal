import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './App.css';
import ToastNotificationsProvider from './components/ToastNotifications/ToastNotificationsProvider';
import ErrorBoundary from './containers/ErrorBoundary';
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
