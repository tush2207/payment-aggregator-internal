import { useState, useEffect, useCallback, useRef } from 'react';
import HelpdeskServices from '&src/services/helpdesk';
import applicationServices from '&src/services/applications';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';
import useQueryWebSocket from '&src/hooks/useQueryWebSocket';
import axios from 'axios';

/**
 * Custom hook encapsulating query fetching, message composition,
 * file uploads, query resolution, and live WebSocket syncing.
 */
export const useApplicationQuery = ({ open, applicationId, customerDetails, onRefresh }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const userDetails = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('userDetails') || '{}');
    } catch {
      return {};
    }
  })();

  const currentRole = userDetails.role || sessionStorage.getItem('role') || 'CO';
  const currentUserId = userDetails.employeeId || userDetails.pfNumber || 'User';
  const currentUserName = userDetails.userName || userDetails.name || `${currentRole} Official`;

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'detail', 'create'

  // New query form state
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newTargetOffice, setNewTargetOffice] = useState(currentRole === 'CO' ? 'RO' : 'CO');
  const [newAttachments, setNewAttachments] = useState([]);
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Thread reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const chatEndRef = useRef(null);

  // Fetch queries for this application
  const fetchQueries = useCallback(async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      const res = await HelpdeskServices.getTicketsByApplication(applicationId);
      const data = res?.data?.data || res?.data || [];
      const list = Array.isArray(data) ? data : [];
      setQueries(list);

      // If a query was selected, refresh it
      if (selectedQuery) {
        const updated = list.find((q) => q.ticketId === selectedQuery.ticketId || q.id === selectedQuery.id);
        if (updated) setSelectedQuery(updated);
      }
    } catch (err) {
      console.debug('Failed to fetch queries:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId, selectedQuery]);

  useEffect(() => {
    if (open && applicationId) {
      fetchQueries();
    }
  }, [open, applicationId, fetchQueries]);

  // Live WebSocket subscription
  useQueryWebSocket(applicationId, () => {
    fetchQueries();
  });

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadingFile(true);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res?.data?.url || res?.data?.fileUrl || URL.createObjectURL(file);
      return { name: file.name, url, size: file.size };
    } catch (e) {
      console.warn('Fallback local file url:', e);
      return { name: file.name, url: URL.createObjectURL(file), size: file.size };
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit new query ticket
  const handleCreateQuery = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      errorNotification('Please enter subject and query message.');
      return;
    }
    setSubmittingQuery(true);
    try {
      let fullMessage = newMessage.trim();
      if (newAttachments.length > 0) {
        const attachStr = newAttachments.map((a) => `[Attachment: ${a.name}](${a.url})`).join(' ');
        fullMessage = `${fullMessage} ${attachStr}`;
      }

      const payload = {
        applicationId,
        subject: newSubject.trim(),
        message: fullMessage,
        priority: newPriority,
        targetOffice: newTargetOffice,
        senderRole: currentRole,
        senderName: currentUserName,
        senderId: currentUserId,
        status: 'Open',
        comments: `${currentUserName} (${currentRole}): ${fullMessage}`,
      };

      await HelpdeskServices.createTicket(payload);
      successNotification('Query raised successfully.');
      setNewSubject('');
      setNewMessage('');
      setNewAttachments([]);
      setActiveTab('list');
      fetchQueries();
      if (onRefresh) onRefresh();
    } catch (err) {
      errorNotification(err?.response?.data?.message || 'Failed to raise query.');
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Send message reply in query thread
  const handleSendReply = async () => {
    if (!selectedQuery || !replyText.trim()) return;
    setSendingReply(true);
    try {
      let msg = replyText.trim();
      if (replyAttachments.length > 0) {
        const attachStr = replyAttachments.map((a) => `[Attachment: ${a.name}](${a.url})`).join(' ');
        msg = `${msg} ${attachStr}`;
      }

      const existingComments = selectedQuery.comments || '';
      const newEntry = `${currentUserName} (${currentRole}): ${msg}`;
      const updatedComments = existingComments ? `${existingComments} | ${newEntry}` : newEntry;

      const ticketId = selectedQuery.ticketId || selectedQuery.id;
      await HelpdeskServices.updateTicket(ticketId, {
        comments: updatedComments,
        status: selectedQuery.status === 'Resolved' ? 'Open' : selectedQuery.status,
      });

      setReplyText('');
      setReplyAttachments([]);
      fetchQueries();
    } catch (err) {
      errorNotification('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Resolve / Close query
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedQuery) return;
    try {
      const ticketId = selectedQuery.ticketId || selectedQuery.id;
      await HelpdeskServices.updateTicket(ticketId, { status: newStatus });
      successNotification(`Query marked as ${newStatus}.`);
      fetchQueries();
      if (onRefresh) onRefresh();
    } catch (err) {
      errorNotification('Failed to update query status.');
    }
  };

  const filteredQueries = queries.filter((q) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      (q.subject || '').toLowerCase().includes(term) ||
      (q.ticketId || '').toLowerCase().includes(term) ||
      (q.comments || '').toLowerCase().includes(term)
    );
  });

  return {
    queries,
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
    newAttachments,
    setNewAttachments,
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
    fetchQueries,
  };
};

export default useApplicationQuery;
