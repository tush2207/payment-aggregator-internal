import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close,
  QuestionAnswerRounded,
  ArrowBackRounded,
  AddCircleOutlineRounded,
  SearchRounded,
  ChatBubbleOutlineRounded,
  AttachFileRounded,
  SendRounded,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useApplicationQuery } from '&src/hooks/useApplicationQuery';
import { formatDateAndTime } from '&src/utils';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const OFFICES = [
  { value: 'BO', label: 'Branch Office (BO)' },
  { value: 'RO', label: 'Regional Office (RO)' },
  { value: 'ZO', label: 'Zonal Office (ZO)' },
  { value: 'CO', label: 'Central Office (CO)' },
];

/**
 * Enhanced, full-width Application Query Modal Component.
 * Supports full List View, New Query Creation, and Dedicated Chat Thread View.
 */
export const ApplicationQueryModal = ({
  open,
  onClose,
  applicationId,
  customerDetails,
  onRefresh,
}) => {
  const {
    filteredQueries,
    loading,
    selectedQuery,
    setSelectedQuery,
    activeTab,
    setActiveTab,
    newSubject,
    setNewSubject,
    newMessage,
    setNewMessage,
    newPriority,
    setNewPriority,
    newTargetOffice,
    setNewTargetOffice,
    submittingQuery,
    replyText,
    setReplyText,
    replyAttachments,
    setReplyAttachments,
    sendingReply,
    uploadingFile,
    searchQuery,
    setSearchQuery,
    chatEndRef,
    currentRole,
    currentUserName,
    handleFileUpload,
    handleCreateQuery,
    handleSendReply,
    handleUpdateStatus,
  } = useApplicationQuery({ open, applicationId, customerDetails, onRefresh });

  const isFinalApproved = Boolean(customerDetails?.isFinalApproved);

  // Parse comments in query to chat bubbles
  const parseMessages = (commentsStr) => {
    if (!commentsStr) return [];
    return commentsStr
      .split('|')
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m) => {
        const colonIdx = m.indexOf(':');
        if (colonIdx === -1) return { sender: 'Official', text: m };
        return {
          sender: m.substring(0, colonIdx).trim(),
          text: m.substring(colonIdx + 1).trim(),
        };
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', minHeight: '560px', maxHeight: '88vh' },
      }}
    >
      {/* ── Modal Header ── */}
      <DialogTitle
        sx={(theme) => ({
          background: theme.palette.cbi?.gradients?.modalHeader || 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.5,
          px: 2.5,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <QuestionAnswerRounded sx={{ color: '#f6d365' }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.2}>
              Application Queries & Clarifications
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.74rem' }}>
              App ID: <b>{applicationId}</b> &bull; {customerDetails?.customerName || 'Merchant'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column' }}>
        {/* ── View 1: New Query Creation Form ── */}
        {activeTab === 'create' ? (
          <Box sx={{ width: '100%', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton size="small" onClick={() => setActiveTab('list')}>
                <ArrowBackRounded fontSize="small" />
              </IconButton>
              <Typography variant="subtitle1" fontWeight={700}>
                Raise New Clarification / Query
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Query Subject / Title"
                placeholder="e.g. Bank Account Validation mismatch in Branch records"
                fullWidth
                size="small"
                required
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target Hierarchy Office</InputLabel>
                  <Select
                    value={newTargetOffice}
                    label="Target Hierarchy Office"
                    onChange={(e) => setNewTargetOffice(e.target.value)}
                  >
                    {OFFICES.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newPriority}
                    label="Priority"
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <TextField
                label="Detailed Query Description"
                placeholder="Type details regarding the required clarification or missing documents..."
                fullWidth
                multiline
                rows={4}
                required
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                <Button onClick={() => setActiveTab('list')} color="inherit" sx={{ textTransform: 'none' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateQuery}
                  disabled={submittingQuery || !newSubject.trim() || !newMessage.trim()}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3 }}
                >
                  {submittingQuery ? 'Submitting...' : 'Submit Query'}
                </Button>
              </Box>
            </Stack>
          </Box>
        ) : selectedQuery ? (
          /* ── View 2: Active Chat Thread View ── */
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Thread Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => setSelectedQuery(null)}>
                  <ArrowBackRounded fontSize="small" />
                </IconButton>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    #{selectedQuery.ticketId || selectedQuery.id} &bull; {selectedQuery.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Target: <b>{selectedQuery.targetOffice || 'BO'}</b> &bull; Priority: {selectedQuery.priority || 'Medium'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={selectedQuery.status || 'Open'}
                  size="small"
                  color={selectedQuery.status === 'Resolved' ? 'success' : 'warning'}
                  sx={{ fontWeight: 700, fontSize: '11px' }}
                />
                {selectedQuery.status !== 'Resolved' && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleOutline sx={{ fontSize: 15 }} />}
                    onClick={() => handleUpdateStatus('Resolved')}
                    sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 700 }}
                  >
                    Mark Resolved
                  </Button>
                )}
              </Box>
            </Box>

            {/* Chat Messages */}
            <Box sx={{ flex: 1, minHeight: 240, maxHeight: 340, overflowY: 'auto', p: 1.5, bgcolor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', mb: 2 }}>
              <Stack spacing={1.5}>
                {parseMessages(selectedQuery.comments || selectedQuery.message).map((msg, idx) => {
                  const isMe = msg.sender.toLowerCase().includes(currentRole.toLowerCase()) || msg.sender.toLowerCase().includes(currentUserName.toLowerCase());
                  return (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        bgcolor: isMe ? '#0E4F8D' : '#ffffff',
                        color: isMe ? '#ffffff' : 'text.primary',
                        p: 1.5,
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: isMe ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.3, color: isMe ? 'rgba(255,255,255,0.85)' : 'primary.main', fontSize: '11px' }}>
                        {msg.sender}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                        {msg.text}
                      </Typography>
                    </Box>
                  );
                })}
                <div ref={chatEndRef} />
              </Stack>
            </Box>

            {/* Reply Input Box */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your response or clarification here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                endIcon={<SendRounded />}
                disabled={sendingReply || !replyText.trim()}
                onClick={handleSendReply}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2.5, whiteSpace: 'nowrap' }}
              >
                Send
              </Button>
            </Box>
          </Box>
        ) : (
          /* ── View 3: Full Query Tickets List ── */
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Search and Raise Query Bar */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search queries by ID, subject, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchRounded sx={{ color: 'text.secondary', mr: 0.8, fontSize: 18 }} />,
                }}
              />
              {!isFinalApproved && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineRounded />}
                  onClick={() => setActiveTab('create')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px',
                    px: 2.5,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  + Raise New Query
                </Button>
              )}
            </Box>

            {/* Queries List */}
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                <CircularProgress size={28} />
              </Box>
            ) : filteredQueries.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  borderRadius: '12px',
                  bgcolor: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                }}
              >
                <QuestionAnswerRounded sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700} color="#475569" gutterBottom>
                  {searchQuery ? 'No queries match your search' : 'No queries found'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 460, mx: 'auto', fontSize: '12.5px' }}>
                  Need clarification regarding merchant documents, turn-over projections, or quotes? Raise a query directly.
                </Typography>
                {!isFinalApproved && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddCircleOutlineRounded />}
                    onClick={() => setActiveTab('create')}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                  >
                    Raise First Query
                  </Button>
                )}
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {filteredQueries.map((ticket) => {
                  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';
                  return (
                    <Paper
                      key={ticket.ticketId || ticket.id}
                      elevation={0}
                      onClick={() => setSelectedQuery(ticket)}
                      sx={{
                        p: 1.8,
                        borderRadius: '10px',
                        bgcolor: '#ffffff',
                        border: '1px solid',
                        borderColor: isResolved ? '#86efac' : '#e2e8f0',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(14, 79, 141, 0.08)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                            #{ticket.ticketId || ticket.id} &bull; {ticket.subject || ticket.ticketName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mt: 0.2,
                            }}
                          >
                            {ticket.comments || ticket.message || 'No description provided.'}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Chip
                            label={ticket.priority || 'Medium'}
                            size="small"
                            color={ticket.priority === 'Urgent' || ticket.priority === 'High' ? 'error' : 'primary'}
                            sx={{ fontWeight: 700, fontSize: '10.5px', height: 20 }}
                          />
                          <Chip
                            label={ticket.status || 'Open'}
                            size="small"
                            color={isResolved ? 'success' : 'warning'}
                            sx={{ fontWeight: 700, fontSize: '10.5px', height: 20 }}
                          />
                        </Stack>
                      </Box>

                      <Divider sx={{ my: 0.8 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Target: <b>{ticket.targetOffice || 'BO'}</b> &bull; Updated: {formatDateAndTime(ticket.createdAt || ticket.created_at)}
                        </Typography>

                        <Button
                          size="small"
                          endIcon={<ChatBubbleOutlineRounded sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '11.5px', color: 'primary.main' }}
                        >
                          Open Chat & Replies &rarr;
                        </Button>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.5, px: 2.5, borderTop: '1px solid #e2e8f0' }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ApplicationQueryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  applicationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  customerDetails: PropTypes.object,
  onRefresh: PropTypes.func,
};

export default ApplicationQueryModal;
