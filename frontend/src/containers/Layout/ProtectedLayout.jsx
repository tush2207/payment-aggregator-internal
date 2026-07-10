import {
  Box,
  CssBaseline
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import Navbar from '../Appbar';

const ProtectedLayout = () => {
  return (
    <Box>
      <CssBaseline />
      <Navbar />
      <Box
        component="main"
        sx={{
          px: { xs: '4%', sm: '3%', md: '1%' },     // horizontal padding
          pt: { xs: '14%', sm: '12%', md: '5.5%' }, // top padding
          pb: 3                                     // bottom padding
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProtectedLayout;
