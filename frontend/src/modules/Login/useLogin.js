import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import { APPLICATION_ROUTES_URLS } from "&src/routes/routesConfig";
import AuthServices from "&src/services/authServices";
import { encodeBase64 } from "&src/utils";
import { loginSchema } from "&src/utils/validationSchemas";
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const navigate = useNavigate();
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isLoading, setLoading] = useState(false);

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
      // const username = encodeBase64(values?.username);

      // const password = encodeBase64(values?.password);

      const username = values?.username;

      const password = values?.password;
      // 1️⃣ Call login API
      const response = await AuthServices.devLogin({ username, password });
      console.log('userDetailsResponse', response?.data?.access_token, response?.data)

      if (response?.status === 200 || response?.status === 201) {
        const accessToken = response?.data?.access_token;

        // Store access token
        sessionStorage.setItem("accessToken", accessToken);

        try {
          // 2️⃣ Call userDetails API
          // const userDetailsResponse = await AuthServices.userDetails(values?.username);
          // console.log('userDetailsResponse', userDetailsResponse)
          // if (userDetailsResponse) {
          const { pfId, employeeId, role, } = response?.data?.user;
          // Store user details
          sessionStorage.setItem("userDetails", JSON.stringify({ ...response?.data?.user }));
          sessionStorage.setItem("role", role || "");
          sessionStorage.setItem("userId", pfId || employeeId);
          successNotification("Login successful ✅");
          window.location.href = APPLICATION_ROUTES_URLS.DASHBOARD;
          // } 
          // else {
          //   errorNotification("Failed to fetch user details. Please login again.");
          // }
        } catch (err) {
          errorNotification(err?.response?.data?.detail || "Failed to fetch user details. Please login again.");
          sessionStorage.clear();
        }
      } else {
        errorNotification(response?.data?.message || "Login failed, please try again later.");
      }
    } catch (err) {
      errorNotification(err?.response?.data?.detail || "Login failed, please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    navigate(APPLICATION_ROUTES_URLS.LOGIN, { replace: true });
  };

  return { login, logout, isLoading, formik };
};
