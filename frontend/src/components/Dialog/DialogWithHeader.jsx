import { Close } from '@mui/icons-material';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Slide
} from '@mui/material';
import { forwardRef } from 'react';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const DialogWithHeader = ({
  open,
  onClose,
  headerText,
  maxWidth = 'sm',
  ...props
}) => (
  <Dialog
    fullWidth
    maxWidth={maxWidth}
    open={open}
    onClose={onClose}
    TransitionComponent={Transition}
    keepMounted
    {...props}
  >
    <DialogTitle sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" component='div'>{headerText}</Typography>
        {onClose && (
          <IconButton aria-label="close" onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </Box>
    </DialogTitle>
    <DialogContent dividers >{props.children}</DialogContent>
  </Dialog>
);

export default DialogWithHeader;
