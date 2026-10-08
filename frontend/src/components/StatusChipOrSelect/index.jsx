import React from 'react';
import { Chip, MenuItem, Select, Box } from '@mui/material';
import TextFieldLabel from '../Label';

const CHIP_CONFIG = {
  active: { label: 'Active', color: '#15803d' },
  inactive: { label: 'In-Active', color: '#b91c1c' },
  all: { label: 'All', color: '#176FC1' },
  todo: { label: 'To Do', color: '#b91c1c' },
  open: { label: 'Open', color: '#b45309' },
  pending: { label: 'Pending', color: '#b45309' },
  inprogress: { label: 'In Progress', color: '#176FC1' },
  submitted: { label: 'Submitted', color: '#15803d' },
  approved: { label: 'Approved', color: '#15803d' },
  rejected: { label: 'Rejected', color: '#b91c1c' },
  accepted: { label: 'Accepted', color: '#15803d' },
  expired: { label: 'Expired', color: '#b91c1c' },
  resolved: { label: 'Resolved', color: '#15803d' },
  high: { label: 'High', color: '#b91c1c' },
  medium: { label: 'Medium', color: '#b45309' },
  low: { label: 'Low', color: '#15803d' },
  applicationSubmitted: { label: 'Application Submitted', color: '#176FC1' },
  approvedbyro: { label: 'Approved by RO', color: '#15803d' },
  approvedbyzo: { label: 'Approved by ZO', color: '#15803d' },
  approvedbyco: { label: 'Approved by CO', color: '#15803d' },
  sendtoaggregators: { label: 'Sent to Aggregators', color: '#176FC1' },
  quoterequested: { label: 'Quote Requested', color: '#0E4F8D' },
  quotesubmitted: { label: 'Quote Submitted', color: '#b45309' },
  reviewquote: { label: 'Quote Analysis', color: '#CE0F3E' },
  quoteaccepted: { label: 'Quote Accepted', color: '#15803d' },
  finalapproval: { label: 'Final Approval', color: '#15803d' },
  negotiation_requested: { label: 'Negotiation Requested', color: '#b45309' },
  quoterevised: { label: 'Quote Revised', color: '#176FC1' },
  rejectedbyro: { label: 'Rejected by RO', color: '#b91c1c' },
  rejectedbyzo: { label: 'Rejected by ZO', color: '#b91c1c' },
  rejectedbyco: { label: 'Rejected by CO', color: '#b91c1c' },
  quoterejected: { label: 'Quote Rejected', color: '#b91c1c' },
  completed: { label: 'Completed', color: '#15803d' },
};

const STATUS_OPTIONS = ['to do', 'pending', 'in progress', 'completed', 'submitted', 'approved', 'rejected', 'active', 'inactive'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const WORKFLOW_OPTIONS = [
  'all',
  'applicationSubmitted',
  'approvedbyro',
  'approvedbyzo',
  'approvedbyco',
  'quoterequested',
  'quotesubmitted',
  'reviewquote',
  'negotiation_requested',
  'quoterevised',
  'quoteaccepted',
  'finalapproval',
  'rejectedbyro',
  'rejectedbyzo',
  'rejectedbyco',
  'completed',
];

const premiumChipStyle = (color) => ({
  borderColor: color,
  borderWidth: '1.5px',
  borderStyle: 'solid',
  color: color,
  background: `${color}14`,
  padding: '0 8px',
  height: 24,
  minWidth: 120,
  maxWidth: 155,
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '11px',
  borderRadius: '6px',
  fontWeight: 700,
  letterSpacing: 0.3,
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease-in-out',
  boxShadow: `0 0 6px ${color}25`,
  '& .MuiChip-label': {
    px: 0.6,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '&:hover': {
    boxShadow: `0 0 10px ${color}45`,
    background: `${color}22`,
  },
});

export const StatusChipOrSelect = ({
  placeholder,
  fullWidth,
  label,
  value,
  status,
  editable = false,
  type = 'status',
  onChange,
  sx = {},
}) => {
  const rawKey = String(value || status || placeholder || '').trim();
  const normalizedKey = rawKey.toLowerCase().replace(/[\s\-_]/g, '');
  const config = CHIP_CONFIG[normalizedKey] || CHIP_CONFIG[rawKey] || {
    label: rawKey || 'Pending',
    color: '#64748b',
  };

  const optionKeys = type === 'priority' ? PRIORITY_OPTIONS : type === 'workflow' ? WORKFLOW_OPTIONS : STATUS_OPTIONS;

  if (editable) {
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
        {label && <TextFieldLabel label={label} />}
        <Select
          size="small"
          value={value || ''}
          onChange={onChange}
          displayEmpty
          fullWidth={fullWidth}
          sx={{
            borderRadius: '8px',
            fontSize: '12px',
            '& .MuiSelect-select': { py: 0.8 },
          }}
        >
          {optionKeys.map((opt) => {
            const optNorm = opt.toLowerCase().replace(/[\s\-_]/g, '');
            const optCfg = CHIP_CONFIG[optNorm] || { label: opt, color: '#64748b' };
            return (
              <MenuItem key={opt} value={opt} sx={{ fontSize: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: optCfg.color }} />
                  {optCfg.label}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </Box>
    );
  }

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        ...premiumChipStyle(config.color),
        ...sx,
      }}
    />
  );
};

export default StatusChipOrSelect;
