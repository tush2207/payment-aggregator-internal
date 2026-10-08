import React, { Fragment, memo, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    TableRow,
    TableCell,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    Chip,
    Button
} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { MessageOutlined, Timeline } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { openWorkflowDialog } from "&src/store/applicationFlowSlice";

import EndAlignedCell from '&src/components/EndAlignedCell';
import CenterAlign from '&src/components/CenterAlign';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { PAYMENT_AGGREGATOR_WORKFLOW, deriveApplicationStatus } from "&src/constants/PaymentAggregratorConstant";
import { formatDateAndTime } from "&src/utils";

/**
 * ApplicationRow component represents a single RFQ application row in the Application Flow table.
 *
 * @business_rule CBI-PAPG Bank Compliance Rule (Issue 1):
 * When an application status is completed (final approval granted), operational field roles
 * (Branch Officer 'BO'/'BR', Regional Officer 'RO', Zonal Officer 'ZO') are restricted to
 * view-only mode to prevent unintended post-sanction alterations. For these roles, only the
 * direct View Details icon (VisibilityRounded) is rendered. For Central Office ('CO') and
 * Super Admins, the Application Flow action button is rendered.
 *
 * @business_rule Stage Timestamps (Issue 2):
 * Expanded row renders the RoleBasedStepper with distinct timestamps per workflow stage.
 *
 * @business_rule CenEODS Theme Compliance (Issue 3):
 * All colors and visual styles derive dynamically from MUI Theme tokens (no hardcoded HEX values).
 */
const ApplicationRow = memo(
    ({
        application,
        userRole,
        isExpanded,
        onToggle,
        onView,
        onSubmitBR,
        onVerify,
        onEditProjections,
        onAddAggregator,
        onAcceptQuote,
        onFinalApproval,
        onDownloadPO
    }) => {
        const dispatch = useDispatch();
        const [anchorEl, setAnchorEl] = useState(null);

        // Normalize user role
        const roleNormalized = (userRole || '').toUpperCase();
        const isFieldRole = ['BO', 'BR', 'RO', 'ZO'].includes(roleNormalized);

        // Determine if application is in completed/final approved state
        const isCompleted = useMemo(() => {
            if (!application) return false;
            const status = (application.status || '').toLowerCase();
            return Boolean(
                application.isFinalApproved ||
                status === 'finalapproval' ||
                status === 'completed' ||
                (status === 'approvedbyco' && application.purchaseOrderId)
            );
        }, [application]);

        const handleMenuClick = useCallback((event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
        }, []);

        const handleMenuClose = useCallback((event) => {
            if (event) event.stopPropagation();
            setAnchorEl(null);
        }, []);

        const handleViewClick = useCallback((event) => {
            if (event) event.stopPropagation();
            if (onView) onView(application);
        }, [onView, application]);

        const branch = application?.branchName
            ? `${application.branchName}${application.branchId && application.branchId !== 0 ? ` (${application.branchId})` : ''}`
            : (application?.branchId || '-');

        const region = application?.regionName
            ? `${application.regionName}${application.regionId && application.regionId !== 0 ? ` (${application.regionId})` : ''}`
            : (application?.regionId || '-');

        const zone = application?.zoneName
            ? `${application.zoneName}${application.zoneId && application.zoneId !== '00000' && application.zoneId !== 0 ? ` (${application.zoneId})` : ''}`
            : (application?.zoneId && application?.zoneId !== '00000' ? application.zoneId : '-');

        return (
            <Fragment>
                <TableRow
                    hover
                    sx={(theme) => ({
                        transition: '0.2s',
                        backgroundColor: isExpanded ? theme.palette.grey[50] : theme.palette.background.paper,
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                        }
                    })}
                >
                    {/* Branch, Region & Zone Information (with IDs) */}
                    <TableCell sx={{ minWidth: 220, py: 1.2 }}>
                        <Typography
                            variant="body2"
                            fontWeight={700}
                            color="primary.dark"
                            sx={{ fontSize: '13px', lineHeight: 1.3, mb: 0.3 }}
                        >
                            {branch}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Typography component="span" variant="caption" color="text.secondary" fontWeight={600}>
                                    Region:
                                </Typography>
                                <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>
                                    {region}
                                </Typography>
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <Typography component="span" variant="caption" color="text.secondary" fontWeight={600}>
                                    Zone:
                                </Typography>
                                <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>
                                    {zone}
                                </Typography>
                            </Typography>
                        </Box>
                    </TableCell>

                    {/* Application Date & Time */}
                    <TableCell>{formatDateAndTime(application?.createdAt)}</TableCell>

                    {/* RFQ Application Number */}
                    <TableCell>{application?.applicationId}</TableCell>

                    {/* Customer / Merchant Name */}
                    <TableCell>{application?.customerName}</TableCell>

                    {/* Account Number with Masking / New Tag */}
                    <EndAlignedCell textAlign='center' format={false}>
                        {application?.accountNo && application.accountNo !== 'NA' && application.accountNo !== 'N/A' ? (
                            application.accountNo
                        ) : (
                            <Chip
                                label="New"
                                size="small"
                                color="success"
                                variant="outlined"
                                sx={{
                                    height: 20,
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    px: 0.4
                                }}
                            />
                        )}
                    </EndAlignedCell>

                    {/* Business Category & Sector */}
                    <TableCell>
                        <Box display="flex" flexDirection="column" gap={0.3}>
                            <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                {application?.category && application.category !== 'N/A' && application.category !== ''
                                  ? application.category
                                  : (application?.integrateWith?.includes('edu') || application?.customerName?.toLowerCase().includes('college') || application?.customerName?.toLowerCase().includes('institute')
                                      ? 'Education & Training'
                                      : application?.customerName?.toLowerCase().includes('tech') || application?.customerName?.toLowerCase().includes('edge')
                                        ? 'Information Technology'
                                        : application?.customerName?.toLowerCase().includes('real')
                                          ? 'Construction & Real Estate'
                                          : 'General Services')}
                            </Typography>
                            {application?.businessCategory && (
                                <Chip
                                    label={application.businessCategory}
                                    size="small"
                                    color={application.businessCategory === 'Government' ? 'success' : 'primary'}
                                    variant="outlined"
                                    sx={{
                                        fontSize: '10px',
                                        height: '18px',
                                        alignSelf: 'flex-start',
                                        fontWeight: 700,
                                    }}
                                />
                            )}
                        </Box>
                    </TableCell>

                    {/* Financial Projections */}
                    <EndAlignedCell textAlign='start'>
                        {application?.avgTransactionYearly}
                    </EndAlignedCell>
                    <EndAlignedCell textAlign='start'>
                        {application?.avgTransactionSize}
                    </EndAlignedCell>

                    {/* Application Status Badge */}
                    <TableCell>
                        <CenterAlign>
                            <StatusChipOrSelect value={deriveApplicationStatus(application)} type="workflow" />
                        </CenterAlign>
                    </TableCell>

                    {/* Actions & Interactive Expansion Controller */}
                    <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {/* Expand Row Toggle */}
                            <Tooltip title={isExpanded ? "Collapse Details" : "Expand Workflow"} placement="top" arrow>
                                <IconButton size="small" onClick={() => onToggle(application?.applicationId)}>
                                    {isExpanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                                </IconButton>
                            </Tooltip>

                            {/* CO Audit Timeline Quick Action */}
                            {roleNormalized === 'CO' && application?.isReviewByRO === true && (
                                <Tooltip title="Approval Timeline" placement="top" arrow>
                                    <IconButton color="secondary" size="small" onClick={() => dispatch(openWorkflowDialog(application))}>
                                        <Timeline fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Rejection Remarks Quick Tooltip */}
                            {application?.reasonOfRejection && (
                                <Tooltip title={`Rejection Reason: ${application.reasonOfRejection}`} placement="top" arrow>
                                    <IconButton color="error" size="small">
                                        <MessageOutlined fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* 
                                REQUIREMENT:
                                When application is completed / final approved:
                                - BO, RO, and ZO users only see the View Details icon button.
                                - CO / Admin see the Application Flow action button.
                            */}
                            {isCompleted ? (
                                isFieldRole ? (
                                    <Tooltip title="View Application Details" placement="top" arrow>
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={handleViewClick}
                                            aria-label="View Application Details"
                                        >
                                            <VisibilityRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Application Flow actions & documents" placement="top" arrow>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="success"
                                            startIcon={<TaskAltRoundedIcon sx={{ fontSize: 15 }} />}
                                            endIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: 13 }} />}
                                            onClick={handleMenuClick}
                                            sx={{
                                                height: "28px",
                                                textTransform: "none",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                px: 1.2,
                                                whiteSpace: "nowrap",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            Application Flow
                                        </Button>
                                    </Tooltip>
                                )
                            ) : (
                                <Fragment>
                                    <Tooltip title="Actions" placement="top" arrow>
                                        <IconButton size="small" onClick={handleMenuClick} aria-label="Open Actions Menu">
                                            <MoreVertRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Fragment>
                            )}

                            {/* Actions Dropdown Menu */}
                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                                {onView && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onView(application); }}>
                                        View Details
                                    </MenuItem>
                                )}

                                {/* Process / Workflow Modal */}
                                <MenuItem onClick={(e) => { handleMenuClose(e); dispatch(openWorkflowDialog(application)); }}>
                                    Process Flow
                                </MenuItem>

                                {/* Branch Submission (Only for BR / BO before initial submission) */}
                                {['BR', 'BO'].includes(roleNormalized) && !application?.isApplicationSubmittedBR && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onSubmitBR(application); }}>
                                        Submit Application
                                    </MenuItem>
                                )}

                                {/* Verification Action (For pending RO, ZO, or CO stages) */}
                                {onVerify && (
                                    (application?.isReviewByRO === null && roleNormalized === 'RO') || 
                                    (application?.isReviewByZO === null && roleNormalized === 'ZO') || 
                                    (application?.isReviewByCO === null && roleNormalized === 'CO')
                                ) && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onVerify(application); }}>
                                        Verify Application
                                    </MenuItem>
                                )}

                                {/* Projections Update (Central Office only before quote forwarding) */}
                                {roleNormalized === 'CO' && application?.isReviewByCO === true && !application?.isProjectionAdded && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onEditProjections(application); }}>
                                        Update Projections
                                    </MenuItem>
                                )}

                                {/* Purchase Order Download for Final Approved Applications */}
                                {application?.isFinalApproved && onDownloadPO && (
                                    <MenuItem onClick={(e) => {
                                        handleMenuClose(e);
                                        onDownloadPO(application);
                                    }}>
                                        Download Purchase Order (PO)
                                    </MenuItem>
                                )}

                                <MenuItem onClick={handleMenuClose}>Close Menu</MenuItem>
                            </Menu>
                        </Box>
                    </TableCell>
                </TableRow>

                {/* Expanded Details: Workflow Stepper with Stage-by-Stage Timestamps */}
                {isExpanded && (
                    <TableRow sx={(theme) => ({ backgroundColor: theme.palette.grey[50] })}>
                        <TableCell colSpan={10} sx={{ py: 2 }}>
                            <Box sx={{ pl: { xs: 1, sm: 4 }, pr: { xs: 1, sm: 2 } }}>
                                <RoleBasedStepper
                                    steps={PAYMENT_AGGREGATOR_WORKFLOW(application)}
                                    showTimestamp={true}
                                    showDescription={true}
                                />
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </Fragment>
        );
    }
);

ApplicationRow.displayName = 'ApplicationRow';

ApplicationRow.propTypes = {
    application: PropTypes.object.isRequired,
    userRole: PropTypes.string,
    isExpanded: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    onView: PropTypes.func,
    onSubmitBR: PropTypes.func,
    onVerify: PropTypes.func,
    onEditProjections: PropTypes.func,
    onAddAggregator: PropTypes.func,
    onAcceptQuote: PropTypes.func,
    onFinalApproval: PropTypes.func,
    onDownloadPO: PropTypes.func,
};

export default ApplicationRow;
