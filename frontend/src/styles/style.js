import { Card } from '@mui/material';
import { styled } from '@mui/system';

export const ImageWrapper = styled('img')({
  width: '100%',
  maxWidth: '500px',
  height: 'auto',
});

export const WrapLoginCard = styled(Card)({
  border: '0px',
  background: 'transparent',
  boxShadow: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
});
