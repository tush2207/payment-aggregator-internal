import {
  Chat,
  Delete,
  Edit,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  Download,
  Info,
  MessageOutlined,
} from "@mui/icons-material";

import {
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Pagination,
} from "@mui/material";

import React, { useEffect, useState, useMemo } from "react";
import NoData from "../NoData";
import RoleBasedStepper from "../RoleBasedStepper";
import StatusChipOrSelect from "../StatusChipOrSelect";
import AggregatorDetails from "./AggregatorQuoteTable";
import AcceptedQuoteTable from "./AcceptedQuoteTable";
import EndAlignedCell from "../EndAlignedCell";
import { PAYMENT_AGGREGATOR_WORKFLOW, user_role } from "&src/constants/PaymentAggregratorConstant";
import usePOGenerator from "&src/hooks/usePOGenerator";
import { formatDateAndTime } from "&src/utils";
import CenterAlign from "../CenterAlign";

export default function ProjectionQuoteTable({
  applicationDetails = [],
  onView,
  onDelete,
  onEdit,
  onVerify,
}) {
  const { generatePO: onDownload } = usePOGenerator()
  const [expandedRow, setExpandedRow] = useState(null);

  /** ---------- Sorting ---------- */
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  /** ---------- ACTIVE ARROW BLACK, INACTIVE ARROWS GRAY ---------- */
  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;

    const iconStyle = {
      fontSize: "16px",
      marginLeft: "4px",
      color: isActive ? "black" : "gray",
    };

    if (!isActive)
      return (
        <ArrowUpward sx={iconStyle} /> // always show faded arrow for inactive columns
      );

    return sortConfig.direction === "asc" ? (
      <ArrowUpward sx={iconStyle} />
    ) : (
      <ArrowDownward sx={iconStyle} />
    );
  };

  /** ------------ CLIENT-SIDE PAGINATION -------------- */
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const sortedData = useMemo(() => {
    return [...applicationDetails].sort((a, b) => {
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
  }, [applicationDetails, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;

  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page]);

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell onClick={() => handleSort("createdAt")} sx={{ width: '130px' }}>
                Date & Time <SortIcon columnKey="createdAt" />
              </TableCell>
              <TableCell onClick={() => handleSort("applicationId")} sx={{ width: '150px' }}>
                Application ID <SortIcon columnKey="applicationId" />
              </TableCell>
              <TableCell onClick={() => handleSort("customerName")}>
                Customer Name <SortIcon columnKey="customerName" />
              </TableCell>
              <TableCell onClick={() => handleSort("accountNo")} sx={{ width: '130px' }}>
                Account No <SortIcon columnKey="accountNo" />
              </TableCell>
              <TableCell onClick={() => handleSort("category")}>
                Category <SortIcon columnKey="category" />
              </TableCell>
              <TableCell>Avg. No. of Transactions</TableCell>
              <TableCell>Avg. Ticket Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((customer, index) => {
                const isActive = customer?.isActive === true;

                return (
                  <React.Fragment key={customer.applicationId}>
                    <TableRow>
                      <TableCell>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>

                      <TableCell>{formatDateAndTime(customer.createdAt)}</TableCell>

                      <TableCell>{customer.applicationId}</TableCell>

                      <TableCell>{customer.customerName}</TableCell>

                      <EndAlignedCell textAlign='start' format={false}>
                        {customer.accountNo}
                      </EndAlignedCell>

                      <TableCell>{customer.category}</TableCell>

                      <EndAlignedCell textAlign='start'>
                        {customer.avgTransactionYearly}
                      </EndAlignedCell >
                      <EndAlignedCell textAlign='start' >{customer.avgTransactionSize}</EndAlignedCell>

                      <TableCell>
                        <CenterAlign>
                          <StatusChipOrSelect
                            value={customer.status}
                            type="workflow"
                          />
                        </CenterAlign>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" display='flex'>
                          {onView && (
                            <Tooltip title="View" placement="top" arrow>
                              <IconButton color="primary" onClick={() => onView(customer)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          )}

                          {onEdit && !customer?.isFinalApproved && (
                            <Tooltip title="Update" placement="top" arrow>
                              <IconButton color="primary" onClick={() => onEdit(customer)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                          )}

                          {onVerify && ((!customer?.isReviewByRO && user_role === "RO") ||  (!customer?.isReviewByZO  && user_role === "ZO")) && (
                            <Tooltip title="Update" placement="top" arrow>

                              <Button
                                size="small"
                                sx={{ height: "25px", mt: 1 }}
                                variant="outlined"
                                onClick={() => onVerify(customer)}

                              >
                                Verify
                              </Button>
                            </Tooltip>

                          )}

                          {onDelete && (
                            <Tooltip title="Delete" placement="top" arrow>
                              <IconButton color="error" onClick={() => onDelete(customer)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                          {customer?.reasonOfRejection && (
                            <Tooltip title={customer?.reasonOfRejection} placement="top" arrow>
                              <IconButton color="error">
                                <MessageOutlined />
                              </IconButton>
                            </Tooltip>
                          )}

                          {customer?.isFinalApproved && (
                            <Tooltip title="Download PO" placement="top" arrow>
                              <IconButton color="primary" onClick={() =>
                                onDownload({
                                  applicationId: customer?.applicationId,
                                  aggregatorId: customer?.finalizedAggregatorId,
                                  customerName: customer?.customerName,
                                  isFinalApproved: customer?.isFinalApproved
                                })}>
                                <Download />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={expandedRow === index ? "Collapse" : "Expand"} placement="top" arrow>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === index ? null : index
                              )
                            }
                          >
                            {expandedRow === index ? (
                              <KeyboardArrowUp />
                            ) : (
                              <KeyboardArrowDown />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {expandedRow === index && (
                      <TableRow sx={{ p: 0 }}>
                        <TableCell colSpan={11}>
                          {(customer?.isMarkUpAddedCO && user_role === 'RO' && customer?.status !== 'quoterejected') ? (
                            <AcceptedQuoteTable customer={customer} applicationId={customer?.applicationId} />
                          ) : (
                            <>
                              {/* Stepper */}
                              <RoleBasedStepper
                                steps={PAYMENT_AGGREGATOR_WORKFLOW(customer)}
                                statusChip
                              />
                              {customer?.isApplicationSubmittedBR && (customer?.isReviewByRO || customer?.isReviewByZO) && <AggregatorDetails customerDetails={customer} />
                              }
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <NoData message="Data not found" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Stack direction="row" justifyContent="end" my={2}>
        <Pagination
          count={totalPages}
          page={page || 1}
          onChange={(e, value) => setPage(value)}
          variant="outlined"
          shape="rounded"
          color="primary"
        />
      </Stack>
    </>
  );
}
