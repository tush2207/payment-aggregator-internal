import { TaskManagement } from '&src/assets';
import SectionHeader from '&src/components/Headers/SectionHeader';
import LoginModule from '&src/modules/Login';
import { ImageWrapper, WrapLoginCard } from '&src/styles/style';
import { Grid, Stack, Typography, useTheme } from '@mui/material';

const Login = () => {
    const theme = useTheme();
  
  return (
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
   
      <Grid item xs={12} md={6} lg={7}>
      
        <Stack
          direction='row'
          justifyContent='center'
          alignItems='center'
        >
          <Typography
            fontSize='32px'
            fontWeight='700'
            sx={{
              background: theme.custom?.gradients?.main || theme.palette.primary.main,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Payment Aggregator Request Automation Portal
          </Typography>

        </Stack>
        <WrapLoginCard elevation={0}>
          <ImageWrapper src={TaskManagement} alt='Task Management Illustration' />
      
        </WrapLoginCard>
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <LoginModule />
      </Grid>
    </Grid>

  );
};

export default Login;
