import React from 'react';
import { Grid, Box, Typography } from '@mui/material';

export const FormSectionHeader = ({ icon, title, subtitle }) => (
  <Grid item xs={12} sx={{ mt: 1.5, mb: 0.5 }}>
    <Box sx={(theme) => ({ pb: 1, borderBottom: `2px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 1.2 })}>
      <Box
        sx={(theme) => ({
          width: 30,
          height: 30,
          borderRadius: '8px',
          bgcolor: theme.palette.primary['50'] || '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.primary.main,
          flexShrink: 0,
        })}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: '0.92rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
          {subtitle}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

export default FormSectionHeader;
