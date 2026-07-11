import LoginModule from '&src/modules/Login';
import { Grid } from '@mui/material';

const Login = () => (
  <Grid
    container
    direction={{ xs: 'column', md: 'row' }}
    sx={{
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
    }}
    spacing={4}
  >
    <Grid item xs={12} md={12} lg={12}>
      <LoginModule />
    </Grid>
  </Grid>
);

export default Login;
