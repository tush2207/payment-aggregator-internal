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
  Tooltip,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  QuestionAnswerRounded,
  AddCircleOutlineRounded,
  CloseRounded,
  RefreshRounded,
  SendRounded,
  ArrowBackRounded,
  AttachFileRounded,
  DownloadRounded,
  CheckCircleRounded,
  LockRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  InsertDriveFileRounded,
  PictureAsPdfRounded,
  ImageRounded,
  TableChartRounded,
  DescriptionRounded,
  FolderZipRounded,
  ReplyRounded,
  ChatBubbleOutlineRounded,
  VerifiedRounded,
  InfoOutlined,
  SearchRounded,
} from "@mui/icons-material";
import HelpdeskServices from "&src/services/helpdesk";
import applicationServices from "&src/services/applications";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import useQueryWebSocket from "&src/hooks/useQueryWebSocket";
import axios from "axios";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const OFFICES = [
  { value: "BO", label: "Branch Office (BO)" },
  { value: "RO", label: "Regional Office (RO)" },
  { value: "ZO", label: "Zonal Office (ZO)" },
  { value: "CO", label: "Central Office (CO)" },
];

export const getFileIcon = (fileName, size = 16) => {
  if (!fileName) return <InsertDriveFileRounded sx={{ fontSize: size, color: "#64748b" }} />;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <PictureAsPdfRounded sx={{ fontSize: size, color: "#ef4444" }} />;
  if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) return <ImageRounded sx={{ fontSize: size, color: "#3b82f6" }} />;
  if (["xlsx", "xls", "csv"].includes(ext)) return <TableChartRounded sx={{ fontSize: size, color: "#10b981" }} />;
  if (["doc", "docx"].includes(ext)) return <DescriptionRounded sx={{ fontSize: size, color: "#2563eb" }} />;
  if (["zip", "rar", "7z"].includes(ext)) return <FolderZipRounded sx={{ fontSize: size, color: "#f59e0b" }} />;
  return <InsertDriveFileRounded sx={{ fontSize: size, color: "#64748b" }} />;
};

const parseChatMessages = (chatStr) => {
  if (!chatStr) return [];
  return chatStr
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c !== "")
    .map((c) => {
      const firstColon = c.indexOf(":");
      if (firstColon === -1) {
        return { senderLabel: "User", msg: c };
      }
      const label = c.substring(0, firstColon).trim();
      const msg = c.substring(firstColon + 1).trim();
      return { senderLabel: label || "User", msg };
    });
};

const renderChatMessage = (text, isCurrentUser) => {
  if (!text) return null;
  const attachmentRegex = /\[Attachment:\s*([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = attachmentRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: "text", content: text.substring(lastIdx, match.index) });
    }
    parts.push({ type: "file", name: match[1], url: match[2] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push({ type: "text", content: text.substring(lastIdx) });
  }

  if (parts.length === 0) {
    return <Typography sx={{ fontSize: "13px", lineHeight: 1.45 }}>{text}</Typography>;
  }

  return (
    <Box>
      {parts.map((p, idx) => {
        if (p.type === "text" && p.content.trim()) {
          return (
            <Typography key={idx} sx={{ fontSize: "13px", lineHeight: 1.45, mb: 0.5 }}>
              {p.content}
            </Typography>
          );
        }
        if (p.type === "file") {
          return (
            <Box
              key={idx}
              component="a"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              download={p.name}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.8,
                p: "4px 10px",
                my: 0.4,
                borderRadius: "6px",
                bgcolor: isCurrentUser ? "rgba(255,255,255,0.22)" : "#e2e8f0",
                color: isCurrentUser ? "#ffffff" : "#0f172a",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                border: isCurrentUser ? "1px solid rgba(255,255,255,0.4)" : "1px solid #cbd5e1",
                "&:hover": {
                  textDecoration: "underline",
                  bgcolor: isCurrentUser ? "rgba(255,255,255,0.35)" : "#cbd5e1",
                },
              }}
            >
              {getFileIcon(p.name, 14)}
              {p.name}
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};

export default function ApplicationQueryModal({
  open,
  onClose,
  application = null,
  initialTicket = null,
  initialTicketId = null,
  initialShowNewQuery = false,
  isHelpDeskGlobalMode = false,
  onQueriesCountUpdated,
}) {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // New Query Form fields
  const [queryAppNo, setQueryAppNo] = useState("");
  const [verifiedAppData, setVerifiedAppData] = useState(null);
  const [verifyingApp, setVerifyingApp] = useState(false);
  const [queryTitle, setQueryTitle] = useState("");
  const [queryPriority, setQueryPriority] = useState("Medium");
  const [targetOffice, setTargetOffice] = useState("BO");
  const [queryDescription, setQueryDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const multiFileInputRef = useRef(null);

  // Chat Reply fields
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const replyFileInputRef = useRef(null);
  const chatScrollEndRef = useRef(null);

  const userDetails = (() => {
    try {
      return JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    } catch {
      return {};
    }
  })();
  const userRole = sessionStorage.getItem("role") || userDetails.role || "CO";

  // Check if application is fully completed / final approved
  const isFinalApproved = Boolean(
    application?.isFinalApproved === true ||
    application?.isFinalApproved === "true" ||
    String(application?.status || "").toLowerCase().includes("final approved") ||
    String(application?.status || "").toLowerCase() === "approved"
  );

  const userSenderLabel = (() => {
    switch (userRole) {
      case "CO":
        return "Central Office";
      case "BO":
        return `Branch Office (${application?.branchName || userDetails.branchName || "BO"})`;
      case "RO":
        return `Regional Office (${application?.regionName || userDetails.regionName || "RO"})`;
      case "ZO":
        return `Zonal Office (${application?.zoneName || userDetails.zoneName || "ZO"})`;
      default:
        return userRole;
    }
  })();

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    try {
      if (application?.applicationId) {
        const res = await HelpdeskServices.getApplicationQueriesSummary(application.applicationId);
        const data = res?.data || res;
        const appTickets = Array.isArray(data?.tickets) ? data.tickets : [];
        setTickets(appTickets);
        if (onQueriesCountUpdated) onQueriesCountUpdated(appTickets.length);
        if (activeTicket) {
          const refreshed = appTickets.find((t) => t.id === activeTicket.id);
          if (refreshed) setActiveTicket(refreshed);
        }
      } else {
        // Global Helpdesk mode - fetch all helpdesk tickets
        const res = await HelpdeskServices.getAllHelpdesks();
        const allList = res?.data?.ticketsList || res?.data || [];
        setTickets(allList);
        if (onQueriesCountUpdated) onQueriesCountUpdated(allList.length);
        if (activeTicket) {
          const refreshed = allList.find((t) => t.id === activeTicket.id);
          if (refreshed) setActiveTicket(refreshed);
        }
      }
    } catch (err) {
      console.debug("Query fetch error:", err);
      try {
        const fallbackRes = await HelpdeskServices.getAllHelpdesks();
        const allList = fallbackRes?.data?.ticketsList || fallbackRes?.data || [];
        if (application?.applicationId) {
          const filtered = allList.filter(
            (t) => t && Number(t.applicationNo) === Number(application.applicationId)
          );
          setTickets(filtered);
          if (onQueriesCountUpdated) onQueriesCountUpdated(filtered.length);
        } else {
          setTickets(allList);
          if (onQueriesCountUpdated) onQueriesCountUpdated(allList.length);
        }
      } catch (fbErr) {
        console.error("Fallback query fetch error:", fbErr);
      }
    } finally {
      setLoading(false);
    }
  }, [application?.applicationId, onQueriesCountUpdated, activeTicket]);

  // Real-time WebSocket listener
  const handleWsEvent = useCallback(
    (event) => {
      if (!event) return;
      if (
        !application?.applicationId ||
        (event.applicationId && Number(event.applicationId) === Number(application.applicationId)) ||
        event.type === "NEW_QUERY" ||
        event.type === "NEW_COMMENT"
      ) {
        fetchQueries();
      }
    },
    [application?.applicationId, fetchQueries]
  );

  const wsRoom = application?.applicationId ? String(application.applicationId) : "global";
  useQueryWebSocket(wsRoom, handleWsEvent, open);

  // Initialize modal state on open
  useEffect(() => {
    if (open) {
      fetchQueries();
      if (initialTicket) {
        setActiveTicket(initialTicket);
        setShowNewQueryForm(false);
      } else if (initialTicketId) {
        HelpdeskServices.getHelpdeskById(initialTicketId)
          .then((res) => {
            if (res?.data) setActiveTicket(res.data);
          })
          .catch(() => {});
        setShowNewQueryForm(false);
      } else if (initialShowNewQuery) {
        setShowNewQueryForm(true);
        setActiveTicket(null);
      } else {
        setActiveTicket(null);
        setShowNewQueryForm(false);
      }
    }
  }, [open, application?.applicationId, initialTicket, initialTicketId, initialShowNewQuery]);

  useEffect(() => {
    if (chatScrollEndRef.current) {
      chatScrollEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTicket?.chats]);

  // Verify Application ID in New Query Form
  const handleVerifyApp = async () => {
    if (!queryAppNo.trim()) {
      return errorNotification("Please enter an Application Number to verify.");
    }
    setVerifyingApp(true);
    try {
      const res = await applicationServices.getApplicationById(queryAppNo.trim());
      if (res?.data) {
        setVerifiedAppData(res.data);
        successNotification(`Application #${queryAppNo} verified for ${res.data.customerName || "Merchant"}`);
      } else {
        setVerifiedAppData(null);
        errorNotification("Application not found. Please verify the Application Number.");
      }
    } catch (err) {
      console.error("App verify error:", err);
      setVerifiedAppData(null);
      errorNotification("Application verification failed.");
    } finally {
      setVerifyingApp(false);
    }
  };

  // Multi-file upload handler for query creation
  const handleMultiFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFiles(true);

    try {
      const token = sessionStorage.getItem("accessToken");
      const uploadedResults = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post("/api/files/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res?.data?.fileId) {
          uploadedResults.push({
            fileId: res.data.fileId,
            fileName: file.name,
            url: `/api/files/download/${res.data.fileId}`,
            size: file.size,
          });
        }
      }

      setUploadedFiles((prev) => [...prev, ...uploadedResults]);
      successNotification(`Uploaded ${uploadedResults.length} file(s) successfully.`);
    } catch (err) {
      console.error("Multi-file upload error:", err);
      errorNotification("Failed to upload one or more files.");
    } finally {
      setUploadingFiles(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = "";
    }
  };

  // Multi-file upload handler for chat reply
  const handleReplyFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingFiles(true);

    try {
      const token = sessionStorage.getItem("accessToken");
      const uploadedResults = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await axios.post("/api/files/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (res?.data?.fileId) {
          uploadedResults.push({
            fileId: res.data.fileId,
            fileName: file.name,
            url: `/api/files/download/${res.data.fileId}`,
            size: file.size,
          });
        }
      }

      setReplyFiles((prev) => [...prev, ...uploadedResults]);
    } catch (err) {
      console.error("Reply file upload error:", err);
      errorNotification("Failed to upload attachment.");
    } finally {
      setUploadingFiles(false);
      if (replyFileInputRef.current) replyFileInputRef.current.value = "";
    }
  };

  // Submit New Query
  const handleCreateQuery = async (e) => {
    e.preventDefault();
    if (isFinalApproved) {
      return errorNotification("Application is finalized & completed. Queries are in View-Only mode.");
    }
    if (!queryTitle.trim() || !queryDescription.trim()) {
      return errorNotification("Please enter both a Query Subject and Description.");
    }

    setSubmittingQuery(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      if (uploadedFiles.length > 0) {
        attachmentUrl = uploadedFiles[0].url;
        attachmentName = uploadedFiles[0].fileName;
      }

      const attachmentsString = uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null;

      let initialChat = `${userSenderLabel}: ${queryDescription.trim()}`;
      if (uploadedFiles.length > 0) {
        const fileLinks = uploadedFiles
          .map((f) => `[Attachment: ${f.fileName}](${f.url})`)
          .join(" ");
        initialChat += ` ${fileLinks}`;
      }

      const appData = verifiedAppData || application || {};
      const finalAppNo = queryAppNo ? Number(queryAppNo) : (application?.applicationId ? Number(application.applicationId) : null);

      const payload = {
        applicationNo: finalAppNo,
        accountNo: appData?.accountNo ? Number(appData.accountNo) : null,
        ticketName: queryTitle.trim(),
        customerName: appData?.customerName || userDetails?.Name || "Customer",
        branchName: appData?.branchName || userDetails?.branchName || "Branch Office",
        regionName: appData?.regionName || userDetails?.regionName || "RO",
        zoneName: appData?.zoneName || userDetails?.zoneName || "ZO",
        customerEmail: appData?.email || userDetails?.email_addr || "",
        customerMobileNo: appData?.mobileNo || userDetails?.phone || null,
        description: queryDescription.trim(),
        priority: queryPriority || "Medium",
        status: "Open",
        targetOffice: targetOffice || "BO",
        queryType: "APPLICATION_QUERY",
        attachmentUrl,
        attachmentName,
        attachments: attachmentsString,
        chats: initialChat,
      };

      const res = await HelpdeskServices.addHelpdesk(payload);
      if (res?.status === 200 || res?.status === 201 || res?.data) {
        successNotification("Query raised successfully and dispatched to Branch/Office.");
        setQueryTitle("");
        setQueryDescription("");
        setQueryPriority("Medium");
        setTargetOffice("BO");
        setUploadedFiles([]);
        setQueryAppNo("");
        setVerifiedAppData(null);
        setShowNewQueryForm(false);
        await fetchQueries();
      } else {
        errorNotification("Failed to create query.");
      }
    } catch (err) {
      console.error("Create query error:", err);
      errorNotification(err?.response?.data?.detail || err?.response?.data?.message || "Failed to create query.");
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Send Reply / Revert Comment
  const handleSendComment = async (revertStatus = null) => {
    if (isFinalApproved) {
      return errorNotification("Application is finalized & completed. Query is locked in View-Only mode.");
    }
    if (!replyText.trim() && replyFiles.length === 0) {
      return errorNotification("Please enter a message or attach a file.");
    }

    setSubmittingReply(true);
    try {
      let finalComment = replyText.trim();
      if (replyFiles.length > 0) {
        const fileTags = replyFiles.map((f) => `[Attachment: ${f.fileName}](${f.url})`).join(" ");
        finalComment = `${finalComment} ${fileTags}`.trim();
      }

      const payload = {
        comment: finalComment,
        senderLabel: userSenderLabel,
        status: revertStatus || (userRole === "BO" ? "Reverted_By_Branch" : "In Review"),
        attachments: replyFiles.length > 0 ? JSON.stringify(replyFiles) : null,
      };

      await HelpdeskServices.addTicketComment(activeTicket.id, payload);
      setReplyText("");
      setReplyFiles([]);
      successNotification(
        revertStatus === "Resolved"
          ? "Query marked as Resolved!"
          : userRole === "BO"
          ? "Branch revert sent successfully!"
          : "Comment posted."
      );
      await fetchQueries();
    } catch (err) {
      console.error("Send comment error:", err);
      errorNotification(err?.response?.data?.detail || err?.response?.data?.message || "Failed to post comment.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const parsedMessages = activeTicket ? parseChatMessages(activeTicket.chats) : [];

  // Parse attachments on the active ticket
  const ticketAttachments = (() => {
    if (!activeTicket) return [];
    const list = [];
    if (activeTicket.attachments) {
      try {
        const parsed = typeof activeTicket.attachments === "string" ? JSON.parse(activeTicket.attachments) : activeTicket.attachments;
        if (Array.isArray(parsed)) list.push(...parsed);
      } catch (e) {}
    }
    if (list.length === 0 && activeTicket.attachmentUrl) {
      list.push({
        fileId: null,
        fileName: activeTicket.attachmentName || "Attachment",
        url: activeTicket.attachmentUrl,
        size: null,
      });
    }
    return list;
  })();

  const filteredTickets = tickets.filter((t) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      String(t.id || "").includes(q) ||
      String(t.ticketName || "").toLowerCase().includes(q) ||
      String(t.description || "").toLowerCase().includes(q) ||
      String(t.customerName || "").toLowerCase().includes(q) ||
      String(t.applicationNo || "").includes(q)
    );
  });

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
          height: "88vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Unified Dialog Header */}
      <DialogTitle
        sx={{
          background: isFinalApproved
            ? "linear-gradient(135deg, #334155 0%, #475569 100%)"
            : "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
          color: "#ffffff",
          py: 1.8,
          px: 2.8,
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
              sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
            >
              <ArrowBackRounded />
            </IconButton>
          ) : (
            <QuestionAnswerRounded sx={{ fontSize: 26 }} />
          )}

          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
                {activeTicket
                  ? `Query #${activeTicket.id}: ${activeTicket.ticketName}`
                  : application?.applicationId
                  ? `Queries & Clarifications • App #${application.applicationId}`
                  : "HelpDesk & Application Query Desk"}
              </Typography>
              {isFinalApproved && (
                <Chip
                  icon={<LockRounded sx={{ fontSize: "13px !important", color: "#ffffff !important" }} />}
                  label="View-Only (Final Approved)"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "10.5px",
                    height: 22,
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ opacity: 0.9, color: "#ffffff" }}>
              {activeTicket
                ? `Customer: ${activeTicket.customerName || "N/A"} • Branch: ${activeTicket.branchName || "N/A"} • App #${activeTicket.applicationNo || "General"}`
                : application
                ? `${application.customerName} • Branch: ${application.branchName || "N/A"} • Account: ${application.accountNo || "New Merchant"}`
                : "Real-time communication & branch revert system"}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          {!activeTicket && (
            <Tooltip title="Refresh queries">
              <IconButton
                size="small"
                onClick={fetchQueries}
                disabled={loading}
                sx={{ color: "#ffffff" }}
              >
                <RefreshRounded />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "#ffffff" }}>
            <CloseRounded />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 2.5, bgcolor: "#f8fafc", flex: 1, overflowY: "auto" }}>
        {/* VIEW 1: ACTIVE QUERY DISCUSSION & TIMELINE */}
        {activeTicket ? (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Query details header card */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 1.5,
                bgcolor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ flex: 1, minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  Subject / Description:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#0f172a">
                  {activeTicket.description || activeTicket.ticketName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: "block" }}>
                  Target: {activeTicket.targetOffice || "Branch Office"} • Created:{" "}
                  {activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleString() : "Recently"}
                </Typography>

                {/* Attachments on this ticket */}
                {ticketAttachments.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mt: 1, flexWrap: "wrap" }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      Attachments:
                    </Typography>
                    {ticketAttachments.map((f, i) => (
                      <Chip
                        key={i}
                        icon={getFileIcon(f.fileName, 14)}
                        label={f.fileName || `File ${i + 1}`}
                        component="a"
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: "11px",
                          bgcolor: "#eff6ff",
                          borderColor: "#bfdbfe",
                          border: "1px solid",
                          "&:hover": { bgcolor: "#dbeafe" },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                {activeTicket.applicationNo && (
                  <Chip
                    label={`App #${activeTicket.applicationNo}`}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: "11px", bgcolor: "#e0f2fe", color: "#0369a1" }}
                  />
                )}
                <Chip
                  label={activeTicket.priority || "Medium"}
                  size="small"
                  color={activeTicket.priority === "Urgent" || activeTicket.priority === "High" ? "error" : "primary"}
                  sx={{ fontWeight: 700, fontSize: "11px" }}
                />
                <Chip
                  label={
                    activeTicket.status === "Reverted_By_Branch"
                      ? "Branch Reverted"
                      : activeTicket.status || "Open"
                  }
                  size="small"
                  color={
                    activeTicket.status === "Resolved" || activeTicket.status === "Closed"
                      ? "success"
                      : activeTicket.status === "Reverted_By_Branch"
                      ? "warning"
                      : "info"
                  }
                  sx={{ fontWeight: 700, fontSize: "11px" }}
                />
              </Stack>
            </Paper>

            {/* Read-Only Banner if Final Approved */}
            {isFinalApproved && (
              <Alert severity="info" icon={<LockRounded />} sx={{ mb: 1.5, py: 0.5, borderRadius: "8px", fontWeight: 600 }}>
                This application is fully approved & completed. Conversation is preserved in View-Only mode.
              </Alert>
            )}

            {/* Messages Scroll Area */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                bgcolor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {parsedMessages.length === 0 ? (
                <Box textAlign="center" py={6} color="#94a3b8">
                  <Typography variant="body2" fontStyle="italic">
                    No messages in this query thread yet.
                  </Typography>
                </Box>
              ) : (
                parsedMessages.map((m, idx) => {
                  const isCurrentUser =
                    m.senderLabel === userSenderLabel ||
                    (userRole === "CO" && m.senderLabel.includes("Central Office")) ||
                    (userRole === "BO" && m.senderLabel.includes("Branch Office"));

                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                        mb: 1.5,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          px: 2,
                          py: 1.3,
                          borderRadius: "12px",
                          maxWidth: "80%",
                          bgcolor: isCurrentUser ? "#176FC1" : "#f1f5f9",
                          color: isCurrentUser ? "#ffffff" : "#0f172a",
                          border: isCurrentUser ? "none" : "1px solid #e2e8f0",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                        }}
                      >
                        {renderChatMessage(m.msg, isCurrentUser)}
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            opacity: isCurrentUser ? 0.8 : 0.65,
                            fontSize: "10.5px",
                            textAlign: "right",
                            fontWeight: 600,
                          }}
                        >
                          {m.senderLabel}
                        </Typography>
                      </Paper>
                    </Box>
                  );
                })
              )}
              <div ref={chatScrollEndRef} />
            </Paper>

            {/* Reply / Branch Revert Composer */}
            {!isFinalApproved ? (
              <Box sx={{ mt: 1.5, bgcolor: "#ffffff", p: 1.5, borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                {replyFiles.length > 0 && (
                  <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                    {replyFiles.map((rf, fIdx) => (
                      <Chip
                        key={fIdx}
                        icon={getFileIcon(rf.fileName, 14)}
                        label={`${rf.fileName} (${(rf.size / 1024).toFixed(1)} KB)`}
                        onDelete={() => setReplyFiles((prev) => prev.filter((_, i) => i !== fIdx))}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}

                <Box display="flex" gap={1} alignItems="center">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    style={{ display: "none" }}
                    multiple
                    onChange={handleReplyFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.xlsx,.xls"
                  />
                  <Tooltip title="Attach Supporting Documents / Screenshots">
                    <IconButton
                      onClick={() => replyFileInputRef.current?.click()}
                      disabled={uploadingFiles || submittingReply}
                      sx={{ color: "#0E4F8D", border: "1px solid #cbd5e1", borderRadius: "8px" }}
                    >
                      <AttachFileRounded />
                    </IconButton>
                  </Tooltip>

                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={3}
                    placeholder={
                      userRole === "BO"
                        ? "Enter branch explanation / revert notes..."
                        : "Type clarification reply or note..."
                    }
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />

                  {userRole === "BO" ? (
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<ReplyRounded />}
                      onClick={() => handleSendComment("Reverted_By_Branch")}
                      disabled={submittingReply || (!replyText.trim() && replyFiles.length === 0)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        borderRadius: "8px",
                      }}
                    >
                      Revert
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      endIcon={<SendRounded />}
                      onClick={() => handleSendComment()}
                      disabled={submittingReply || (!replyText.trim() && replyFiles.length === 0)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                        borderRadius: "8px",
                        px: 2,
                      }}
                    >
                      Send
                    </Button>
                  )}

                  {activeTicket.status !== "Resolved" && (
                    <Tooltip title="Mark query as successfully resolved">
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<CheckCircleRounded />}
                        onClick={() => handleSendComment("Resolved")}
                        disabled={submittingReply}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", whiteSpace: "nowrap" }}
                      >
                        Resolve
                      </Button>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ) : null}
          </Box>
        ) : showNewQueryForm ? (
          /* VIEW 2: RAISE NEW QUERY FORM (MULTI-FILE UPLOAD) */
          <Paper elevation={0} sx={{ p: 3, bgcolor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={800} color="#0E4F8D">
                Raise Query / Clarification with Multiple Attachments
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setShowNewQueryForm(false)}
                sx={{ textTransform: "none" }}
              >
                Back to Query List
              </Button>
            </Box>

            <form onSubmit={handleCreateQuery}>
              <Grid container spacing={2}>
                {/* Application Number (Editable if not pre-set) */}
                {!application?.applicationId && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Application Number (Optional)"
                        placeholder="e.g. 1002"
                        value={queryAppNo}
                        onChange={(e) => setQueryAppNo(e.target.value)}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleVerifyApp}
                        disabled={verifyingApp || !queryAppNo.trim()}
                        sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 700 }}
                      >
                        {verifyingApp ? <CircularProgress size={16} /> : "Verify"}
                      </Button>
                    </Box>
                    {verifiedAppData && (
                      <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: "block", fontWeight: 600 }}>
                        ✓ {verifiedAppData.customerName} ({verifiedAppData.branchName})
                      </Typography>
                    )}
                  </Grid>
                )}

                <Grid item xs={12} sm={!application?.applicationId ? 6 : 6}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Query Subject / Title"
                    placeholder="e.g. KYC Mismatch, Projection Turnover clarification"
                    value={queryTitle}
                    onChange={(e) => setQueryTitle(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Target Office"
                    value={targetOffice}
                    onChange={(e) => setTargetOffice(e.target.value)}
                  >
                    {OFFICES.map((off) => (
                      <MenuItem key={off.value} value={off.value}>
                        {off.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Priority"
                    value={queryPriority}
                    onChange={(e) => setQueryPriority(e.target.value)}
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
                    label="Query Description & Action Required"
                    placeholder="Specify exact clarifications or documents required from the branch..."
                    value={queryDescription}
                    onChange={(e) => setQueryDescription(e.target.value)}
                  />
                </Grid>

                {/* Multi-File Drag & Drop Area */}
                <Grid item xs={12}>
                  <input
                    type="file"
                    ref={multiFileInputRef}
                    style={{ display: "none" }}
                    multiple
                    onChange={handleMultiFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.xlsx,.xls"
                  />
                  <Box
                    onClick={() => multiFileInputRef.current?.click()}
                    sx={{
                      border: "2px dashed #93c5fd",
                      borderRadius: "10px",
                      p: 2.5,
                      textAlign: "center",
                      bgcolor: "#eff6ff",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "#dbeafe",
                        borderColor: "#3b82f6",
                      },
                    }}
                  >
                    <CloudUploadRounded sx={{ fontSize: 32, color: "#1d4ed8", mb: 0.5 }} />
                    <Typography variant="body2" fontWeight={700} color="#1e40af">
                      Click to Browse & Upload Multiple Supporting Documents
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Supports PDF, Images (PNG/JPG), Word (.docx), Excel (.xlsx)
                    </Typography>
                  </Box>

                  {uploadingFiles && <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />}

                  {/* Uploaded files list */}
                  {uploadedFiles.length > 0 && (
                    <Box mt={1.5}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                        Attached Files ({uploadedFiles.length}):
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {uploadedFiles.map((f, idx) => (
                          <Chip
                            key={idx}
                            icon={getFileIcon(f.fileName, 14)}
                            label={`${f.fileName} (${(f.size / 1024).toFixed(1)} KB)`}
                            onDelete={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                            deleteIcon={<DeleteOutlineRounded />}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={1.5} mt={1}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={() => setShowNewQueryForm(false)}
                      sx={{ textTransform: "none" }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={submittingQuery || uploadingFiles}
                      sx={{
                        background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        borderRadius: "8px",
                      }}
                    >
                      {submittingQuery ? "Submitting Query..." : "Submit Query to Branch"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        ) : (
          /* VIEW 3: QUERIES LIST OVERVIEW */
          <Box>
            {/* Top Action Bar */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              p={2}
              bgcolor="#ffffff"
              borderRadius="10px"
              border="1px solid #e2e8f0"
              flexWrap="wrap"
              gap={1}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  {application?.applicationId
                    ? `Clarifications for App #${application.applicationId}`
                    : "HelpDesk Queries & Communication Threads"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time synchronization across Branch, Regional, Zonal, and Central Offices
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  placeholder="Filter queries..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchRounded sx={{ color: "text.secondary", mr: 0.5, fontSize: 18 }} />,
                  }}
                  sx={{ width: 180, "& .MuiOutlinedInput-root": { height: 36, fontSize: "12px", borderRadius: "8px" } }}
                />

                {!isFinalApproved ? (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineRounded />}
                    onClick={() => setShowNewQueryForm(true)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
                    }}
                  >
                    + Raise New Query
                  </Button>
                ) : (
                  <Tooltip title="Application is finalized. Adding new queries is disabled.">
                    <span>
                      <Button
                        disabled
                        variant="outlined"
                        startIcon={<LockRounded />}
                        sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
                      >
                        Locked (Finalized)
                      </Button>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredTickets.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                  border: "1.5px dashed #cbd5e1",
                }}
              >
                <QuestionAnswerRounded sx={{ fontSize: 44, color: "#94a3b8", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={700} color="#475569" gutterBottom>
                  {searchFilter ? "No queries match your search" : "No queries found"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 460, mx: "auto" }}>
                  Need clarification regarding merchant documents, turn-over projections, or aggregator quotes?
                  Raise a query to notify the branch or Central Office instantly via WebSockets.
                </Typography>
                {!isFinalApproved && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutlineRounded />}
                    onClick={() => setShowNewQueryForm(true)}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
                  >
                    Raise First Query
                  </Button>
                )}
              </Paper>
            ) : (
              <Stack spacing={1.5}>
                {filteredTickets.map((ticket) => {
                  let attachmentsList = [];
                  try {
                    if (ticket.attachments) {
                      attachmentsList = JSON.parse(ticket.attachments);
                    }
                  } catch (e) {
                    attachmentsList = [];
                  }

                  const isReverted = ticket.status === "Reverted_By_Branch";
                  const isResolved = ticket.status === "Resolved" || ticket.status === "Closed";

                  return (
                    <Paper
                      key={ticket.id}
                      elevation={0}
                      onClick={() => setActiveTicket(ticket)}
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        bgcolor: "#ffffff",
                        border: "1px solid",
                        borderColor: isReverted ? "#fbbf24" : isResolved ? "#86efac" : "#e2e8f0",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#0E4F8D",
                          boxShadow: "0 4px 14px rgba(14, 79, 141, 0.08)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.8}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D">
                            #{ticket.id} • {ticket.ticketName}
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

                        <Stack direction="row" spacing={0.8} alignItems="center">
                          {ticket.applicationNo && (
                            <Chip
                              label={`App #${ticket.applicationNo}`}
                              size="small"
                              sx={{ fontWeight: 700, fontSize: "10.5px", bgcolor: "#e0f2fe", color: "#0369a1" }}
                            />
                          )}
                          <Chip
                            label={ticket.priority || "Medium"}
                            size="small"
                            color={ticket.priority === "Urgent" || ticket.priority === "High" ? "error" : "primary"}
                            sx={{ fontWeight: 700, fontSize: "11px" }}
                          />
                          <Chip
                            label={
                              ticket.status === "Reverted_By_Branch"
                                ? "Branch Reverted"
                                : ticket.status || "Open"
                            }
                            size="small"
                            color={
                              isResolved
                                ? "success"
                                : isReverted
                                ? "warning"
                                : "info"
                            }
                            sx={{ fontWeight: 700, fontSize: "11px" }}
                          />
                        </Stack>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography variant="caption" color="text.secondary">
                          Customer: <b>{ticket.customerName || "N/A"}</b> • Branch: {ticket.branchName || "N/A"} • Target: {ticket.targetOffice || "BO"} • Files:{" "}
                          {attachmentsList.length || (ticket.attachmentUrl ? 1 : 0)}
                        </Typography>

                        <Button
                          size="small"
                          endIcon={<ChatBubbleOutlineRounded sx={{ fontSize: 15 }} />}
                          sx={{ textTransform: "none", fontWeight: 700, fontSize: "12px", color: "#0E4F8D" }}
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

      <DialogActions sx={{ p: 2, bgcolor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <Button variant="outlined" color="inherit" onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
