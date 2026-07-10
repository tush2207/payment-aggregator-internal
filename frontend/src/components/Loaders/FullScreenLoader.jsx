import React from 'react';
import { Backdrop, Box, CircularProgress } from '@mui/material';
import { cbiLogo } from '&src/assets';

const FullScreenLoader = () => {
  return (
    <Backdrop
      sx={(theme) => ({
        color: '#fff',
        zIndex: theme.zIndex.drawer + 1,
      })}
      open={true}
    >
      <Box
        position="relative"
        display="inline-flex"
        justifyContent="center"
        alignItems="center"
        width={80}
        height={80}
      >
        <CircularProgress size={80} thickness={4} />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{
            transform: 'translate(-50%, -50%)',
            width: 65,
            height: 65,
          }}
        >
          <img
            src={cbiLogo}
            alt="logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%',
              backgroundColor: 'transparent',
            }}
          />
        </Box>
      </Box>
    </Backdrop>
  );
};

export default FullScreenLoader;
