import {
  Add,
  CheckCircle,
  CurrencyRupee,
  Gavel,
  InfoOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Send,
  Download,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  TableContainer,
  Paper
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import {
  AGGREGATOR_COLUMNS,
  isCO,
  MANAGE_AGGREGATOR_TABLE_COLUMNS,
  PROJECTION_CAL_DETAILS
} from "&src/constants/PaymentAggregratorConstant";

import { AGGREGRATOR_BY_APPLICATION_RESPONSE } from "&src/data/data";
import useAggregatorDetails from "&src/hooks/useAggregatorDetails";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import { sortAggregatorsByQuote, formatNumber, PERCENTAGE, RS } from "&src/utils";
import { calculateQuoteRow, calculateTotals, calculateProjectionDetails, generateProjectionArray } from "&src/utils/calculation";
import applicationServices from "&src/services/applications";
import CenterAlign from "&src/components/CenterAlign";
import DatePicker from "&src/components/DatePicker";
import EndAlignedCell from "&src/components/EndAlignedCell";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import StatusChipOrSelect from "&src/components/StatusChipOrSelect";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import DialogWithHeader from "&src/components/Dialog/DialogWithHeader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import AddCharges from "./AddCharges";
import QuoteTable from "./QuoteTable";
import ManageAggregatorForm from "&src/modules/ManageAggregrator/ManageAggregatorForm";

import { useDispatch } from "react-redux";
import { fetchApplicationDetails } from "&src/store/applicationFlowSlice";

// ✅ Conditional hook wrapper
function useConditionalAggregatorDetails(condition) {
  const details = useAggregatorDetails();
  return condition ? details : { aggregatorDetails: [], fetchAllAggregators: () => {} };
}

const AggregatorDetails = ({ customerDetails }) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const dispatch = useDispatch();
  const [openRow, setOpenRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [endDate, setEndDate] = useState(dayjs().add(2, "day"));
  const [selectedAggregators, setSelectedAggregators] = useState([]);
  const [selectedAggregatorsDetails, setSelectedAggregatorsDetails] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const [viewMode, setViewMode] = useState("all");
  const [allProjections, setAllProjections] = useState({});
  const [projectionsLoading, setProjectionsLoading] = useState(false);

  const { applicationId, aggregateDepositAmt, avgTransactionYearly, isAggregatorAdded, isQuoteAcceptRO, finalizedAggregatorId, category, avgTransactionSize } =
    customerDetails || {};

  const fetchAllProjections = useCallback(async () => {
    if (!applicationId || !selectedAggregatorsDetails?.length) return;
    setProjectionsLoading(true);
    try {
      const promises = selectedAggregatorsDetails.map(async (agg) => {
        const response = await aggregatorProjections.getAllProjections(applicationId, agg.aggregatorId);
        const calculated = response?.data?.map((row) => {
          return calculateQuoteRow(row, row?.chargesProposed, row?.unit, row?.rate);
        }) || [];
        return { aggregatorId: agg.aggregatorId, data: calculated };
      });
      const results = await Promise.all(promises);
      const mapped = {};
      results.forEach((res) => {
        mapped[res.aggregatorId] = res.data;
      });
      setAllProjections(mapped);
    } catch (err) {
      console.error("[ERROR] Failed to fetch all projections:", err);
    } finally {
      setProjectionsLoading(false);
    }
  }, [applicationId, selectedAggregatorsDetails]);

  useEffect(() => {
    if (applicationId && selectedAggregatorsDetails?.length) {
      fetchAllProjections();
    }
  }, [applicationId, selectedAggregatorsDetails, fetchAllProjections]);

  const condition = isAggregatorAdded === null && isCO;
  const { aggregatorDetails, fetchAllAggregators } = useConditionalAggregatorDetails(condition);
  const [openAddModal, setOpenAddModal] = useState(false);

  // 🔹 Manage Tabs
  const [tabValue, setTabValue] = useState("all");

  useEffect(() => {
    if (finalizedAggregatorId && isQuoteAcceptRO) {
      setTabValue("finalizedAggregator");
    } else {
      setTabValue("all");
    }
  }, [finalizedAggregatorId, isQuoteAcceptRO]);

  const handleChange = (event, newValue) => {
    setTabValue(newValue);
    setOpenRow(null)
  };

  /** 🔹 Fetch Aggregator Details */
  const fetchSelectedAggregatorDetails = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);

    try {
      const response = await aggregatorByApplication.getAllAggregatorsByApplication(applicationId);
      setSelectedAggregatorsDetails(Array.isArray(response?.data)

        ? sortAggregatorsByQuote(response?.data)
        : []);
    } catch (error) {
      console.error("[ERROR] Failed to fetch aggregators:", error);
      errorNotification(error?.response?.data?.message || "Failed to fetch aggregators");
      // fallback mock sorted data
      setSelectedAggregatorsDetails(sortAggregatorsByQuote(AGGREGRATOR_BY_APPLICATION_RESPONSE));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId && customerDetails?.isAggregatorAdded) {
      fetchSelectedAggregatorDetails();
    }
  }, [applicationId, customerDetails?.isAggregatorAdded, customerDetails?.isQuoteAcceptRO, customerDetails?.isFinalApproved, customerDetails?.finalizedAggregatorId]);

  const handleRefresh = useCallback(() => {
    fetchSelectedAggregatorDetails();
    fetchAllProjections();
  }, [fetchSelectedAggregatorDetails, fetchAllProjections]);

  /** 🔹 Send for Quote */
  const handleSendForQuote = async () => {
    if (!selectedAggregators?.length) {
      return errorNotification("Please select at least one aggregator");
    }

    try {
      setLoading(true);

      // 1️⃣ Aggregator Payload
      const aggregatorPayload = selectedAggregators.map((agg) => ({
        aggregatorId: agg.aggregatorId,
        aggregatorName: agg.aggregatorName,
        email: agg.email,
        endDate,
        applicationId,
        totalEstimatedTransactions: 0,
        totalAggregateAmount: 0,
        totalGrossAmount: 0,
        totalVendorShare: 0,
        totalExpectedRevenue: 0,
        status: "pending",
        quoteStatus: "inprogress",
        sumOfRate: 0,
        avgTransactionYearly,
        avgTransactionSize,
        category,
      }));

      const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize)
      // 2️⃣ Projection Payload
      const projectionsPayload = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly,
        aggregateDepositAmt,
        applicationId,
      });

      // 🔹 Sequential API Calls
      const aggResponse = await aggregatorByApplication.createAggregatorByApplication(applicationId, aggregatorPayload);
      if (!(aggResponse?.status === 200 || aggResponse?.status === 201)) {
        throw new Error("Failed to add aggregator");
      }

      const projResponse = await aggregatorProjections.createProjection(applicationId, projectionsPayload);
      if (!(projResponse?.status === 200 || projResponse?.status === 201)) {
        errorNotification("Failed to add projections.");
        throw new Error("Failed to add projections.");
      }

      const appResponse = await applicationServices.updateApplication(applicationId, {
        isAggregatorAdded: true,
        isReviewByCO: true,
        status: "quoterequested",
      });
      if (!(appResponse?.status === 200 || appResponse?.status === 201)) {
        errorNotification("Failed to update application status.");
        throw new Error("Failed to update application status.");
      }

      successNotification("Aggregators & Projections added successfully");
      fetchSelectedAggregatorDetails();
      if (applicationId) {
        dispatch(fetchApplicationDetails(applicationId));
      }
    } catch (err) {
      setLoading(false);
      errorNotification(err?.response?.data?.message || err.message || "Something went wrong.");
    }
  };


  const sortAggregator = (data) => {
    return [...data]?.sort((a, b) => {
      //Submitted first
      if (a.status === 'submitted' && b.status !== 'submitted') return -1;
      if (a.status !== 'submitted' && b.status === 'submitted') return 1;
      // Revenue sorting (high -> low)
      return (b.totalExpectedRevenue || 0) - (a.totalExpectedRevenue || 0)
    })
  }

  /** 🔹 Filter finalized aggregator if exists */
  const filteredAggregators =
    tabValue === "finalizedAggregator" && finalizedAggregatorId

      ? sortAggregator(selectedAggregatorsDetails.filter((agg) => agg.aggregatorId === customerDetails.finalizedAggregatorId))

      : sortAggregator(selectedAggregatorsDetails);

  return (
    <Box>
      {loading && <FullScreenLoader />}

      {/* ➤ Add Aggregator Section */}
      {condition && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              Add Aggregator for Quote

              <Button
                variant="outlined"
                className="ml-2"
                startIcon={<Add />}
                onClick={() => setOpenAddModal(true)}
              >
                Add New Aggregator
              </Button>
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <DatePicker disablePast value={endDate} onChange={setEndDate} />
              <Tooltip title="Choose the desired end date for quotation submission" arrow placement="top">
                <IconButton size="small">
                  <InfoOutlined color="primary" />
                </IconButton>
              </Tooltip>
              <Button variant="contained" endIcon={<Send />} onClick={handleSendForQuote}>
                Send for Quote
              </Button>
            </Stack>
          </Box>

          <DataGrid
            checkboxSelection
            columns={MANAGE_AGGREGATOR_TABLE_COLUMNS}
            rows={aggregatorDetails || []}
            getRowId={(row) => row.aggregatorId}
            hideFooter
            onRowSelectionModelChange={(selectionModel) => {
              setSelectedAggregators(
                aggregatorDetails.filter((row) => selectionModel.includes(row.aggregatorId))
              );
            }}
          />
        </Box>
      )}

      {/* dialog for adding a brand new aggregator */}
      <DialogWithHeader
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        maxWidth="sm"
        headerText="Add New Aggregator"
      >
        <ManageAggregatorForm
          fetchAllAggregators={fetchAllAggregators}
          handleClose={() => setOpenAddModal(false)}
          formClosed={openAddModal}
        />
      </DialogWithHeader>

      {/* ➤ Added Aggregators Section */}
      {customerDetails?.isAggregatorAdded && isCO && (
        <Box sx={{ mt: 2 }}>
          <Box display='flex' justifyContent='space-between' m={2} alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              {!customerDetails?.isFinalApproved && (
                <Tabs
                  value={viewMode}
                  onChange={(e, val) => setViewMode(val)}
                  size="small"
                  sx={{
                    minHeight: "32px",
                    "& .MuiTab-root": {
                      minHeight: "32px",
                      py: 0.5,
                      fontSize: "12px",
                      textTransform: "none",
                      fontWeight: 600,
                    }
                  }}
                >
                  <Tab value="all" label="View All Aggregators (Side-by-Side)" />
                  <Tab value="aggregator" label="Aggregator View" />
                </Tabs>
              )}
            </Box>
            <Box>
              {!customerDetails?.isFinalApproved &&
                <>
                  <Button startIcon={<CurrencyRupee />} variant="outlined" onClick={() => setOpenModal(!openModal)}>
                    Add Charges
                  </Button>
                  <Tooltip title="Add Charges as per projection details" placement="top" arrow>
                    <IconButton size="small">
                      <InfoOutlined color="primary" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            </Box>
          </Box>

          {customerDetails?.isFinalApproved || viewMode === "all" ? (
            <CompareAggregatorsTable
              filteredAggregators={sortAggregator(selectedAggregatorsDetails)}
              allProjections={allProjections}
              projectionsLoading={projectionsLoading}
              finalizedAggregatorId={finalizedAggregatorId}
              customerDetails={customerDetails}
            />
          ) : (
            <>
              {/* Tabs visible only if finalizedAggregatorId exists */}
              {finalizedAggregatorId && isQuoteAcceptRO && (
                <Tabs
                  variant="fullWidth"
                  value={tabValue}
                  onChange={handleChange}
                  aria-label="Aggregator Process Tabs"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: 2,
                    p: 0.5,
                    ".MuiTab-root": {
                      borderRadius: 1,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#555",
                      minHeight: "40px",
                      px: 2,
                      "&:hover": {
                        backgroundColor: "#e0e0e0",
                      },
                      "&.Mui-selected": {
                        border: finalizedAggregatorId && tabValue === 'finalizedAggregator'
                          ? "1px solid green"
                          : "1px solid blue",
                        backgroundColor: finalizedAggregatorId && tabValue === 'finalizedAggregator'
                          ? "rgba(144, 238, 144, 0.3)"
                          : "rgba(173, 216, 230, 0.3)",
                        color: finalizedAggregatorId && tabValue === 'finalizedAggregator' ? "green" : "blue",
                      },
                    },
                    gap: 1,
                    "& .MuiTabs-flexContainer": { justifyContent: "center", gap: "8px" },
                  }}
                >
                  <Tab
                    icon={<CheckCircle />}
                    iconPosition="start"
                    label="Finalized Aggregator"
                    value="finalizedAggregator"
                  />
                  <Tab
                    icon={<Gavel />}
                    iconPosition="start"
                    label="All Selected Aggregators"
                    value="selectedAggregators"
                  />
                </                Tabs>
              )}

              <Box sx={{ width: "100%", overflow: "hidden", mt: 1 }}>
                <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      {AGGREGATOR_COLUMNS.map((col, idx) => (
                        <TableCell key={idx} sx={{ fontWeight: 700, fontSize: "11px", py: "8px !important", px: "6px !important", whiteSpace: "normal !important", wordBreak: "break-word", lineHeight: 1.1, verticalAlign: "top", textTransform: "none !important" }}>{col}</TableCell>
                      ))}
                      <TableCell sx={{ fontWeight: 700, fontSize: "11px", py: "8px !important", px: "6px !important", whiteSpace: "normal !important", wordBreak: "break-word", lineHeight: 1.1, verticalAlign: "top", textTransform: "none !important" }}>Quote Submission</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {(() => {
                      const submittedAggs = [...selectedAggregatorsDetails]
                        .filter(agg => agg.status === "submitted" && Number(agg.totalVendorShare) > 0)
                        .sort((a, b) => Number(a.totalVendorShare) - Number(b.totalVendorShare));

                      return filteredAggregators.map((agg, idx) => {
                        const isOpen = openRow === agg.aggregatorId;
                        const cellSx = { fontSize: "11px", p: "6px", whiteSpace: "normal", wordBreak: "break-word" };
                        return (
                          <React.Fragment key={agg.aggregatorId || idx}>
                            <TableRow sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
                              <TableCell sx={cellSx}>{idx + 1}</TableCell>
                              <TableCell sx={cellSx}>{`AGG000${agg.aggregatorId || idx + 1}`}</TableCell>
                              <TableCell sx={cellSx}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {agg.aggregatorName}
                                  {(() => {
                                    const isAccepted = customerDetails?.isQuoteAcceptRO;
                                    const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                                    const rankIndex = submittedAggs.findIndex(a => a.aggregatorId === agg.aggregatorId) + 1;
                                    
                                    if (rankIndex > 0) {
                                      if (isAccepted) {
                                        if (isFinalized) {
                                          return (
                                            <span style={{ fontSize: "9px", backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, border: "1px solid #bbf7d0" }}>
                                              Finalized
                                            </span>
                                          );
                                        }
                                      } else {
                                        return (
                                          <span style={{ 
                                            fontSize: "9px", 
                                            backgroundColor: rankIndex === 1 ? "#dcfce7" : "#f1f5f9", 
                                            color: rankIndex === 1 ? "#15803d" : "#475569", 
                                            padding: "2px 6px", 
                                            borderRadius: "4px", 
                                            fontWeight: 700, 
                                            border: rankIndex === 1 ? "1px solid #bbf7d0" : "1px solid #cbd5e1" 
                                          }}>
                                            {rankIndex === 1 ? "Lowest Quote (L1)" : `L${rankIndex}`}
                                          </span>
                                        );
                                      }
                                    }
                                    return null;
                                  })()}
                                </Box>
                              </TableCell>
                            <EndAlignedCell sx={cellSx}>{agg.totalGrossAmount}</EndAlignedCell>
                            <EndAlignedCell sx={cellSx}>{agg.totalVendorShare}</EndAlignedCell>
                            <EndAlignedCell sx={cellSx}>{agg.totalExpectedRevenue}</EndAlignedCell>
                            <TableCell sx={cellSx}>
                              <CenterAlign>
                                <StatusChipOrSelect value={agg.quoteStatus} type="status" />
                              </CenterAlign>
                            </TableCell>
                            <TableCell sx={cellSx}>
                              <CenterAlign>
                                <StatusChipOrSelect value={agg.status} type="status" />
                              </CenterAlign>
                            </TableCell>
                            <TableCell align="center" sx={{ p: "4px" }}>
                              <IconButton
                                size="small"
                                onClick={() => setOpenRow(isOpen ? null : agg.aggregatorId)}
                              >
                                {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                              </IconButton>
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell
                              colSpan={AGGREGATOR_COLUMNS?.length + (customerDetails?.isFinalApproved ? 6 : 3)}
                              sx={{ p: 0, maxWidth: "100%", overflow: "hidden" }}
                            >
                              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box sx={{ width: "100%", overflow: "hidden", p: 1, bgcolor: "#f8fafc" }}>
                                  <QuoteTable
                                    applicationDetails={customerDetails}
                                    aggregatorId={agg.aggregatorId}
                                    aggregatorName={agg.aggregatorName}
                                    isRateAdded={Boolean(agg.sumOfRate)}
                                    onSaveSuccess={handleRefresh}
                                  />
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    });
                  })()}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </Box>
      )}
      <AddCharges openModal={openModal} setOpenModal={setOpenModal} applicationDetails={customerDetails} onSaveSuccess={handleRefresh} />
    </Box>
  );
};

const CompareAggregatorsTable = ({ filteredAggregators, allProjections, projectionsLoading, finalizedAggregatorId, customerDetails }) => {
  if (projectionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography variant="body2" color="text.secondary">Loading comparative quote analysis...</Typography>
      </Box>
    );
  }

  const activeAggs = filteredAggregators.filter(agg => allProjections[agg.aggregatorId]?.length > 0);

  if (!activeAggs.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} border="1px dashed #cbd5e1" borderRadius="8px" bgcolor="#f8fafc" m={2}>
        <Typography variant="body2" color="text.secondary">No quotation projections loaded yet.</Typography>
      </Box>
    );
  }

  const baseRows = allProjections[activeAggs[0].aggregatorId] || [];

  // Calculate totals for each aggregator
  const aggregatorTotals = {};
  activeAggs.forEach((agg) => {
    aggregatorTotals[agg.aggregatorId] = calculateTotals(allProjections[agg.aggregatorId] || []);
  });

  const baseTotals = calculateTotals(baseRows);

  const sortedActiveAggs = [...activeAggs].sort((a, b) => {
    const shareA = aggregatorTotals[a.aggregatorId]?.totalVendorShare || 0;
    const shareB = aggregatorTotals[b.aggregatorId]?.totalVendorShare || 0;
    return shareA - shareB;
  });

  let serialNo = 0;

  const handleExportExcel = () => {
    const data = [];
    
    // Title
    data.push([`Cost Benefit Analysis for ${customerDetails?.customerName || "Customer"}`]);
    data.push([]);
    
    // Headers
    const headers = [
      "% Share Txn Count",
      "% Share Txn Value",
      "Type of Transaction",
      "Estimated No of Transactions",
      "Aggregate amount (Rs)",
      "Charges proposed",
      "Gross Amount Received (Rs)"
    ];
    
    activeAggs.forEach(agg => {
      const isAccepted = customerDetails?.isQuoteAcceptRO;
      const label = finalizedAggregatorId 
        ? ((Number(agg.aggregatorId) === Number(finalizedAggregatorId) && isAccepted) ? `${agg.aggregatorName} (FINALIZED)` : `${agg.aggregatorName} (REJECTED)`)
        : agg.aggregatorName;
      headers.push(`${label} - Rate`);
      headers.push(`${label} - Vendor Share (Rs)`);
      headers.push(`${label} - Expected Revenue (Rs)`);
    });
    
    data.push(headers);
    
    // Data Rows
    baseRows.forEach(row => {
      const rowData = [
        row.transactionCount ? `${row.transactionCount}%` : "",
        row.transactionValue ? `${row.transactionValue}%` : "",
        row.transactionType,
        Math.round(row.estimatedTransactions) || 0,
        row.aggregateAmount || 0,
        row.chargesProposed || 0,
        row.grossAmount || 0
      ];
      
      activeAggs.forEach(agg => {
        const aggProjList = allProjections[agg.aggregatorId] || [];
        const aggRow = aggProjList.find(r => r.transactionType === row.transactionType) || {};
        rowData.push(aggRow.rate || 0);
        rowData.push(aggRow.vendorShare || 0);
        rowData.push(aggRow.expectedRevenue || 0);
      });
      
      data.push(rowData);
    });
    
    // Totals
    const totalsRow = [
      "",
      "",
      "TOTAL",
      baseTotals.totalEstimatedTransactions,
      baseTotals.totalAggregateAmount,
      "",
      baseTotals.totalGrossAmount
    ];
    
    activeAggs.forEach(agg => {
      const totals = aggregatorTotals[agg.aggregatorId] || {};
      totalsRow.push("");
      totalsRow.push(totals.totalVendorShare || 0);
      totalsRow.push(totals.totalExpectedRevenue || 0);
    });
    
    data.push(totalsRow);
    
    // Create Excel
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cost Benefit Analysis");
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}.xlsx`);
  };
  const cbaTableRef = React.useRef(null);

  const handleExportPDF = async () => {
    try {
      const element = cbaTableRef.current;
      const oldBg = element.style.background;
      element.style.background = "#ffffff";
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      element.style.background = oldBg;
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      const pdfWidth = pageWidth - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
      pdf.save(`Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}.pdf`);
    } catch (err) {
      console.error("PDF generation error: ", err);
    }
  };

  const headerCellSx = {
    fontWeight: 700,
    fontSize: "10px",
    py: "6px !important",
    px: "4px !important",
    color: "#ffffff",
    bgcolor: "#1e293b",
    whiteSpace: "normal !important",
    wordBreak: "break-word",
    lineHeight: 1.1,
    verticalAlign: "top",
    textTransform: "none !important",
    border: "1px solid #334155"
  };

  const subHeaderCellSx = {
    fontWeight: 700,
    fontSize: "9px",
    py: "4px !important",
    px: "3px !important",
    color: "#475569",
    bgcolor: "#f1f5f9",
    whiteSpace: "normal !important",
    wordBreak: "break-word",
    lineHeight: 1.1,
    verticalAlign: "top",
    textTransform: "none !important",
    border: "1px solid #cbd5e1"
  };

  const cellSx = {
    fontSize: "10px",
    p: "4px !important",
    whiteSpace: "normal",
    wordBreak: "break-word",
    border: "1px solid #e2e8f0"
  };

  const totalCellSx = {
    fontWeight: 700,
    fontSize: "10px",
    p: "4px !important",
    bgcolor: "#f8fafc",
    border: "1px solid #cbd5e1"
  };

  const isAccepted = customerDetails?.isQuoteAcceptRO;

  return (
    <Box sx={{ width: "100%", mt: 2, p: 2 }}>
      {/* Downloader & Legend Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, bgcolor: "#f8fafc", p: 1.5, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {isAccepted && finalizedAggregatorId ? (
            <span>
              ℹ️ Color Legend: <strong style={{ color: "#16a34a" }}>Green columns</strong> represent the Finalized Aggregator. <strong style={{ color: "#dc2626" }}>Red columns</strong> represent other rejected aggregators.
            </span>
          ) : (
            <span>
              ℹ️ Quote Rank Legend: L1 represents the lowest quote based on vendor share, followed by L2, L3. Color highlighting applies once customer acceptance is completed.
            </span>
          )}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Download />}
            onClick={handleExportExcel}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Download Excel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Download />}
            onClick={handleExportPDF}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Download PDF
          </Button>
        </Stack>
      </Box>

      <Box ref={cbaTableRef} sx={{ p: 1, bgcolor: "#ffffff" }}>
        <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
          <Table size="small" sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
            <TableHead>
              {/* Row 1: Aggregator Headers */}
              <TableRow>
                <TableCell colSpan={7} sx={headerCellSx} align="center">
                  Cost Benefit Analysis for Payment Aggregation (Online)
                </TableCell>
                {activeAggs.map((agg) => {
                  const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                  const headerBg = isAccepted
                    ? (isFinalized ? "#16a34a" : "#dc2626") 
                    : "#0f766e";
                  const rankIndex = sortedActiveAggs.findIndex(a => a.aggregatorId === agg.aggregatorId) + 1;
                  const rankLabel = rankIndex > 0 ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}` : "";
                  return (
                    <TableCell key={agg.aggregatorId} colSpan={3} sx={{ ...headerCellSx, bgcolor: headerBg, border: `1px solid ${headerBg}` }} align="center">
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: "10px" }}>{agg.aggregatorName}</Typography>
                        <Typography sx={{ fontSize: "9px", opacity: 0.95, fontWeight: 600 }}>
                          {isAccepted 
                            ? (isFinalized ? "(Selected)" : "(Rejected)")
                            : `(${rankLabel})`
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
              {/* Row 2: Sub-headers */}
              <TableRow>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "100px" }}>% Share Transaction Count</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "100px" }}>% Share Transaction Value</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "150px" }}>Type of Transaction</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "110px" }}>Estimated No of Transactions</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "120px" }}>Aggregate amount (Rs)</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "100px" }}>Charges proposed</TableCell>
                <TableCell sx={{ ...subHeaderCellSx, minWidth: "140px" }}>Gross Amount Received from Charges (Rs)</TableCell>
                {activeAggs.map((agg) => {
                  const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                  const subHeaderBg = isAccepted 
                    ? (isFinalized ? "#dcfce7" : "#fee2e2") 
                    : "#ccfbf1";
                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "80px" }}>Rate</TableCell>
                      <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "90px" }}>Vendor Share (Rs)</TableCell>
                      <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "100px" }}>Expected Revenue (Rs)</TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
        </TableHead>
        <TableBody>
          {baseRows.map((row, idx) => {
            const isSubBank = row.isIB;
            if (!isSubBank) serialNo += 1;

            return (
              <TableRow key={idx} sx={{ "&:hover": { bgcolor: "#f8fafc" }, bgcolor: isSubBank ? "#fdfdfd" : "transparent" }}>
                {/* Count % */}
                <TableCell sx={cellSx} align="right">
                  {isSubBank ? "" : (row.transactionCount ? `${row.transactionCount}%` : "")}
                </TableCell>
                {/* Value % */}
                <TableCell sx={cellSx} align="right">
                  {isSubBank ? "" : (row.transactionValue ? `${row.transactionValue}%` : "")}
                </TableCell>
                {/* Type of Transaction */}
                <TableCell sx={{ ...cellSx, pl: isSubBank ? 3 : 1, fontStyle: isSubBank ? "italic" : "normal", color: isSubBank ? "#64748b" : "inherit" }}>
                  {row.transactionType}
                  {row.transactionTypePercent && isSubBank ? ` (${row.transactionTypePercent})` : ""}
                </TableCell>
                {/* Estimated Txns */}
                <TableCell sx={cellSx} align="right">
                  {Math.round(row.estimatedTransactions) || "0"}
                </TableCell>
                {/* Aggregate Amount */}
                <TableCell sx={cellSx} align="right">
                  {formatNumber(row.aggregateAmount)}
                </TableCell>
                {/* Charges Proposed */}
                <TableCell sx={cellSx} align="right">
                  {row.allow ? (row.unit === PERCENTAGE ? `${row.chargesProposed}${PERCENTAGE}` : `${row.chargesProposed}`) : ""}
                </TableCell>
                {/* Gross Amount Received */}
                <TableCell sx={cellSx} align="right">
                  {row.allow ? formatNumber(row.grossAmount) : ""}
                </TableCell>

                {/* Aggregators Data */}
                {activeAggs.map((agg) => {
                  const aggProjList = allProjections[agg.aggregatorId] || [];
                  const aggRow = aggProjList.find(r => r.transactionType === row.transactionType) || {};
                  const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                  const columnBg = finalizedAggregatorId
                    ? (isFinalized ? "#f0fdf4" : "#f0fdfa") 
                    : "#f0fdfa";
                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
                        {aggRow.allow && aggRow.rate !== undefined ? (aggRow.unit === PERCENTAGE ? `${aggRow.rate}${PERCENTAGE}` : `${aggRow.rate}`) : ""}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
                        {aggRow.allow ? formatNumber(aggRow.vendorShare) : ""}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
                        {aggRow.allow ? formatNumber(aggRow.expectedRevenue) : ""}
                      </TableCell>
                    </React.Fragment>
                  );
                })}
              </TableRow>
            );
          })}

          {/* Totals Row */}
          <TableRow>
            <TableCell colSpan={3} sx={{ ...totalCellSx }} align="center">TOTAL</TableCell>
            <TableCell sx={totalCellSx} align="right">
              {baseTotals.totalEstimatedTransactions}
            </TableCell>
            <TableCell sx={totalCellSx} align="right">
              {formatNumber(baseTotals.totalAggregateAmount)}
            </TableCell>
            <TableCell sx={totalCellSx}></TableCell>
            <TableCell sx={totalCellSx} align="right">
              {formatNumber(baseTotals.totalGrossAmount)}
            </TableCell>
            {activeAggs.map((agg) => {
              const totals = aggregatorTotals[agg.aggregatorId] || {};
              const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
              const totalsBg = finalizedAggregatorId
                ? (isFinalized ? "#dcfce7" : "#e6f4f1") 
                : "#e6f4f1";
              return (
                <React.Fragment key={agg.aggregatorId}>
                  <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }}></TableCell>
                  <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }} align="right">
                    {formatNumber(totals.totalVendorShare)}
                  </TableCell>
                  <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }} align="right">
                    {formatNumber(totals.totalExpectedRevenue)}
                  </TableCell>
                </React.Fragment>
              );
            })}
          </TableRow>
        </TableBody>
      </Table>
      </TableContainer>
      </Box>
    </Box>
  );
};

export default AggregatorDetails;
