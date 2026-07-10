import { centralbanklogo } from "&src/assets";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useState } from "react";
import { useLogin } from "./useLogin";
import { FormField } from "&src/components/FormFields";

const LoginModule = () => {
  const { isLoading, formik } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    handleBlur,
    errors,
    handleChange,
    touched,
    handleSubmit,
    values,
  } = formik || {};

  const togglePasswordVisibility = () =>
    setShowPassword((prev) => !prev);

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      {isLoading && <FullScreenLoader />}

      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
          borderRadius: 4,
          backdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.80)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.15)",
          transition: "0.3s",
          display: "flex",
          flexDirection: "column",
          gap: 3,                  //🔥 uniform spacing inside the card
        }}
      >
        {/* Logo */}
        <Box display="flex" justifyContent="center">
          <img
            src={centralbanklogo}
            alt="cbi"
            style={{ height: 70, objectFit: "contain" }}
          />
        </Box>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",           //🔥 spacing between FormField
          }}
        >
          <FormField
            autoComplete
            label="Username"
            name="username"
            fullWidth
            value={values?.username ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched?.username && Boolean(errors?.username)}
            helperText={touched?.username && errors?.username}
          />

          <FormField
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={values?.password ?? ""}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched?.password && Boolean(errors?.password)}
            helperText={touched?.password && errors?.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            fullWidth
            sx={{
              mt: 2,           
            }}
          >
            Login
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default LoginModule;
