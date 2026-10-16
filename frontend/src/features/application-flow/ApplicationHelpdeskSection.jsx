import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  AddCircleOutline,
  ArrowBack,
  QuestionAnswerRounded,
} from '@mui/icons-material';
import TicketChatSection from '&src/components/TicketChatSection';
import HelpdeskServices from '&src/services/helpdesk';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';

/**
 * Collapsible Helpdesk & Audit Thread Section for Application Row.
 * Strict < 200 lines, theme-driven.
 */
export const ApplicationHelpdeskSection = ({
  applicationId,
  customerDetails = {},
  onTicketCountUpdate,
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const res = await HelpdeskServices.getTicketsByApplication(applicationId);
      const list = Array.isArray(res?.data?.data || res?.data) ? (res.data.data || res.data) : [];
      setTickets(list);
      if (onTicketCountUpdate) onTicketCountUpdate(list.length);
      if (activeTicket) {
        const ref = list.find((t) => t.ticketId === activeTicket.ticketId || t.id === activeTicket.id);
        if (ref) setActiveTicket(ref);
      }
    } catch (e) {
      console.debug('Failed to fetch helpdesk tickets:', e);
    } finally {
      setLoading(false);
    }
  }, [applicationId, onTicketCountUpdate, activeTicket]);

  useEffect(() => {
    fetchTickets();
  }, [applicationId]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      errorNotification('Please provide subject and description.');
      return;
    }
    setSubmitting(true);
    try {
      const user = JSON.parse(sessionStorage.getItem('userDetails') || '{}');
      await HelpdeskServices.createTicket({
        applicationId,
        subject: newSubject.trim(),
        message: newDescription.trim(),
        senderRole: user.role || 'CO',
        senderName: user.userName || user.name || 'Official',
        status: 'Open',
        comments: `${user.userName || 'Official'}: ${newDescription.trim()}`,
      });
      successNotification('Query ticket created.');
      setNewSubject('');
      setNewDescription('');
      setShowCreate(false);
      fetchTickets();
    } catch (err) {
      errorNotification('Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {showCreate ? (
        <Box sx={{ p: 2, bgcolor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <IconButton size="small" onClick={() => setShowCreate(false)}>
              <ArrowBack fontSize="small" />
            </IconButton>
            <Typography variant="subtitle2" fontWeight={700}>
              Raise Query for Application {applicationId}
            </Typography>
          </Box>
          <Stack spacing={1.5}>
            <TextField
              size="small"
              label="Query Subject"
              fullWidth
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <TextField
              size="small"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button size="small" onClick={() => setShowCreate(false)} color="inherit">
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleCreateTicket} disabled={submitting}>
                Submit
              </Button>
            </Box>
          </Stack>
        </Box>
      ) : activeTicket ? (
        <Box sx={{ bgcolor: '#ffffff', borderRadius: '8px', p: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={() => setActiveTicket(null)}>
                <ArrowBack fontSize="small" />
              </IconButton>
              <Typography variant="subtitle2" fontWeight={700}>
                {activeTicket.subject || 'Ticket Conversation'}
              </Typography>
            </Box>
            <Chip label={activeTicket.status || 'Open'} size="small" color="primary" />
          </Box>
          <TicketChatSection
            comments={activeTicket.comments || activeTicket.message}
            currentRole="CO"
            currentUserName="Official"
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionAnswerRounded sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>
              Application Queries ({tickets.length})
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            {tickets.map((t) => (
              <Chip
                key={t.ticketId || t.id}
                label={t.subject || 'Query'}
                size="small"
                onClick={() => setActiveTicket(t)}
                sx={{ cursor: 'pointer', fontWeight: 600 }}
              />
            ))}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddCircleOutline />}
              onClick={() => setShowCreate(true)}
              sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '0.75rem' }}
            >
              Add Query
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default ApplicationHelpdeskSection;