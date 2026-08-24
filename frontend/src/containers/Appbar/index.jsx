import React, { useEffect, useMemo, useState } from 'react';
import { cbiBGLogo } from '&src/assets';
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';
import { clearAllCookie } from '&src/utils/cookies';
import BrandingHeader from '&src/components/common/PageHeader/BrandingHeader';

import {
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Logout,
  Menu as MenuIcon,
} from '@mui/icons-material';

import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Fade,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ onDrawerToggle, sidebarOpen }) => {
  const theme = useTheme();
  const RED = theme.palette.secondary.main || '#CE0F3E';
  const GOLD = theme.palette.accent?.main || '#f6d365';

  const location = useLocation();
  const navigate = useNavigate();

  const userDetails = useMemo(() => {
    try {
      const stored = sessionStorage.getItem('userDetails');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const { employeeName, pfId, role: storedRole, name } = userDetails || {};
  const role = user_role || storedRole || 'CO';
  const displayName = employeeName || name || 'Bank Officer';
  const displayPfId = pfId ? `PF: ${pfId}` : role;

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Format formatted timestamp for Last Login
  useEffect(() => {
    const formatDate = () => {
      const now = new Date();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');
      return `${day}-${month}-${year} ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    };
    setCurrentTimeStr(formatDate());
  }, []);

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = () => {
    clearAllCookie();
    sessionStorage.clear();
    navigate(APPLICATION_ROUTES_URLS.LOGIN, { replace: true });
    window.location.reload();
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* ================= OFFICIAL CBI BRAND SIGNATURE HEADER ================= */}
      <AppBar
        position="fixed"
        sx={{
          borderRadius: 0,
          zIndex: (t) => t.zIndex.drawer + 2,
          /* ── Signature Dual-Tone CBI Header Gradient: Blue on Left → Red on Right ── */
          background:
            theme.palette.gradients?.cbiHeader ||
            'linear-gradient(90deg, #176FC1 0%, #135FA6 35%, #9B0A2E 75%, #CE0F3E 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',

          /* ── Top Gold & Crimson Accent Line ── */
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background:
              theme.palette.gradients?.accent ||
              `linear-gradient(90deg, ${RED} 0%, ${GOLD} 50%, ${RED} 100%)`,
          },
        }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            minHeight: '68px !important',
            px: { xs: 1.5, sm: 2, md: 2.5 },
            gap: { xs: 1, sm: 1.5 },
          }}
        >
          {/* ── LEFT: HAMBURGER + HIGH-DEFINITION CBI BRAND LOGO + PORTAL BRANDING ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, flexShrink: 0 }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{
                color: '#ffffff',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '8px',
                p: 0.8,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.20)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* CBI Logo */}
            <Box
              onClick={() => navigate(APPLICATION_ROUTES_URLS.DASHBOARD)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.25s ease',
                '&:hover': { transform: 'scale(1.03)' },
              }}
            >
              <img
                src={cbiBGLogo}
                alt="Central Bank of India"
                style={{
                  height: 44,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
                }}
              />
            </Box>

            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: 'rgba(255,255,255,0.20)',
                height: 28,
                my: 'auto',
                display: { xs: 'none', sm: 'block' },
              }}
            />

            {/* Branding Header Component */}
            <BrandingHeader />
          </Box>

          {/* ── RIGHT: LAST LOGIN + USER GREETING + PROFILE CHIP + DROPDOWN ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.8 } }}>
            {/* Last Login Info Pill */}
            {currentTimeStr && (
              <Box
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.10)',
                }}
              >
                <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Session Active
                </Typography>
                <Typography sx={{ color: '#ffffff', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.2px' }}>
                  {currentTimeStr}
                </Typography>
              </Box>
            )}

            {/* User Profile Action Chip */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 1.4,
                py: 0.7,
                borderRadius: '10px',
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.10)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.20)',
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: RED,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.80rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                {role || 'U'}
              </Avatar>

              <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', textAlign: 'left' }}>
                <Typography sx={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {displayName}
                </Typography>
                <Typography sx={{ color: GOLD, fontSize: '0.70rem', fontWeight: 600, letterSpacing: '0.4px' }}>
                  {greeting} • {role}
                </Typography>
              </Box>

              {Boolean(anchorElUser) ? (
                <ExpandLess sx={{ color: '#ffffff', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: '#ffffff', fontSize: 18 }} />
              )}
            </Box>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              TransitionComponent={Fade}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                elevation: 6,
                sx: {
                  mt: 1.2,
                  minWidth: 220,
                  borderRadius: '12px',
                  border: '1px solid #eaeaea',
                  overflow: 'hidden',
                  p: 0,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                },
              }}
            >
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #eaeaea' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  {displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.8 }}>
                  {displayPfId}
                </Typography>
                <Chip
                  label={`Role: ${role}`}
                  size="small"
                  sx={{
                    bgcolor: `${RED}18`,
                    color: RED,
                    fontWeight: 700,
                    fontSize: '0.70rem',
                    borderRadius: '6px',
                  }}
                />
              </Box>

              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.4,
                  px: 2,
                  gap: 1.5,
                  color: 'error.main',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  '&:hover': { bgcolor: 'error.lighter' },
                }}
              >
                <Logout fontSize="small" />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
