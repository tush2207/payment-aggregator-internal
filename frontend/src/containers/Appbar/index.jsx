import { cbiBGLogo } from '&src/assets';
import { ROLE_NAV_ACCESS, user_role } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';
import { clearAllCookie } from '&src/utils/cookies';
import {
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Logout
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Fade,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const theme = useTheme();
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

  const { employeeName, pfId, role: userRole } = userDetails || {};

  const [anchorElSub, setAnchorElSub] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleNavigate = (path) => navigate(path);

  const handleSubmenuToggle = (event, items) => {
    setAnchorElSub((prev) => (prev ? null : { anchor: event.currentTarget, items }));
  };

  const handleLogout = () => {
    clearAllCookie();
    sessionStorage.clear();
    navigate(APPLICATION_ROUTES_URLS.LOGIN, { replace: true });
    window.location.reload();
  };

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const roleBasedNavItems = useMemo(() => ROLE_NAV_ACCESS[user_role], [user_role]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* ================= ULTIMATE PREMIUM APPBAR ================= */}
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(25, 118, 210, 0.75)',
          backgroundImage:
            'linear-gradient(90deg, rgba(25,118,210,0.85), rgba(211,47,47,0.85))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>

          {/* ---------- Left Logo ---------- */}
          <Box
            onClick={() => navigate(APPLICATION_ROUTES_URLS.DASHBOARD)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 1,
              borderRadius: 0,
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)', transition: '0.3s' },
            }}
          >
            <img
              src={cbiBGLogo}
              alt="Logo"
              style={{ height: 48, filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))', marginRight: '8px' }}
            />
            {/* <SectionHeader title='Payment Aggregator Request Automation Portal' color='white' /> */}
          </Box>

          {/* ---------- NAVIGATION WITH ICONS ---------- */}
          <Box display="flex" alignItems="center" gap={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {roleBasedNavItems?.map(({ label, path, icon }) => {
                const isActive = location.pathname === path;

                return (
                  <Button
                    key={label}
                    onClick={() => handleNavigate(path)}
                    startIcon={icon} // <-- ICON ADDED HERE
                    sx={{
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      textTransform: 'none',
                      '& .MuiSvgIcon-root': { fontSize: 22 },
                      position: 'relative',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 4,
                        left: 0,
                        width: isActive ? '100%' : 0,
                        height: '2px',
                        bgcolor: '#fff',
                        borderRadius: 0,
                        transition: '0.35s',
                      },
                      '&:hover:after': { width: '100%' },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
            </Box>

            {/* ---------- USER CHIP ---------- */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.4,
                px: 1.8,
                py: 0.9,
                borderRadius: 0,
                cursor: 'pointer',
                // background: 'rgba(255,255,255,0.18)',
                // border: '1px solid rgba(255,255,255,0.25)',
                // boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                transition: '0.3s',
                '&:hover': {
                  // background: 'rgba(255,255,255,0.28)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <AccountCircle sx={{ color: '#fff', fontSize: 36 }} />

              <Box sx={{ color: '#fff' }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {employeeName}
                </Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.8 }}>
                  PF: {pfId}
                </Typography>
              </Box>

              {anchorElUser ? (
                <ExpandLess sx={{ color: '#fff' }} />
              ) : (
                <ExpandMore sx={{ color: '#fff' }} />
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* USER MENU */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1,
            ml: 2,
            width: 260,
            borderRadius: 0,
            overflow: 'hidden',
            boxShadow: '0 10px 35px rgba(0,0,0,0.25)',
          },
        }}
      >
        {/* <MenuItem
          onClick={() => navigate(APPLICATION_ROUTES_URLS.HELP_DESK)}
          sx={{ py: 1.3 }}
        >
          <HelpOutline sx={{ fontSize: 22, mr: 1.6 }} /> Help Desk
        </MenuItem> */}

        <MenuItem
          onClick={handleLogout}
          sx={{ py: 1.3 }}
        >
          <Logout color="error" sx={{ fontSize: 22, mr: 1.6 }} /> Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar;
