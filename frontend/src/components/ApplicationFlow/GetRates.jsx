import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline, Close } from "@mui/icons-material";

import {
  PROJECTION_CAL_DETAILS,
  PROJECTION_COLUMNS_FOR_PA,
} from "&src/constants/PaymentAggregratorConstant";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import { PERCENTAGE, RS, sumofAggregatorRates } from "&src/utils";
import {
  calculateProjectionDetails,
  calculateQuoteRow,
  calculateTotals,
  getProjectionsForCustomer,
  getChannelOrder,
} from "&src/utils/calculation";
import DialogWithHeader from "../Dialog/DialogWithHeader";
import FullScreenLoader from "../Loaders/FullScreenLoader";
import useStatusWiseAlert from "../ToastNotifications/useStatusWiseAlert";

const PRESET_CHANNELS = [
  "Internet banking",
  "UPI",
  "Debit card - Rupay",
  "Debit card - Master/Visa (Above 2000)",
  "Debit card - Master/Visa (Upto 2000)",
  "Credit cards",
  "Corporate Net Banking",
  "Wallets & Prepaid Cards",
  "Bharat QR / Dynamic QR",
  "International Cards & Forex",
  "BNPL & EMI Payments",
  "Custom Channel",
];

const GetRates = ({
  applicationDetails,
  aggregatorId,
  aggregatorName,
  quoteDetails,
  openModal,
  setOpenModal,
  onSaveSuccess,
}) => {
  const { applicationId, projection, avgTransactionSize, avgTransactionYearly, aggregateDepositAmt } =
    applicationDetails || {};
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const [loading, setLoading] = useState(false);
  const [errorRowIds, setErrorRowIds] = useState([]);
  const [rateDetails, setRateDetails] = useState([]);

  // Add More Channel Dialog State
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("Corporate Net Banking");
  const [customChannelName, setCustomChannelName] = useState("");
  const [newChannelUnit, setNewChannelUnit] = useState(PERCENTAGE);

  // ---------------------- Initialize Data ----------------------
  useEffect(() => {
    if (!openModal || !applicationId || !aggregatorId) {
      setRateDetails([]);
      setErrorRowIds([]);
      return;
    }

    setRateDetails([]);
    setErrorRowIds([]);
    let isMounted = true;
    const loadRates = async () => {
      try {
        setLoading(true);
        const res = await aggregatorProjections.getAllProjections(applicationId, aggregatorId);
        const rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (rawData.length > 0 && isMounted) {
          const initialized = rawData.map((q, i) => {
            const hasExplicitRate =
              q.rate !== undefined &&
              q.rate !== null &&
              q.rate !== "" &&
              Number(q.rate) > 0;
            const rVal = hasExplicitRate ? q.rate : "";
            const cVal =
              q.chargesProposed !== undefined &&
              q.chargesProposed !== null &&
              q.chargesProposed !== ""
                ? q.chargesProposed
                : "";
            return {
              ...q,
              id: q.id ?? i + 1,
              rate: rVal,
              chargesProposed: cVal,
              unit: q.unit ?? PERCENTAGE,
              bankUnit: q.bankUnit ?? q.unit ?? PERCENTAGE,
            };
          });
          initialized.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
          setRateDetails(initialized);
          return;
        }

        if (quoteDetails && quoteDetails.length > 0 && isMounted) {
          const initialized = quoteDetails.map((q, i) => {
            const hasExplicitRate =
              q.rate !== undefined &&
              q.rate !== null &&
              q.rate !== "" &&
              Number(q.rate) > 0;
            const rVal = hasExplicitRate ? q.rate : "";
            const cVal =
              q.chargesProposed !== undefined &&
              q.chargesProposed !== null &&
              q.chargesProposed !== ""
                ? q.chargesProposed
                : "";
            return {
              ...q,
              id: q.id ?? i + 1,
              rate: rVal,
              chargesProposed: cVal,
              unit: q.unit ?? PERCENTAGE,
              bankUnit: q.bankUnit ?? q.unit ?? PERCENTAGE,
            };
          });
          initialized.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
          setRateDetails(initialized);
        } else if (isMounted) {
          // Fallback: Generate baseline projections for customer
          const baseline = getProjectionsForCustomer(
            PROJECTION_CAL_DETAILS,
            projection,
            avgTransactionSize,
            applicationId
          );
          const calculated = calculateProjectionDetails({
            projectionDetails: baseline,
            avgTransactionYearly,
            aggregateDepositAmt,
            applicationId,
          }).map((p, i) => ({
            ...p,
            id: p.id ?? i + 1,
            aggregatorId,
            rate: (p.rate !== undefined && p.rate !== null && p.rate !== "" && Number(p.rate) > 0) ? p.rate : "",
            chargesProposed: p.chargesProposed || "",
            unit: p.unit || PERCENTAGE,
            bankUnit: p.bankUnit || p.unit || PERCENTAGE,
          }));
          calculated.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
          setRateDetails(calculated);
        }
      } catch (err) {
        console.warn("Could not load saved rates for aggregator, using baseline:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRates();

    return () => {
      isMounted = false;
      setLoading(false);
    };
  }, [openModal, quoteDetails, applicationId, aggregatorId, projection, avgTransactionSize, avgTransactionYearly, aggregateDepositAmt]);

  // ---------------------- Handlers ----------------------
  const handleRateChange = (id, value) => {
    setRateDetails((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, rate: value, chargesProposed: row.chargesProposed || value } : row
      )
    );
  };

  const handleRateTypeChange = (id, newUnit) => {
    setRateDetails((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, unit: newUnit, bankUnit: row.bankUnit || newUnit } : row
      )
    );
  };

  // Add More Channel
  const handleConfirmAddChannel = () => {
    const channelTitle =
      selectedChannel === "Custom Channel"
        ? customChannelName.trim() || "Custom Payment Mode"
        : selectedChannel;

    if (!channelTitle) {
      errorNotification("Please enter a valid channel name.");
      return;
    }

    const exists = rateDetails.some(
      (r) => r.transactionType?.toLowerCase() === channelTitle.toLowerCase()
    );
    if (exists) {
      errorNotification(`Channel "${channelTitle}" already exists in the quote matrix.`);
      return;
    }

    const nextId =
      rateDetails.length > 0
        ? Math.max(...rateDetails.map((r) => (typeof r.id === "number" ? r.id : 0))) + 1
        : 1;

    const newRow = {
      id: nextId,
      order: 100 + nextId,
      applicationId,
      aggregatorId,
      transactionType: channelTitle,
      transactionCount: "",
      transactionValue: "",
      transactionTypePercent: "",
      isIB: false,
      allow: true,
      rate: "",
      unit: newChannelUnit,
      bankUnit: newChannelUnit,
      chargesProposed: "",
      grossAmount: 0,
      vendorShare: 0,
      expectedRevenue: 0,
      estimatedTransactions: 0,
      aggregateAmount: 0,
      isDeleted: false,
      quoteVersion: 1,
      isCustom: true,
    };

    setRateDetails((prev) => [...prev, newRow]);
    setAddChannelOpen(false);
    setCustomChannelName("");
    successNotification(`Added "${channelTitle}" mode to quote rates.`);
  };

  const handleDeleteRow = (id) => {
    setRateDetails((prev) => prev.filter((row) => row.id !== id));
  };

  // ---------------------- Save All Rates ----------------------
  const saveAllRates = async () => {
    setLoading(true);
    try {
      const isInvalidNumber = (value) =>
        value === null ||
        value === undefined ||
        value === "" ||
        isNaN(Number(value)) ||
        Number(value) < 0;

      const invalidRows = rateDetails.filter((row) => row.allow && isInvalidNumber(row.rate));

      if (invalidRows.length > 0) {
        const invalidIds = invalidRows.map((r) => r.id);
        setErrorRowIds(invalidIds);

        const transactionTypeList = invalidRows.map((r) => r.transactionType);
        errorNotification(
          `⚠️ Missing or invalid rate in: ${transactionTypeList.join(", ")}`
        );
        setLoading(false);
        return;
      }

      setErrorRowIds([]);

      // Calculate row-by-row commercial values
      const calculatedRows = rateDetails.map((item) => {
        const charges =
          item.chargesProposed !== undefined &&
          item.chargesProposed !== null &&
          item.chargesProposed !== "" &&
          Number(item.chargesProposed) >= 0
            ? item.chargesProposed
            : item.rate;
        return calculateQuoteRow(item, charges, item.unit, item.rate);
      });

      const totals = calculateTotals(calculatedRows);
      const sumOfRate = sumofAggregatorRates(rateDetails);

      const isRevision = Boolean(
        applicationDetails?.isNegotiationRequested ||
          applicationDetails?.status === "negotiation_requested"
      );
      const config = isRevision
        ? {
            params: {
              isRevision: true,
              revisionRemarks: applicationDetails?.negotiationRemarks || undefined,
            },
          }
        : undefined;

      // 1. First, save the projections
      const res = await aggregatorProjections.updateProjection(
        applicationId,
        aggregatorId,
        calculatedRows,
        config
      );

      if (!res || (res.status && res.status >= 400)) {
        throw new Error(res?.data?.message || "Failed to save quotation projections.");
      }

      // 2. Once projections are saved, update aggregator status & totals
      await aggregatorByApplication.updateAggregatorByApplication(applicationId, aggregatorId, {
        ...totals,
        sumOfRate,
        status: "submitted",
      });

      // 3. Update application status
      await applicationServices.updateApplication(applicationId, {
        isQuoteAddedPA: true,
        status: "quotesubmitted",
        isNegotiationRequested: false,
      });

      successNotification("✅ Rates and projections saved successfully.");
      setOpenModal(false);
      if (onSaveSuccess) {
        await onSaveSuccess(calculatedRows);
      }
    } catch (err) {
      console.error("Error in saveAllRates:", err);
      errorNotification(
        err?.response?.data?.message || err?.message || "⚠️ Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <DialogWithHeader
        maxWidth="md"
        open={openModal}
        onClose={() => setOpenModal(false)}
        headerText={`Add / Edit Quotation Rates ${aggregatorName ? `— ${aggregatorName}` : ""}`}
        sx={{ zIndex: 1600 }}
      >
        {loading && <FullScreenLoader />}

        <Box sx={{ mb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "12px" }}>
            Enter vendor quote rates for each payment channel. Additional modes can be added via <b>"Add More Mode"</b>.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setAddChannelOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px", fontSize: "11.5px" }}
          >
            Add More Mode
          </Button>
        </Box>

        <Table size="small" sx={{ border: "1px solid #e2e8f0" }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: 45 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px" }}>Transactions Types / Payment Channels</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: 180 }}>Rate</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "12px", width: 50, textAlign: "center" }}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rateDetails?.length ? (
              rateDetails.map((row, i) => {
                const srNo = !row.isIB
                  ? rateDetails.slice(0, i + 1).filter((r) => !r.isIB).length
                  : "";

                return (
                  <TableRow key={row.id || i} hover>
                    <TableCell sx={{ fontSize: "12px", color: "text.secondary" }}>{srNo}</TableCell>
                    <TableCell sx={{ fontSize: "12.5px", fontWeight: row.isIB ? 500 : 700, pl: row.isIB ? 3 : 1 }}>
                      {row.transactionType}
                      {row.isCustom && (
                        <Typography
                          component="span"
                          sx={{
                            ml: 1,
                            fontSize: "10px",
                            bgcolor: "#e0f2fe",
                            color: "#0369a1",
                            px: 0.8,
                            py: 0.2,
                            borderRadius: "4px",
                            fontWeight: 700,
                          }}
                        >
                          Additional
                        </Typography>
                      )}
                    </TableCell>

                    {row.allow ? (
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={0.8}>
                          <ToggleButtonGroup
                            value={row.unit || PERCENTAGE}
                            exclusive
                            size="small"
                            onChange={(e, newUnit) => {
                              if (newUnit) handleRateTypeChange(row.id, newUnit);
                            }}
                            sx={{
                              height: 32,
                              "& .MuiToggleButton-root": {
                                px: 1,
                                py: "2px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textTransform: "none",
                                borderColor: "#cbd5e1",
                                "&.Mui-selected": {
                                  bgcolor: "#0E4F8D !important",
                                  color: "#ffffff !important"
                                }
                              }
                            }}
                          >
                            <ToggleButton value={PERCENTAGE}>%</ToggleButton>
                            <ToggleButton value={RS}>₹</ToggleButton>
                          </ToggleButtonGroup>
                          <TextField
                            size="small"
                            variant="outlined"
                            type="text"
                            value={row.rate}
                            error={errorRowIds.includes(row.id)}
                            helperText={errorRowIds.includes(row.id) ? "Required" : ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || /^\d{0,3}(\.\d{0,4})?$/.test(val)) {
                                handleRateChange(row.id, val);
                              }
                            }}
                            inputProps={{ style: { textAlign: "right", padding: "5px 8px", fontSize: "12px", fontWeight: 600 } }}
                            sx={{ width: 90 }}
                          />
                        </Box>
                      </TableCell>
                    ) : (
                      <TableCell sx={{ color: "text.disabled", fontSize: "12px" }}>—</TableCell>
                    )}

                    <TableCell align="center">
                      {row.isCustom ? (
                        <Tooltip title="Remove custom mode" arrow>
                          <IconButton size="small" color="error" onClick={() => handleDeleteRow(row.id)}>
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  No projection channels available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Box display="flex" justifyContent="flex-end" gap={1.5} mt={2.5}>
          <Button variant="outlined" color="inherit" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={saveAllRates} sx={{ fontWeight: 700 }}>
            Submit Rates
          </Button>
        </Box>
      </DialogWithHeader>

      {/* ── Add More Channel Dialog ── */}
      <Dialog
        open={addChannelOpen}
        onClose={() => setAddChannelOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: 1700 }}
        PaperProps={{ sx: { borderRadius: "10px" } }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.8,
          }}
        >
          Add Additional Channel / Mode
          <IconButton size="small" onClick={() => setAddChannelOpen(false)} sx={{ color: "#ffffff" }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Mode / Channel</InputLabel>
              <Select
                value={selectedChannel}
                label="Select Mode / Channel"
                onChange={(e) => setSelectedChannel(e.target.value)}
              >
                {PRESET_CHANNELS.map((ch) => (
                  <MenuItem key={ch} value={ch}>
                    {ch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedChannel === "Custom Channel" && (
              <TextField
                label="Custom Channel Name"
                placeholder="e.g. Bharat QR / Static QR"
                fullWidth
                size="small"
                required
                value={customChannelName}
                onChange={(e) => setCustomChannelName(e.target.value)}
              />
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Rate Unit</InputLabel>
              <Select
                value={newChannelUnit}
                label="Rate Unit"
                onChange={(e) => setNewChannelUnit(e.target.value)}
              >
                <MenuItem value={PERCENTAGE}>Percentage (%)</MenuItem>
                <MenuItem value={RS}>Rupees (₹)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1, borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setAddChannelOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmAddChannel}
            sx={{ fontWeight: 700 }}
          >
            Add Mode
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GetRates;
