import { useState, useCallback } from 'react';

const useToastNotifications = () => {
  const [isToastNotificationOpen, setIsToastNotificationOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const showAlertNotification = useCallback((msg, severity) => {
    setMessage(msg);
    setSeverity(severity);
    setIsToastNotificationOpen(true);
  }, []);

  const hideToastNotification = useCallback(() => {
    setIsToastNotificationOpen(false);
  }, []);

  return {
    isToastNotificationOpen,
    message,
    severity,
    showAlertNotification,
    hideToastNotification,
  };
};

export default useToastNotifications;
