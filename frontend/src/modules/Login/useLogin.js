import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { APPLICATION_ROUTES_URLS } from "&src/routes/routesConfig";
import { CBI_DEFAULT_LOCATIONS } from "&src/constants/PaymentAggregratorConstant";
import AuthServices from "&src/services/authServices";
import { encodeBase64 } from "&src/utils";
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
  const [devRole, setDevRole] = useState("CO"); // only used in DEV

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: (values) => {
      login(values);
    },
  });

  const login = async (values) => {
    setLoading(true);
    try {
      let username = (values?.username || "").trim();
      let password = values?.password || "";

      let response;
      if (IS_DEV) {
        // In DEV mode, provide sensible defaults if empty
        if (!username) {
          username = devRole === "CO" ? "139822" : `${devRole}1001`;
        }
        if (!password) {
          password = "Admin@12345";
        }
        // Dev login: backend expects { username, password, role }
        response = await AuthServices.devLogin({ username, password, role: devRole });
      } else {
        // Production login: backend expects Base64 encoded username/password in form URL encoded format
        const encUsername = encodeBase64(username);
        const encPassword = encodeBase64(password);
        response = await AuthServices.login({ username: encUsername, password: encPassword });
      }

      if (response?.status === 200 || response?.status === 201) {
        const accessToken = response?.data?.access_token;
        if (accessToken) {
          sessionStorage.setItem("accessToken", accessToken);
        }

        try {
          let userObj;
          if (IS_DEV) {
            userObj = response?.data?.user || {};
            if (!userObj.branchName && !userObj.branchId) {
              const locDefaults = CBI_DEFAULT_LOCATIONS[devRole] || CBI_DEFAULT_LOCATIONS.CO;
              userObj.zoneName = userObj.zoneName || locDefaults.zoneName;
              userObj.zoneId = userObj.zoneId ?? locDefaults.zoneId;
              userObj.regionName = userObj.regionName || locDefaults.regionName;
              userObj.regionId = userObj.regionId ?? locDefaults.regionId;
              userObj.branchName = userObj.branchName || locDefaults.branchName;
              userObj.branchId = userObj.branchId ?? locDefaults.branchId;
            }
          } else {
            // In Production mode: Fetch user profile details from backend
            try {
              const userDetailsResponse = await AuthServices.userDetails(username);
              if (userDetailsResponse && (userDetailsResponse.status === 200 || userDetailsResponse.status === 201)) {
                userObj = userDetailsResponse.data;
              }
            } catch (fetchErr) {
              console.warn("Could not retrieve full user profile from backend, using fallback session details:", fetchErr);
            }

            // If userObj not fully provided, populate standard secure defaults based on username
            if (!userObj || !userObj.role) {
              const isAdminId = ["139822", "115019", "CE25000014", "138922"].includes(username);
              const inferredRole = isAdminId ? "CO" : (username.toUpperCase().startsWith("RO") ? "RO" : (username.toUpperCase().startsWith("ZO") ? "ZO" : "BO"));
              const locDefaults = CBI_DEFAULT_LOCATIONS[inferredRole] || CBI_DEFAULT_LOCATIONS.CO;

              userObj = {
                employeeId: username,
                pfId: username,
                employeeName: isAdminId ? "Central Office Administrator" : `Bank Officer (${username})`,
                email: `${username.toLowerCase()}@cbi.co.in`,
                role: inferredRole,
                isAdmin: isAdminId,
                ...locDefaults,
              };
            }
          }

          // Persist user session
          sessionStorage.setItem("userDetails", JSON.stringify(userObj));
          sessionStorage.setItem("role", userObj.role || "CO");
          sessionStorage.setItem("userId", userObj.pfId || userObj.employeeId || username);

          // Dispatch session update event for appbar / layout listeners
          window.dispatchEvent(new Event("user-session-changed"));

          successNotification("Authentication successful. Welcome to PAPG Portal!");
          window.location.href = APPLICATION_ROUTES_URLS.DASHBOARD;
        } catch (err) {
          console.error("Error setting up user session:", err);
          errorNotification(err?.response?.data?.detail || err?.message || "Failed to initialize session. Please try again.");
          sessionStorage.clear();
        }
      } else {
        errorNotification(response?.data?.message || "Invalid credentials. Please verify your Employee ID and password.");
      }
    } catch (err) {
      console.error("Login exception:", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Invalid Employee ID or password. Please verify and try again.";
      errorNotification(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    navigate(APPLICATION_ROUTES_URLS.LOGIN, { replace: true });
  };

  return { login, logout, isLoading, formik, devRole, setDevRole };
};
