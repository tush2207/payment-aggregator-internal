import React from "react";
import { Box, Button, DialogContent, Typography } from "@mui/material";
import DialogWithHeader from "./DialogWithHeader";
import { TextAreaField } from "../FormFields";
import FullScreenLoader from "../Loaders/FullScreenLoader";

const ConfirmationDialogWithReason = ({
  open,
  onClose,
  onConfirm,
  title = "Reason of Rejection",
  placeholder = "Enter reason...",
  confirmText = "Send",
  cancelText = "Cancel",
  reason,
  setReason,
  isLoading,
  description,
  confirmTextColor = 'primary',
  showReasonSec = true
}) => {
  return (
    <>
      <DialogWithHeader
        maxWidth="xs"
        open={open}
        onClose={onClose}
        headerText={title}
      >
        {isLoading && <FullScreenLoader />}
        <Box>
          <Typography mb={2} component="div">
            <Typography variant="body1">{description}</Typography>
            {showReasonSec &&
              <TextAreaField
                fullWidth
                placeholder={placeholder}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />}
          </Typography>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={onClose} variant="outlined" className="w-1/3">
              {cancelText}
            </Button>
            <Button
              onClick={() => onConfirm(reason)}
              variant="contained"
              color={confirmTextColor}
              className="w-1/3"
              disabled={reason && !reason?.trim()}
            >
              {confirmText}
            </Button>
          </Box>
        </Box>
      </DialogWithHeader>
    </>
  );
};

export default ConfirmationDialogWithReason;
