import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { APPLICATION_ROUTES_URLS } from "&src/routes/routesConfig";
import { CBI_DEFAULT_LOCATIONS } from "&src/constants/PaymentAggregratorConstant";
import AuthServices from "&src/services/authServices";
import { encodeBase64 } from "&src/utils";
import { setStoredItem } from "&src/utils/storage";
import { loginSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const IS_DEV = (() => {
  // 1. Explicit VITE_DEV_MODE toggle from .env (e.g., VITE_DEV_MODE="false")
  const devMode = String(import.meta.env.VITE_DEV_MODE ?? '').trim().toLowerCase();
  if (devMode === 'false' || devMode === '0' || devMode === 'off' || devMode === 'no') {
    return false;
  }
  if (devMode === 'true' || devMode === '1' || devMode === 'on' || devMode === 'yes') {
    return true;
  }

  // 2. Explicit Environment String (VITE_APP_ENV / VITE_ENV / MODE)
  const rawEnv = String(import.meta.env.VITE_APP_ENV || import.meta.env.VITE_ENV || import.meta.env.MODE || '').trim().toUpperCase();
  if (rawEnv === 'PROD' || rawEnv === 'PRODUCTION') return false;
  if (rawEnv === 'DEV' || rawEnv === 'DEVELOPMENT') return true;

  // 3. Vite production build flag
  if (import.meta.env.PROD === true) return false;

  // 4. Default fallback
  return Boolean(import.meta.env.DEV);
})();

export const IS_PROD = !IS_DEV;

export const DEV_ROLES = [
  { value: "CO", label: "CO" },
  { value: "RO", label: "RO" },
  { value: "ZO", label: "ZO" },
  { value: "BO", label: "BO" },
];

export const useLogin = () => {
  const navigate = useNavigate();
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const [isLoading, setLoading] = useState(false);
  const [devRole, setDevRole] = useState('CO'); // only used in DEV

  const formik = useFormik({
    initialValues: { username: '', password: '' },
    // Only enforce strict validation in PROD mode so DEV bypass can log in instantly
    validationSchema: IS_DEV ? undefined : loginSchema,
    onSubmit: (values) => login(values),
  });

  const login = async (values = {}) => {
    setLoading(true);
    try {
      let res;
      const cleanUsername = String(values?.username || '').trim();
      const cleanPassword = String(values?.password || '');

      if (IS_DEV) {
        /* DEV bypass — single /auth/dev-token endpoint with selected role and optional custom pfId */
        const pfId = cleanUsername || (devRole === 'CO' ? '139822' : `${devRole}1001`);
        res = await AuthServices.devLogin({
          pfId,
          role: devRole,
        });

        const resData = res?.data?.data || res?.data || {};
        const token = resData?.access_token || resData?.token || 'mock-dev-token';
        const userDetails = resData?.employeeDetails || resData?.user || {
          employeeName: `Administrator (${pfId})`,
          pfId: pfId,
          employeeId: pfId,
          role: devRole,
          ...(CBI_DEFAULT_LOCATIONS[devRole] || CBI_DEFAULT_LOCATIONS.CO),
        };

        // Ensure location details are populated
        if (!userDetails.branchName && !userDetails.branchId) {
          const locDefaults = CBI_DEFAULT_LOCATIONS[devRole] || CBI_DEFAULT_LOCATIONS.CO;
          Object.assign(userDetails, locDefaults);
        }

        setStoredItem('accessToken', token);
        setStoredItem('userDetails', userDetails);
        setStoredItem('role', devRole);
        setStoredItem('userId', pfId);
        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
        sessionStorage.setItem('role', devRole);
        sessionStorage.setItem('userId', pfId);

        window.dispatchEvent(new Event('user-session-changed'));

        successNotification(`Dev Login Successful — Role: ${devRole} `);
        window.location.href = APPLICATION_ROUTES_URLS.DASHBOARD;
        return;
      }

      /* UAT / PROD normal API login — Base64 payload encoded */
      if (!cleanUsername || !cleanPassword) {
        throw new Error('Please enter your username and password.');
      }

      const payload = {
        username: cleanUsername,
        password: cleanPassword,
      };
      const encData = encodeBase64(JSON.stringify(payload));
      res = await AuthServices.login({ data: encData });

      const resBody = res?.data || {};
      if (resBody?.status === 'error' || resBody?.statusCode >= 400) {
        throw new Error(resBody?.message || 'Invalid credentials.');
      }

      const resData = resBody?.data || resBody;
      const token = resData?.access_token || resData?.token || resBody?.access_token;
      const employeeDetails = resData?.employeeDetails || resData?.user || resBody?.employeeDetails || resBody?.user;

      if (!token) {
        throw new Error(resBody?.message || 'Authentication succeeded but no access token received.');
      }

      const role =
        employeeDetails?.role ||
        (employeeDetails?.locationType === 'DO' ? 'CO' : employeeDetails?.locationType) ||
        'CO';

      const userDetails = {
        ...employeeDetails,
        role,
      };

      setStoredItem('accessToken', token);
      setStoredItem('userDetails', userDetails);
      setStoredItem('role', role);
      setStoredItem('userId', userDetails?.pfId || userDetails?.employeeId || cleanUsername);
      sessionStorage.setItem('accessToken', token);
      sessionStorage.setItem('userDetails', JSON.stringify(userDetails));
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('userId', userDetails?.pfId || userDetails?.employeeId || cleanUsername);

      window.dispatchEvent(new Event('user-session-changed'));

      successNotification('Login successful ');
      window.location.href = APPLICATION_ROUTES_URLS.DASHBOARD;
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err?.response?.data?.detail?.message ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed, please check your credentials.';
      errorNotification(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userDetails');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = APPLICATION_ROUTES_URLS.LOGIN;
  };

  return { login, logout, isLoading, formik, devRole, setDevRole, isDev: IS_DEV, isProd: IS_PROD };
};

export default useLogin;
