import React, { memo } from 'react';
import PropTypes from 'prop-types';
import {
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Stack,
  Chip,
  Badge,
  Button,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility,
  Timeline,
  CancelOutlined,
  QuestionAnswerRounded,
  TaskAltRounded,
} from '@mui/icons-material';
import { formatDateOnly, formatTimeOnly } from '&src/utils';
import StatusChipOrSelect from '&src/components/table/common/StatusChipOrSelect';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { PAYMENT_AGGREGATOR_WORKFLOW, deriveApplicationStatus } from '&src/constants/PaymentAggregratorConstant';

const isWaiverApplication = (app) => {
  return Boolean(app?.isWaiverRequested || app?.isWaiver || app?.waiverRequested || app?.category === 'Govt');
};

/**
 * Presentational row component for Customer Applications & Workflow Table.
 * Renders the exact 10 portal columns:
 * - For Final Approved applications: Renders ONLY the green Application Flow button.
 * - For in-progress/pending applications: Renders View Details, Queries badge, and role action button.
 */
export const ApplicationFlowRow = memo(({
  customer = {},
  idx = 0,
  expanded = false,
  onToggleExpand,
  userRole = 'CO',
  isAdmin = false,
  onView,
  onVerify,
  onProcessFlow,
  onOpenReject,
  onOpenQuery,
  onOpenActionMenu,
}) => {
  const isRejected = (customer?.status || '').toLowerCase().includes('reject') || Boolean(customer?.reasonOfRejection);
  const isFinalApproved = Boolean(customer?.isFinalApproved);
  const isCOApproved = Boolean(customer?.isReviewByCO);
  const roApproved = customer?.isReviewByRO === true;
  const zoApproved = customer?.isReviewByZO === true;

  const branchDisplay = customer.branchName
    ? `${customer.branchName}${customer.branchId && customer.branchId !== 0 ? ` (${customer.branchId})` : ''}`
    : (customer.branchId || '-');

  const regionDisplay = customer.regionName
    ? `${customer.regionName}${customer.regionId && customer.regionId !== 0 ? ` (${customer.regionId})` : ''}`
    : (customer.regionId || '-');

  const zoneDisplay = customer.zoneName
    ? `${customer.zoneName}${customer.zoneId && customer.zoneId !== '00000' && customer.zoneId !== 0 ? ` (${customer.zoneId})` : ''}`
    : (customer.zoneId && customer.zoneId !== '00000' ? customer.zoneId : '-');

  const appQueryCount = customer.queryCount || 0;

  return (
    <React.Fragment>
      <TableRow
        hover
        selected={expanded}
        sx={(theme) => ({
          bgcolor: expanded ? `${theme.palette.primary.main}08` : idx % 2 === 1 ? theme.palette.background.default : '#ffffff',
          transition: 'background-color 0.15s ease',
          '&:hover': {
            bgcolor: theme.palette.action.hover || '#f1f5f9',
          },
        })}
      >
        {/* 1. # Index */}
        <TableCell sx={(theme) => ({ width: 45, fontWeight: 600, fontSize: '12px', color: 'text.secondary', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
          {idx + 1}
        </TableCell>

        {/* 2. Date & Time */}
        <TableCell sx={(theme) => ({ width: 125, whiteSpace: 'nowrap', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
          <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '12.5px', lineHeight: 1.3 }}>
            {formatDateOnly(customer.createdAt || customer.created_at)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', display: 'block', mt: 0.2 }}>
            {formatTimeOnly(customer.createdAt || customer.created_at)}
          </Typography>
        </TableCell>

        {/* 3. App ID */}
        <TableCell sx={(theme) => ({ width: 105, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
          <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ fontSize: '12.5px' }}>
            {customer.applicationId}
          </Typography>
        </TableCell>

        {/* 4. Customer Name */}
        <TableCell sx={(theme) => ({ minWidth: 160, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 1 })}>
          <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ fontSize: '13px', lineHeight: 1.3 }}>
            {customer.customerName || 'N/A'}
          </Typography>
        </TableCell>

        {/* 5. Branch Details */}
        <TableCell sx={(theme) => ({ minWidth: 175, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 1.2 })}>
          <Typography variant="body2" fontWeight={700} color="primary.dark" sx={{ fontSize: '13px', lineHeight: 1.3, mb: 0.3 }}>
            {branchDisplay}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', lineHeight: 1.2 }}>
              <b>Region:</b> {regionDisplay}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', lineHeight: 1.2 }}>
              <b>Zone:</b> {zoneDisplay}
            </Typography>
          </Box>
        </TableCell>

        {/* 6. Account No */}
        <TableCell align="center" sx={(theme) => ({ minWidth: 110, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 1 })}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.3 }}>
            {customer.accountNo && customer.accountNo !== 'NA' && customer.accountNo !== 'N/A' ? (
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'text.primary', textAlign: 'center' }}>
                {customer.accountNo}
              </Typography>
            ) : (
              <Chip
                label="New"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '10px',
                  fontWeight: 700,
                  bgcolor: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  borderRadius: '4px',
                  px: 0.4,
                }}
              />
            )}
            {isWaiverApplication(customer) && (
              <Tooltip title="Fee Waiver Requested / Applicable" arrow placement="top">
                <Chip
                  label="WAIVER"
                  size="small"
                  sx={{
                    height: 17,
                    fontSize: '9px',
                    fontWeight: 800,
                    bgcolor: '#fef3c7',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                    px: 0.2,
                  }}
                />
              </Tooltip>
            )}
          </Box>
        </TableCell>

        {/* 7. Category */}
        <TableCell sx={(theme) => ({ minWidth: 150, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}`, py: 1.2 })}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.4 }}>
            <Chip
              label={customer.category || 'General'}
              size="small"
              sx={{
                height: 22,
                fontSize: '11px',
                fontWeight: 700,
                bgcolor: customer.category === 'Govt' ? '#eff6ff' : '#f8fafc',
                color: customer.category === 'Govt' ? '#1d4ed8' : '#334155',
                border: customer.category === 'Govt' ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                borderRadius: '5px',
              }}
            />
            {customer.businessCategory && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'primary.dark',
                  lineHeight: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                }}
              >
                <span style={{ color: '#94a3b8', fontSize: '9px' }}>●</span>
                {customer.businessCategory}
              </Typography>
            )}
          </Box>
        </TableCell>

        {/* 8. Workflow Status */}
        <TableCell align="center" sx={(theme) => ({ py: 1, px: 1, borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
          <StatusChipOrSelect value={deriveApplicationStatus(customer)} type="workflow" />
        </TableCell>

        {/* 9. Actions Column */}
        <TableCell align="center" sx={(theme) => ({ minWidth: 175, py: 1, px: 1, whiteSpace: 'nowrap', borderRight: `1px solid ${theme.palette.divider}`, borderBottom: `1px solid ${theme.palette.divider}` })}>
          <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center" sx={{ flexWrap: 'nowrap' }}>
            {isFinalApproved ? (
              /* ── FINAL APPROVED: Render ONLY the green Application Flow dropdown button ── */
              <Tooltip title="View application flow actions & documents" arrow placement="top">
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<TaskAltRounded sx={{ fontSize: 15 }} />}
                  endIcon={<KeyboardArrowDown sx={{ fontSize: 13 }} />}
                  sx={{
                    height: '28px',
                    textTransform: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    px: 1.2,
                    whiteSpace: 'nowrap',
                    borderRadius: '6px',
                    bgcolor: '#059669',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#047857' },
                  }}
                  onClick={(e) => onOpenActionMenu && onOpenActionMenu(e, customer)}
                >
                  Application Flow
                </Button>
              </Tooltip>
            ) : (
              /* ── IN-PROGRESS / REJECTED / PENDING: Render View & Query icons + Action button ── */
              <>
                {/* View Application Details Icon */}
                <Tooltip title="View Application Details" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => (onView ? onView(customer) : onProcessFlow(customer))}
                    sx={{
                      width: 28,
                      height: 28,
                      p: '4px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      bgcolor: '#f8fafc',
                      color: 'primary.main',
                      '&:hover': { bgcolor: '#f1f5f9', color: 'primary.dark' },
                    }}
                  >
                    <Visibility sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                {/* Queries & Clarifications Icon with Live Badge */}
                <Tooltip title={`Queries & Clarifications (${appQueryCount} active)`} arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={() => onOpenQuery && onOpenQuery(customer)}
                    sx={{
                      width: 28,
                      height: 28,
                      p: '4px',
                      border: '1px solid',
                      borderColor: appQueryCount > 0 ? '#fb923c' : '#cbd5e1',
                      borderRadius: '6px',
                      bgcolor: appQueryCount > 0 ? '#fff7ed' : '#f8fafc',
                      color: appQueryCount > 0 ? '#ea580c' : 'primary.main',
                      '&:hover': {
                        bgcolor: appQueryCount > 0 ? '#ffedd5' : '#f1f5f9',
                        color: appQueryCount > 0 ? '#c2410c' : 'primary.dark',
                      },
                    }}
                  >
                    <Badge
                      badgeContent={appQueryCount}
                      color="error"
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '9px',
                          height: 14,
                          minWidth: 14,
                          px: '3px',
                          right: -2,
                          top: -2,
                        },
                      }}
                    >
                      <QuestionAnswerRounded sx={{ fontSize: 15 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Role Actions */}
                {isRejected ? (
                  <Tooltip
                    title={
                      <Box sx={{ p: 0.5, maxWidth: 220 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#fca5a5' }}>
                          Rejection Reason
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: '#ffffff', mt: 0.3, lineHeight: 1.3 }}>
                          {customer?.reasonOfRejection || 'Application was rejected by Central Office'}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Chip
                      icon={<CancelOutlined sx={{ fontSize: '14px !important', color: '#dc2626 !important' }} />}
                      label="Rejected"
                      size="small"
                      sx={{
                        height: 26,
                        fontSize: '11px',
                        fontWeight: 700,
                        bgcolor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        cursor: 'pointer',
                        '& .MuiChip-label': { px: 0.8 },
                      }}
                    />
                  </Tooltip>
                ) : !isCOApproved ? (
                  // Pre-CO Approval actions
                  userRole === 'RO' && !roApproved ? (
                    <Tooltip title="Verify and review application details as Regional Office" arrow placement="top">
                      <Button
                        size="small"
                        sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 700, px: 1.4, whiteSpace: 'nowrap', borderRadius: '6px' }}
                        variant="contained"
                        color="primary"
                        onClick={() => (onVerify ? onVerify(customer) : onView && onView(customer))}
                      >
                        Verify (RO)
                      </Button>
                    </Tooltip>
                  ) : userRole === 'ZO' && roApproved && !zoApproved ? (
                    <Tooltip title="Verify and review application details as Zonal Office" arrow placement="top">
                      <Button
                        size="small"
                        sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 700, px: 1.4, whiteSpace: 'nowrap', borderRadius: '6px' }}
                        variant="contained"
                        color="primary"
                        onClick={() => (onVerify ? onVerify(customer) : onView && onView(customer))}
                      >
                        Verify (ZO)
                      </Button>
                    </Tooltip>
                  ) : (userRole === 'CO' || isAdmin) && roApproved ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={isAdmin ? 'Verify and review application details as Central Office' : 'View Application Details'} arrow placement="top">
                        <Button
                          size="small"
                          sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 700, px: 1.4, whiteSpace: 'nowrap', borderRadius: '6px' }}
                          variant="contained"
                          color="primary"
                          onClick={() => (isAdmin && onVerify ? onVerify(customer) : onView ? onView(customer) : onProcessFlow(customer))}
                        >
                          Verify (CO)
                        </Button>
                      </Tooltip>
                      {isAdmin && (
                        <Tooltip title="Reject application" arrow placement="top">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelOutlined sx={{ fontSize: 14 }} />}
                            sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 600, px: 1, whiteSpace: 'nowrap', borderRadius: '6px' }}
                            onClick={() => onOpenReject && onOpenReject(customer)}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  ) : null
                ) : (
                  // Post-CO Approval actions
                  userRole === 'RO' && customer?.isMarkUpAddedCO === true && !customer?.isQuoteAcceptRO ? (
                    <Tooltip title="Evaluate submitted quotes and propose markup charges" arrow placement="top">
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<Timeline sx={{ fontSize: 14 }} />}
                        sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 600, px: 1.2, whiteSpace: 'nowrap', borderRadius: '6px' }}
                        onClick={() => onProcessFlow(customer)}
                      >
                        Quote Evaluation
                      </Button>
                    </Tooltip>
                  ) : userRole === 'CO' || isAdmin ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Process payment aggregator application workflow" arrow placement="top">
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          startIcon={<Timeline sx={{ fontSize: 14 }} />}
                          sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 600, px: 1.2, whiteSpace: 'nowrap', borderRadius: '6px' }}
                          onClick={() => onProcessFlow(customer)}
                        >
                          Process Flow
                        </Button>
                      </Tooltip>
                      {isAdmin && (
                        <Tooltip title="Reject application" arrow placement="top">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelOutlined sx={{ fontSize: 14 }} />}
                            sx={{ height: '28px', textTransform: 'none', fontSize: '11px', fontWeight: 600, px: 1, whiteSpace: 'nowrap', borderRadius: '6px' }}
                            onClick={() => onOpenReject && onOpenReject(customer)}
                          >
                            Reject
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  ) : null
                )}
              </>
            )}
          </Stack>
        </TableCell>

        {/* 10. Expand Workflow Chevron */}
        <TableCell align="center" sx={(theme) => ({ width: 44, p: 0.5, borderBottom: `1px solid ${theme.palette.divider}` })}>
          <Tooltip title={expanded ? 'Collapse' : 'Expand Workflow'}>
            <IconButton size="small" onClick={() => onToggleExpand(customer.applicationId)}>
              {expanded ? <KeyboardArrowUp color="primary" fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* ── Collapsible Stepper Row ── */}
      {expanded && (
        <TableRow sx={{ p: 0, bgcolor: '#f8fafc' }}>
          <TableCell colSpan={10} sx={{ p: { xs: 1.5, sm: 2.5 }, borderBottom: '1px solid #cbd5e1' }}>
            <RoleBasedStepper
              steps={PAYMENT_AGGREGATOR_WORKFLOW(customer)}
              showTimestamp={true}
              showDescription={false}
              statusChip
            />
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
});

ApplicationFlowRow.displayName = 'ApplicationFlowRow';

ApplicationFlowRow.propTypes = {
  customer: PropTypes.object.isRequired,
  idx: PropTypes.number,
  expanded: PropTypes.bool,
  onToggleExpand: PropTypes.func.isRequired,
  userRole: PropTypes.string,
  isAdmin: PropTypes.bool,
  onView: PropTypes.func,
  onVerify: PropTypes.func,
  onProcessFlow: PropTypes.func.isRequired,
  onOpenReject: PropTypes.func,
  onOpenQuery: PropTypes.func,
  onOpenActionMenu: PropTypes.func,
};

export default ApplicationFlowRow;
