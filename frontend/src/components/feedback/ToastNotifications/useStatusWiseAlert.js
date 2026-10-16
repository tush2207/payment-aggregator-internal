import { useShowToastNotifications } from "./ToastNotificationsProvider";

const useStatusWiseAlert = () => {
	const { showAlertNotification } = useShowToastNotifications();

	const successNotification = (message) => showAlertNotification(message, 'success');
	const infoNotification = (message) => showAlertNotification(message, 'info');
	const warningNotification = (message) => showAlertNotification(message, 'warning');
	const errorNotification = (message) => showAlertNotification(message, 'error');

	return { successNotification, infoNotification, warningNotification, errorNotification };
};

export default useStatusWiseAlert;
