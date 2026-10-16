import { Snackbar } from '@mui/material';
import Alert from '@mui/material/Alert';
import { createContext, useContext } from 'react';
import useToastNotifications from './useToastNotifications';

const ToastNotificationsContext = createContext();

const ToastNotificationsProvider = ({ children }) => {
  const {
    isToastNotificationOpen,
    message,
    severity,
    showAlertNotification,
    hideToastNotification,
  } = useToastNotifications();

  return (
    <ToastNotificationsContext.Provider value={{ showAlertNotification }}>
      {isToastNotificationOpen && (
        <Snackbar
          autoHideDuration={3000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={isToastNotificationOpen}
          onClose={hideToastNotification}>
          <Alert
            variant="standard"
            color={severity}
            onClose={hideToastNotification}
            severity={severity}>
            {message}
          </Alert>
        </Snackbar>
      )}
      {children}
    </ToastNotificationsContext.Provider>
  );
};

export const useShowToastNotifications = () =>
  useContext(ToastNotificationsContext);
export default ToastNotificationsProvider;
