import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Divider,
  IconButton,
  Paper,
  Grid,
  CircularProgress,
} from "@mui/material";
import {
  HelpOutline,
  ChatBubbleOutline,
  AddCircleOutline,
  Close,
  Refresh,
  Send,
  ArrowBack,
  AttachFileRounded,
  DownloadRounded,
} from "@mui/icons-material";
import TicketChatSection from "&src/components/TicketChatSection";
import HelpdeskServices from "&src/services/helpdesk";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import axios from "axios";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const ApplicationHelpdeskSection = ({
  open,
  onClose,
  application,
  onTicketCountUpdate,
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // New ticket form state
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDescription, setTicketDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const fileInputRef = useRef(null);

  const userDetails = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = sessionStorage.getItem("role") || userDetails.role || "User";

  const fetchApplicationTickets = useCallback(async () => {
    if (!application?.applicationId) return;
    setLoading(true);
    try {
      const response = await HelpdeskServices.getAllHelpdesks();
      const allData = Array.isArray(response?.data)
        ? response.data
        : (response?.data?.ticketsList || Object.values(response?.data || {}));
      const appTickets = allData.filter(
        (t) =>
          t && typeof t === "object" && (
            Number(t.applicationNo) === Number(application.applicationId) ||
            String(t.applicationNo) === String(application.applicationId)
          )
      );
      setTickets(appTickets);
      if (onTicketCountUpdate) {
        onTicketCountUpdate(appTickets.length);
      }
      if (activeTicket) {
        const refreshed = appTickets.find((t) => t.id === activeTicket.id);
        if (refreshed) setActiveTicket(refreshed);
      }
    } catch (err) {
      console.error("Failed to load application queries:", err);
    } finally {
      setLoading(false);
    }
  }, [application?.applicationId, onTicketCountUpdate, activeTicket]);

  useEffect(() => {
    if (open) {
      fetchApplicationTickets();
    }
  }, [open, application?.applicationId]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      return errorNotification("Please provide both a query title and description.");
    }

    setSubmittingTicket(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const token = sessionStorage.getItem("accessToken");
        const uploadRes = await axios.post("/api/files/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (uploadRes?.data?.fileId) {
          attachmentUrl = `/api/files/download/${uploadRes.data.fileId}`;
          attachmentName = selectedFile.name;
        }
      }

      const payload = {
        applicationNo: application?.applicationId ? Number(application.applicationId) : null,
        accountNo: application?.accountNo ? Number(application.accountNo) : null,
        ticketName: ticketTitle.trim(),
        customerName: application?.customerName || "Customer",
        branchName: application?.branchName || userDetails?.branchName || "Central Office",
        regionName: application?.regionName || userDetails?.regionName || "CO",
        zoneName: application?.zoneName || userDetails?.zoneName || "CO",
        customerEmail: application?.email || application?.applicantEmail || userDetails?.email_addr || "",
        customerMobileNo: application?.mobileNo || application?.applicantMobile || userDetails?.phone || null,
        description: ticketDescription.trim(),
        priority: ticketPriority || "Medium",
        status: "Open",
        attachmentUrl,
        attachmentName,
        chats: `${userRole}: ${ticketDescription.trim()}${attachmentName ? ` [Attachment: ${attachmentName}]` : ""}`,
      };

      const res = await HelpdeskServices.addHelpdesk(payload);
      if (res?.status === 200 || res?.status === 201) {
        successNotification("Query raised successfully! Helpdesk ticket created.");
        setTicketTitle("");
        setTicketDescription("");
        setTicketPriority("Medium");
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowNewTicketForm(false);
        await fetchApplicationTickets();
      } else {
        errorNotification("Failed to create helpdesk query.");
      }
    } catch (err) {
      console.error("Query creation error:", err);
      errorNotification(err?.response?.data?.message || err?.message || "Failed to submit query.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          overflow: "hidden",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
          color: "#ffffff",
          py: 2,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          {activeTicket ? (
            <IconButton
              size="small"
              onClick={() => setActiveTicket(null)}
              sx={{ color: "#ffffff", mr: 0.5 }}
            >
              <ArrowBack />
            </IconButton>
          ) : (
            <HelpOutline />
          )}
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
              {activeTicket
                ? `Query #${activeTicket.id}: ${activeTicket.ticketName}`
                : `Application Queries & Clarifications (#${application?.applicationId})`}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, color: "#ffffff" }}>
              {activeTicket
                ? `Status: ${activeTicket.status || "Open"} | Priority: ${activeTicket.priority || "Medium"}`
                : `Interactive queries linked to Application #${application?.applicationId} (${application?.customerName})`}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {!activeTicket && (
            <IconButton
              size="small"
              onClick={fetchApplicationTickets}
              disabled={loading}
              sx={{ color: "#ffffff" }}
              title="Refresh Queries"
            >
              <Refresh />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "#ffffff" }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: "#f8fafc", flex: 1, overflowY: "auto" }}>
        {/* Case 1: Active Ticket Chat Mode */}
        {activeTicket ? (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Description / Topic:
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#1e293b">
                  {activeTicket.description || activeTicket.ticketName}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {activeTicket.attachmentUrl && (
                  <Button
                    size="small"
                    variant="outlined"
                    href={activeTicket.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={activeTicket.attachmentName || "attachment"}
                    startIcon={<DownloadRounded sx={{ fontSize: 14 }} />}
                    sx={{
                      height: 26,
                      textTransform: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      borderRadius: "6px",
                      borderColor: "#93c5fd",
                      color: "#1d4ed8",
                      bgcolor: "#eff6ff",
                    }}
                  >
                    Attached: {activeTicket.attachmentName || "File"}
                  </Button>
                )}
                <Chip
                  label={activeTicket.priority || "Medium"}
                  size="small"
                  color={
                    activeTicket.priority === "Urgent" || activeTicket.priority === "High"
                      ? "error"
                      : "primary"
                  }
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={activeTicket.status || "Open"}
                  size="small"
                  color={activeTicket.status === "Closed" ? "default" : "success"}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Paper>

            <Box flex={1} sx={{ bgcolor: "#ffffff", borderRadius: "10px", p: 1, border: "1px solid #e2e8f0" }}>
              <TicketChatSection
                ticketData={activeTicket}
                openMessegner={Boolean(activeTicket)}
              />
            </Box>
          </Box>
        ) : showNewTicketForm ? (
          /* Case 2: Raise New Query Form */
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #cbd5e1",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={700} color="#0E4F8D">
                Raise New Clarification / Helpdesk Query
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setShowNewTicketForm(false)}
                sx={{ textTransform: "none" }}
              >
                Back to Queries List
              </Button>
            </Box>

            <form onSubmit={handleCreateTicket}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Query Subject / Title"
                    placeholder="e.g., Clarification needed on projection charges / RO documentation"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Priority"
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    required
                    label="Query Description & Details"
                    placeholder="Describe your question or clarification in detail so other offices or Central Office can assist..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.xlsx,.xls"
                  />
                  <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AttachFileRounded />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ textTransform: "none", color: "#176FC1", borderColor: "#cbd5e1", borderRadius: "8px", fontWeight: 600 }}
                    >
                      {selectedFile ? "Change Attachment" : "Attach Supporting Document"}
                    </Button>
                    {selectedFile && (
                      <Chip
                        label={`${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`}
                        onDelete={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={1.5} mt={1}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() => setShowNewTicketForm(false)}
                      sx={{ textTransform: "none" }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submittingTicket}
                      sx={{
                        background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                      }}
                    >
                      {submittingTicket ? "Submitting Query..." : "Submit Query"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        ) : (
          /* Case 3: List of Queries for this Application */
          <Box>
            {/* Top Action Bar */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2.5}
              p={2}
              bgcolor="#ffffff"
              borderRadius="10px"
              border="1px solid #e2e8f0"
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#1e293b">
                  Queries & Clarifications for Application #{application?.applicationId}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Threaded discussions between Branch, Region, Zone, and Central Office
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutline />}
                onClick={() => setShowNewTicketForm(true)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                }}
              >
                Raise New Query
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                <CircularProgress size={32} />
              </Box>
            ) : tickets.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Typography variant="body1" fontWeight={700} color="#64748b" gutterBottom>
                  No queries raised for this application yet.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 450, mx: "auto" }}>
                  Have questions about commercial projections, charges, waivers, or customer approvals? Raise a query to discuss directly with other offices.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddCircleOutline />}
                  onClick={() => setShowNewTicketForm(true)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Raise First Query
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {tickets.map((ticket) => (
                  <Paper
                    key={ticket.id}
                    elevation={0}
                    onClick={() => setActiveTicket(ticket)}
                    sx={{
                      p: 2,
                      borderRadius: "10px",
                      bgcolor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "#0E4F8D",
                        boxShadow: "0 4px 12px rgba(14, 79, 141, 0.08)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0E4F8D">
                          #{ticket.id} &bull; {ticket.ticketName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mt: 0.3,
                          }}
                        >
                          {ticket.description || "No description provided."}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={ticket.priority || "Medium"}
                          size="small"
                          color={
                            ticket.priority === "Urgent" || ticket.priority === "High"
                              ? "error"
                              : "primary"
                          }
                          sx={{ fontWeight: 700, fontSize: "11px" }}
                        />
                        <Chip
                          label={ticket.status || "Open"}
                          size="small"
                          color={ticket.status === "Closed" ? "default" : "success"}
                          sx={{ fontWeight: 700, fontSize: "11px" }}
                        />
                      </Stack>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        Branch: {ticket.branchName || "N/A"} &bull; Created:{" "}
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "Recently"}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<ChatBubbleOutline fontSize="small" />}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "12px" }}
                      >
                        Open Discussion & Chat
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationHelpdeskSection;