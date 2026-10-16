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
  Paper,
  CircularProgress,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
  isCO,
  isRO,
  PROJECTION_COLUMNS_FOR_CO,
  PROJECTION_CAL_DETAILS,
  user_Id
} from "&src/constants/PaymentAggregratorConstant";
import usePOGenerator from "&src/hooks/usePOGenerator";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { formatNumber, PERCENTAGE, RS } from "&src/utils";
import { calculateQuoteRow, calculateTotals, getProjectionsForCustomer, getChannelOrder, isZeroProjectionChannel } from "&src/utils/calculation";
import { CurrencyRupee, ForwardOutlined, InfoOutlined, Email, CompareArrows, Close, CheckCircle, FullscreenRounded, FullscreenExitRounded } from "@mui/icons-material";
import EndAlignedCell from "&src/components/table/common/EndAlignedCell";
import FullScreenLoader from "&src/components/feedback/FullScreenLoader";
import NoData from "&src/components/feedback/NoData";
import useStatusWiseAlert from "&src/components/feedback/ToastNotifications/useStatusWiseAlert";
import GetRates from "./GetRates";
import POForm from "./POForm";
import { useDispatch } from "react-redux";
import { fetchApplicationDetails } from "&src/store/applicationFlowSlice";
const QuoteTable = ({
  applicationDetails,
  aggregatorId,
  aggregatorName,
  isRateAdded,
  onSaveSuccess,
  initialFullScreen = false,
  onCloseModal
}) => {
  const dispatch = useDispatch();
  const { applicationId, isQuoteReviewCO, isQuoteAcceptRO, finalizedAggregatorId, isFinalApproved, isQuoteAddedPA } = applicationDetails || {};
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [openPOModal, setOpenPOModal] = useState(false);
  const { poLoading, generatePO, poFormDetails } = usePOGenerator(applicationDetails, setOpenPOModal, openPOModal);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [errorRowIds, setErrorRowIds] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(Boolean(initialFullScreen));

  useEffect(() => {
    if (initialFullScreen) {
      setIsFullScreen(true);
    }
  }, [initialFullScreen]);

  const isRejected = applicationDetails?.status?.toLowerCase()?.includes('reject') || Boolean(applicationDetails?.reasonOfRejection) || Boolean(applicationDetails?.rejectedDate);

  const hasAddedRates = useMemo(() => {
    return (quoteDetails || []).some(
      (p) => Number(p.rate) > 0
    );
  }, [quoteDetails]);

  const calculateAllQuoteRows = (details) => {
    const totTxns = Number(
      applicationDetails?.avgTransactionYearly ||
      (applicationDetails?.totalAnnualTransaction && Number(applicationDetails.totalAnnualTransaction)) ||
      0
    );
    const totAmt = Number(
      applicationDetails?.aggregateDepositAmt ||
      applicationDetails?.totalBankCollection ||
      applicationDetails?.totalAnnualTransaction ||
      (applicationDetails?.avgTransactionSize * applicationDetails?.avgTransactionYearly) ||
      0
    );

    const baselineList = getProjectionsForCustomer(
      PROJECTION_CAL_DETAILS,
      applicationDetails?.projection,
      applicationDetails?.avgTransactionSize,
      applicationId
    );
    const baselineMap = new Map();
    baselineList.forEach((b) => {
      const key = (b.transactionType || "").toLowerCase().trim();
      if (key) baselineMap.set(key, b);
    });

    // 1. First pass: compute parent rows
    const firstPass = details.map((row) => {
      let r = { ...row };
      const key = (r.transactionType || "").toLowerCase().trim();
      const bData = baselineMap.get(key);

      if (bData) {
        if (!r.transactionCount || r.transactionCount === "0%" || r.transactionCount === "0") {
          r.transactionCount = bData.transactionCount;
        }
        if (!r.transactionValue || r.transactionValue === "0%" || r.transactionValue === "0") {
          r.transactionValue = bData.transactionValue;
        }
        if (bData.transactionTypePercent && !r.transactionTypePercent) {
          r.transactionTypePercent = bData.transactionTypePercent;
        }
        if (bData.allow !== undefined && r.allow === undefined) {
          r.allow = bData.allow;
        }
      }

      if (!r.isIB) {
        const countP = parseFloat(r.transactionCount) / 100 || 0;
        const valP = parseFloat(r.transactionValue) / 100 || 0;
        if (countP > 0 && totTxns > 0) {
          r.estimatedTransactions = Math.round(totTxns * countP);
        }
        if (valP > 0 && totAmt > 0) {
          r.aggregateAmount = totAmt * valP;
        }
      }
      return r;
    });

    const ibParent = firstPass.find((r) => r.transactionType?.toLowerCase().includes("internet") && !r.isIB);

    // 2. Second pass: compute sub-bank rows and calculate quote rows
    const secondPass = firstPass
      .filter((r) => {
        // Filter out inactive Debit card - Master/Visa (Above 2000) or (Upto 2000) when 0 count and 0 value and not allowed
        if (
          r.transactionType?.includes("Debit card - Master/Visa") &&
          !r.allow &&
          (parseFloat(r.transactionCount) || 0) === 0 &&
          (parseFloat(r.transactionValue) || 0) === 0
        ) {
          return false;
        }
        return true;
      })
      .map((row) => {
        let r = { ...row };
        if (r.isIB && ibParent) {
          const percent = parseFloat(r.transactionTypePercent) / 100 || 0;
          r.estimatedTransactions = Math.round((ibParent.estimatedTransactions || 0) * percent);
          r.aggregateAmount = (ibParent.aggregateAmount || 0) * percent;
        }
        const effectiveCharges =
          r?.chargesProposed !== undefined &&
          r?.chargesProposed !== null &&
          r?.chargesProposed !== "" &&
          Number(r?.chargesProposed) > 0
            ? r?.chargesProposed
            : "";
        return calculateQuoteRow(r, effectiveCharges, r?.bankUnit || r?.unit, r?.rate);
      });

    return secondPass;
  };
  const [resendingEmail, setResendingEmail] = useState(false);

  const processProjectionRows = (rawData) => {
    let cleanData = (Array.isArray(rawData) ? rawData : []).filter(
      (p) =>
        (Number(p.applicationId) === Number(applicationId) || !p.applicationId) &&
        (Number(p.aggregatorId) === Number(aggregatorId) || !p.aggregatorId)
    );

    // If empty, try matching without aggregatorId constraint if rawData belongs to this application
    if (cleanData.length === 0 && Array.isArray(rawData) && rawData.length > 0) {
      cleanData = rawData.filter((p) => Number(p.applicationId) === Number(applicationId));
    }

    // Deduplicate by transactionType while preserving the row with rate if available
    const rowMap = new Map();
    for (const item of cleanData) {
      const tType = item.transactionType?.trim();
      if (!tType) continue;
      if (!rowMap.has(tType)) {
        rowMap.set(tType, item);
      } else {
        const existing = rowMap.get(tType);
        if (
          (Number(item.rate) > 0 || Number(item.chargesProposed) > 0) &&
          (!Number(existing.rate) && !Number(existing.chargesProposed))
        ) {
          rowMap.set(tType, { ...existing, ...item });
        }
      }
    }

    let finalData = Array.from(rowMap.values());

    // If no existing rows found in DB for this aggregator, initialize from application baseline
    if (finalData.length === 0) {
      const totTxns = Number(
        applicationDetails?.avgTransactionYearly ||
        (applicationDetails?.totalAnnualTransaction && Number(applicationDetails.totalAnnualTransaction)) ||
        0
      );
      const totAmt = Number(
        applicationDetails?.aggregateDepositAmt ||
        applicationDetails?.totalBankCollection ||
        applicationDetails?.totalAnnualTransaction ||
        (applicationDetails?.avgTransactionSize * applicationDetails?.avgTransactionYearly) ||
        0
      );

      const customerProjs = getProjectionsForCustomer(
        PROJECTION_CAL_DETAILS,
        applicationDetails?.projection,
        applicationDetails?.avgTransactionSize,
        applicationId
      );

      customerProjs.forEach((q, idx) => {
        const count = parseInt(q.transactionCount, 10) || 0;
        const val = parseInt(q.transactionValue, 10) || 0;
        finalData.push({
          ...q,
          id: `init_${idx + 1}`,
          applicationId,
          aggregatorId,
          order: q.order || idx + 1,
          transactionCount: q.isIB ? '' : `${count}%`,
          transactionValue: q.isIB ? '' : `${val}%`,
          estimatedTransactions: q.isIB ? 0 : Math.round(totTxns * (count / 100)),
          aggregateAmount: q.isIB ? 0 : (totAmt * (val / 100)),
          rate: 0,
          chargesProposed: (q.chargesProposed !== undefined && q.chargesProposed !== null && q.chargesProposed !== "" && Number(q.chargesProposed) > 0) ? q.chargesProposed : "",
          grossAmount: 0,
          vendorShare: 0,
          expectedRevenue: 0,
        });
      });
    }

    // If Internet banking exists, ensure sub-bank bifurcation rows (SBI, HDFC, ICICI, AXIS, OTHERS) are present
    const ibIndex = finalData.findIndex((p) => p.transactionType === "Internet banking" && !p.isIB);
    const hasIbChildren = finalData.some((p) => p.isIB);

    if (ibIndex !== -1 && !hasIbChildren) {
      const ibParent = finalData[ibIndex];
      const ibChildren = [
        { transactionType: "SBI", transactionTypePercent: "68.61%", isIB: true, allow: true, order: 2, chargesProposed: "", unit: RS, bankUnit: RS },
        { transactionType: "HDFC", transactionTypePercent: "10.78%", isIB: true, allow: true, order: 3, chargesProposed: "", unit: RS, bankUnit: RS },
        { transactionType: "ICICI", transactionTypePercent: "5.57%", isIB: true, allow: true, order: 4, chargesProposed: "", unit: RS, bankUnit: RS },
        { transactionType: "AXIS", transactionTypePercent: "4.47%", isIB: true, allow: true, order: 5, chargesProposed: "", unit: RS, bankUnit: RS },
        { transactionType: "OTHERS", transactionTypePercent: "10.56%", isIB: true, allow: true, order: 6, chargesProposed: "", unit: RS, bankUnit: RS },
      ].map((bank, bIdx) => {
        const percent = parseFloat(bank.transactionTypePercent) / 100 || 0;
        return {
          ...bank,
          id: `ib_${ibParent.id || 'ib'}_${bIdx}`,
          applicationId,
          aggregatorId,
          order: bank.order,
          estimatedTransactions: Math.round((ibParent.estimatedTransactions || 0) * percent),
          aggregateAmount: (ibParent.aggregateAmount || 0) * percent,
          rate: 0,
          unit: RS,
          bankUnit: RS,
          chargesProposed: (bank.chargesProposed !== undefined && bank.chargesProposed !== null && bank.chargesProposed !== "" && Number(bank.chargesProposed) > 0) ? bank.chargesProposed : "",
          grossAmount: 0,
          vendorShare: 0,
          expectedRevenue: 0,
        };
      });

      finalData.splice(ibIndex + 1, 0, ...ibChildren);
    }

    // Ensure any channels in applicationDetails.projection are present in finalData
    const rawProjs = applicationDetails?.projection;
    if (rawProjs) {
      const channelNames = typeof rawProjs === 'string'
        ? rawProjs.split('|').map((s) => s.trim()).filter(Boolean)
        : (Array.isArray(rawProjs) ? rawProjs.map((s) => String(s).trim()).filter(Boolean) : []);
      channelNames.forEach((cName, idx) => {
        const cLower = cName.toLowerCase();
        const exists = finalData.some((p) => p.transactionType?.toLowerCase() === cLower);
        if (!exists) {
          finalData.push({
            id: `proj_custom_${idx}_${Date.now()}`,
            applicationId,
            aggregatorId,
            order: 100 + idx,
            transactionType: cName,
            transactionCount: '0%',
            transactionValue: '0%',
            isIB: false,
            estimatedTransactions: 0,
            aggregateAmount: 0,
            rate: 0,
            unit: '₹',
            chargesProposed: "",
            bankUnit: '₹',
            grossAmount: 0,
            vendorShare: 0,
            expectedRevenue: 0,
            allow: true,
          });
        }
      });
    }

    // Sort strictly by canonical channel order
    finalData.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));

    return calculateAllQuoteRows(finalData);
  };

  // ---------------------- Data Fetch ----------------------
  const fetchProjectionDetails = async () => {
    setLoading(true);
    try {
      const [response, benchRes] = await Promise.all([
        aggregatorProjections.getAllProjections(applicationId, aggregatorId),
        aggregatorProjections.getAllProjections(applicationId, 0).catch(() => ({ data: [] }))
      ]);
      const rawData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      const benchData = Array.isArray(benchRes?.data) ? benchRes.data : (Array.isArray(benchRes) ? benchRes : []);

      const benchMap = new Map();
      benchData.forEach((b) => {
        const k = (b.transactionType || "").trim().toLowerCase();
        if (
          k &&
          b.chargesProposed !== undefined &&
          b.chargesProposed !== null &&
          b.chargesProposed !== "" &&
          Number(b.chargesProposed) > 0
        ) {
          benchMap.set(k, {
            chargesProposed: b.chargesProposed,
            bankUnit: b.chargeType || b.bankUnit || b.unit || "%"
          });
        }
      });

      const mergedData = rawData.map((row) => {
        const k = (row.transactionType || "").trim().toLowerCase();
        const bench = benchMap.get(k);
        return {
          ...row,
          chargesProposed: bench ? bench.chargesProposed : "",
          bankUnit: bench?.bankUnit || row.bankUnit || row.unit || "%"
        };
      });

      const processed = processProjectionRows(mergedData.length > 0 ? mergedData : rawData);
      setQuoteDetails(processed);
    } catch (err) {
      console.error("[ERROR] Failed to fetch projections:", err);
      // Even on fetch error, generate clean baseline so the table is never blank
      const processed = processProjectionRows([]);
      setQuoteDetails(processed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId && aggregatorId) {
      setQuoteDetails([]);
      setLoading(true);
      fetchProjectionDetails();
    }
    return () => {
      setQuoteDetails([]);
    };
  }, [applicationId, aggregatorId]);
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
      successNotification("Ô£à Application updated successfully");
    } catch (err) {
      console.error("ÔØî Error updating application:", err);
      errorNotification("Failed to update application");
    }
  };
  const sendForCustomerAcceptance = async () => {
    setLoading(true);
    try {
      // Ô£à Ensure all items have unique IDs (fallback if missing)
      const dataWithIds = quoteDetails?.map((item, index) => ({
        ...item,
        id: item.id ?? index + 1,
      }));
      // Ô£à Helper to safely check numeric fields
      const isInvalidNumber = (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isNaN(Number(value)) ||
        Number(value) <= 0;
      // Ô£à Find invalid rows
      const invalidRows = dataWithIds.filter(
        (row) =>
          row.allow && isInvalidNumber(row.chargesProposed)
      );
      // Ô£à Handle invalid rows
      if (invalidRows.length > 0) {
        const invalidIds = invalidRows.map((r) => r.id);
        setErrorRowIds(invalidIds);
        const transactionTypeList = invalidRows.map((r) => r.transactionType);
        errorNotification(
          `ÔÜá´©Å Missing or invalid charge details in: ${transactionTypeList.join(", ")}`
        );
        console.warn("Invalid Rows Detected:", invalidRows);
        setLoading(false);
        return; // Stop execution if validation fails
      }
      // Ô£à Clear previous errors if validation passed
      setErrorRowIds([]);
      setLoading(false);
      // Ô£à Prepare API payloads
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
      // Ô£à Validate all responses
      const allSuccess = [res, resAgg, resApp].every(
        (r) => r?.status === 200 || r?.status === 201
      );
      if (!allSuccess) {
        throw new Error("ÔØî One or more API calls failed.");
      }
      successNotification("Ô£à Application approved and projections added successfully.");
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
        "ÔÜá´©Å Something went wrong. Please try again."
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
  const handleRateSaveSuccess = async (savedRows) => {
    if (Array.isArray(savedRows) && savedRows.length > 0) {
      setQuoteDetails(savedRows);
    }
    await fetchProjectionDetails();
    if (onSaveSuccess) {
      await onSaveSuccess();
    }
  };

  const handleResendQuoteEmail = async () => {
    setResendingEmail(true);
    try {
      const res = await aggregatorProjections.resendQuoteEmail(applicationId, aggregatorId);
      if (res?.data?.status === 'success' || res?.status === 'success') {
        successNotification(res?.data?.message || res?.message || `Quotation email resent to ${aggregatorName} successfully!`);
      } else {
        errorNotification(res?.data?.message || res?.message || "Email queued. Please verify SMTP credentials in .env.");
      }
    } catch (err) {
      console.error("[ERROR] Failed to resend quote email:", err);
      errorNotification(err?.response?.data?.detail || err?.response?.data?.message || "Failed to resend quotation email");
    } finally {
      setResendingEmail(false);
    }
  };

  // ---------------------- Inner Components ----------------------
  const RoleBasedActions = ({ isHeader = false }) => {
    if (isRejected) {
      return (
        <Box display="flex" alignItems="center" gap={1}>
          {isRejected && (
            <Chip
              label="Application Rejected ÔÇö Read Only"
              size="small"
              color="error"
              variant="filled"
              sx={{ fontWeight: 700, fontSize: "11px", bgcolor: "#ef4444", color: "#ffffff" }}
            />
          )}
          {!isHeader && (
            <Button
              variant="contained"
              size="small"
              startIcon={isFullScreen ? <FullscreenExitRounded sx={{ fontSize: 16 }} /> : <FullscreenRounded sx={{ fontSize: 16 }} />}
              onClick={() => setIsFullScreen(!isFullScreen)}
              sx={{
                fontSize: "11.5px",
                py: "4px",
                px: 1.5,
                borderRadius: "6px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#ffffff",
                color: "#0E4F8D !important",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                "&:hover": { bgcolor: "#f0f7ff !important" }
              }}
            >
              {isFullScreen ? "Exit Full Screen" : "Full Screen View"}
            </Button>
          )}
        </Box>
      );
    }
    const showAddRates = !hasAddedRates && !isQuoteAcceptRO && !isRejected;
    return (
      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
        {showAddRates && (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Button
              startIcon={<CurrencyRupee />}
              variant="contained"
              size="small"
              onClick={() => setOpenModal(true)}
              sx={{
                bgcolor: isHeader ? "#ffffff !important" : "#0E4F8D !important",
                color: isHeader ? "#0E4F8D !important" : "#ffffff !important",
                fontWeight: 700,
                fontSize: "11.5px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                "&:hover": { bgcolor: isHeader ? "#f0f9ff !important" : "#0B3D6D !important" }
              }}
            >
              Add Rates
            </Button>
            <Tooltip title="Add rate or custom modes as per given by the Payment Aggregator." placement="top" arrow>
              <IconButton size="small" sx={{ color: isHeader ? "#ffffff" : "#0E4F8D" }}>
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {isRO && !isQuoteAcceptRO && (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleAcceptance}
            sx={{ fontWeight: 700, fontSize: "11.5px", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}
          >
            Quote Acceptance By Customer
          </Button>
        )}
        {!isHeader && (
          <Button
            variant="outlined"
            size="small"
            startIcon={isFullScreen ? <FullscreenExitRounded sx={{ fontSize: 16 }} /> : <FullscreenRounded sx={{ fontSize: 16 }} />}
            onClick={() => setIsFullScreen(!isFullScreen)}
            sx={{
              fontSize: "11.5px",
              py: "4px",
              px: 1.5,
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 700,
              borderColor: "#0E4F8D",
              color: "#0E4F8D",
              bgcolor: "#ffffff !important",
              "&:hover": { bgcolor: "#f0f7ff !important", borderColor: "#0B3D6D" }
            }}
          >
            {isFullScreen ? "Exit Full Screen" : "Full Screen View"}
          </Button>
        )}
      </Box>
    );
  };
  const QuoteRow = ({ row, rowIndex, srNo, errorRowIds, isFinalApproved }) => {
    const [localCharges, setLocalCharges] = useState(row.chargesProposed ?? "");

    useEffect(() => {
      setLocalCharges(row.chargesProposed ?? "");
    }, [row.chargesProposed]);

    const cellSx = { fontSize: "11px", p: "4px", whiteSpace: "normal", wordBreak: "break-word" };
    const countDisplay = !row.isIB ? (row.transactionCount ? (String(row.transactionCount).endsWith("%") ? row.transactionCount : `${row.transactionCount}%`) : "") : "";
    const valueDisplay = !row.isIB ? (row.transactionValue ? (String(row.transactionValue).endsWith("%") ? row.transactionValue : `${row.transactionValue}%`) : "") : "";

    const isEven = rowIndex % 2 === 0;
    const isSubBank = row.isIB;
    const rowBg = isSubBank ? "#f8fafc" : (isEven ? "#ffffff" : "#f1f5f9");

    const canEditCharges = isCO && !applicationDetails?.isQuoteAcceptRO && !isRejected;

    const rateDisplay =
      row.rate !== undefined && row.rate !== null && row.rate !== "" && Number(row.rate) > 0
        ? row.unit === PERCENTAGE || row.unit === "%" || row.unit === "Percentage"
          ? `${row.rate}%`
          : `₹${row.rate}`
        : "—";

    return (
      <TableRow
        sx={{
          bgcolor: rowBg,
          "&:hover": { bgcolor: "#e2e8f0 !important" },
          transition: "background-color 0.15s ease"
        }}
      >
        <TableCell sx={cellSx}>{srNo}</TableCell>
        <TableCell sx={cellSx}>{countDisplay}</TableCell>
        <TableCell sx={cellSx}>{valueDisplay}</TableCell>
        <TableCell
          sx={{
            ...cellSx,
            pl: isSubBank ? 3 : 1,
            fontStyle: isSubBank ? "italic" : "normal",
            color: isSubBank ? "#475569" : "#0f172a",
            fontWeight: isSubBank ? 500 : 600
          }}
        >
          {row.transactionType}
          {row.transactionTypePercent && row?.isIB ? ` (${row.transactionTypePercent})` : ""}
        </TableCell>
        <EndAlignedCell sx={cellSx}>{Math.round(row.estimatedTransactions || 0)}</EndAlignedCell>
        <EndAlignedCell sx={cellSx}>{formatNumber(row.aggregateAmount)}</EndAlignedCell>
        {isZeroProjectionChannel(row) || (row.transactionType?.toLowerCase().includes("internet") && !row.isIB) ? (
          <>
            <TableCell align="center" sx={{ color: "text.secondary", ...cellSx }}>—</TableCell>
            <TableCell align="center" sx={{ color: "text.secondary", ...cellSx }}>—</TableCell>
            <TableCell align="center" sx={{ color: "text.secondary", ...cellSx }}>—</TableCell>
            <TableCell align="center" sx={{ color: "text.secondary", ...cellSx }}>—</TableCell>
            <TableCell align="center" sx={{ color: "text.secondary", ...cellSx }}>—</TableCell>
          </>
        ) : (
          <>
            {!canEditCharges ? (
              <TableCell align="right" sx={cellSx}>
                {(() => {
                  let chargeVal = row?.chargesProposed;
                  if (
                    chargeVal === undefined ||
                    chargeVal === null ||
                    chargeVal === "" ||
                    chargeVal === "NaN" ||
                    Number.isNaN(chargeVal) ||
                    Number.isNaN(Number(chargeVal)) ||
                    Number(chargeVal) <= 0
                  ) {
                    const g = Number(row?.grossAmount) || 0;
                    const est = Number(row?.estimatedTransactions) || 0;
                    const agg = Number(row?.aggregateAmount) || 0;
                    const isPct = (row?.bankUnit || row?.unit) === PERCENTAGE || (row?.bankUnit || row?.unit) === "%";
                    if (g > 0) {
                      if (isPct && agg > 0) {
                        chargeVal = parseFloat(((g * 100) / agg).toFixed(3));
                      } else if (est > 0) {
                        chargeVal = parseFloat((g / est).toFixed(3));
                      }
                    }
                  }

                  if (
                    chargeVal !== undefined &&
                    chargeVal !== null &&
                    chargeVal !== "" &&
                    chargeVal !== "NaN" &&
                    !Number.isNaN(Number(chargeVal)) &&
                    Number(chargeVal) > 0
                  ) {
                    const isPct = (row?.bankUnit || row?.unit) === PERCENTAGE || (row?.bankUnit || row?.unit) === "%";
                    return isPct ? `${chargeVal}%` : `₹${chargeVal}`;
                  }
                  return "—";
                })()}
              </TableCell>
            ) : (
              <TableCell sx={{ p: "4px" }}>
                <Box display="flex" gap={0.5}>
                  <TextField
                    variant="outlined"
                    size="small"
                    type="text"
                    value={localCharges}
                    error={errorRowIds?.includes(row.id)}
                    helperText={errorRowIds?.includes(row.id) ? "Required" : ""}
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
                          value={row.bankUnit || PERCENTAGE}
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
            )}
            <EndAlignedCell sx={cellSx}>{formatNumber(row.grossAmount) || "0.00"}</EndAlignedCell>
            <TableCell sx={cellSx}>{rateDisplay}</TableCell>
            <EndAlignedCell sx={cellSx}>{formatNumber(row.vendorShare) || "0.00"}</EndAlignedCell>
            <EndAlignedCell sx={cellSx}>{formatNumber(row.expectedRevenue) || "0.00"}</EndAlignedCell>
          </>
        )}
      </TableRow>
    );
  };
  const totalCountPercent = useMemo(() => {
    if (!Array.isArray(quoteDetails)) return 0;
    return quoteDetails
      .filter((r) => !r.isIB)
      .reduce((acc, r) => acc + (parseFloat(r.transactionCount) || 0), 0);
  }, [quoteDetails]);

  const totalValuePercent = useMemo(() => {
    if (!Array.isArray(quoteDetails)) return 0;
    return quoteDetails
      .filter((r) => !r.isIB)
      .reduce((acc, r) => acc + (parseFloat(r.transactionValue) || 0), 0);
  }, [quoteDetails]);

  const TotalsRow = () => {
    const cellSx = { fontSize: "11px", p: "4px", borderTop: "2px solid #0E4F8D", borderBottom: "2px solid #0E4F8D", bgcolor: "#f1f5f9" };
    return (
      <TableRow>
        <TableCell sx={cellSx} />
        <TableCell sx={{ fontWeight: 800, color: "#0E4F8D", ...cellSx }}>
          {totalCountPercent.toFixed(2)}%
        </TableCell>
        <TableCell sx={{ fontWeight: 800, color: "#0E4F8D", ...cellSx }}>
          {totalValuePercent.toFixed(2)}%
        </TableCell>
        <TableCell sx={{ fontWeight: 800, color: "#0E4F8D", ...cellSx }}>TOTAL</TableCell>
        <EndAlignedCell fontWeight={800} sx={{ color: "#0E4F8D", ...cellSx }}>
          {Math.round(totals?.totalEstimatedTransactions)}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={800} sx={{ color: "#0E4F8D", ...cellSx }}>
          {formatNumber(totals?.totalAggregateAmount)}
        </EndAlignedCell>
        <TableCell sx={cellSx}>—</TableCell>
        <EndAlignedCell fontWeight={800} sx={{ color: "#0E4F8D", ...cellSx }}>
          {formatNumber(totals?.totalGrossAmount)}
        </EndAlignedCell>
        <TableCell align="center" sx={cellSx}>
          —
        </TableCell>
        <EndAlignedCell fontWeight={800} sx={{ color: "#0E4F8D", ...cellSx }}>
          {formatNumber(totals?.totalVendorShare)}
        </EndAlignedCell>
        <EndAlignedCell fontWeight={800} sx={{ color: "#0E4F8D", ...cellSx }}>
          {formatNumber(totals?.totalExpectedRevenue)}
        </EndAlignedCell>
      </TableRow>
    );
  };
  // ---------------------- Render ----------------------
  const renderFullScreenDialog = () => (
    <Dialog
      fullScreen
      open={isFullScreen}
      onClose={() => {
        setIsFullScreen(false);
        if (onCloseModal) onCloseModal();
      }}
      PaperProps={{
        sx: { bgcolor: "#f8fafc" }
      }}
    >
      {(loading || poLoading) && <FullScreenLoader message="Processing and synchronizing quotation details..." />}
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        {/* Top Header Bar */}
        <Box
          sx={{
            background: "linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)",
            color: "#ffffff",
            px: 3,
            py: 1.8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            borderBottom: "3px solid #CE0F3E",
            zIndex: 10,
            flexWrap: "wrap",
            gap: 1.5
          }}
        >
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#ffffff !important", letterSpacing: "0.3px", fontSize: "16px" }}>
                Quotation & Projection Details — {aggregatorName}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9) !important", display: "block", fontSize: "11.5px", mt: 0.2 }}>
                Application ID: #{applicationId} | Customer: {applicationDetails?.customerName || applicationDetails?.merchantName || "Merchant"} | Avg Annual Txns: {formatNumber(applicationDetails?.avgTransactionYearly)} | Total Deposit: ₹ {formatNumber(applicationDetails?.aggregateDepositAmt || applicationDetails?.totalAnnualTransaction)}
              </Typography>
            </Box>

          </Box>

          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <RoleBasedActions isHeader={true} />
            <Button
              variant="contained"
              size="small"
              startIcon={<Close sx={{ fontSize: 18 }} />}
              onClick={() => {
                setIsFullScreen(false);
                if (onCloseModal) onCloseModal();
              }}
              sx={{
                bgcolor: "#ffffff !important",
                color: "#0E4F8D !important",
                fontWeight: 800,
                fontSize: "12px",
                textTransform: "none",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                "&:hover": { bgcolor: "#f1f5f9 !important", color: "#0B3D6D !important" }
              }}
            >
              Exit View
            </Button>
          </Box>
        </Box>

        {/* Fullscreen Table Content */}
        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <Paper elevation={2} sx={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
            <TableContainer sx={{ maxHeight: "none", overflowX: "auto" }}>
              <Table size="medium" stickyHeader sx={{ width: "100%", tableLayout: "auto" }}>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%) !important' }}>
                    {PROJECTION_COLUMNS_FOR_CO.map((col, idx) => {
                      const isRight =
                        col.includes("Estimated") ||
                        col.includes("Aggregate") ||
                        col.includes("Charges") ||
                        col.includes("Gross") ||
                        col.includes("Rate") ||
                        col.includes("Share") ||
                        col.includes("Revenue");
                      const isCenter = col.includes("Sr No");
                      const isRate = col === "Rate";
                      const isSrNo = col === "Sr No";

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
                            whiteSpace: isRate || isSrNo ? "nowrap !important" : "normal !important",
                            wordBreak: "normal !important",
                            overflowWrap: "normal !important",
                            minWidth: isSrNo ? "50px" : isRate ? "80px" : "95px",
                            lineHeight: 1.2,
                            verticalAlign: "middle",
                            textTransform: "none !important"
                          }}
                        >
                          {col}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quoteDetails?.length > 0 ? (
                    <>
                      {quoteDetails.map((row, i) => {
                        const srNo = !row.isIB
                          ? quoteDetails.slice(0, i + 1).filter((r) => !r.isIB).length
                          : "";
                        return (
                          <QuoteRow
                            key={row.id || i}
                            row={row}
                            rowIndex={i}
                            srNo={srNo}
                            errorRowIds={errorRowIds}
                          />
                        );
                      })}
                      <TotalsRow />
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
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Dialog>
  );

  const renderAuxiliaryModals = () => (
    <>
      <POForm isLoading={poLoading} openPOModal={openPOModal} setOpenPOModal={setOpenPOModal} generatePO={generatePO} poFormDetails={poFormDetails} applicationId={applicationId} aggregatorId={aggregatorId} />
      <GetRates openModal={openModal} setOpenModal={setOpenModal} quoteDetails={quoteDetails} applicationDetails={applicationDetails} aggregatorId={aggregatorId} aggregatorName={aggregatorName} onSaveSuccess={handleRateSaveSuccess} />
    </>
  );

  // When initialFullScreen is true, render ONLY as popup modal dialog (nothing underneath)
  if (initialFullScreen) {
    return (
      <>
        {(loading || poLoading) && <FullScreenLoader />}
        {renderAuxiliaryModals()}
        {renderFullScreenDialog()}
      </>
    );
  }

  return (
    <Box p={2} sx={{ width: "100%", overflow: "hidden" }}>
      {(loading || poLoading) && <FullScreenLoader />}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
            Projection Quote Details ({aggregatorName})
          </Typography>

        </Box>
        <RoleBasedActions />
      </Box>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "auto" }}>
          <TableHead>
            <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%) !important' }}>
              {PROJECTION_COLUMNS_FOR_CO.map((col, idx) => {
                const isRight =
                  col.includes("Estimated") ||
                  col.includes("Aggregate") ||
                  col.includes("Charges") ||
                  col.includes("Gross") ||
                  col.includes("Rate") ||
                  col.includes("Share") ||
                  col.includes("Revenue");
                const isCenter = col.includes("Sr No");
                const isRate = col === "Rate";
                const isSrNo = col === "Sr No";

                return (
                  <TableCell
                    key={idx}
                    align={isRight ? "right" : isCenter ? "center" : "left"}
                    sx={{
                      fontWeight: 700,
                      fontSize: "10.5px",
                      py: "8px !important",
                      px: "6px !important",
                      color: "#ffffff !important",
                      background: "transparent !important",
                      whiteSpace: isRate || isSrNo ? "nowrap !important" : "normal !important",
                      wordBreak: "normal !important",
                      overflowWrap: "normal !important",
                      minWidth: isSrNo ? "45px" : isRate ? "75px" : "85px",
                      lineHeight: 1.2,
                      verticalAlign: "middle",
                      textTransform: "none !important"
                    }}
                  >
                    {col}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {quoteDetails?.length > 0 ? (
              <>
                {quoteDetails.map((row, i) => {
                  const srNo = !row.isIB
                    ? quoteDetails.slice(0, i + 1).filter((r) => !r.isIB).length
                    : "";
                  return (
                    <QuoteRow
                      key={row.id || i}
                      row={row}
                      rowIndex={i}
                      srNo={srNo}
                      errorRowIds={errorRowIds}
                    />
                  );
                })}
                <TotalsRow />
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
      {renderAuxiliaryModals()}
      {renderFullScreenDialog()}
    </Box>
  );
};
export default QuoteTable;
