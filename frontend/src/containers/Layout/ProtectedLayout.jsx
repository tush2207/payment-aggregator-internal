import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../Appbar';
import Sidebar from '&src/components/layout/Sidebar';

const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8' }}>
      <CssBaseline />

      {/* Fixed Top Navigation */}
      <Navbar onDrawerToggle={handleDrawerToggle} sidebarOpen={sidebarOpen} />

      {/* Permanent / Collapsible Side Navigation */}
      <Sidebar open={sidebarOpen} onToggle={handleDrawerToggle} />

      {/* Dynamic Main Content Container with Premium Responsive Padding */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: { xs: '80px', md: '90px' }, // Generous top offset below the 68px fixed Appbar
          pb: { xs: 3, md: 5 },
          px: { xs: 2.5, sm: 3.5, md: 4.5, lg: 2.5 }, // Elegant, balanced side margins
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
