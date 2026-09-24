import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Fade,
  useTheme,
  Divider,
} from '@mui/material';
import {
  DashboardRounded,
  Groups2,
  HelpCenterRounded,
  DescriptionRounded,
  BusinessRounded,
  StoreRounded,
  HomeWorkRounded,
  AccountBalanceRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { user_role, ROLE_NAV_ACCESS } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';

export const SIDEBAR_WIDTH = 260;
export const COLLAPSED_WIDTH = 76;

const Sidebar = ({ open }) => {
  const theme = useTheme();
  const RED = theme.palette.secondary.main || '#CE0F3E';
  const BLUE = theme.palette.primary.main || '#176FC1';
  const location = useLocation();
  const navigate = useNavigate();
  const role = user_role || 'CO';

  const isExpanded = open;

  const userDetails = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('userDetails');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  // Robust location field resolution supporting all API/DB key formats
  const zoneName =
    userDetails?.zoneName ||
    userDetails?.Zone_Name ||
    userDetails?.zone ||
    (userDetails?.zoneId && userDetails.zoneId !== 0 && userDetails.zoneId !== '00000'
      ? `Zone ${userDetails.zoneId}`
      : '');

  const regionName =
    userDetails?.regionName ||
    userDetails?.Region_Name ||
    userDetails?.region ||
    (userDetails?.regionId && userDetails.regionId !== 0
      ? `Region ${userDetails.regionId}`
      : '');

  const branchName =
    userDetails?.branchName ||
    userDetails?.Branch_Name ||
    userDetails?.branch ||
    (userDetails?.branchId && userDetails.branchId !== 0
      ? `Branch ${userDetails.branchId}`
      : '');

  // Retrieve navigation items based on current role from constants
  const visibleItems =
    ROLE_NAV_ACCESS[role] ||
    ROLE_NAV_ACCESS.CO || [
      { label: 'Dashboard', icon: <DashboardRounded />, path: APPLICATION_ROUTES_URLS.DASHBOARD },
      { label: 'Help Desk', icon: <HelpCenterRounded />, path: APPLICATION_ROUTES_URLS.HELP_DESK },
      { label: 'Annexures', icon: <DescriptionRounded />, path: APPLICATION_ROUTES_URLS.ANNEXURES },
    ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: isExpanded ? SIDEBAR_WIDTH : COLLAPSED_WIDTH,
          boxSizing: 'border-box',
          background: '#ffffff',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: 'none',
          color: '#212B36',
          overflowX: 'hidden',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
          pt: { xs: '76px', md: '84px' }, // Push down below fixed Appbar
          zIndex: (t) => t.zIndex.drawer + 1,
        },
      }}
    >
      <List
        sx={{
          px: isExpanded ? 1.5 : 1,
          pt: 1.5,
          gap: 0.8,
          display: 'flex',
          flexDirection: 'column',
          transition: 'padding 0.3s',
        }}
      >
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip
                title={item.label}
                placement="right"
                disableHoverListener={isExpanded}
                TransitionComponent={Fade}
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: RED,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      boxShadow: '0 4px 12px rgba(206,15,62,0.35)',
                      borderRadius: '6px',
                      px: 1.5,
                      py: 0.8,
                    },
                  },
                  arrow: { sx: { color: RED } },
                }}
              >
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                  }}
                  sx={{
                    borderRadius: '10px',
                    py: 1.2,
                    px: isExpanded ? 2 : 0,
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: isActive ? 'rgba(206,15,62,0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive ? 'rgba(206,15,62,0.14)' : 'rgba(0,0,0,0.04)',
                      '& .MuiListItemIcon-root': {
                        color: isActive ? RED : BLUE,
                      },
                      '& .MuiSvgIcon-root': {
                        transform: 'scale(1.15) rotate(-3deg)',
                      },
                    },
                    // Left accent bar when active
                    '&::before': isActive
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '12%',
                          bottom: '12%',
                          width: '4px',
                          background: RED,
                          borderRadius: '0 4px 4px 0',
                        }
                      : {},
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? RED : '#637381',
                      minWidth: isExpanded ? 38 : '100%',
                      justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      '& .MuiSvgIcon-root': {
                        fontSize: 22,
                        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      opacity: isExpanded ? 1 : 0,
                      width: isExpanded ? 'auto' : 0,
                      transition: 'opacity 0.2s ease',
                      m: 0,
                    }}
                    primaryTypographyProps={{
                      fontSize: '0.86rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? RED : '#212B36',
                      letterSpacing: '0.01em',
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Organization branch / zone info when expanded (Digital Ambassador Portal Style) */}
      {(zoneName || regionName || branchName) && (
        <Box
          sx={{
            p: 2,
            mx: 1.5,
            mb: 2,
            borderRadius: '12px',
            border: '1px solid rgba(23, 111, 193, 0.15)',
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.2s ease',
            display: isExpanded ? 'block' : 'none',
            bgcolor: 'rgba(240, 247, 255, 0.8)',
          }}
        >
          <Typography
            sx={{
              color: '#0E4F8D',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
            }}
          >
            <BusinessRounded sx={{ fontSize: 14, color: RED }} /> Assigned Location
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            {zoneName && (
              <Typography sx={{ color: '#334155', fontSize: '0.74rem', fontWeight: 600 }}>
                <b>Zone:</b> {zoneName}
              </Typography>
            )}
            {regionName && (
              <Typography sx={{ color: '#334155', fontSize: '0.74rem', fontWeight: 600 }}>
                <b>Region:</b> {regionName}
              </Typography>
            )}
            {branchName && (
              <Typography sx={{ color: '#334155', fontSize: '0.74rem', fontWeight: 600 }}>
                <b>Branch:</b> {branchName}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;
