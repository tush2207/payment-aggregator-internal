import React from "react";
import { Chip, MenuItem, Select, Box } from "@mui/material";
import TextFieldLabel from "../Label";

// -------------------------------------------------------------
// 🌈 1. CONFIG – COLORS + LABELS (NO ICONS, MINIMAL PREMIUM)
// -------------------------------------------------------------
const CHIP_CONFIG = {
  // Status
  active: { label: "Active", color: "#30D158" },
  inactive: { label: "In-Active", color: "#FF3B30" },

  "all": { label: "All", color: "#FF3B30" },

  todo: { label: "To Do", color: "#FF3B30" },
  open: { label: "Open", color: "#FF3B30" },
  pending: { label: "Pending", color: "#FF9500" },
  inprogress: { label: "In Progress", color: "#007AFF" },
  // completed: { label: "Completed", color: "#34C759" },
  submitted: { label: "Submitted", color: "#30D158" },
  approved: { label: "Approved", color: "#30D158" },
  rejected: { label: "Rejected", color: "#FF3B30" },
  accepted: { label: "Accepted", color:  "#30D158"  },
  expired: { label: "Expired", color: "#FF3B30" },
  resolved:  { label: "Resolved", color:  "#30D158"  },

  // Priority
  high: { label: "High", color: "#FF3B30" },
  medium: { label: "Medium", color: "#FFCC00" },
  low: { label: "Low", color: "#AC8E00" },

  // Workflow Stages
  applicationSubmitted: { label: "Application Submitted", color: "#0A84FF" },
  approvedbyro: { label: "Approved by RO", color: "#BF5AF2" },
  approvedbyzo: { label: "Approved by ZO", color: "#AC8E00" },
  approvedbyco: { label: "Approved by CO", color: "#5E5CE6" },
  sendtoaggregators: { label: "Send to Aggregators", color: "#5E5CE6" },
  quoterequested: { label: "Quote Requested", color: "#7B1FA2" },
  quotesubmitted: { label: "Quote Submitted", color: "#FF9800" },
  reviewquote: { label: "Quote Analysis", color: "#FF5722" },
  quoteaccepted: { label: "Customer Accepted", color: "#388E3C" },
  finalapproval: { label: "Final Approval", color: "#30D158" },

  // Rejections
  rejectedbyro: { label: "Rejected by RO", color: "#FF3B30" },
  rejectedbyzo: { label: "Rejected by ZO", color: "#B00020" },
  rejectedbyco: { label: "Rejected by CO", color: "#FF3B30" },
  quoterejected: { label: "Quote Rejected", color: "#FF3B30" },
  completed: { label: "Completed", color: "#4CAF50" },
};

// -------------------------------------------------------------
// 🟣 2. OPTIONS LISTS
// -------------------------------------------------------------
const STATUS_OPTIONS = [
  "to do",
  "pending",
  "in progress",
  "completed",
  "submitted",
  "approved",
  "rejected",
  "active",
  "inactive"
];

const PRIORITY_OPTIONS = ["high", "medium", "low"];

const WORKFLOW_OPTIONS = [
  "all",
  "applicationSubmitted",

  "approvedbyro",
  "approvedbyzo",
  "approvedbyco",

  "quoterequested",
  "quotesubmitted",

  "reviewquote",
  "quoteaccepted",
  "finalapproval",

  "rejectedbyro",
  "rejectedbyzo",
  "rejectedbyco",

  "quoterejected",
  "completed",
];

// -------------------------------------------------------------
// 🔥 3. PREMIUM MINIMAL CHIP (NO ICONS • ULTRA CLEAN)
// -------------------------------------------------------------
const premiumChipStyle = (color) => ({
  borderColor: `${color}AA`,
  color,
  background: `rgba(255,255,255,0.05)`,
  backdropFilter: "blur(8px)",
  padding: "0 6px",
  height: 22,
  fontSize: "10.5px",
  borderRadius: "6px",
  fontWeight: 700,
  letterSpacing: 0.4,
  transition: "0.25s ease-out",
  boxShadow: `0 0 3px ${color}55`,
  "&:hover": {
    transform: "translateY(-1px)",
    boxShadow: `0 0 8px ${color}AA`,
    background: `${color}15`,
  },
});

// -------------------------------------------------------------
// 🌟 4. MAIN COMPONENT
// -------------------------------------------------------------
const StatusChipOrSelect = ({
  placeholder,
  fullWidth,
  label,
  value,
  editable = false,
  type = "status", // status | priority | workflow
  onChange,
  sx = {},
}) => {
  const optionKeys =
    type === "priority"
      ? PRIORITY_OPTIONS
      : type === "workflow"
        ? WORKFLOW_OPTIONS
        : STATUS_OPTIONS;

  const options = optionKeys.map((key) => ({
    value: key,
    ...CHIP_CONFIG[key],
  }));

  const selected = CHIP_CONFIG[value];
  const color = selected?.color || "#ccc";

  // -------------------------------------------------------------
  // 🔹 VIEW MODE → CLEAN MINIMAL PREMIUM CHIP
  // -------------------------------------------------------------
  if (!editable) {
    return (
      <Chip
        size="small"
        label={selected?.label || value}
        variant="outlined"
        sx={{
          width: "fit-content",
          maxWidth: 160,
          ...premiumChipStyle(color),
          ...sx,
        }}
      />
    );
  }

  // -------------------------------------------------------------
  // 🔹 EDIT MODE → PREMIUM SELECT (NO ICONS)
  // -------------------------------------------------------------
  return (
    <Box>
      <TextFieldLabel label={label} />
      <Select
        fullWidth={fullWidth}
        displayEmpty
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        sx={{
          minWidth: 200,
          ...sx,
          '& .MuiSelect-placeholder': {
            color: '#888',
          },
        }}
        renderValue={(selectedVal) => {
          if (!selectedVal)
            return <span style={{ color: "#888" }}>{placeholder}</span>;

          return CHIP_CONFIG[selectedVal]?.label;
        }}
        MenuProps={{
          PaperProps:{
            sx:{
              maxHeight:225,
              overflowY:"auto"
            }
          }
        }}
      >
        <MenuItem disabled value="">{placeholder}</MenuItem>

        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default StatusChipOrSelect;
// import React from "react";
// import {
//   Chip,
//   MenuItem,
//   Select,
//   Box,
// } from "@mui/material";
// import TextFieldLabel from "../Label";
// import {
//   CheckCircle,
//   Pending,
//   HourglassTop,
//   DoneAll,
//   Block,
//   Error,
//   Star,
//   LowPriority,
//   PriorityHigh,
// } from "@mui/icons-material";
// import { all } from "axios";

// // -------------------------------------------------------------
// // 🔥 1. CENTRALIZED CONFIG – COLORS + ICONS + LABELS
// // -------------------------------------------------------------
// const CHIP_CONFIG = {
//   // Status
//   "to do": {
//     label: "To Do",
//     color: "#B00020",
//     // icon: <Pending fontSize="small" />,
//   },
//   pending: {
//     label: "Pending",
//     color: "#FFA500",
//     // icon: <HourglassTop fontSize="small" />,
//   },
//   "inprogress": {
//     label: "In Progress",
//     color: "#001F5B",
//     // icon: <HourglassTop fontSize="small" />,
//   },
//   completed: {
//     label: "Completed",
//     color: "#4CAF50",
//     // icon: <DoneAll fontSize="small" />,
//   },
//   submitted: {
//     label: "Submitted",
//     color: "#4CAF50",
//     // icon: <CheckCircle fontSize="small" />,
//   },
//   approved: {
//     label: "Approved",
//     color: "#4CAF50",
//     // icon: <CheckCircle fontSize="small" />,
//   },

  
//   accepted: {
//     label: "Accepted",
//     color: "#4CAF50",
//     // icon: <CheckCircle fontSize="small" />,
//   },
//   rejected: {
//     label: "Rejected",
//     color: "#B00020",
//     // icon: <Error fontSize="small" />,
//   },
//   expired: {
//     label: "Expired",
//     color: "#B00020",
//     // icon: <Error fontSize="small" />,
//   },

//   // Priority
//   high: {
//     label: "High",
//     color: "#B00020",
//     // icon: <PriorityHigh fontSize="small" />,
//   },
//   medium: {
//     label: "Medium",
//     color: "#FFA500",
//     // icon: <Star fontSize="small" />,
//   },
//   low: {
//     label: "Low",
//     color: "#4CAF50",
//     // icon: <LowPriority fontSize="small" />,
//   },

//   // Workflow
//   all: {
//     label: "All",
//     color: "#2196F3",
//     // icon: <Pending fontSize="small" />,
//   },
//   applicationSubmitted: {
//     label: "Application Submitted",
//     color: "#2196F3",
//     // icon: <Pending fontSize="small" />,
//   },
//   approvedbyro: {
//     label: "Approved by RO",
//     color: "#9C27B0",
//     // icon: <CheckCircle fontSize="small" />,
//   },
//   approvedbyzo: {
//     label: "Approved by ZO",
//     color: "#673700",
//     // icon: <CheckCircle fontSize="small" />,
//   },
//   approvedbyco: {
//     label: "Send to Aggregators",
//     color: "#6737B7",
//     // icon: <CheckCircle fontSize="small" />,
//   },
//   rejectedbyro: {
//     label: "Rejected by RO",
//     color: "#B00020",
//     // icon: <Error fontSize="small" />,
//   },
//   rejectedbyzo: {
//     label: "Rejected by ZO",
//     color: "#B00020",
//     // icon: <Error fontSize="small" />,
//   },
//   quoterequested: {
//     label: "Quote Requested",
//     color: "#7B1FA2",
//     // icon: <Error fontSize="small" />,
//   },
//   quotesubmitted: {
//     label: "Quote Submitted",
//     color: "#FF9800",
//     // icon: <Error fontSize="small" />,
//   },
//   quoteaccepted:{
//     label: "Quote Accepted",
//     color: "#388E3C",
//     // icon: <Error fontSize="small" />,
//   },
//   reviewquote:{
//     label: "Quote Evaluation",
//     color: "#FF5722",
//     // icon: <Error fontSize="small" />,
//   },
//   finalapproval: {
//     label: "Final Approval",
//     color: "#4CAF50",
//     // icon: <Error fontSize="small" />,
//   },

//   resolved: {
//     label: "Resolved",
//     color: "#4CAF50",
//     // icon: <Error fontSize="small" />,
//   }
// };

// // -------------------------------------------------------------
// // 🔥 2. OPTIONS LISTS
// // -------------------------------------------------------------
// const STATUS_OPTIONS = Object.keys(CHIP_CONFIG).filter(
//   (key) =>
//     ["to do", "pending", "in progress", "completed", "submitted", "approved", "rejected"].includes(
//       key
//     )
// );

// const PRIORITY_OPTIONS = ["high", "medium", "low"];

// const WORKFLOW_OPTIONS = Object.keys(CHIP_CONFIG).filter((key) =>
//   ["all",
//     "applicationSubmitted",
//     "approvedbyro",
//     "approvedbyzo",
//     "approvedbyco",
//     "rejectedbyro",
//     "rejectedbyzo",
//     "rejectedbyco",
//     "quoterequested",
//     "quotesubmitted",
//     "quoteaccepted",
//     "finalapproval"
//   ].includes(key)
// );

// // -------------------------------------------------------------
// // 🔥 3. ULTRA-PREMIUM CHIP STYLE (GLASS + GLOW)
// // -------------------------------------------------------------
// const premiumChipStyle = (color) => ({
//   borderColor: color,
//   color,
//   backdropFilter: "blur(6px)",
//   background: "rgba(255,255,255,0.09)",
//   borderRadius: "8px",
//   padding: "0 6px",
//   fontWeight: 600,
//   transition: "all .25s ease",
//   "&:hover": {
//     boxShadow: `0 0 12px ${color}99`,
//     transform: "translateY(-1px)",
//     background: `${color}22`,
//   },
// });

// // -------------------------------------------------------------
// // 🔥 4. MAIN COMPONENT
// // -------------------------------------------------------------
// const StatusChipOrSelect = ({
//   placeholder,
//   fullWidth,
//   label,
//   value,
//   editable = false,
//   type = "status", // status | priority | workflow
//   onChange,
//   sx = {},
// }) => {
//   const optionKeys =
//     type === "priority"
//       ? PRIORITY_OPTIONS
//       : type === "workflow"
//         ? WORKFLOW_OPTIONS
//         : STATUS_OPTIONS;

//   const options = optionKeys.map((key) => ({
//     value: key,
//     ...CHIP_CONFIG[key],
//   }));

//   const selected = CHIP_CONFIG[value];
//   const color = selected?.color || "#ccc";

//   // -------------------------------------------------------------
//   // 🔹 VIEW MODE → PREMIUM CHIP
//   // -------------------------------------------------------------
//   if (!editable) {
//     return (
//       <Chip
//         size="small"
//         icon={selected?.icon}
//         label={selected?.label || value}
//         variant="outlined"
//         sx={{
//           width: 170,
//           ...premiumChipStyle(color),
//           ...sx,
//         }}
//       />
//     );
//   }

//   // -------------------------------------------------------------
//   // 🔹 EDIT MODE → PREMIUM SELECT
//   // -------------------------------------------------------------
//   return (
//     <Box>
//       <TextFieldLabel label={label} />
//       {/* <Select
//         fullWidth={fullWidth}
//         displayEmpty
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         size="small"
//         sx={{
//           minWidth: 200,
//           borderRadius: "10px",
//           fontWeight: 600,
//           "& .MuiSelect-select": {
//             padding: "8px",
//           },
//           ...sx,
//         }}
//         renderValue={(selectedVal) => {
//           if (!selectedVal)
//             return (
//               <span style={{ color: "#888" }}>{placeholder}</span>
//             );

//           return CHIP_CONFIG[selectedVal]?.label;
//         }}
//       >
//         <MenuItem disabled value="">
//           {placeholder}
//         </MenuItem>

//         {options.map((opt) => (
//           <MenuItem key={opt.value} value={opt.value}>
//             <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//               {opt.icon}
//               {opt.label}
//             </Box>
//           </MenuItem>
//         ))}
//       </Select> */}
//       <Select
//         fullWidth={fullWidth}
//         displayEmpty               // <-- REQUIRED
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         variant="outlined"
//         size="small"
//         sx={{
//           minWidth: 200,
//           ...sx,
//           '& .MuiSelect-placeholder': {
//             color: '#888',
//           },
//         }}
//         renderValue={(selected) => {
//           if (!selected) {
//             return <span style={{ color: '#b3b3b3ff' }}>{placeholder}</span>;   // <-- SHOW PLACEHOLDER
//           }
//           const option = options.find((opt) => opt.value === selected);
//           return option?.label;
//         }}
//       >
//         {/* Placeholder item (hidden) */}
//         <MenuItem value="" disabled>
//           {placeholder}
//         </MenuItem>

//         {options.map((option) => (
//           <MenuItem key={option.value} value={option.value}>
//             {option.label}
//           </MenuItem>
//         ))}
//       </Select>
//     </Box>
//   );
// };

// export default StatusChipOrSelect;
