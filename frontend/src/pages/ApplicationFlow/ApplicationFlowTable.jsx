import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    TextField,
    InputAdornment
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";

import NoData from "&src/components/NoData";
import ApplicationRow from './ApplicationRow';
import ProjectionModal from './ProjectionModal';
import DownloadPOModal from './DownloadPOModal';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SortIcon = ({ columnKey, sortConfig }) => {
    const isActive = sortConfig.key === columnKey;
    const iconStyle = {
        fontSize: "16px",
        marginLeft: "4px",
        color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
        verticalAlign: "middle"
    };

    return sortConfig.direction === "asc" || !isActive ? (
        <ArrowUpward sx={iconStyle} />
    ) : (
        <ArrowDownward sx={iconStyle} />
    );
};

export default function ApplicationFlowTable({
    applicationDetails = [],
    userRole,
    onSubmitBR,
    onVerify,
    onSubmitProjections,
    onAddAggregator,
    onAcceptQuote,
    onFinalApproval
}) {
    const [search, setSearch] = useState("");
    const [expandedRow, setExpandedRow] = useState(null);
    const [page, setPage] = useState(0); 
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const [projectionModalOpen, setProjectionModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);

    const [poModalOpen, setPoModalOpen] = useState(false);

    const [sortConfig, setSortConfig] = useState({
        key: "createdAt",
        direction: "desc",
    });

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
            }
            return { key, direction: "asc" };
        });
    };

    const filteredData = useMemo(() => {
        let data = [...applicationDetails];
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter((app) => 
                app.applicationId?.toString().toLowerCase().includes(q) ||
                app.customerName?.toLowerCase().includes(q) ||
                app.accountNo?.toString().toLowerCase().includes(q)
            );
        }
        return data;
    }, [applicationDetails, search]);

    const sortedData = useMemo(() => {
        return filteredData.sort((a, b) => {
            let v1 = a[sortConfig.key] ?? "";
            let v2 = b[sortConfig.key] ?? "";

            if (sortConfig.key === "createdAt") {
                v1 = new Date(v1);
                v2 = new Date(v2);
            }

            if (v1 < v2) return sortConfig.direction === "asc" ? -1 : 1;
            if (v1 > v2) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    const visibleList = useMemo(() => {
        const start = page * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, page, pageSize]);

    const toggleExpand = useCallback((id) => {
        setExpandedRow((prev) => (prev === id ? null : id));
    }, []);

    const handlePageChange = useCallback((_, newPage) => {
        setPage(newPage);
        setExpandedRow(null);
    }, []);

    const handlePageSizeChange = useCallback((e) => {
        setPageSize(parseInt(e.target.value, 10));
        setPage(0);
        setExpandedRow(null);
    }, []);

    const handleEditProjections = useCallback((app) => {
        setSelectedApp(app);
        setProjectionModalOpen(true);
    }, []);

    const handleDownloadPO = useCallback((app) => {
        setSelectedApp(app);
        setPoModalOpen(true);
    }, []);

    const isEmpty = visibleList.length === 0;

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    size="small"
                    placeholder="Search app ID, name, a/c…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 280, flexShrink: 0 }}
                />
            </Box>

            <TableContainer component={Paper} sx={{ overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow
                            sx={{
                                background: 'linear-gradient(90deg,#b71c1c,#d32f2f,#fcc419,#d32f2f,#b71c1c)',
                            }}>
                            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>
                                Location
                            </TableCell>
                            <TableCell onClick={() => handleSort("createdAt")} sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Date & Time <SortIcon columnKey="createdAt" sortConfig={sortConfig} />
                            </TableCell>
                            <TableCell onClick={() => handleSort("applicationId")} sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                App ID <SortIcon columnKey="applicationId" sortConfig={sortConfig} />
                            </TableCell>
                            <TableCell onClick={() => handleSort("customerName")} sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Customer Name <SortIcon columnKey="customerName" sortConfig={sortConfig} />
                            </TableCell>
                            <TableCell onClick={() => handleSort("accountNo")} sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Account No <SortIcon columnKey="accountNo" sortConfig={sortConfig} />
                            </TableCell>
                            <TableCell onClick={() => handleSort("category")} sx={{ color: '#fff', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Category <SortIcon columnKey="category" sortConfig={sortConfig} />
                            </TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>Avg Txns</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>Ticket Size</TableCell>
                            <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Status</TableCell>
                            <TableCell align="center" sx={{ color: '#fff', fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {isEmpty ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">
                                        {search ? `No results for "${search}"` : <NoData message="Data not found" />}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleList.map(app => (
                                <ApplicationRow
                                    key={app.applicationId}
                                    application={app}
                                    userRole={userRole}
                                    isExpanded={expandedRow === app.applicationId}
                                    onToggle={toggleExpand}
                                    onSubmitBR={() => onSubmitBR(app.applicationId)}
                                    onVerify={onVerify}
                                    onEditProjections={handleEditProjections}
                                    onAddAggregator={() => onAddAggregator(app.applicationId, [1, 2])} // Dummy IDs for now
                                    onAcceptQuote={(quoteDetails) => onAcceptQuote(app.applicationId, quoteDetails)}
                                    onFinalApproval={(isApproved) => onFinalApproval(app.applicationId, isApproved)}
                                    onDownloadPO={handleDownloadPO}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={sortedData.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={pageSize}
                    onRowsPerPageChange={handlePageSizeChange}
                    rowsPerPageOptions={PAGE_SIZE_OPTIONS}
                    sx={{ borderTop: '1px solid #f1f1f1' }}
                />
            </TableContainer>

            <ProjectionModal 
                open={projectionModalOpen} 
                onClose={() => setProjectionModalOpen(false)} 
                applicationDetails={selectedApp} 
                onSubmitProjections={onSubmitProjections}
            />

            <DownloadPOModal
                open={poModalOpen}
                onClose={() => setPoModalOpen(false)}
                applicationDetails={selectedApp}
            />
        </Box>
    );
}
