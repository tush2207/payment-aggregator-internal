import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  SendRounded,
  AttachFileRounded,
  CheckCircleRounded,
  LockRounded,
  ArrowBackRounded,
  DeleteOutlineRounded,
} from '@mui/icons-material';

export const QueryMessageComposer = ({
  query,
  onBack,
  replyText,
  onChangeReplyText,
  onSendReply,
  sendingReply = false,
  onUpdateStatus,
  onFileUpload,
  uploadingFile = false,
  replyAttachments = [],
  onRemoveAttachment,
  chatEndRef,
  currentUserName,
  currentRole,
}) => {
  if (!query) return null;

  const messages = (query.comments || query.message || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((raw) => {
      const idx = raw.indexOf(':');
      if (idx === -1) return { sender: 'User', text: raw };
      return { sender: raw.substring(0, idx).trim(), text: raw.substring(idx + 1).trim() };
    });

  const isResolved = (query.status || '').toLowerCase() === 'resolved';

  const handleFilePick = async (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      await onFileUpload(file);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Thread Header */}
      <Box
        sx={(theme) => ({
          p: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onBack} sx={{ display: { sm: 'none' } }}>
            <ArrowBackRounded fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} noWrap>
              {query.subject}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ticket ID: <b>{query.ticketId || query.id}</b> &bull; Target: <b>{query.targetOffice || 'Office'}</b>
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {!isResolved ? (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<CheckCircleRounded />}
              onClick={() => onUpdateStatus('Resolved')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
            >
              Mark Resolved
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onUpdateStatus('Open')}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', fontSize: '0.75rem' }}
            >
              Reopen Query
            </Button>
          )}
        </Stack>
      </Box>

      {/* Messages Scroll Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {messages.map((m, idx) => {
          const isMe = m.sender.toLowerCase().includes((currentRole || '').toLowerCase()) || m.sender.includes(currentUserName);

          return (
            <Box
              key={idx}
              sx={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <Typography variant="caption" sx={{ fontSize: '10.5px', color: 'text.secondary', mb: 0.3, display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                {m.sender}
              </Typography>
              <Paper
                elevation={0}
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  bgcolor: isMe ? theme.palette.primary.main : theme.palette.background.default,
                  color: isMe ? '#ffffff' : theme.palette.text.primary,
                  border: isMe ? 'none' : `1px solid ${theme.palette.divider}`,
                })}
              >
                <Typography variant="body2" sx={{ fontSize: '13px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {m.text}
                </Typography>
              </Paper>
            </Box>
          );
        })}
        <div ref={chatEndRef} />
      </Box>

      {/* Reply Input Bar */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        {replyAttachments.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1 }}>
            {replyAttachments.map((att, aIdx) => (
              <Chip
                key={aIdx}
                label={att.name}
                size="small"
                onDelete={() => onRemoveAttachment(aIdx)}
                sx={{ fontSize: '11px' }}
              />
            ))}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Attach document / image" arrow>
            <IconButton component="label" size="small" disabled={uploadingFile}>
              <AttachFileRounded fontSize="small" />
              <input type="file" hidden onChange={handleFilePick} />
            </IconButton>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Type your reply message..."
            fullWidth
            multiline
            maxRows={3}
            value={replyText}
            onChange={(e) => onChangeReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSendReply();
              }
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
          />

          <Button
            variant="contained"
            color="primary"
            disabled={sendingReply || (!replyText.trim() && replyAttachments.length === 0)}
            onClick={onSendReply}
            sx={{ borderRadius: '8px', minWidth: 42, px: 1.8 }}
          >
            {sendingReply ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendRounded fontSize="small" />}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default QueryMessageComposer;
