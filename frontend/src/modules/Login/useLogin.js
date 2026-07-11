import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { APPLICATION_ROUTES_URLS } from "&src/routes/routesConfig";
import AuthServices from "&src/services/authServices";
import { encodeBase64 } from "&src/utils";
import { loginSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const IS_DEV = import.meta.env.VITE_ENV !== "prod";

export const DEV_ROLES = [
  { value: "CO", label: "CO — Central Office" },
  { value: "RO", label: "RO — Regional Office" },
  { value: "ZO", label: "ZO — Zonal Office" },
  { value: "BO", label: "BO — Branch Office" },
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
      const username = values?.username;
      const password = values?.password;
      
      let response;
      if (IS_DEV) {
        // Dev login: backend expects { username } or { username, password }
        response = await AuthServices.devLogin({ username, password });
      } else {
        // Normal login: backend expects Base64 encoded username/password in form URL encoded form
        const encUsername = encodeBase64(username);
        const encPassword = encodeBase64(password);
        response = await AuthServices.login({ username: encUsername, password: encPassword });
      }

      console.log("Login Response Status:", response?.status);

      if (response?.status === 200 || response?.status === 201) {
        const accessToken = response?.data?.access_token;
        sessionStorage.setItem("accessToken", accessToken);

        try {
          let userObj;
          if (IS_DEV) {
            userObj = response?.data?.user || {};
            // Override the role and locationType based on selected Dev Role
            userObj.role = devRole;
            userObj.locationType = devRole;
          } else {
            // Retrieve actual user details from the backend
            const userDetailsResponse = await AuthServices.userDetails(username);
            if (userDetailsResponse && (userDetailsResponse.status === 200 || userDetailsResponse.status === 201)) {
              userObj = userDetailsResponse.data;
            } else {
              throw new Error("Failed to fetch user details.");
            }
          }

          // Store in sessionStorage
          sessionStorage.setItem("userDetails", JSON.stringify(userObj));
          sessionStorage.setItem("role", userObj.role || "");
          sessionStorage.setItem("userId", userObj.pfId || userObj.employeeId);

          successNotification("Login successful ✅");
          window.location.href = APPLICATION_ROUTES_URLS.DASHBOARD;
        } catch (err) {
          console.error("Error fetching user details:", err);
          errorNotification(err?.response?.data?.detail || err?.message || "Failed to fetch user details. Please login again.");
          sessionStorage.clear();
        }
      } else {
        errorNotification(response?.data?.message || "Login failed, please try again later.");
      }
    } catch (err) {
      console.error("Login exception:", err);
      const msg = err?.response?.data?.detail || "Login failed, please try again later.";
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
