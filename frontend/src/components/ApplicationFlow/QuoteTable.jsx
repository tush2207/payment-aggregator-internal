import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  TableContainer,
  Paper
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  isCO,
  isRO,
  PROJECTION_COLUMNS_FOR_CO,
  user_Id
} from "&src/constants/PaymentAggregratorConstant";
import usePOGenerator from "&src/hooks/usePOGenerator";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { formatNumber, PERCENTAGE, RS } from "&src/utils";
import { calculateQuoteRow, calculateTotals } from "&src/utils/calculation";
import { CurrencyRupee, ForwardOutlined, InfoOutlined } from "@mui/icons-material";
import EndAlignedCell from "&src/components/EndAlignedCell";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import NoData from "&src/components/NoData";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import GetRates from "./GetRates";
import POForm from "./POForm";
import { useDispatch } from "react-redux";
import { fetchApplicationDetails } from "&src/store/applicationFlowSlice";
const QuoteTable = ({ applicationDetails, aggregatorId, aggregatorName, isRateAdded, onSaveSuccess }) => {
  let serialNo = 0;
  const dispatch = useDispatch();
  const { applicationId, isQuoteReviewCO, isQuoteAcceptRO, finalizedAggregatorId, isFinalApproved, isQuoteAddedPA } = applicationDetails || {};
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [openPOModal, setOpenPOModal] = useState(false);
  const { poLoading, generatePO, poFormDetails } = usePOGenerator(applicationDetails, setOpenPOModal, openPOModal);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [errorRowIds, setErrorRowIds] = useState([]);
  console.log(isQuoteReviewCO, 'isQuoteReviewCO')
  const calculateAllQuoteRows = (details) => {
    console.log('calculateAll', details)
    if (!Array.isArray(details)) return [];
    console.log('calculateAllQuoteRows', details)
    return details?.map((row) => {
      console.log('calculateAllQuoteRows', row, row?.chargesProposed, row?.unit, row?.rate)
      return calculateQuoteRow(row, row?.chargesProposed, row?.unit, row?.rate)
    })
  }
  // ---------------------- Data Fetch ----------------------
  const fetchProjectionDetails = async () => {
    setLoading(true);
    try {
      const response = await aggregatorProjections.getAllProjections(
        applicationId,
        aggregatorId,
      );
      console.log('calculateAll', response?.data)

      const calculateAll = calculateAllQuoteRows(mergedData)
      console.log('calculateAll', calculateAll, response?.data)
      if (Array.isArray(response?.data)) setQuoteDetails(calculateAll);
    } catch (err) {
      console.error("[ERROR] Failed to fetch projections:", err);
      errorNotification(err?.response?.data?.message || "Failed to fetch projections");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (applicationId && aggregatorId) {
      fetchProjectionDetails();
    }
  }, [applicationId, aggregatorId]); // watch full object to ensure update
  // ---------------------- Helpers ----------------------
  const handleChargesChange = (transactionType, value) => {
    setQuoteDetails((prev) =>
      prev.map((row) =>
        row.transactionType === transactionType
          ? calculateQuoteRow(row, value)
          : row
      )
    );
  };
  const handleRateTypeChange = (rowIndex, newUnit) => {
    setQuoteDetails((prev) =>
      prev.map((row, i) => (i === rowIndex ? calculateQuoteRow(row, undefined, newUnit) : row))
    );
  };
  const updateApplicationFlow = async (statusFlags) => {
    try {
      await applicationServices.updateApplication(applicationId, statusFlags);
      successNotification("✅ Application updated successfully");
    } catch (err) {
      console.error("❌ Error updating application:", err);
      errorNotification("Failed to update application");
    }
  };
  const sendForCustomerAcceptance = async () => {
    setLoading(true);
    try {
      // ✅ Ensure all items have unique IDs (fallback if missing)
      const dataWithIds = quoteDetails?.map((item, index) => ({
        ...item,
        id: item.id ?? index + 1,
      }));
      // ✅ Helper to safely check numeric fields
      const isInvalidNumber = (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isNaN(Number(value)) ||
        Number(value) <= 0;
      // ✅ Find invalid rows
      const invalidRows = dataWithIds.filter(
        (row) =>
          row.allow && isInvalidNumber(row.chargesProposed)
      );
      // ✅ Handle invalid rows
      if (invalidRows.length > 0) {
        const invalidIds = invalidRows.map((r) => r.id);
        setErrorRowIds(invalidIds);
        const transactionTypeList = invalidRows.map((r) => r.transactionType);
        errorNotification(
          `⚠️ Missing or invalid charge details in: ${transactionTypeList.join(", ")}`
        );
        console.warn("Invalid Rows Detected:", invalidRows);
        setLoading(false);
        return; // Stop execution if validation fails
      }
      // ✅ Clear previous errors if validation passed
      setErrorRowIds([]);
      setLoading(false);
      // ✅ Prepare API payloads
      const [res, resAgg, resApp] = await Promise.all([
        aggregatorProjections.updateProjection(applicationId, aggregatorId, dataWithIds),
        aggregatorByApplication.updateAggregatorByApplication(applicationId, aggregatorId, totals),
        applicationServices.updateApplication(applicationId, {
          isMarkUpAddedCO: true,
          isQuoteReviewCO: true,
          approvedByCOId: user_Id,
          finalizedAggregatorId: aggregatorId,
          finalizedAggregatorName: aggregatorName,
          status: 'reviewquote'
        }),
      ]);
      // ✅ Validate all responses
      const allSuccess = [res, resAgg, resApp].every(
        (r) => r?.status === 200 || r?.status === 201
      );
      if (!allSuccess) {
        throw new Error("❌ One or more API calls failed.");
      }
      successNotification("✅ Application approved and projections added successfully.");
      if (applicationId) {
        dispatch(fetchApplicationDetails(applicationId));
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Error in sendForCustomerAcceptance:", err);
      errorNotification(
        err?.response?.data?.message ||
        err?.message ||
        "⚠️ Something went wrong. Please try again."
      );
    }
  };
  const handleAcceptance = async () => await updateApplicationFlow({ isQuoteAcceptRO: true });
  // ---------------------- Totals ----------------------
  const totals = useMemo(() => calculateTotals(quoteDetails), [quoteDetails]);
  const updateTotals = async () => {
    setLoading(true);
    console.log(totals, 'totalstotalstotals')
    const hasNonZeroVales = Object.values(totals).some((v) => Number(v) !== 0);
    if (!hasNonZeroVales) {
      setLoading(false);
      console.log("Total are Zero -> API NOT called")
      return
    };
    try {
      await aggregatorByApplication.updateAggregatorByApplication(applicationId, aggregatorId, totals)
    } catch (err) {
      console.error("[ERROR] Failed to fetch projections:", err);
      errorNotification(err?.response?.data?.message || "Failed to fetch projections");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (applicationId && aggregatorId) {
      updateTotals()
    }
  }, [totals])
  // ---------------------- Inner Components ----------------------
  const RoleBasedActions = () => (
    <Box display="flex" gap={1}>
      {
        !isRateAdded && !isQuoteAcceptRO &&
        <Box>
          <Button startIcon={<CurrencyRupee />} variant="outlined" onClick={() => setOpenModal(!openModal)}>
            Add Rates
          </Button>
          <Tooltip title="Add rate as per given by the Payment Aggregator." placement="top" arrow>
            <IconButton size="small">
              <InfoOutlined color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
      }
      {(isCO && !isQuoteReviewCO) && (
        <Button startIcon={<ForwardOutlined />} variant="contained" onClick={sendForCustomerAcceptance}>
          Forward for Acceptance
        </Button>
      )}
      {isCO && isQuoteAcceptRO && (
        <Button
          variant="contained"
          color="success"
          onClick={() => generatePO({ applicationId, aggregatorId: finalizedAggregatorId })}
        >
          Approve & Submit
        </Button>
      )}
      {isRO && !isQuoteAcceptRO && (
        <Button variant="contained" color="success" onClick={handleAcceptance}>
          Quote Acceptance By Customer
        </Button>
      )}
    </Box>
  );
  const QuoteRow = ({ row, rowIndex, errorRowIds, isFinalApproved }) => {
    const [localCharges, setLocalCharges] = useState(row.chargesProposed ?? "");

    useEffect(() => {
      setLocalCharges(row.chargesProposed ?? "");
    }, [row.chargesProposed]);
    if (!row.isIB) serialNo += 1;
    const cellSx = { fontSize: "11px", p: "4px", whiteSpace: "normal", wordBreak: "break-word" };
    if (isCO) {
      return (
        <TableRow sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
          <TableCell sx={cellSx}>{!row.isIB ? serialNo : ""}</TableCell>
          <TableCell sx={cellSx}>{row.transactionCount}</TableCell>
          <TableCell sx={cellSx}>{row.transactionValue}</TableCell>
          <TableCell sx={cellSx}>
            {row.transactionType}
            {row.transactionTypePercent && row?.isIB ? ` (${row.transactionTypePercent})` : ""}
          </TableCell>
          <EndAlignedCell sx={cellSx}>{Math.round(row.estimatedTransactions)}</EndAlignedCell>
          <EndAlignedCell sx={cellSx}>{formatNumber(row.aggregateAmount)}</EndAlignedCell>
          {!row?.allow ? (
            <TableCell colSpan={5} align="center" sx={{ fontStyle: "italic", color: "gray", ...cellSx }} />
          ) : (
            <>
              {applicationDetails?.isQuoteAcceptRO ?
                <EndAlignedCell sx={cellSx}>{row?.chargesProposed}</EndAlignedCell> :
                <TableCell sx={{ p: "4px" }}>
                  <Box display="flex" gap={0.5}>
                    <TextField
                      variant="outlined"
                      size="small"
                      type="text"
                      value={localCharges}
                      error={errorRowIds?.includes(row.id)} // 🔴 highlights red if row.id is invalid
                      helperText={errorRowIds?.includes(row.id) ? "Required" : ""} // optional message
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d{0,3}(\.\d{0,3})?$/.test(val)) {
                          setLocalCharges(val);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d{0,4}(\.\d{0,4})?$/.test(val)) {
                          handleChargesChange(row?.transactionType, val);
                        } else {
                          setLocalCharges(row.chargesProposed ?? "");
                        }
                      }}
                      inputProps={{ style: { textAlign: "right", padding: "4px 4px", fontSize: "11px" } }}
                      InputProps={{
                        startAdornment: (
                          <TextField
                            select
                            disabled={Boolean(row.bankUnit)}
                            value={row.bankUnit}
                            onChange={(e) => handleRateTypeChange(rowIndex, e.target.value)}
                            variant="standard"
                            size="small"
                            sx={{
                              minWidth: 35,
                              "& .MuiSelect-select": { padding: "0px 4px", fontSize: "11px" },
                            }}
                          >
                            <MenuItem value={RS} sx={{ fontSize: "11px" }}>{RS}</MenuItem>
                            <MenuItem value={PERCENTAGE} sx={{ fontSize: "11px" }}>{PERCENTAGE}</MenuItem>
                          </TextField>
                        ),
                      }}
                      sx={{ width: "95px" }}
                    />
                  </Box>
                </TableCell>
              }
              <EndAlignedCell sx={cellSx}>{formatNumber(row.grossAmount) || "0.00"}</EndAlignedCell>
              <TableCell sx={cellSx}>{row.unit === PERCENTAGE ? `${row.rate}${PERCENTAGE}` : row.rate}</TableCell>
              <EndAlignedCell sx={cellSx}>{formatNumber(row.vendorShare) || "0.00"}</EndAlignedCell>
              <EndAlignedCell sx={cellSx}>{formatNumber(row.expectedRevenue) || "0.00"}</EndAlignedCell>
            </>
          )}
        </TableRow>
      );
    }
    return (
      <TableRow sx={{ "&:hover": { bgcolor: "#f8fafc" } }}>
        <TableCell sx={cellSx}>{rowIndex + 1}</TableCell>
        <TableCell sx={cellSx}>{row.type}</TableCell>
      </TableRow>
    );
  };
  const TotalsRow = () => {
    const cellSx = { fontSize: "11px", p: "4px", whiteSpace: "normal", wordBreak: "break-word" };
    return (
      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
        <TableCell colSpan={4} align="center" sx={{ fontWeight: 700, ...cellSx }}>
          TOTAL
        </TableCell>
        <EndAlignedCell fontWeight={700} sx={cellSx}>
          {totals?.totalEstimatedTransactions}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={700} sx={cellSx}>
          {formatNumber(totals?.totalAggregateAmount)}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={700} sx={cellSx} />
        <EndAlignedCell fontWeight={700} sx={cellSx}>
          {formatNumber(totals?.totalGrossAmount)}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={700} sx={cellSx} />
        <EndAlignedCell fontWeight={700} sx={cellSx}>
          {formatNumber(totals?.totalVendorShare)}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={700} sx={cellSx}>
          {formatNumber(totals?.totalExpectedRevenue)}
        </EndAlignedCell>
      </TableRow>
    );
  };
  // ---------------------- Render ----------------------
  return (
    <Box p={2} sx={{ width: "100%", overflow: "hidden" }}>
      {(loading || poLoading) && <FullScreenLoader />}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mt: 1 }}>
          Projection Quote Details ({aggregatorName})
        </Typography>
        <RoleBasedActions />
      </Box>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
          <TableHead sx={{ bgcolor: "#f1f5f9" }}>
            <TableRow>
              {PROJECTION_COLUMNS_FOR_CO.map((col, idx) => (
                <TableCell key={idx} sx={{ fontWeight: 700, fontSize: "10px", py: "6px !important", px: "4px !important", color: "#475569", whiteSpace: "normal !important", wordBreak: "break-word", lineHeight: 1.1, verticalAlign: "top", textTransform: "none !important" }}>
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {quoteDetails?.length > 0 ? (
              <>
                {quoteDetails.map((row, i) => (
                  <QuoteRow key={i} row={row} rowIndex={i} errorRowIds={errorRowIds} />
                ))}
                {isCO && <TotalsRow />}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={PROJECTION_COLUMNS_FOR_CO.length} align="center">
                  <NoData />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      <POForm isLoading={poLoading} openPOModal={openPOModal} setOpenPOModal={setOpenPOModal} generatePO={generatePO} poFormDetails={poFormDetails} applicationId={applicationId} aggregatorId={aggregatorId} />
      <GetRates openModal={openModal} setOpenModal={setOpenModal} quoteDetails={quoteDetails} applicationDetails={applicationDetails} aggregatorId={aggregatorId} onSaveSuccess={onSaveSuccess} />
    </Box>
  );
};
export default QuoteTable;