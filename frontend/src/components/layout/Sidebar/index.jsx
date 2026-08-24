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
  useTheme
} from '@mui/material';
import {
  DashboardRounded,
  AssignmentRounded,
  Groups2,
  AccountBalanceWalletRounded,
  HelpCenterRounded,
  TimelineRounded,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { user_role } from '&src/constants/PaymentAggregratorConstant';
import { APPLICATION_ROUTES_URLS } from '&src/routes/routesConfig';

export const SIDEBAR_WIDTH = 260;
export const COLLAPSED_WIDTH = 76;

const Sidebar = ({ open, onToggle }) => {
  const theme = useTheme();
  const RED = theme.palette.secondary.main || '#CE0F3E';
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

  const navItems = [
    {
      label: 'Dashboard',
      icon: <DashboardRounded />,
      path: APPLICATION_ROUTES_URLS.DASHBOARD,
      allowedRoles: ['CO', 'RO', 'ZO', 'BO'],
    },
    {
      label: 'Manage Aggregator',
      icon: <Groups2 />,
      path: APPLICATION_ROUTES_URLS.MANAGE_AGGREGRATOR,
      allowedRoles: ['CO'],
    },
    {
      label: 'Help Desk',
      icon: <HelpCenterRounded />,
      path: APPLICATION_ROUTES_URLS.HELP_DESK,
      allowedRoles: ['CO', 'RO', 'ZO', 'BO'],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role)
  );

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
                        color: isActive ? RED : theme.palette.primary.main,
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

      {/* Organization branch / zone info when expanded */}
      {(userDetails?.zoneName || userDetails?.regionName || userDetails?.branchName) && (
        <Box
          sx={{
            p: 1.8,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            opacity: isExpanded ? 1 : 0,
            transition: 'opacity 0.2s ease',
            display: isExpanded ? 'block' : 'none',
            bgcolor: '#fafafa',
          }}
        >
          <Typography
            sx={{
              color: '#637381',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.4,
            }}
          >
            {userDetails?.zoneName && <span>Zone: {userDetails.zoneName}</span>}
            {userDetails?.regionName && <span>Region: {userDetails.regionName}</span>}
            {userDetails?.branchName && <span>Branch: {userDetails.branchName}</span>}
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;
