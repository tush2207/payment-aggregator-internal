import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Typography,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonOutline as PersonOutlineIcon,
  LockOutlined as LockOutlinedIcon,
} from '@mui/icons-material';

import { papgLogo, loginLeftside } from '&src/assets';
import { FormField } from '&src/components/FormFields';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { DEV_ROLES, IS_DEV, useLogin } from './useLogin';

// ─────────────────────────────────────────────────────────────────────────────
// ROLE CONFIG & STYLING TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_META = {
  CO: { accent: '#c0392b', label: 'CO', title: 'Central Office (CO)', desc: 'Central Office' },
  RO: { accent: '#1565c0', label: 'RO', title: 'Regional Office (RO)', desc: 'Regional Office' },
  ZO: { accent: '#2e7d32', label: 'ZO', title: 'Zonal Office (ZO)', desc: 'Zonal Office' },
  BO: { accent: '#6a1b9a', label: 'BO', title: 'Branch Office (BO)', desc: 'Branch Office' },
};

const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    fontSize: '0.86rem',
    background: '#f4f7fb',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: '#d5deea',
      transition: 'border-color 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: '#004990',
    },
    '&.Mui-focused': {
      background: '#ffffff',
      '& fieldset': {
        borderColor: '#004990',
        borderWidth: '2px',
      },
    },
  },
};

const LABEL_SX = {
  color: '#475569',
  fontWeight: 700,
  mb: 0.4,
  display: 'block',
  fontSize: '0.68rem',
  letterSpacing: '0.6px',
  textTransform: 'uppercase',
};

// ─────────────────────────────────────────────────────────────────────────────
// DEV ROLE SELECTOR — Clean single line with short forms (CO, RO, ZO, BO)
// ─────────────────────────────────────────────────────────────────────────────

const DevRoleSelector = ({ devRole, setDevRole }) => (
  <Box
    sx={{
      width: '100%',
      mb: 1.2,
      px: 1,
      py: 0.8,
      borderRadius: '10px',
      background: 'rgba(0, 73, 144, 0.04)',
      border: '1px dashed rgba(0, 73, 144, 0.25)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        fontWeight: 700,
        color: '#004990',
        display: 'block',
        mb: 0.6,
        textAlign: 'center',
        letterSpacing: '0.4px',
        fontSize: '0.65rem',
        textTransform: 'uppercase',
      }}
    >
      🛠️ Dev Mode — Target Role
    </Typography>

    <Box
      sx={{
        display: 'flex',
        gap: 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'nowrap',
        width: '100%',
      }}
    >
      {DEV_ROLES.map(({ value }) => {
        const isSel = devRole === value;
        const meta = ROLE_META[value] || { accent: '#004990', label: value, title: value, desc: value };
        return (
          <Tooltip key={value} title={meta.title} arrow placement="top">
            <Chip
              label={meta.label}
              size="small"
              onClick={() => setDevRole(value)}
              sx={{
                flex: 1,
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                height: 26,
                cursor: 'pointer',
                bgcolor: isSel ? meta.accent : 'transparent',
                color: isSel ? '#ffffff' : '#475569',
                border: `1.5px solid ${isSel ? meta.accent : '#cbd5e1'}`,
                boxShadow: isSel ? `0 2px 8px ${meta.accent}40` : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: isSel ? meta.accent : 'rgba(0,0,0,0.06)',
                  borderColor: meta.accent,
                  color: isSel ? '#ffffff' : meta.accent,
                },
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LOGIN MODULE — Centered Card Layout, Balanced 65:35 Ratio & Full Image
// ─────────────────────────────────────────────────────────────────────────────

const LoginModule = () => {
  const { isLoading, formik, devRole, setDevRole } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = formik || {};

  return (
    <>
      {isLoading && <FullScreenLoader />}

      {/* Main Fullscreen Viewport — 100vh with Zero Scrollbars */}
      <Box
        sx={{
          height: '100vh',
          maxHeight: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #07192d 0%, #0d2847 50%, #153b66 100%)',
          p: { xs: 1.5, sm: 2.5, md: 3 },
          boxSizing: 'border-box',
        }}
      >
        {/* Centered Floating Card Container with Balanced Proportions */}
        <Paper
          elevation={16}
          sx={{
            width: '100%',
            maxWidth: 1180,
            height: { xs: 'auto', md: '620px' },
            maxHeight: '94vh',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
            background: '#ffffff',
          }}
        >
          {/* ════════════════════════════════════════════════════════════
              LEFT PANEL — Wide Frame for loginLeftside.png (64% Width)
          ════════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flex: { md: 1.7, lg: 1.8 },
              display: { xs: 'none', md: 'block' },
              position: 'relative',
              height: '100%',
              overflow: 'hidden',
              background: '#041830',
            }}
          >
            <Box
              component="img"
              src={loginLeftside}
              alt="Central Bank of India - Digital Ambassador"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'left center',
              }}
            />
          </Box>

          {/* ════════════════════════════════════════════════════════════
              RIGHT PANEL — Login Form with papgLogo (36% Width)
          ════════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 2.5, sm: 3.5, md: 4 },
              py: { xs: 2, sm: 2.5, md: 3 },
              height: '100%',
              boxSizing: 'border-box',
              overflowY: 'auto',
              background: '#ffffff',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Top Official PAPG Logo — Enlarged & Clearly Readable */}
              <Box sx={{ mb: 1.2, textAlign: 'center', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={papgLogo}
                  alt="Central Bank of India - Payment Aggregator Portal"
                  sx={{
                    height: { xs: 80, sm: 100, md: 105 },
                    maxHeight: 115,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 3px 10px rgba(0, 0, 0, 0.08))',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                />
              </Box>

              {/* Title + Accent Stripe */}
              <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#003875',
                    fontSize: '1.2rem',
                    letterSpacing: '-0.2px',
                  }}
                >
                  Payment Aggregator Portal
                </Typography>
                <Box
                  sx={{
                    height: 3,
                    width: 44,
                    mx: 'auto',
                    mt: 0.5,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #c0392b, #e74c3c)',
                  }}
                />
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.76rem', mt: 0.6 }}>
                  Sign in to your account to continue
                </Typography>
              </Box>

              {/* DEV Role Selector (Active only in DEV mode) — Single Line CO, RO, ZO, BO */}
              {IS_DEV && <DevRoleSelector devRole={devRole} setDevRole={setDevRole} />}

              {/* Form Inputs */}
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}
              >
                {/* Username Input */}
                <Box>
                  <Typography variant="caption" sx={LABEL_SX}>
                    USERNAME
                  </Typography>
                  <FormField
                    name="username"
                    placeholder="Enter your username"
                    fullWidth
                    autoComplete="username"
                    value={values?.username ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={touched?.username && errors?.username}
                    sx={FIELD_SX}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon sx={{ color: '#64748b', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Password Input */}
                <Box>
                  <Typography variant="caption" sx={LABEL_SX}>
                    PASSWORD
                  </Typography>
                  <FormField
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    fullWidth
                    value={values?.password ?? ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    helperText={touched?.password && errors?.password}
                    sx={FIELD_SX}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#64748b', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(p => !p)}
                            edge="end"
                            size="small"
                            sx={{ color: '#64748b', '&:hover': { color: '#004990' } }}
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Coral-Red / Brand LOGIN Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    mt: 0.4,
                    height: 42,
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.90rem',
                    letterSpacing: '0.8px',
                    color: '#ffffff',
                    background: 'linear-gradient(90deg, #ff5733 0%, #e74c3c 100%)',
                    boxShadow: '0 6px 18px rgba(231, 76, 60, 0.35)',
                    textTransform: 'uppercase',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #e04826 0%, #c0392b 100%)',
                      boxShadow: '0 8px 22px rgba(231, 76, 60, 0.45)',
                    },
                    '&.Mui-disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  LOGIN
                </Button>
              </Box>

              {/* Footer Copyright */}
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  textAlign: 'center',
                  fontSize: '0.66rem',
                  lineHeight: 1.4,
                  mt: 1.8,
                  pt: 1.2,
                  borderTop: '1px solid #f1f5f9',
                  width: '100%',
                }}
              >
                © {new Date().getFullYear()} Central Bank of India.
                <br />
                All rights reserved. Authorised personnel only.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default LoginModule;
