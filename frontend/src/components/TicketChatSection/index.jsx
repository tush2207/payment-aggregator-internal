import { message } from "&src/assets";
import { isBO, isCO, user_role } from "&src/constants/PaymentAggregratorConstant";
import HelpdeskServices from "&src/services/helpdesk";
import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, Paper, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";


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
    console.log(ticketData, openMessegner, 'Check')

    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // // Fetch chat from backend
    // const fetchChat = async () => {
    //     if (!ticketId) return;

    //     // Example API response
    //     const res = {
    //         data: {
    //             chats: "Branch: Hello | CO: Noted",
    //         },
    //     };

    //     const parsedMessages = parseChatString(res.data?.chats);
    //     setMessages(parsedMessages);
    // };


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

        console.log("DATA SENT TO BACKEND PIPE FORMAT:", pipeString);

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
        <Box
            sx={{
                padding: 2,
                borderRadius: 3,
                minHeight: "50vh",
                display: "flex",
                flexDirection: "column",
                background: "#fafafa",
                border: "1px solid #e0e0e0",
            }}
        >
            {/* CHAT WINDOW */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    mb: 2,
                    pr: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {messages?.length === 0 ? (
                    <Box
                        sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.6,
                        }}
                    >
                        {/* <ChatBubbleOutline sx={{ fontSize: 60, mb: 1 }} /> */}
                        <img src={message} width={150} />
                        <Typography fontSize='20px'>No chats yet. Start conversation…</Typography>
                    </Box>
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
                                    elevation={3}
                                    sx={{
                                        px: 2,
                                        py: 1.3,
                                        borderRadius: "12px",
                                        maxWidth: "70%",
                                        bgcolor: isCurrentUser ? "#1E88E5" : "#eeeeee",
                                        color: isCurrentUser ? "white" : "black",
                                        position: "relative",
                                    }}
                                >
                                    <Typography sx={{ fontSize: "15px" }}>{m.msg}</Typography>

                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: "block",
                                            mt: 0.5,
                                            opacity: 0.7,
                                            fontSize: "11px",
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
                    pt: 1,
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a message..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: "20px",
                        },
                    }}
                />

                <IconButton
                    onClick={sendMessage}
                    color="primary"
                    sx={{
                        bgcolor: "#1E88E5",
                        color: "white",
                        "&:hover": { bgcolor: "#1565C0" },
                    }}
                >
                    <SendIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default TicketChatSection;
