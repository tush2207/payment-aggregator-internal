import { centralbanklogo } from "&src/assets";
import paymentIllustration from "&src/assets/payment_illustration.png";
import { FormField } from "&src/components/FormFields";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import CodeIcon from "@mui/icons-material/Code";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { DEV_ROLES, IS_DEV, useLogin } from "./useLogin";

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Static Style Tokens
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_META = {
  CO: { accent: "#c0392b", label: "Central Office", short: "CO" },
  RO: { accent: "#1565c0", label: "Regional Office", short: "RO" },
  ZO: { accent: "#2e7d32", label: "Zonal Office", short: "ZO" },
  BO: { accent: "#6a1b9a", label: "Branch Office", short: "BO" },
};

/** Shared MUI sx for both form fields */
const FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    fontSize: "0.88rem",
    background: IS_DEV ? "rgba(255,255,255,0.06)" : "#f7f9fc",
    color: IS_DEV ? "#fff" : "inherit",
    transition: "background 0.25s ease",
    "& fieldset": {
      borderColor: IS_DEV ? "rgba(255,255,255,0.15)" : "#dde3ed",
      transition: "border-color 0.25s ease",
    },
    "&:hover fieldset": {
      borderColor: IS_DEV ? "rgba(255,255,255,0.35)" : "#0a2342",
    },
    "&.Mui-focused": {
      background: IS_DEV ? "rgba(255,255,255,0.09)" : "#fff",
      "& fieldset": { borderColor: "#c0392b", borderWidth: 2 },
    },
    "& input::placeholder": {
      color: IS_DEV ? "rgba(255,255,255,0.28)" : undefined,
    },
  },
};

/** Styles to override FormField's internal label styling based on DEV mode */
const FORM_WRAPPER_SX = {
  "& .MuiTypography-subtitle1": {
    color: IS_DEV ? "rgba(255,255,255,0.65)" : "#374151",
    fontWeight: 600,
    fontSize: "0.72rem",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    mb: 0.4,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS Keyframe Definitions (injected via <style>)
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_KEYFRAMES = `
  @keyframes floatOrb {
    0%,100% { transform: translate(0,0) scale(1); }
    33%      { transform: translate(28px,-18px) scale(1.06); }
    66%      { transform: translate(-18px,22px) scale(0.94); }
  }
  @keyframes slideInRight {
    from { opacity:0; transform:translateX(38px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes logoFloat {
    0%,100% { transform:translateY(0px);   filter:drop-shadow(0 4px 10px rgba(192,57,43,0.28)); }
    50%     { transform:translateY(-5px);  filter:drop-shadow(0 10px 22px rgba(192,57,43,0.50)); }
  }
  @keyframes shimmerBtn {
    0%   { left:-100%; }
    100% { left:200%; }
  }
  @keyframes spinLoader {
    to { transform:rotate(360deg); }
  }
  @keyframes imgFloat {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedBackground — floating radial orbs + subtle grid
// ─────────────────────────────────────────────────────────────────────────────

const ORB_CONFIG = [
  { size: 420, left: "8%", top: "15%", color: "rgba(192,57,43,0.10)", dur: "13s", delay: "0s" },
  { size: 360, left: "72%", top: "8%", color: "rgba(13,59,110,0.22)", dur: "17s", delay: "4s" },
  { size: 300, left: "58%", top: "60%", color: "rgba(192,57,43,0.07)", dur: "15s", delay: "2s" },
  { size: 240, left: "18%", top: "68%", color: "rgba(246,211,101,0.06)", dur: "19s", delay: "7s" },
];

const AnimatedBackground = () => (
  <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {ORB_CONFIG.map((o, i) => (
      <Box
        key={i}
        sx={{
          position: "absolute",
          width: o.size,
          height: o.size,
          left: o.left,
          top: o.top,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: `floatOrb ${o.dur} ease-in-out infinite`,
          animationDelay: o.delay,
        }}
      />
    ))}
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "36px 36px",
        opacity: 0.6,
      }}
    />
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// DevRoleSelector
// ─────────────────────────────────────────────────────────────────────────────

const DevRoleSelector = ({ devRole, setDevRole }) => (
  <Box
    sx={{
      width: "100%",
      mb: 2.5,
      border: "1.5px dashed rgba(246,211,101,0.45)",
      borderRadius: "12px",
      background: "rgba(246,211,101,0.04)",
      overflow: "hidden",
      animation: "fadeInUp 0.5s ease both",
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.8,
        py: 0.9,
        background: "rgba(246,211,101,0.09)",
        borderBottom: "1px dashed rgba(246,211,101,0.22)",
      }}
    >
      <CodeIcon sx={{ fontSize: 13, color: "#f6d365" }} />
      <Typography
        sx={{ color: "#f6d365", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" }}
      >
        DEV Mode — Select Simulation Role
      </Typography>
    </Box>

    <Box sx={{ display: "flex", gap: 1, p: 1.4, flexWrap: "wrap" }}>
      {DEV_ROLES.map((r) => {
        const meta = ROLE_META[r.value];
        const active = devRole === r.value;
        return (
          <Box
            key={r.value}
            onClick={() => setDevRole(r.value)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: "1 1 60px",
              py: 1,
              px: 0.5,
              borderRadius: "10px",
              cursor: "pointer",
              border: active ? `1.5px solid ${meta.accent}` : "1.5px solid rgba(255,255,255,0.10)",
              background: active ? `${meta.accent}20` : "transparent",
              transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
              "&:hover": {
                background: `${meta.accent}16`,
                border: `1.5px solid ${meta.accent}88`,
                transform: "translateY(-2px)",
              },
              "&:active": { transform: "translateY(0)" },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: active ? meta.accent : "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 0.5,
                transition: "all 0.22s ease",
                boxShadow: active ? `0 4px 12px ${meta.accent}60` : "none",
              }}
            >
              <Typography sx={{ color: active ? "#fff" : "rgba(255,255,255,0.40)", fontWeight: 800, fontSize: "0.72rem" }}>
                {meta.short}
              </Typography>
            </Box>
            <Typography
              sx={{ color: active ? "#fff" : "rgba(255,255,255,0.42)", fontSize: "0.60rem", fontWeight: 600, letterSpacing: "0.3px", textAlign: "center", lineHeight: 1.2 }}
            >
              {meta.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  </Box>
);



// ─────────────────────────────────────────────────────────────────────────────
// SubmitButton — shimmer + inline spinner
// ─────────────────────────────────────────────────────────────────────────────

const SubmitButton = ({ isLoading, devRole }) => (
  <Button
    type="submit"
    variant="contained"
    disabled={isLoading}
    fullWidth
    sx={{
      mt: 0.5,
      py: 1.55,
      borderRadius: "12px",
      fontSize: "0.88rem",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
      boxShadow: "0 4px 20px rgba(192,57,43,0.38)",
      transition: "all 0.28s cubic-bezier(0.34,1.56,0.64,1)",
      "&::after": {
        content: '""',
        position: "absolute",
        top: 0,
        left: "-100%",
        width: "60%",
        height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
        transform: "skewX(-15deg)",
      },
      "&:hover": {
        background: "linear-gradient(135deg, #a93226 0%, #c0392b 100%)",
        boxShadow: "0 8px 28px rgba(192,57,43,0.55)",
        transform: "translateY(-2px)",
        "&::after": { animation: "shimmerBtn 0.65s ease forwards" },
      },
      "&:active": { transform: "translateY(0)", boxShadow: "0 2px 10px rgba(192,57,43,0.30)" },
      "&.Mui-disabled": {
        background: IS_DEV ? "#2a3f55" : "#d0d5df",
        color: IS_DEV ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)",
        boxShadow: "none",
      },
    }}
  >
    {isLoading ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          sx={{
            width: 16, height: 16,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.28)",
            borderTopColor: "white",
            animation: "spinLoader 0.75s linear infinite",
          }}
        />
        Signing in…
      </Box>
    ) : IS_DEV ? (
      `Login as ${devRole} (DEV)`
    ) : (
      "Login"
    )}
  </Button>
);

// ─────────────────────────────────────────────────────────────────────────────
// LoginModule — root component
// ─────────────────────────────────────────────────────────────────────────────

const LoginModule = () => {
  const { isLoading, formik, devRole, setDevRole } = useLogin();

  const { handleBlur, errors, handleChange, touched, handleSubmit, values } = formik || {};

  return (
    <>
      <style>{GLOBAL_KEYFRAMES}</style>

      {/* ── Page Shell ── */}
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(140deg, #060d18 0%, #0a1628 45%, #0d2b4e 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isLoading && <FullScreenLoader />}
        <AnimatedBackground />

        {/* ── Main card wrapper ── */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 1000,
            mx: 2,
            display: "flex",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.07)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* ════════════════════════════════
              LEFT PANEL — Illustration
          ════════════════════════════════ */}
          <Box
            sx={{
              flex: 1,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(160deg, #0a2342 0%, #0d3b6e 100%)",
              p: 4,
              gap: 3,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                right: 0,
                top: "10%",
                height: "80%",
                width: "1px",
                background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.11), transparent)",
              },
            }}
          >
            <img
              src={paymentIllustration}
              alt="Payment Aggregator Illustration"
              style={{
                width: "100%",
                maxWidth: 420,
                height: "auto",
                objectFit: "contain",
                borderRadius: "16px",
                filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.4))",
                animation: "imgFloat 6s ease-in-out infinite",
              }}
            />

            <Box sx={{ textAlign: "center", mt: 0.5 }}>
              <Typography
                variant="h5"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "0.4px",
                  fontSize: "1.15rem",
                  animation: "fadeInUp 0.8s ease 0.3s both",
                }}
              >
                Onboard. Evaluate. Project.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255,255,255,0.48)",
                  mt: 0.8,
                  fontSize: "0.78rem",
                  letterSpacing: "0.3px",
                  animation: "fadeInUp 0.8s ease 0.5s both",
                }}
              >
                Centralised onboarding & projection management for payment aggregators
              </Typography>
            </Box>
          </Box>

          {/* ════════════════════════════════
              RIGHT PANEL — Login Form
          ════════════════════════════════ */}
          <Box
            sx={{
              width: { xs: "100%", md: 420 },
              background: IS_DEV
                ? "linear-gradient(160deg, #0d1f35 0%, #0a1826 100%)"
                : "#ffffff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 3, sm: 4.5 },
              animation: "slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) both",
              position: "relative",
              "&::before": IS_DEV
                ? {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at top right, rgba(192,57,43,0.08) 0%, transparent 55%)",
                  pointerEvents: "none",
                }
                : {},
            }}
          >
            {/* Logo */}
            <Box sx={{ mb: 3, textAlign: "center", animation: "fadeInUp 0.6s ease 0.15s both" }}>
              <img
                src={centralbanklogo}
                alt="Central Bank of India"
                style={{
                  height: 62,
                  objectFit: "contain",
                  filter: IS_DEV ? "brightness(0) invert(1)" : "none",
                  animation: "logoFloat 4s ease-in-out infinite",
                }}
              />
            </Box>

            {/* Title + Underline */}
            <Box sx={{ textAlign: "center", mb: 0.5, animation: "fadeInUp 0.6s ease 0.28s both" }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: IS_DEV ? "#fff" : "#0a2342",
                  fontSize: "1.08rem",
                  letterSpacing: "0.25px",
                }}
              >
                Payment Aggregator Portal
              </Typography>
              <Box
                sx={{
                  height: 3,
                  width: 48,
                  mx: "auto",
                  mt: 0.9,
                  borderRadius: 2,
                  background: "linear-gradient(90deg, #c0392b, #e74c3c)",
                  boxShadow: "0 2px 8px rgba(192,57,43,0.42)",
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: IS_DEV ? "rgba(255,255,255,0.38)" : "#8a9ab5",
                mb: 3,
                mt: 1,
                fontSize: "0.77rem",
                animation: "fadeInUp 0.6s ease 0.40s both",
              }}
            >
              Sign in to your account to continue
            </Typography>

            {/* DEV Mode Role Picker */}
            {IS_DEV && <DevRoleSelector devRole={devRole} setDevRole={setDevRole} />}

            {/* Form */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Username field */}
              <Box sx={{ animation: "fadeInUp 0.6s ease 0.52s both", ...FORM_WRAPPER_SX }}>
                <FormField
                  label="Username"
                  name="username"
                  placeholder="Enter your username"
                  fullWidth
                  autoComplete="username"
                  value={values?.username ?? ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText={touched?.username && errors?.username}
                  sx={FIELD_SX}
                />
              </Box>

              {/* Password field */}
              <Box sx={{ animation: "fadeInUp 0.6s ease 0.62s both", ...FORM_WRAPPER_SX }}>
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  fullWidth
                  value={values?.password ?? ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  helperText={touched?.password && errors?.password}
                  sx={FIELD_SX}
                />
              </Box>

              {/* Submit Button */}
              <Box sx={{ animation: "fadeInUp 0.6s ease 0.72s both" }}>
                <SubmitButton isLoading={isLoading} devRole={devRole} />
              </Box>
            </Box>

            {/* Divider */}
            <Box
              sx={{
                width: "100%",
                mt: 3,
                mb: 2,
                height: "1px",
                background: IS_DEV
                  ? "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)"
                  : "linear-gradient(to right, transparent, #e4e9f2, transparent)",
                animation: "fadeInUp 0.6s ease 0.82s both",
              }}
            />

            {/* Footer Copyright */}
            <Typography
              variant="caption"
              sx={{
                color: IS_DEV ? "rgba(255,255,255,0.18)" : "#b0bac9",
                textAlign: "center",
                fontSize: "0.66rem",
                lineHeight: 1.7,
                animation: "fadeInUp 0.6s ease 0.88s both",
              }}
            >
              © {new Date().getFullYear()} Central Bank of India.
              <br />
              All rights reserved. Authorised personnel only.
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default LoginModule;
