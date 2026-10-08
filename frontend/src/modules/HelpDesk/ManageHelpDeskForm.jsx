import React from 'react';
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  FolderSharedRounded,
  AttachFileRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { useManageHelpDeskForm } from '&src/hooks/useManageHelpDeskForm';
import { HelpDeskTicketFields, FormSectionHeader } from './HelpDeskTicketFields';
import { TicketChatSection } from '&src/components/TicketChatSection';

/**
 * Clean Form Component for HelpDesk Ticket Creation & Editing.
 * Strict < 200 lines, theme-driven.
 */
export const ManageHelpDeskForm = ({
  details,
  isEdit = false,
  onClose,
  onRefresh,
}) => {
  const {
    formik,
    loading,
    fileList,
    handleUploadAttachment,
    newComment,
    setNewComment,
    sendingComment,
    handleAddComment,
    handleAppLookup,
    currentRole,
    currentUserName,
  } = useManageHelpDeskForm({ details, isEdit, onClose, onRefresh });

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', p: 1 }}>
      {loading && <FullScreenLoader />}

      <Grid container spacing={2.5}>
        <FormSectionHeader
          icon={<FolderSharedRounded sx={{ fontSize: 18 }} />}
          title="Merchant & Location Details"
          subtitle="Associate the query with a branch application or merchant onboarding case"
        />

        <Grid item xs={12}>
          <HelpDeskTicketFields formik={formik} onAppLookup={handleAppLookup} />
        </Grid>

        {/* Existing Ticket Message Thread for Edit Mode */}
        {isEdit && details?.ticketId && (
          <Grid item xs={12}>
            <FormSectionHeader
              icon={<FolderSharedRounded sx={{ fontSize: 18 }} />}
              title="Ticket Conversation & Queries History"
            />
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: '10px', mt: 1 }}>
              <TicketChatSection
                comments={formik.values.comments}
                newComment={newComment}
                onChangeNewComment={setNewComment}
                onSendComment={handleAddComment}
                sending={sendingComment}
                currentRole={currentRole}
                currentUserName={currentUserName}
              />
            </Paper>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={<CheckCircleRounded />}
          disabled={loading || !formik.isValid}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '8px',
            px: 3,
          }}
        >
          {isEdit ? 'Update Ticket' : 'Submit Ticket'}
        </Button>
      </Box>
    </Box>
  );
};

export default ManageHelpDeskForm;
