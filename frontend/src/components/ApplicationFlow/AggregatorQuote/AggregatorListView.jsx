import React from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography
} from "@mui/material";
import {
  CurrencyRupee,
  ForwardOutlined,
  ForwardToInboxOutlined,
  RateReview,
  Visibility,
  VisibilityOff
} from "@mui/icons-material";

import { AGGREGATOR_COLUMNS } from "&src/constants/PaymentAggregratorConstant";
import { formatNumber } from "&src/utils";
import CenterAlign from "&src/components/CenterAlign";
import EndAlignedCell from "&src/components/EndAlignedCell";
import StatusChipOrSelect from "&src/components/StatusChipOrSelect";
import QuoteTable from "../QuoteTable";
import GetRates from "../GetRates";

const AggregatorListView = ({
  filteredAggregators = [],
  selectedAggregatorsDetails = [],
  allProjections = {},
  openRow,
  setOpenRow,
  finalizedAggregatorId,
  customerDetails = {},
  isReadOnlyUser = false,
  isRejected = false,
  resendingAggId,
  forwardingAggId,
  onResendQuoteEmail,
  onOpenAcceptanceModal,
  onRefresh
}) => {
  const [modalAggregator, setModalAggregator] = React.useState(null);
  const [rateModalAggregator, setRateModalAggregator] = React.useState(null);

  const submittedAggs = React.useMemo(() => {
    return [...selectedAggregatorsDetails]
      .filter((agg) => {
        const projs = allProjections[agg.aggregatorId] || [];
        const calcShare = projs.reduce(
          (sum, r) => sum + (Number(r.vendorShare) || 0),
          0
        );
        const share = calcShare > 0 ? calcShare : Number(agg.totalVendorShare || 0);
        return share > 0 || (agg.status === "submitted" && Number(agg.sumOfRate) > 0);
      })
      .sort((a, b) => {
        const projsA = allProjections[a.aggregatorId] || [];
        const projsB = allProjections[b.aggregatorId] || [];
        const calcShareA = projsA.reduce(
          (sum, r) => sum + (Number(r.vendorShare) || 0),
          0
        );
        const calcShareB = projsB.reduce(
          (sum, r) => sum + (Number(r.vendorShare) || 0),
          0
        );
        const shareA = calcShareA > 0 ? calcShareA : Number(a.totalVendorShare || 0);
        const shareB = calcShareB > 0 ? calcShareB : Number(b.totalVendorShare || 0);
        return shareA - shareB;
      });
  }, [selectedAggregatorsDetails, allProjections]);

  const renderFormattedHeader = (col) => {
    const colLower = (col || "").toLowerCase();
    if (colLower.includes("gross")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.15 }}>
          <span>Total Gross</span>
          <span>Amount</span>
        </Box>
      );
    }
    if (colLower.includes("vendor") || colLower.includes("share")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.15 }}>
          <span>Total Vendor</span>
          <span>Share</span>
        </Box>
      );
    }
    if (colLower.includes("revenue")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1.15 }}>
          <span>Total Expected</span>
          <span>Revenue</span>
        </Box>
      );
    }
    if (colLower.includes("code")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
          <span>Aggregator</span>
          <span>Code</span>
        </Box>
      );
    }
    if (colLower.includes("name")) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.15 }}>
          <span>Aggregator</span>
          <span>Name</span>
        </Box>
      );
    }
    if (colLower.includes("quote status") || (colLower.includes("quote") && colLower.includes("status"))) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
          <span>Quote</span>
          <span>Status</span>
        </Box>
      );
    }
    return col;
  };

  if (!filteredAggregators || filteredAggregators.length === 0) {
    return (
      <TableContainer sx={{ borderRadius: "0px" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow sx={{ background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%) !important", borderBottom: "2px solid #062545" }}>
              {AGGREGATOR_COLUMNS.map((col, idx) => (
                <TableCell
                  key={idx}
                  sx={{
                    fontWeight: 700,
                    fontSize: "11px",
                    py: "10px !important",
                    px: "8px !important",
                    color: "#ffffff !important",
                    whiteSpace: "normal !important",
                    wordBreak: "normal !important",
                    overflowWrap: "normal !important",
                    border: "1px solid rgba(255, 255, 255, 0.25) !important",
                    borderBottom: "2px solid #062545 !important"
                  }}
                >
                  {renderFormattedHeader(col)}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "11px", color: "#ffffff !important" }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
                  <span>Quote</span>
                  <span>Submission</span>
                </Box>
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "11px", color: "#ffffff !important" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "#64748b", fontSize: "13px" }}>
                No aggregators added yet for this application.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <>
      <TableContainer sx={{ borderRadius: "0px" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow
              sx={{
                background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%) !important",
                borderBottom: "2px solid #062545"
              }}
            >
              {AGGREGATOR_COLUMNS.map((col, idx) => {
                const isRight =
                  col.includes("Gross") ||
                  col.includes("Share") ||
                  col.includes("Revenue");
                const isCenter = col.includes("Status") || col.includes("Sr");
                const isSrNo = col.includes("Sr");
                return (
                  <TableCell
                    key={idx}
                    align={isRight ? "right" : isCenter ? "center" : "left"}
                    sx={{
                      fontWeight: 700,
                      fontSize: "11px",
                      py: "10px !important",
                      px: "8px !important",
                      color: "#ffffff !important",
                      background: "transparent !important",
                      whiteSpace: isSrNo ? "nowrap !important" : "normal !important",
                      wordBreak: "normal !important",
                      overflowWrap: "normal !important",
                      minWidth: isSrNo ? "45px" : "80px",
                      lineHeight: 1.2,
                      verticalAlign: "middle",
                      textTransform: "none !important",
                      border: "1px solid rgba(255, 255, 255, 0.25) !important",
                      borderBottom: "2px solid #062545 !important"
                    }}
                  >
                    {renderFormattedHeader(col)}
                  </TableCell>
                );
              })}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: "11px",
                  py: "10px !important",
                  px: "8px !important",
                  color: "#ffffff !important",
                  background: "transparent !important",
                  whiteSpace: "nowrap !important",
                  lineHeight: 1.2,
                  verticalAlign: "middle",
                  textTransform: "none !important",
                  minWidth: "100px"
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.15 }}>
                  <span>Quote</span>
                  <span>Submission</span>
                </Box>
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  fontSize: "11px",
                  py: "10px !important",
                  px: "8px !important",
                  color: "#ffffff !important",
                  background: "transparent !important",
                  whiteSpace: "nowrap !important",
                  lineHeight: 1.2,
                  verticalAlign: "middle",
                  textTransform: "none !important",
                  minWidth: "120px"
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAggregators.map((agg, idx) => {
            const isOpen = openRow === agg.aggregatorId;
            const cellSx = {
              fontSize: "11px",
              p: "8px",
              whiteSpace: "normal",
              wordBreak: "break-word",
              color: "#334155",
              borderColor: "#f1f5f9"
            };

            const aggProjs = allProjections[agg.aggregatorId] || [];
            const calcGross = aggProjs.reduce(
              (sum, r) => sum + (Number(r.grossAmount) || 0),
              0
            );
            const calcVendor = aggProjs.reduce(
              (sum, r) => sum + (Number(r.vendorShare) || 0),
              0
            );
            const calcRev = aggProjs.reduce(
              (sum, r) => sum + (Number(r.expectedRevenue) || 0),
              0
            );

            const hasRates = Boolean(
              aggProjs.some((p) => Number(p.rate) > 0) ||
                Number(agg.sumOfRate) > 0 ||
                Number(agg.totalVendorShare) > 0 ||
                calcVendor > 0
            );
            const displayGross = hasRates
              ? calcGross > 0
                ? calcGross
                : agg.totalGrossAmount || 0
              : 0;
            const displayVendor = hasRates
              ? calcVendor > 0
                ? calcVendor
                : agg.totalVendorShare || 0
              : 0;
            const displayRevenue = hasRates
              ? calcRev !== 0
                ? calcRev
                : agg.totalExpectedRevenue || displayGross - displayVendor
              : 0;

            const isAccepted = customerDetails?.isQuoteAcceptRO;
            const isFinalized =
              finalizedAggregatorId &&
              Number(agg.aggregatorId) === Number(finalizedAggregatorId);
            const rankIndex =
              submittedAggs.findIndex(
                (a) => a.aggregatorId === agg.aggregatorId
              ) + 1;

            return (
              <React.Fragment key={agg.aggregatorId || idx}>
                <TableRow
                  sx={{
                    "&:hover": { bgcolor: "#f8fafc" },
                    bgcolor: isOpen ? "#f1f5f9" : "transparent",
                    transition: "background-color 0.2s"
                  }}
                >
                  <TableCell sx={cellSx}>{idx + 1}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>
                    {`AGG000${agg.aggregatorId || idx + 1}`}
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "11px",
                          color: "#0f172a"
                        }}
                      >
                        {agg.aggregatorName}
                      </Typography>
                      {rankIndex > 0 ? (
                        isAccepted ? (
                          isFinalized ? (
                            <span
                              style={{
                                fontSize: "9px",
                                backgroundColor: "#dcfce7",
                                color: "#15803d",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontWeight: 700,
                                border: "1px solid #bbf7d0"
                              }}
                            >
                              Finalized
                            </span>
                          ) : null
                        ) : (
                          <span
                            style={{
                              fontSize: "9px",
                              backgroundColor:
                                rankIndex === 1 ? "#dcfce7" : "#f1f5f9",
                              color:
                                rankIndex === 1 ? "#15803d" : "#475569",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              border:
                                rankIndex === 1
                                  ? "1px solid #bbf7d0"
                                  : "1px solid #cbd5e1"
                            }}
                          >
                            {rankIndex === 1
                              ? "Lowest Quote (L1)"
                              : `L${rankIndex}`}
                          </span>
                        )
                      ) : (
                        <span
                          style={{
                            fontSize: "9px",
                            backgroundColor: "#fffbeb",
                            color: "#b45309",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 700,
                            border: "1px solid #fde68a"
                          }}
                        >
                          Pending Quote
                        </span>
                      )}
                    </Box>
                  </TableCell>

                  <EndAlignedCell sx={cellSx}>
                    {formatNumber(displayGross)}
                  </EndAlignedCell>
                  <EndAlignedCell sx={cellSx}>
                    {formatNumber(displayVendor)}
                  </EndAlignedCell>
                  <EndAlignedCell sx={cellSx}>
                    {formatNumber(displayRevenue)}
                  </EndAlignedCell>

                  <TableCell sx={cellSx}>
                    <CenterAlign>
                      <StatusChipOrSelect
                        value={agg.quoteStatus}
                        type="status"
                      />
                    </CenterAlign>
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <CenterAlign>
                      <StatusChipOrSelect value={agg.status} type="status" />
                    </CenterAlign>
                  </TableCell>

                  <TableCell sx={cellSx}>
                    <CenterAlign>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={0.8}
                      >
                        {!isRejected && !isReadOnlyUser && !hasRates && agg.status !== "submitted" && (
                          <Tooltip
                            title={
                              customerDetails?.status === "negotiation_requested"
                                ? `Dispatch revised quote request to ${agg.aggregatorName} with negotiation feedback`
                                : "Send for quotes"
                            }
                            arrow
                            placement="top"
                          >
                            <IconButton
                              size="small"
                              disabled={resendingAggId === agg.aggregatorId}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onResendQuoteEmail) onResendQuoteEmail(agg);
                              }}
                              sx={{
                                width: 28,
                                height: 28,
                                p: "4px",
                                border:
                                  customerDetails?.status ===
                                  "negotiation_requested"
                                    ? "1px solid #f59e0b"
                                    : "1px solid #bae6fd",
                                borderRadius: "6px",
                                bgcolor:
                                  customerDetails?.status ===
                                  "negotiation_requested"
                                    ? "#fffbeb"
                                    : "#f0f9ff",
                                "&:hover": {
                                  bgcolor:
                                    customerDetails?.status ===
                                    "negotiation_requested"
                                      ? "#fef3c7"
                                      : "#e0f2fe"
                                }
                              }}
                            >
                              {resendingAggId === agg.aggregatorId ? (
                                <CircularProgress size={14} />
                              ) : (
                                <ForwardToInboxOutlined
                                  sx={{
                                    fontSize: 16,
                                    color:
                                      customerDetails?.status ===
                                      "negotiation_requested"
                                        ? "#d97706"
                                        : "#0284c7"
                                  }}
                                />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}

                        {!isRejected && !isReadOnlyUser && !hasRates && (
                          <Tooltip
                            title="Add Rates for this Aggregator"
                            arrow
                            placement="top"
                          >
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRateModalAggregator(agg);
                              }}
                              sx={{
                                width: 28,
                                height: 28,
                                p: "4px",
                                border: "1px solid #fed7aa",
                                borderRadius: "6px",
                                bgcolor: "#fff7ed",
                                color: "#ea580c",
                                "&:hover": {
                                  bgcolor: "#ffedd5",
                                  color: "#c2410c"
                                }
                              }}
                            >
                              <RateReview sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip
                          title="View Projection Details (Full Screen Modal)"
                          arrow
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={() => setModalAggregator(agg)}
                            sx={{
                              width: 28,
                              height: 28,
                              p: "4px",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              bgcolor: modalAggregator?.aggregatorId === agg.aggregatorId ? "#f0fdf4" : "#ffffff",
                              color: modalAggregator?.aggregatorId === agg.aggregatorId ? "#16a34a" : "#475569",
                              "&:hover": {
                                bgcolor: "#dcfce7",
                                color: "#16a34a"
                              }
                            }}
                          >
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        {hasRates &&
                          !customerDetails?.isFinalApproved &&
                          !customerDetails?.isQuoteReviewCO &&
                          !isReadOnlyUser &&
                          !isRejected && (
                            <Tooltip
                              title="Forward for Customer Acceptance / Set Waiver"
                              arrow
                              placement="top"
                            >
                              <IconButton
                                size="small"
                                disabled={forwardingAggId === agg.aggregatorId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenAcceptanceModal) {
                                    onOpenAcceptanceModal(agg);
                                  }
                                }}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  p: "4px",
                                  border: "1px solid #bbf7d0",
                                  borderRadius: "6px",
                                  bgcolor: "#f0fdf4",
                                  color: "#16a34a",
                                  "&:hover": {
                                    bgcolor: "#dcfce7",
                                    color: "#15803d"
                                  }
                                }}
                              >
                                {forwardingAggId === agg.aggregatorId ? (
                                  <CircularProgress
                                    size={14}
                                    color="inherit"
                                  />
                                ) : (
                                  <ForwardOutlined sx={{ fontSize: 16 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                      </Box>
                    </CenterAlign>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Rate Modal for selected Aggregator */}
    {Boolean(rateModalAggregator) && (
      <GetRates
        openModal={Boolean(rateModalAggregator)}
        setOpenModal={(val) => {
          if (!val) setRateModalAggregator(null);
        }}
        applicationDetails={customerDetails}
        aggregatorId={rateModalAggregator?.aggregatorId}
        aggregatorName={rateModalAggregator?.aggregatorName}
        quoteDetails={
          rateModalAggregator
            ? allProjections[rateModalAggregator.aggregatorId] || []
            : []
        }
        onSaveSuccess={onRefresh}
      />
    )}

    {/* Full Screen Quote Details Dialog opened directly on View Click */}
    {Boolean(modalAggregator) && (
      <QuoteTable
        applicationDetails={customerDetails}
        aggregatorId={modalAggregator.aggregatorId}
        aggregatorName={modalAggregator.aggregatorName}
        isRateAdded={Boolean(modalAggregator.sumOfRate)}
        onSaveSuccess={onRefresh}
        initialFullScreen={true}
        onCloseModal={() => setModalAggregator(null)}
      />
    )}
  </>
  );
};

export default AggregatorListView;
