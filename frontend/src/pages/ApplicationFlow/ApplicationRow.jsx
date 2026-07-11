import React, { Fragment, memo, useState, useCallback } from 'react';
import { TableRow, TableCell, Typography, Box, IconButton, Tooltip, Menu, MenuItem, alpha } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { MessageOutlined } from "@mui/icons-material";

import EndAlignedCell from '&src/components/EndAlignedCell';
import CenterAlign from '&src/components/CenterAlign';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import RoleBasedStepper from '&src/components/RoleBasedStepper';
import { isCO, isRO, isZO, PAYMENT_AGGREGATOR_WORKFLOW } from "&src/constants/PaymentAggregratorConstant";
import { formatDateAndTime } from "&src/utils";

// These will be implemented next
import AggregatorSelection from './AggregatorSelection';
import QuoteReview from './QuoteReview';

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
        const [anchorEl, setAnchorEl] = useState(null);

        const handleMenuClick = useCallback((event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
        }, []);

        const handleMenuClose = useCallback((event) => {
            if (event) event.stopPropagation();
            setAnchorEl(null);
        }, []);

        const branch = application.branchName || application.branchId || '-';
        const region = application.regionName || application.regionId || '-';
        const zone = application.zoneName || application.zoneId || '-';

        return (
            <Fragment>
                <TableRow hover sx={{ transition: '0.2s', backgroundColor: isExpanded ? '#fafafa' : '#fff' }}>
                    <TableCell>
                        <Typography fontWeight={700} color="#333">
                            {branch}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                            {region} | {zone}
                        </Typography>
                    </TableCell>

                    <TableCell>{formatDateAndTime(application.createdAt)}</TableCell>
                    <TableCell>{application.applicationId}</TableCell>
                    <TableCell>{application.customerName}</TableCell>
                    <EndAlignedCell textAlign='start' format={false}>
                        {application.accountNo}
                    </EndAlignedCell>
                    <TableCell>{application.category}</TableCell>
                    <EndAlignedCell textAlign='start'>
                        {application.avgTransactionYearly}
                    </EndAlignedCell>
                    <EndAlignedCell textAlign='start'>
                        {application.avgTransactionSize}
                    </EndAlignedCell>

                    <TableCell>
                        <CenterAlign>
                            <StatusChipOrSelect value={application.status} type="workflow" />
                        </CenterAlign>
                    </TableCell>

                    {/* Expand & Actions */}
                    <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton size="small" onClick={() => onToggle(application.applicationId)}>
                                {isExpanded ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                            </IconButton>
                            <IconButton size="small" onClick={handleMenuClick}>
                                <MoreVertRoundedIcon />
                            </IconButton>

                            {application?.reasonOfRejection && (
                                <Tooltip title={application?.reasonOfRejection} placement="top" arrow>
                                    <IconButton color="error" size="small">
                                        <MessageOutlined fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}

                            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                                {onView && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onView(application); }}>View Details</MenuItem>
                                )}

                                {/* 1. Branch Submit */}
                                {userRole === 'BR' && !application.isApplicationSubmittedBR && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onSubmitBR(application); }}>Submit Application</MenuItem>
                                )}

                                {/* Verify Menu Option */}
                                {onVerify && (
                                    (application?.isReviewByRO === null && userRole === 'RO') || 
                                    (application?.isReviewByZO === null && userRole === 'ZO') || 
                                    (application?.isReviewByCO === null && userRole === 'CO')
                                ) && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onVerify(application); }}>Verify Application</MenuItem>
                                )}

                                {/* Projection Table Popup */}
                                {userRole === 'CO' && application.isReviewByCO === true && !application.isProjectionAdded && (
                                    <MenuItem onClick={(e) => { handleMenuClose(e); onEditProjections(application); }}>Update Projections</MenuItem>
                                )}

                                {/* 8. Final Approval / Download PO */}
                                {application?.isFinalApproved && (
                                    <MenuItem onClick={(e) => {
                                        handleMenuClose(e);
                                        onDownloadPO(application);
                                    }}>Download PO</MenuItem>
                                )}
                                <MenuItem onClick={handleMenuClose}>Close Menu</MenuItem>
                            </Menu>
                        </Box>
                    </TableCell>
                </TableRow>

                {/* Expanded Details */}
                {isExpanded && (
                    <TableRow sx={{ p: 0, backgroundColor: '#fcfcfc' }}>
                        <TableCell colSpan={10} sx={{ py: 0 }}>
                            <Box sx={{ pl: 5, pr: 2, py: 2 }}>
                                {application.isAggregatorAdded ? (
                                    <QuoteReview
                                        application={application}
                                        userRole={userRole}
                                        onAcceptQuote={onAcceptQuote}
                                        onFinalApproval={onFinalApproval}
                                    />
                                ) : (
                                    <>
                                        <RoleBasedStepper steps={PAYMENT_AGGREGATOR_WORKFLOW(application)} statusChip />
                                        
                                        {/* RO PENDING ACTIONS */}
                                        {userRole === 'RO' && application?.isReviewByRO === null && (
                                            <Box mt={3} p={2} sx={{ border: (theme) => `1px dashed ${theme.palette.primary.main}`, borderRadius: 2, backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                                <Typography variant="subtitle1" color="primary" fontWeight={700} gutterBottom>
                                                    Pending Actions
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Typography variant="body2" flex={1}>
                                                        You need to verify and approve the application details.
                                                    </Typography>
                                                    <Button variant="contained" size="small" onClick={() => onVerify(application)}>
                                                        Verify Application
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}

                                        {/* ZO PENDING ACTIONS */}
                                        {userRole === 'ZO' && application?.isReviewByZO === null && (
                                            <Box mt={3} p={2} sx={{ border: (theme) => `1px dashed ${theme.palette.primary.main}`, borderRadius: 2, backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                                <Typography variant="subtitle1" color="primary" fontWeight={700} gutterBottom>
                                                    Pending Actions
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={2}>
                                                    <Typography variant="body2" flex={1}>
                                                        You need to verify and approve the application details.
                                                    </Typography>
                                                    <Button variant="contained" size="small" onClick={() => onVerify(application)}>
                                                        Verify Application
                                                    </Button>
                                                </Box>
                                            </Box>
                                        )}
                                        
                                        {/* CO PENDING ACTIONS */}
                                        {userRole === 'CO' && !application?.isFinalApproved && (
                                            <Box mt={3} p={2} sx={{ border: (theme) => `1px dashed ${theme.palette.primary.main}`, borderRadius: 2, backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                                <Typography variant="subtitle1" color="primary" fontWeight={700} gutterBottom>
                                                    Pending Actions
                                                </Typography>
                                                
                                                {application?.isReviewByCO === null && (
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Typography variant="body2" flex={1}>
                                                            <b>Step 1:</b> Verify and approve the application details.
                                                        </Typography>
                                                        <Button variant="contained" size="small" onClick={() => onVerify(application)}>
                                                            Verify Application
                                                        </Button>
                                                    </Box>
                                                )}

                                                {application?.isReviewByCO === true && !application?.isProjectionAdded && (
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Typography variant="body2" flex={1}>
                                                            <b>Step 2:</b> Application is approved. Next, you need to add or update the projections.
                                                        </Typography>
                                                        <Button variant="contained" size="small" onClick={() => onEditProjections(application)}>
                                                            Update Projections
                                                        </Button>
                                                    </Box>
                                                )}

                                                {application?.isReviewByCO === true && application?.isProjectionAdded && !application?.isAggregatorAdded && (
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <Typography variant="body2" flex={1}>
                                                            <b>Step 3:</b> Projections updated successfully. Please select the aggregators below to send for quotes.
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}

                                        {application.isReviewByCO && application.isProjectionAdded && (
                                            <AggregatorSelection
                                                application={application}
                                                userRole={userRole}
                                                onAddAggregator={onAddAggregator}
                                            />
                                        )}
                                    </>
                                )}
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </Fragment>
        );
    }
);
ApplicationRow.displayName = 'ApplicationRow';

export default ApplicationRow;
