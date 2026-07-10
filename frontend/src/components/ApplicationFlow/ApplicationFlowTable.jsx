import React, { useState, useMemo } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, Stack, Pagination,
  Typography, Box
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Visibility, Edit, Delete } from '@mui/icons-material';
import { formatDateAndTime } from '&src/utils';
import CenterAlign from '&src/components/CenterAlign';
import StatusChipOrSelect from '&src/components/StatusChipOrSelect';
import ApplicationFlowRow from './ApplicationFlowRow';

export default function ApplicationFlowTable({
  applicationDetails = [],
  onView,
  onEdit,
  onDelete,
  onRefresh
}) {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    return [...applicationDetails].sort((a, b) => {
      let v1 = a[sortConfig.key] || "";
      let v2 = b[sortConfig.key] || "";
      if (sortConfig.key === "createdAt") {
        v1 = new Date(v1);
        v2 = new Date(v2);
      }
      if (v1 < v2) return sortConfig.direction === "asc" ? -1 : 1;
      if (v1 > v2) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [applicationDetails, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page]);
  
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;

  const SortHeader = ({ label, columnKey }) => (
    <TableCell onClick={() => handleSort(columnKey)} sx={{ cursor: 'pointer', fontWeight: 600 }}>
      {label}
      {sortConfig.key === columnKey && (
        <span style={{ fontSize: '12px', marginLeft: '4px' }}>
          {sortConfig.direction === 'asc' ? '▲' : '▼'}
        </span>
      )}
    </TableCell>
  );

  return (
    <Box>
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <SortHeader label="Date & Time" columnKey="createdAt" />
              <SortHeader label="App ID" columnKey="applicationId" />
              <SortHeader label="Customer Name" columnKey="customerName" />
              <TableCell sx={{ fontWeight: 600 }}>Branch Details</TableCell>
              <SortHeader label="Account No" columnKey="accountNo" />
              <SortHeader label="Category" columnKey="category" />
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((customer, index) => {
                const rowIndex = (page - 1) * rowsPerPage + index;
                const isExpanded = expandedRow === rowIndex;
                
                return (
                  <React.Fragment key={customer.applicationId}>
                    <TableRow hover selected={isExpanded}>
                      <TableCell>{rowIndex + 1}</TableCell>
                      <TableCell>{formatDateAndTime(customer.createdAt)}</TableCell>
                      <TableCell>{customer.applicationId}</TableCell>
                      <TableCell fontWeight={500}>{customer.customerName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{customer.branchName || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.regionName || 'N/A'}, {customer.zoneName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{customer.accountNo}</TableCell>
                      <TableCell>{customer.category}</TableCell>
                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect value={customer.status} type="workflow" />
                        </CenterAlign>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {onView && (
                            <Tooltip title="View">
                              <IconButton size="small" color="primary" onClick={() => onView(customer)}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onEdit && !customer?.isFinalApproved && (
                            <Tooltip title="Edit">
                              <IconButton size="small" color="secondary" onClick={() => onEdit(customer)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onDelete && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => onDelete(customer)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={isExpanded ? "Collapse" : "Expand Workflow"}>
                          <IconButton size="small" onClick={() => setExpandedRow(isExpanded ? null : rowIndex)}>
                            {isExpanded ? <KeyboardArrowUp color="primary" /> : <KeyboardArrowDown />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Workflow Row */}
                    {isExpanded && (
                      <ApplicationFlowRow customer={customer} onRefresh={onRefresh} />
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1" color="text.secondary">No applications found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction="row" justifyContent="flex-end" mt={2}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, val) => setPage(val)}
          color="primary"
          shape="rounded"
          variant="outlined"
        />
      </Stack>
    </Box>
  );
}
