import React, { useState, useEffect, useMemo } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Badge,
  Divider,
  Fade,
  useTheme,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  NotificationsNoneRounded,
  NotificationsActiveRounded,
  AdminPanelSettings,
  Logout,
  CorporateFare,
  LocationCity,
  AccountBalance,
  ChevronRight,
  ExpandMore,
  ExpandLess,
  AccountCircle,
  DoneAllRounded,
  InfoOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cbiBGLogo } from '&src/assets';
import BrandingHeader from '&src/components/common/PageHeader/BrandingHeader';
import AdminRoleSwitcherModal from '&src/components/modal/AdminRoleSwitcherModal';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';
import { clearAllCookie } from '&src/utils/cookies';
import { isUserAdmin } from '&src/utils';

const Navbar = ({ onDrawerToggle }) => {
  const theme = useTheme();
  const RED = theme.palette.secondary?.main || '#CE0F3E';
  const GOLD = theme.palette.accent?.main || '#f6d365';

  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState(() => {
    try {
      const stored = sessionStorage.getItem('userDetails');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [role, setRole] = useState(() => {
    return sessionStorage.getItem('role') || userDetails?.role || user_role || 'CO';
  });

  useEffect(() => {
    const handleSessionChange = () => {
      try {
        const stored = sessionStorage.getItem('userDetails');
        if (stored) setUserDetails(JSON.parse(stored));
        const newRole = sessionStorage.getItem('role') || 'CO';
        setRole(newRole);
      } catch (e) {
        console.debug('Session update parse error', e);
      }
    };
    window.addEventListener('user-session-changed', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);
    return () => {
      window.removeEventListener('user-session-changed', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, []);

  const pfId = userDetails?.pfId || sessionStorage.getItem('userId') || '138922';

  const employeeName =
    userDetails?.employeeName ||
    userDetails?.name ||
    (String(pfId) === '138922' || String(pfId) === '139822' ? 'Tushar Kasbe' : 'Bank Officer');

  // Location fields with safe fallbacks
  const zoneName =
    userDetails?.zoneName ||
    userDetails?.Zone_Name ||
    userDetails?.zone ||
    '';
  const zoneId = userDetails?.zoneId || userDetails?.ZoneId || '';

  const regionName =
    userDetails?.regionName ||
    userDetails?.Region_Name ||
    userDetails?.region ||
    '';
  const regionId = userDetails?.regionId || userDetails?.RegionId || '';

  const branchName =
    userDetails?.branchName ||
    userDetails?.Branch_Name ||
    userDetails?.branch ||
    '';
  const branchId = userDetails?.branchId || userDetails?.Locationid || '';

  const isSuperUser = isUserAdmin(userDetails);


  // Menu Anchors & Dialog states
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const stored = localStorage.getItem('readNotificationIds');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Real-time workflow notifications (temporarily disabled for current phase)
  const fetchNotifications = async () => {};

  useEffect(() => {
    // Disabled in current phase
  }, [role, regionName, branchName, zoneName]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readNotifIds.includes(n.id) && !n.isRead).length;
  }, [notifications, readNotifIds]);

  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleNotificationClick = async (item) => {
    const newReadIds = Array.from(new Set([...readNotifIds, item.id]));
    setReadNotifIds(newReadIds);
    try {
      localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
      if (item.rawId || (item.id && String(item.id).startsWith('db_notif_'))) {
        await axios.put(`/api/application-notifications/${item.id}/read`);
      }
    } catch (e) {
      console.debug('Failed to update notification read status', e);
    }
    setNotifAnchor(null);

    if (item.applicationId) {
      navigate(`${APPLICATION_ROUTES_URLS.DASHBOARD}?openAppId=${item.applicationId}&action=flow`);
    }
  };

  const handleMarkAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    const newReadIds = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(newReadIds);
    try {
      localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
      await axios.post('/api/application-notifications/mark-all-read', null, {
        params: { userRole: role, regionName, branchName },
      });
    } catch (e) {
      console.debug('Failed to mark all notifications read', e);
    }
  };

  const handleLogout = () => {
    clearAllCookie();
    sessionStorage.clear();
    window.location.href = APPLICATION_ROUTES_URLS.LOGIN;
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          borderRadius: 0,
          zIndex: (t) => t.zIndex.drawer + 2,
          /* ── Signature Dual-Tone CBI Header Gradient: Blue on Left → Red on Right ── */
          background: 'linear-gradient(90deg, #176FC1 0%, #135fa6 35%, #9b0a2e 75%, #CE0F3E 100%)',
          backdropFilter: 'blur(16px)',
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
            background: `linear-gradient(90deg, ${RED} 0%, ${GOLD} 50%, ${RED} 100%)`,
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

            <Box
              onClick={() => navigate(APPLICATION_ROUTES_URLS.DASHBOARD)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <img
                src={cbiBGLogo}
                alt="Central Bank of India"
                style={{
                  height: 44,
                  width: 'auto',
                  maxWidth: '260px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.30))',
                }}
              />
              <BrandingHeader />
            </Box>
          </Box>

          {/* ── CENTER: ACTIVE JURISDICTION / LOCATION BREADCRUMB CAPSULE (Digital Ambassador Portal Style) ── */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              px: 1.6,
              py: 0.45,
              borderRadius: '30px',
              background: 'rgba(7, 30, 61, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.22)',
              gap: 0.8,
            }}
          >
            {role === 'CO' || role === 'ADMIN' ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 0.6 }}>
                <CorporateFare sx={{ color: GOLD, fontSize: 18 }} />
                <Typography sx={{ color: '#fff', fontSize: '0.80rem', fontWeight: 700, letterSpacing: '0.2px' }}>
                  Central Office • All India Scope
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'nowrap' }}>
                {zoneName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.6 }}>
                    <CorporateFare sx={{ color: GOLD, fontSize: 16 }} />
                    <Typography sx={{ color: '#ffffff', fontSize: '0.74rem', fontWeight: 600 }}>
                      Zone: <strong style={{ color: GOLD }}>{zoneName}</strong>{zoneId ? ` (${zoneId})` : ''}
                    </Typography>
                  </Box>
                )}

                {regionName && (
                  <>
                    <ChevronRight sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.6 }}>
                      <LocationCity sx={{ color: '#81ecec', fontSize: 16 }} />
                      <Typography sx={{ color: '#ffffff', fontSize: '0.74rem', fontWeight: 600 }}>
                        Region: <strong style={{ color: '#81ecec' }}>{regionName}</strong>{regionId ? ` (${regionId})` : ''}
                      </Typography>
                    </Box>
                  </>
                )}

                {branchName && (
                  <>
                    <ChevronRight sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: '16px',
                        bgcolor: 'rgba(206,15,62,0.45)',
                        border: '1px solid rgba(246,211,101,0.4)',
                      }}
                    >
                      <AccountBalance sx={{ color: '#ffbe76', fontSize: 15 }} />
                      <Typography sx={{ color: '#ffffff', fontSize: '0.74rem', fontWeight: 700 }}>
                        Branch: <span style={{ color: '#fff' }}>{branchName}</span>{branchId ? ` (${branchId})` : ''}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* ── RIGHT: USER PROFILE CAPSULE ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.8, sm: 1.2 }, flexShrink: 0 }}>
            {/* User Profile Pill */}
            <Box
              onClick={handleOpenUserMenu}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                px: 1.4,
                py: 0.55,
                borderRadius: '24px',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'rgba(255,255,255,0.22)',
                  borderColor: 'rgba(255,255,255,0.38)',
                },
              }}
            >
              {/* Avatar circle with gold-red gradient */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${RED}, #9B0A2E)`,
                  border: `1.5px solid ${GOLD}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                }}
              >
                <AccountCircle sx={{ color: '#fff', fontSize: 20 }} />
              </Box>

              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: '0.80rem',
                    fontWeight: 700,
                    lineHeight: 1.15,
                  }}
                >
                  {employeeName}
                </Typography>
                <Typography
                  sx={{
                    color: GOLD,
                    fontSize: '0.66rem',
                    fontWeight: 600,
                    lineHeight: 1.15,
                  }}
                >
                  {role} • PF: {pfId || 'N/A'}
                </Typography>
              </Box>

              {anchorElUser ? (
                <ExpandLess sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 18 }} />
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── USER DROPDOWN MENU (Digital Ambassador Portal Style) ── */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.4,
            minWidth: 280,
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
            overflow: 'hidden',
          },
        }}
      >
        {/* Profile summary inside menu with signature CBI gradient */}
        <Box
          sx={{
            px: 2.2,
            py: 2,
            background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
          }}
        >
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.92rem',
            }}
          >
            {employeeName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.4 }}>
            <Chip
              size="small"
              label={`Role: ${role}`}
              sx={{
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 700,
                bgcolor: 'rgba(255,255,255,0.22)',
                color: '#fff',
              }}
            />
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.74rem',
              }}
            >
              PF: {pfId || 'N/A'}
            </Typography>
          </Box>

          {/* Structured Location Breakdown */}
          <Box sx={{ mt: 1.2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.18)', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {role === 'CO' || role === 'ADMIN' ? (
              <Typography sx={{ color: GOLD, fontSize: '0.74rem', fontWeight: 600 }}>
                 Central Office (All India Scope)
              </Typography>
            ) : (
              <>
                {zoneName && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.72rem' }}>
                     <strong>Zone:</strong> {zoneName} {zoneId ? `(${zoneId})` : ''}
                  </Typography>
                )}
                {regionName && (
                  <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.72rem' }}>
                     <strong>Region:</strong> {regionName} {regionId ? `(${regionId})` : ''}
                  </Typography>
                )}
                {branchName && (
                  <Typography sx={{ color: GOLD, fontSize: '0.74rem', fontWeight: 600 }}>
                     <strong>Branch:</strong> {branchName} {branchId ? `(${branchId})` : ''}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>

        {isSuperUser && (
          <>
            <MenuItem
              onClick={() => {
                handleCloseUserMenu();
                setRoleSwitcherOpen(true);
              }}
              sx={{
                py: 1.4,
                px: 2.2,
                gap: 1.2,
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#1565c0',
                transition: 'all 0.15s ease',
                '&:hover': { background: 'rgba(21,101,192,0.08)' },
              }}
            >
              <AdminPanelSettings sx={{ fontSize: 20, color: '#1565c0' }} />
              Change Role & Location (Admin View)
            </MenuItem>
            <Divider />
          </>
        )}

        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.4,
            px: 2.2,
            gap: 1.2,
            fontSize: '0.86rem',
            fontWeight: 600,
            color: RED,
            transition: 'all 0.15s ease',
            '&:hover': { background: 'rgba(192,57,43,0.08)' },
          }}
        >
          <Logout sx={{ fontSize: 19, color: RED }} />
          Logout
        </MenuItem>
      </Menu>

      {/* ── NOTIFICATIONS POPUP MENU ── */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.4,
            width: 360,
            maxHeight: 450,
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ p: 1.8, bgcolor: '#0E4F8D', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Workflow Notifications</Typography>
          {unreadCount > 0 && (
            <IconButton size="small" onClick={handleMarkAllRead} sx={{ color: '#fff', fontSize: '0.75rem', gap: 0.5 }}>
              <DoneAllRounded sx={{ fontSize: 16 }} /> Mark Read
            </IconButton>
          )}
        </Box>
        <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', color: '#64748b' }}>
              <InfoOutlined sx={{ fontSize: 32, mb: 0.5, opacity: 0.5 }} />
              <Typography variant="body2">No notifications found.</Typography>
            </Box>
          ) : (
            notifications.map((item) => {
              const isUnread = !readNotifIds.includes(item.id) && !item.isRead;
              return (
                <MenuItem
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  sx={{
                    py: 1.2,
                    px: 2,
                    borderBottom: '1px solid #f1f5f9',
                    bgcolor: isUnread ? 'rgba(23, 111, 193, 0.06)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 0.4,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: isUnread ? 700 : 500, fontSize: '0.82rem', color: isUnread ? '#0E4F8D' : '#334155' }}>
                      {item.title || item.message}
                    </Typography>
                    {isUnread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: RED }} />}
                  </Box>
                  {item.description && (
                    <Typography sx={{ fontSize: '0.74rem', color: '#64748b', whiteSpace: 'normal', lineHeight: 1.3 }}>
                      {item.description}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{item.time || item.createdAt || 'Just now'}</Typography>
                </MenuItem>
              );
            })
          )}
        </Box>
      </Menu>

      {/* ── ADMIN ROLE & LOCATION SWITCHER MODAL ── */}
      <AdminRoleSwitcherModal
        open={roleSwitcherOpen}
        onClose={() => setRoleSwitcherOpen(false)}
        currentUser={{ ...userDetails, role }}
      />
    </Box>
  );
};

export default Navbar;
