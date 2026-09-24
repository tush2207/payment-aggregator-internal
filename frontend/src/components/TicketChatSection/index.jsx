import { message } from "&src/assets";
import { isBO, isCO, user_role } from "&src/constants/PaymentAggregratorConstant";
import HelpdeskServices from "&src/services/helpdesk";
import SendIcon from "@mui/icons-material/Send";
import AttachFileRounded from "@mui/icons-material/AttachFileRounded";
import { Box, IconButton, Paper, TextField, Typography, Tooltip, CircularProgress } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

// Helper to render message content with clickable attachment links
const renderMessageContent = (text, isCurrentUser) => {
    if (!text) return null;
    const attachmentRegex = /\[Attachment:\s*([^\]]+)\]\(([^)]+)\)/;
    const match = text.match(attachmentRegex);
    if (!match) {
        return <Typography sx={{ fontSize: "14px", lineHeight: 1.4 }}>{text}</Typography>;
    }
    const cleanText = text.replace(attachmentRegex, "").trim();
    const fileName = match[1];
    const fileUrl = match[2];

    return (
        <Box>
            {cleanText && (
                <Typography sx={{ fontSize: "14px", lineHeight: 1.4, mb: 0.8 }}>
                    {cleanText}
                </Typography>
            )}
            <Box
                component="a"
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.8,
                    p: "4px 10px",
                    borderRadius: "6px",
                    bgcolor: isCurrentUser ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: isCurrentUser ? "#ffffff" : "#0f172a",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    "&:hover": {
                        textDecoration: "underline",
                        bgcolor: isCurrentUser ? "rgba(255,255,255,0.35)" : "#cbd5e1",
                    },
                }}
            >
                📎 {fileName}
            </Box>
        </Box>
    );
};

// ---------- FIXED PARSE FUNCTION ----------
const parseChatString = (chatStr) => {
    if (!chatStr) return [];

    return chatStr
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c !== "") // IMPORTANT FIX: remove empty segments
        .map((c) => {
            if (c.startsWith("Branch:")) {
                return {
                    role: "BO",
                    senderLabel: "Branch Office",
                    msg: c.replace("Branch:", "").trim(),
                };
            }

            if (c.startsWith("CO:") || c.startsWith("Central Office:")) {
                return {
                    role: "CO",
                    senderLabel: "Central Office",
                    msg: c.replace("CO:", "").replace("Central Office:", "").trim(),
                };
            }

            // fallback for RO / ZO / others
            const [label, ...rest] = c.split(":");
            return {
                role: label || "Unknown",
                senderLabel: label || "Unknown",
                msg: rest.join(":").trim(),
            };
        });
};


// ---------- FIXED PIPE STRING GENERATOR ----------
const convertToPipeString = (messages) => {
    return messages
        .filter((m) => m.senderLabel && m.msg) // PREVENT ": msg"
        .map((m) => `${m.senderLabel}: ${m.msg}`)
        .join(" | ");
};

const getLabelFromRole = (role) => {
    switch (role) {
        case "CO":
            return "Central Office"
        case "BO":
            return "Branch Office"
        case "RO":
            return "Region Office"
        case "ZO":
            return "Zone Office"
        default:
            return role

    }
}
const TicketChatSection = ({ ticketData, openMessegner }) => {
    const { chats, id: ticketId } = ticketData || {}
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef(null);

    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleFileAttach = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const token = sessionStorage.getItem("accessToken");
            const res = await axios.post("/api/files/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res?.data?.fileId) {
                const fileUrl = `/api/files/download/${res.data.fileId}`;
                setMsg((prev) => (prev ? `${prev} [Attachment: ${file.name}](${fileUrl})` : `[Attachment: ${file.name}](${fileUrl})`));
            }
        } catch (err) {
            console.error("Attachment upload failed:", err);
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Send Message
    const sendMessage = async () => {
        if (!msg.trim()) return;

        const senderLabel =
            isCO
                ? "Central Office"
                : isBO
                    ? "Branch Office"
                    : user_role; // fallback for RO / ZO / others

        const formatted = {
            role: user_role,
            senderLabel,
            msg,
        };

        const updatedMessages = [...messages, formatted];

        // Convert to valid backend string
        const pipeString = convertToPipeString(updatedMessages);

        // API call
        await HelpdeskServices.updateHelpdesk(ticketId, { chats: pipeString });

        setMessages(updatedMessages);
        setMsg("");
    };


    useEffect(() => {
        if (openMessegner) {
            const parsedMessages = parseChatString(chats);
            setMessages(parsedMessages);
        } else {
            setMessages([]);
        }
    }, [chats, openMessegner]);


    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* HIDDEN FILE INPUT */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileAttach}
                accept=".pdf,.png,.jpg,.jpeg,.docx,.doc,.xlsx,.xls"
            />

            {/* MESSAGE LIST */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                {messages.length === 0 ? (
                    <Typography
                        sx={{
                            color: "#888",
                            textAlign: "center",
                            mt: 5,
                            fontStyle: "italic",
                        }}
                    >
                        No messages yet...
                    </Typography>
                ) : (
                    messages.map((m, i) => {
                        const isCurrentUserLabel = getLabelFromRole(user_role);
                        const isCurrentUser = m.senderLabel === isCurrentUserLabel;

                        return (
                            <Box
                                key={i}
                                sx={{
                                    display: "flex",
                                    justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                                    mb: 1.5,
                                }}
                            >
                                <Paper
                                    elevation={1}
                                    sx={{
                                        px: 2,
                                        py: 1.3,
                                        borderRadius: "12px",
                                        maxWidth: "75%",
                                        bgcolor: isCurrentUser ? "#176FC1" : "#f1f5f9",
                                        color: isCurrentUser ? "white" : "#0f172a",
                                        position: "relative",
                                        border: isCurrentUser ? "none" : "1px solid #e2e8f0",
                                    }}
                                >
                                    {renderMessageContent(m.msg, isCurrentUser)}

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: "block",
                                            mt: 0.5,
                                            opacity: 0.75,
                                            fontSize: "10.5px",
                                            textAlign: "right",
                                        }}
                                    >
                                        {m.senderLabel}
                                    </Typography>
                                </Paper>
                            </Box>
                        );
                    })
                )}

                <div ref={chatEndRef}></div>
            </Box>

            {/* INPUT BOX */}
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    borderTop: "1px solid #e0e0e0",
                    pt: 1.2,
                }}
            >
                <Tooltip title="Attach File / Screenshot">
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        sx={{ color: "#64748b" }}
                    >
                        {uploadingFile ? <CircularProgress size={20} /> : <AttachFileRounded />}
                    </IconButton>
                </Tooltip>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a message..."
                    value={msg}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    onChange={(e) => setMsg(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "20px",
                        },
                    }}
                />

                <IconButton
                    onClick={sendMessage}
                    disabled={!msg.trim()}
                    color="primary"
                    sx={{
                        bgcolor: "#176FC1",
                        color: "white",
                        "&:hover": { bgcolor: "#0E4F8D" },
                        "&.Mui-disabled": { bgcolor: "#cbd5e1", color: "#94a3b8" },
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default TicketChatSection;
