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
  EmailOutlined,
  OpenInNew,
  Close,
  Email,
  Visibility,
  VisibilityOff,
  ForwardToInboxOutlined,
  ForwardOutlined,
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
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { fetchApplicationDetails, updateApplicationWorkflow } from "&src/store/applicationFlowSlice";

// ✅ Conditional hook wrapper
function useConditionalAggregatorDetails(condition) {
  const details = useAggregatorDetails();
  return condition ? details : { aggregatorDetails: [], fetchAllAggregators: () => { } };
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

  const [viewMode, setViewMode] = useState("aggregator");
  const [allProjections, setAllProjections] = useState({});
  const [projectionsLoading, setProjectionsLoading] = useState(false);
  const [finalApprovedTab, setFinalApprovedTab] = useState("finalized");

  // Email Preview Modal States
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [quoteConsent, setQuoteConsent] = useState(false);
  const [dispatchedAggregators, setDispatchedAggregators] = useState([]);
  const [appProjectionsList, setAppProjectionsList] = useState([]);
  const [resendingAggId, setResendingAggId] = useState(null);
  const [forwardingAggId, setForwardingAggId] = useState(null);

  const { applicationId, aggregateDepositAmt, avgTransactionYearly, isAggregatorAdded, isQuoteAcceptRO, finalizedAggregatorId, category, avgTransactionSize } =
    customerDetails || {};

  const requestedChannels = useMemo(() => {
    if (appProjectionsList && appProjectionsList.length > 0) {
      return appProjectionsList.map(p => p.transactionType).filter(Boolean);
    }
    const rawProjs = customerDetails?.projection;
    if (rawProjs) {
      return typeof rawProjs === 'string' ? rawProjs.split('|').map(s => s.trim()).filter(Boolean) : [];
    }
    return ['UPI', 'Internet banking', 'Debit card - Rupay', 'Debit card - Master/Visa', 'Credit cards'];
  }, [appProjectionsList, customerDetails?.projection]);

  const isQuoteAcceptedAndFinalized = Boolean(
    customerDetails?.isFinalApproved ||
    (customerDetails?.isQuoteAcceptReviewByCO && customerDetails?.isQuoteAcceptRO)
  );
  const fetchAllProjections = useCallback(async (aggregatorsList) => {
    const list = aggregatorsList || selectedAggregatorsDetails;
    if (!applicationId || !list?.length) return;
    setProjectionsLoading(true);
    try {
      const promises = list.map(async (agg) => {
        let response = await aggregatorProjections.getAllProjections(applicationId, agg.aggregatorId);
        let rawData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

        // Fallback: If no projections exist for this aggregatorId yet, initialize them from baseline
        if (!rawData.length) {
          try {
            const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
            const projectionsPayload = calculateProjectionDetails({
              projectionDetails: projectionList,
              avgTransactionYearly,
              aggregateDepositAmt,
              applicationId,
            });
            await aggregatorProjections.createProjection(applicationId, projectionsPayload);
            const refetch = await aggregatorProjections.getAllProjections(applicationId, agg.aggregatorId);
            rawData = Array.isArray(refetch?.data) ? refetch.data : (Array.isArray(refetch) ? refetch : []);
          } catch (initErr) {
            console.warn("Auto-initialization fallback error:", initErr);
          }
        }

        const cleanData = rawData.filter(
          (p) =>
            Number(p.applicationId) === Number(applicationId) &&
            Number(p.aggregatorId) === Number(agg.aggregatorId)
        );

        // Deduplicate by transactionType
        const uniqueData = [];
        const seenTypes = new Set();
        for (const item of cleanData) {
          const tType = item.transactionType?.trim();
          if (tType && !seenTypes.has(tType)) {
            seenTypes.add(tType);
            uniqueData.push(item);
          }
        }

        // If Internet banking exists, ensure sub-bank bifurcation rows (SBI, HDFC, ICICI, AXIS, OTHERS) are present
        const ibIndex = uniqueData.findIndex((p) => p.transactionType === "Internet banking" && !p.isIB);
        const hasIbChildren = uniqueData.some((p) => p.isIB);

        let finalData = [...uniqueData];
        if (ibIndex !== -1 && !hasIbChildren) {
          const ibParent = uniqueData[ibIndex];
          const ibChildren = [
            { transactionType: "SBI", transactionTypePercent: "68.61%", isIB: true, allow: true },
            { transactionType: "HDFC", transactionTypePercent: "10.78%", isIB: true, allow: true },
            { transactionType: "ICICI", transactionTypePercent: "5.57%", isIB: true, allow: true },
            { transactionType: "AXIS", transactionTypePercent: "4.47%", isIB: true, allow: true },
            { transactionType: "OTHERS", transactionTypePercent: "10.56%", isIB: true, allow: true },
          ].map((bank, bIdx) => {
            const percent = parseFloat(bank.transactionTypePercent) / 100 || 0;
            return {
              ...bank,
              id: `ib_${ibParent.id || 'ib'}_${bIdx}`,
              applicationId,
              aggregatorId: agg.aggregatorId,
              order: (ibParent.order || 1) + (bIdx + 1) * 0.1,
              estimatedTransactions: (ibParent.estimatedTransactions || 0) * percent,
              aggregateAmount: (ibParent.aggregateAmount || 0) * percent,
              rate: 0,
              unit: "₹",
              chargesProposed: 0,
              grossAmount: 0,
              vendorShare: 0,
              expectedRevenue: 0,
            };
          });

          finalData.splice(ibIndex + 1, 0, ...ibChildren);
        }

        const calculated = finalData.map((row) => {
          return calculateQuoteRow(row, row?.chargesProposed, row?.unit, row?.rate);
        });
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
  }, [applicationId, avgTransactionSize, avgTransactionYearly, aggregateDepositAmt]);

  const showAddAggregatorSection = !customerDetails?.isAggregatorAdded;
  const { aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();
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
    setOpenRow(null);
  };

  /** 🔹 Fetch Aggregator Details */
  const fetchSelectedAggregatorDetails = useCallback(async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      const response = await aggregatorByApplication.getAllAggregatorsByApplication(applicationId);
      const data = response?.data || response;
      const sorted = Array.isArray(data) ? sortAggregatorsByQuote(data) : [];
      setSelectedAggregatorsDetails(sorted);
      if (sorted.length > 0) {
        fetchAllProjections(sorted);
      }
    } catch (error) {
      console.error("[ERROR] Failed to fetch aggregators:", error);
      errorNotification(error?.response?.data?.message || "Failed to fetch aggregators");
    } finally {
      setLoading(false);
    }
  }, [applicationId, fetchAllProjections, errorNotification]);

  // Load once when application changes or aggregator stage is reached
  useEffect(() => {
    if (applicationId && customerDetails?.isAggregatorAdded) {
      fetchSelectedAggregatorDetails();
    }
  }, [applicationId, customerDetails?.isAggregatorAdded]);

  const handleRefresh = useCallback(() => {
    fetchSelectedAggregatorDetails();
  }, [fetchSelectedAggregatorDetails]);

  /** 🔹 Direct Forward for Customer Acceptance without opening sub-table */
  const handleDirectForwardForAcceptance = async (agg) => {
    if (!agg || !applicationId) return;
    setForwardingAggId(agg.aggregatorId);
    try {
      let rawData = allProjections[agg.aggregatorId] || [];
      if (!rawData.length) {
        const response = await aggregatorProjections.getAllProjections(applicationId, agg.aggregatorId);
        rawData = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
      }

      if (!rawData.length) {
        errorNotification(`No quotation projections found for ${agg.aggregatorName}. Please add rates first.`);
        setForwardingAggId(null);
        return;
      }

      const calculatedRows = rawData.map((row) => {
        return calculateQuoteRow(row, row?.chargesProposed, row?.unit, row?.rate);
      });

      const totals = calculateTotals(calculatedRows);
      const userId = sessionStorage.getItem('userId') || sessionStorage.getItem('user_id') || 1;

      const [res, resAgg, resApp] = await Promise.all([
        aggregatorProjections.updateProjection(applicationId, agg.aggregatorId, calculatedRows),
        aggregatorByApplication.updateAggregatorByApplication(applicationId, agg.aggregatorId, {
          ...totals,
          sumOfRate: agg.sumOfRate || 0,
          status: 'submitted',
        }),
        applicationServices.updateApplication(applicationId, {
          isMarkUpAddedCO: true,
          isQuoteReviewCO: true,
          approvedByCOId: userId,
          finalizedAggregatorId: agg.aggregatorId,
          finalizedAggregatorName: agg.aggregatorName,
          status: 'reviewquote',
        }),
      ]);

      const allSuccess = [res, resAgg, resApp].every(
        (r) => r?.status === 200 || r?.status === 201
      );

      if (!allSuccess) {
        throw new Error("One or more API calls failed.");
      }

      successNotification(`✅ Quotation for ${agg.aggregatorName} forwarded for customer acceptance successfully!`);
      if (applicationId) {
        dispatch(fetchApplicationDetails(applicationId));
      }
      handleRefresh();
    } catch (err) {
      console.error("Error in handleDirectForwardForAcceptance:", err);
      errorNotification(err?.response?.data?.message || err?.message || "Failed to forward for customer acceptance");
    } finally {
      setForwardingAggId(null);
    }
  };

  /** 🔹 Open Preview Dialog before sending */
  const handleOpenQuotePreview = async () => {
    if (!selectedAggregators?.length) {
      return errorNotification("Please select at least one aggregator from the list.");
    }

    try {
      const projRes = await aggregatorProjections.getAllProjections(applicationId);
      const rawProjs = Array.isArray(projRes?.data) ? projRes.data : (Array.isArray(projRes) ? projRes : []);
      if (rawProjs.length > 0) {
        const unique = [];
        const seen = new Set();
        for (const p of rawProjs.filter((p) => !p.isIB)) {
          const tType = p.transactionType?.trim();
          if (tType && !seen.has(tType)) {
            seen.add(tType);
            unique.push(p);
          }
        }
        setAppProjectionsList(unique);
      } else {
        const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
        setAppProjectionsList(projectionList.filter((p) => !p.isIB));
      }
    } catch (e) {
      console.warn("Could not fetch projections for preview:", e);
      const projectionList = generateProjectionArray(PROJECTION_CAL_DETAILS, avgTransactionSize);
      setAppProjectionsList(projectionList.filter((p) => !p.isIB));
    }

    setQuoteConsent(false);
    setDispatchedAggregators(selectedAggregators);
    setEmailPreviewOpen(true);
  };

  /** 🔹 Confirm & Dispatch Quotation Requests */
  const handleConfirmSendForQuote = async () => {
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

      // 2️⃣ API Call to add aggregators & trigger background email dispatch
      const aggResponse = await aggregatorByApplication.createAggregatorByApplication(applicationId, aggregatorPayload);
      if (!(aggResponse?.status === 200 || aggResponse?.status === 201)) {
        throw new Error("Failed to add aggregator");
      }

      // 3️⃣ Update application workflow stage
      await dispatch(updateApplicationWorkflow({
        applicationId,
        payload: {
          isAggregatorAdded: true,
          isReviewByCO: true,
          status: "quoterequested",
        }
      })).unwrap();

      const names = selectedAggregators.map((a) => a.aggregatorName).join(", ");
      const emails = selectedAggregators.map((a) => a.email).filter(Boolean).join(", ");
      successNotification(`Quotation request & projection schedule successfully dispatched to ${names} (${emails})`);

      setEmailPreviewOpen(false);
      await fetchSelectedAggregatorDetails();
      await fetchAllProjections();
    } catch (err) {
      errorNotification(err?.response?.data?.message || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
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
      {showAddAggregatorSection && (
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
              <Button variant="contained" endIcon={<Send />} onClick={handleOpenQuotePreview}>
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

      {/* ── Quotation Request Email Dispatch & Preview Dialog ── */}
      <Dialog
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1.05rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 2,
            px: 3,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <EmailOutlined />
            <span>Quotation Request Email Preview & Confirmation</span>
          </Box>
          <Chip label="Ready to Dispatch" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: '11px' }} />
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {/* Recipient Aggregator Chips */}
          <Box sx={{ mb: 2.5, p: 2, bgcolor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing={0.5} sx={{ display: 'block', mb: 1 }}>
              Target Selected Aggregators ({dispatchedAggregators.length})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {dispatchedAggregators.map((agg) => (
                <Chip
                  key={agg.aggregatorId}
                  label={`${agg.aggregatorName} (${agg.email || 'No email configured'})`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: '12px', bgcolor: '#f0f9ff' }}
                />
              ))}
            </Stack>
          </Box>

          {/* Email Preview Card */}
          <Box sx={{ p: 2.5, bgcolor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0E4F8D" sx={{ mb: 0.5 }}>
              Subject: [Action Required] Request for Quotation: Application #{applicationId} ({customerDetails?.category || 'General'}) [Due: {endDate ? (typeof endDate === 'string' ? endDate : dayjs(endDate).format('DD/MM/YYYY')) : 'Within 48 Hours'}] - Central Bank of India
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            {/* Merchant Application Summary */}
            <Typography variant="caption" fontWeight={800} color="#0E4F8D" textTransform="uppercase" letterSpacing={0.5}>
              Merchant Application Summary
            </Typography>
            <Grid container spacing={1.5} sx={{ mt: 0.5, mb: 2 }}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Application Reference:</Typography>
                <Typography variant="body2" fontWeight={700}>#{applicationId}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Business Category:</Typography>
                <Typography variant="body2" fontWeight={700}>{customerDetails?.category || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Average Ticket Size:</Typography>
                <Typography variant="body2" fontWeight={700}>₹ {Number(customerDetails?.avgTransactionSize || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Expected Annual Txns:</Typography>
                <Typography variant="body2" fontWeight={700}>{Number(customerDetails?.avgTransactionYearly || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Expected Annual Volume:</Typography>
                <Typography variant="body2" fontWeight={700}>
                  ₹ {Number(customerDetails?.totalAnnualTransaction || customerDetails?.aggregateDepositAmt || (customerDetails?.avgTransactionSize * customerDetails?.avgTransactionYearly) || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" display="block">Quote Submission Due:</Typography>
                <Typography variant="body2" fontWeight={700} color="#CE0F3E">
                  {endDate ? (typeof endDate === 'string' ? endDate : dayjs(endDate).format('DD/MM/YYYY')) : 'Within 48 Hours'}
                </Typography>
              </Grid>
            </Grid>

            {/* Requested Payment Modes / Projection Channels */}
            <Typography variant="caption" fontWeight={800} color="#0E4F8D" textTransform="uppercase" letterSpacing={0.5} sx={{ display: 'block', mb: 1 }}>
              Requested Payment Modes / Projection Channels for Quotation
            </Typography>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', mb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {requestedChannels.map((channel, idx) => (
                  <Chip
                    key={idx}
                    label={channel}
                    color="primary"
                    variant="filled"
                    sx={{ fontWeight: 700, fontSize: '12px', bgcolor: '#0E4F8D', color: '#ffffff' }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Consent & Confirmation Checkbox */}
            <Box sx={{ mt: 2.5, p: 2, bgcolor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quoteConsent}
                    onChange={(e) => setQuoteConsent(e.target.checked)}
                    color="success"
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 24 } }}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={700} color="#166534">
                    I verify the merchant application parameters and authorize sending quotation requests to all selected aggregators.
                  </Typography>
                }
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<OpenInNew />}
            onClick={() => {
              const emails = dispatchedAggregators.map((a) => a.email).filter(Boolean).join(',');
              const dueDateStr = endDate ? (typeof endDate === 'string' ? endDate : dayjs(endDate).format('DD/MM/YYYY')) : 'Within 48 Hours';
              const subject = encodeURIComponent(`[Action Required] Request for Quotation: Application #${applicationId} (${customerDetails?.category || 'General'}) [Due: ${dueDateStr}] - Central Bank of India`);
              const projDetailsText = requestedChannels.map((ch, idx) => `  ${idx + 1}. ${ch}`).join('\n');

              const body = encodeURIComponent(
                `Dear Partner,\n\nCentral Bank of India has initiated a commercial quotation request for Application #${applicationId}.\n\nCOMMERCIAL PARAMETERS:\n- Application ID: #${applicationId}\n- Category: ${customerDetails?.category || 'N/A'}\n- Average Ticket Size: ₹ ${Number(customerDetails?.avgTransactionSize || 0).toLocaleString()}\n- Expected Annual Volume: ₹ ${Number(customerDetails?.totalAnnualTransaction || customerDetails?.aggregateDepositAmt || 0).toLocaleString()}\n- Submission Due: ${dueDateStr}\n\nREQUESTED PAYMENT MODES / CHANNELS FOR QUOTATION:\n${projDetailsText}\n\nPlease log in to the Payment Aggregator Portal to submit your quotation rates.\n\nRegards,\nCentral Bank of India\nNeo Banking & Emerging Technologies`
              );
              window.open(`mailto:${emails}?subject=${subject}&body=${body}`, '_blank');
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Open in Email Client (mailto:)
          </Button>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setEmailPreviewOpen(false)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!quoteConsent || loading}
              onClick={handleConfirmSendForQuote}
              sx={{
                background: quoteConsent ? 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)' : '#cbd5e1',
                textTransform: 'none',
                fontWeight: 800,
                px: 3,
                borderRadius: '8px'
              }}
            >
              {loading ? "Sending..." : "🚀 Confirm & Dispatch Quotation Requests"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* ➤ Added Aggregators Section */}
      {!showAddAggregatorSection && (
        <Box sx={{ mt: 2 }}>
          {/* Helpful Guidance Info Card - visible only during quotation review */}
          {!isQuoteAcceptedAndFinalized && !customerDetails?.isFinalApproved && !customerDetails?.isQuoteReviewCO && (
            <Paper
              elevation={0}
              sx={{
                mx: 2,
                mb: 2,
                p: 1.5,
                bgcolor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5
              }}
            >
              <InfoOutlined sx={{ color: "#0284c7", fontSize: 20, mt: 0.2 }} />
              <Box>
                <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#0369a1", mb: 0.3 }}>
                  Quotation Stage Workflow Guide:
                </Typography>
                <Typography sx={{ fontSize: "11.5px", color: "#334155", lineHeight: 1.4 }}>
                  1️⃣ Click <strong>Send for quotes</strong> (<ForwardToInboxOutlined sx={{ fontSize: 13, verticalAlign: "middle", color: "#0284c7" }} />) in the Actions column to dispatch quotation requests &bull;
                  2️⃣ Click <strong>View Details</strong> (<Visibility sx={{ fontSize: 13, verticalAlign: "middle", color: "#16a34a" }} />) to enter proposed rates &bull;
                  3️⃣ Switch to <strong>View All Aggregators (Side-by-Side)</strong> to compare quotes and select L1 lowest bidder.
                </Typography>
              </Box>
            </Paper>
          )}

          <Box display='flex' justifyContent='space-between' mx={2} mb={1.5} alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              {!isQuoteAcceptedAndFinalized && (
                <Tabs
                  value={viewMode}
                  onChange={(e, val) => setViewMode(val)}
                  sx={{
                    bgcolor: "#f1f5f9",
                    borderRadius: "10px",
                    p: "4px",
                    minHeight: "36px",
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": {
                      minHeight: "30px",
                      py: "4px",
                      px: 2,
                      fontSize: "12px",
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "7px",
                      color: "#64748b",
                      transition: "all 0.2s ease-in-out",
                      "&.Mui-selected": {
                        bgcolor: "#0E4F8D",
                        color: "#ffffff !important",
                        boxShadow: "0 2px 6px rgba(14, 79, 141, 0.25)"
                      }
                    }
                  }}
                >
                  <Tab value="aggregator" label="Aggregator View" />
                  <Tab value="all" label="View All Aggregators (Side-by-Side)" />
                </Tabs>
              )}
            </Box>
            <Box>
              {!isQuoteAcceptedAndFinalized && !customerDetails?.isQuoteAcceptRO &&
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    startIcon={<CurrencyRupee />}
                    variant="outlined"
                    size="small"
                    onClick={() => setOpenModal(!openModal)}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                  >
                    Add Charges New
                  </Button>
                  <Tooltip title="Add Charges as per projection details" placement="top" arrow>
                    <IconButton size="small">
                      <InfoOutlined color="primary" fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            </Box>
          </Box>

          {isQuoteAcceptedAndFinalized && (
            <Box display="flex" justifyContent="flex-start" mx={2} mb={1.5}>
              <Tabs
                value={finalApprovedTab}
                onChange={(e, val) => setFinalApprovedTab(val)}
                sx={{
                  bgcolor: "#f1f5f9",
                  borderRadius: "10px",
                  p: "4px",
                  minHeight: "36px",
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    minHeight: "30px",
                    py: "4px",
                    px: 2,
                    fontSize: "12px",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "7px",
                    color: "#64748b",
                    transition: "all 0.2s ease-in-out",
                    "&.Mui-selected": {
                      bgcolor: finalApprovedTab === "finalized" ? "#16a34a" : "#0E4F8D",
                      color: "#ffffff !important",
                      boxShadow: finalApprovedTab === "finalized"
                        ? "0 2px 6px rgba(22, 163, 74, 0.25)"
                        : "0 2px 6px rgba(14, 79, 141, 0.25)"
                    }
                  }
                }}
              >
                <Tab value="finalized" label="Finalized Aggregator Cost Benefit Analysis" />
                <Tab value="all" label="View All Aggregators" />
              </Tabs>
            </Box>
          )}

          {isQuoteAcceptedAndFinalized ? (
            <CompareAggregatorsTable
              filteredAggregators={
                finalApprovedTab === "finalized"
                  ? sortAggregator(
                      selectedAggregatorsDetails.filter(agg =>
                        finalizedAggregatorId
                          ? Number(agg.aggregatorId) === Number(finalizedAggregatorId) || String(agg.aggregatorId) === String(finalizedAggregatorId)
                          : true
                      )
                    )
                  : sortAggregator(selectedAggregatorsDetails)
              }
              allProjections={allProjections}
              projectionsLoading={projectionsLoading}
              finalizedAggregatorId={finalizedAggregatorId}
              customerDetails={customerDetails}
            />
          ) : viewMode === "all" ? (
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
                <Box display="flex" justifyContent="flex-start" mb={1.5} mx={2}>
                  <Tabs
                    value={tabValue}
                    onChange={handleChange}
                    aria-label="Aggregator Process Tabs"
                    sx={{
                      bgcolor: "#f1f5f9",
                      borderRadius: "10px",
                      p: "4px",
                      minHeight: "36px",
                      "& .MuiTabs-indicator": { display: "none" },
                      "& .MuiTab-root": {
                        minHeight: "30px",
                        py: "4px",
                        px: 2,
                        fontSize: "12px",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "7px",
                        color: "#64748b",
                        transition: "all 0.2s ease-in-out",
                        "&.Mui-selected": {
                          bgcolor: tabValue === 'finalizedAggregator' ? "#16a34a" : "#0E4F8D",
                          color: "#ffffff !important",
                          boxShadow: tabValue === 'finalizedAggregator'
                            ? "0 2px 6px rgba(22, 163, 74, 0.25)"
                            : "0 2px 6px rgba(14, 79, 141, 0.25)"
                        }
                      }
                    }}
                  >
                    <Tab
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                      label="Finalized Aggregator"
                      value="finalizedAggregator"
                    />
                    <Tab
                      icon={<Gavel sx={{ fontSize: 16 }} />}
                      iconPosition="start"
                      label="All Selected Aggregators"
                      value="selectedAggregators"
                    />
                  </Tabs>
                </Box>
              )}

              <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden", mt: 1.5, borderRadius: "0px", borderColor: "#cbd5e1", boxShadow: "none" }}>
                <TableContainer sx={{ borderRadius: "0px" }}>
                  <Table size="small" sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%) !important', borderBottom: '2px solid #062545' }}>
                        {AGGREGATOR_COLUMNS.map((col, idx) => {
                          const isRight = col.includes("Gross") || col.includes("Share") || col.includes("Revenue");
                          const isCenter = col.includes("Status");
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
                                whiteSpace: "normal !important",
                                wordBreak: "break-word",
                                lineHeight: 1.2,
                                verticalAlign: "middle",
                                textTransform: "none !important",
                                border: "1px solid rgba(255, 255, 255, 0.25) !important",
                                borderBottom: "2px solid #062545 !important",
                              }}
                            >
                              {col}
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
                            whiteSpace: "normal !important",
                            wordBreak: "break-word",
                            lineHeight: 1.2,
                            verticalAlign: "middle",
                            textTransform: "none !important"
                          }}
                        >
                          Quote Submission
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
                            whiteSpace: "normal !important",
                            wordBreak: "break-word",
                            lineHeight: 1.2,
                            verticalAlign: "middle",
                            textTransform: "none !important"
                          }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {(() => {
                        if (!filteredAggregators || filteredAggregators.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 4, color: "#64748b", fontSize: "13px" }}>
                                No aggregators added yet for this application.
                              </TableCell>
                            </TableRow>
                          );
                        }

                        const submittedAggs = [...selectedAggregatorsDetails]
                          .filter(agg => agg.status === "submitted" && Number(agg.totalVendorShare) > 0)
                          .sort((a, b) => Number(a.totalVendorShare) - Number(b.totalVendorShare));

                        return filteredAggregators.map((agg, idx) => {
                          const isOpen = openRow === agg.aggregatorId;
                          const cellSx = { fontSize: "11px", p: "8px", whiteSpace: "normal", wordBreak: "break-word", color: "#334155", borderColor: "#f1f5f9" };
                          return (
                            <React.Fragment key={agg.aggregatorId || idx}>
                              <TableRow sx={{ "&:hover": { bgcolor: "#f8fafc" }, bgcolor: isOpen ? "#f1f5f9" : "transparent", transition: "background-color 0.2s" }}>
                                <TableCell sx={cellSx}>{idx + 1}</TableCell>
                                <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{`AGG000${agg.aggregatorId || idx + 1}`}</TableCell>
                                <TableCell sx={cellSx}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography sx={{ fontWeight: 600, fontSize: "11px", color: "#0f172a" }}>{agg.aggregatorName}</Typography>
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
                                <EndAlignedCell sx={cellSx}>{formatNumber(agg.totalGrossAmount)}</EndAlignedCell>
                                <EndAlignedCell sx={cellSx}>{formatNumber(agg.totalVendorShare)}</EndAlignedCell>
                                <EndAlignedCell sx={cellSx}>{formatNumber(agg.totalExpectedRevenue)}</EndAlignedCell>
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
                                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.8}>
                                    <Tooltip title="Send for quotes" arrow placement="top">
                                      <IconButton
                                        size="small"
                                        disabled={resendingAggId === agg.aggregatorId}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          setResendingAggId(agg.aggregatorId);
                                          try {
                                            const res = await aggregatorProjections.resendQuoteEmail(applicationId, agg.aggregatorId);
                                            if (res?.data?.status === 'success' || res?.status === 'success') {
                                              successNotification(res?.data?.message || res?.message || `Quotation email resent to ${agg.aggregatorName} successfully!`);
                                            } else {
                                              errorNotification(res?.data?.message || "Email queued. Check SMTP configuration in .env.");
                                            }
                                          } catch (err) {
                                            console.error("Error resending quote email:", err);
                                            errorNotification(err?.response?.data?.detail || err?.response?.data?.message || "Failed to resend quotation email");
                                          } finally {
                                            setResendingAggId(null);
                                          }
                                        }}
                                        sx={{
                                          p: "4px",
                                          border: "1px solid #bae6fd",
                                          borderRadius: "6px",
                                          bgcolor: "#f0f9ff",
                                          "&:hover": { bgcolor: "#e0f2fe" }
                                        }}
                                      >
                                        {resendingAggId === agg.aggregatorId ? (
                                          <CircularProgress size={14} />
                                        ) : (
                                          <ForwardToInboxOutlined sx={{ fontSize: 16, color: "#0284c7" }} />
                                        )}
                                      </IconButton>
                                    </Tooltip>

                                    <Tooltip title={isOpen ? "Hide Projection Details" : "View Projection Details"} arrow placement="top">
                                      <IconButton
                                        size="small"
                                        onClick={() => setOpenRow(isOpen ? null : agg.aggregatorId)}
                                        sx={{
                                          p: "4px",
                                          border: "1px solid #cbd5e1",
                                          borderRadius: "6px",
                                          bgcolor: isOpen ? "#f0fdf4" : "#ffffff",
                                          color: isOpen ? "#16a34a" : "#475569",
                                          "&:hover": { bgcolor: isOpen ? "#dcfce7" : "#f1f5f9" }
                                        }}
                                      >
                                        {isOpen ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                                      </IconButton>
                                    </Tooltip>

                                    {(!customerDetails?.isFinalApproved && !customerDetails?.isQuoteReviewCO) && (
                                      <Tooltip title="Forward for Customer Acceptance" arrow placement="top">
                                        <IconButton
                                          size="small"
                                          disabled={forwardingAggId === agg.aggregatorId}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDirectForwardForAcceptance(agg);
                                          }}
                                          sx={{
                                            p: "4px",
                                            border: "1px solid #bbf7d0",
                                            borderRadius: "6px",
                                            bgcolor: "#f0fdf4",
                                            color: "#16a34a",
                                            "&:hover": { bgcolor: "#dcfce7", color: "#15803d" }
                                          }}
                                        >
                                          {forwardingAggId === agg.aggregatorId ? (
                                            <CircularProgress size={14} color="inherit" />
                                          ) : (
                                            <ForwardOutlined sx={{ fontSize: 16 }} />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>

                              <TableRow>
                                <TableCell
                                  colSpan={9}
                                  sx={{ p: 0, maxWidth: "100%", overflow: "hidden", borderBottom: isOpen ? "1px solid #cbd5e1" : "none" }}
                                >
                                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <Box sx={{ width: "100%", overflow: "hidden", p: 1.5, bgcolor: "#f8fafc", borderLeft: "4px solid #0f766e" }}>
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
                </TableContainer>
              </Paper>
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
    const isAccepted = customerDetails?.isQuoteAcceptRO;
    const totalCols = 7 + (activeAggs.length * 3);

    const formatPercent = (val) => {
      if (val === null || val === undefined || val === "") return "";
      const str = String(val).trim();
      return str.endsWith("%") ? str : `${str}%`;
    };

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Cost Benefit Analysis</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; }
          .title-row { background-color: #062545; color: #ffffff; font-size: 15px; font-weight: bold; text-align: center; height: 36px; }
          .meta-row { background-color: #f1f5f9; color: #334155; font-size: 11px; font-weight: bold; text-align: center; height: 26px; border-bottom: 2px solid #0E4F8D; }
          .cba-top-header { background-color: #0E4F8D; color: #ffffff; font-weight: bold; font-size: 12px; text-align: center; height: 32px; border: 1px solid #0B3D6D; }
          .agg-finalized-header { background-color: #16A34A; color: #ffffff; font-weight: bold; font-size: 12px; text-align: center; height: 32px; border: 1px solid #15803D; }
          .agg-rejected-header { background-color: #DC2626; color: #ffffff; font-weight: bold; font-size: 12px; text-align: center; height: 32px; border: 1px solid #B91C1C; }
          .agg-ranking-header { background-color: #0F766E; color: #ffffff; font-weight: bold; font-size: 12px; text-align: center; height: 32px; border: 1px solid #0F766E; }
          .cba-sub-header { background-color: #062545; color: #ffffff; font-weight: bold; font-size: 10px; text-align: center; height: 28px; border: 1px solid #062545; }
          .agg-finalized-sub { background-color: #15803D; color: #ffffff; font-weight: bold; font-size: 10px; text-align: center; height: 28px; border: 1px solid #15803D; }
          .agg-rejected-sub { background-color: #B91C1C; color: #ffffff; font-weight: bold; font-size: 10px; text-align: center; height: 28px; border: 1px solid #B91C1C; }
          .agg-ranking-sub { background-color: #0D635C; color: #ffffff; font-weight: bold; font-size: 10px; text-align: center; height: 28px; border: 1px solid #0D635C; }
          .cell { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
          .cell-left { text-align: left; }
          .cell-right { text-align: right; }
          .cell-center { text-align: center; }
          .sub-bank-cell { background-color: #fafafa; font-style: italic; color: #475569; }
          .finalized-cell { background-color: #f0fdf4; color: #14532d; font-weight: 600; border: 1px solid #bbf7d0; }
          .rejected-cell { background-color: #fef2f2; color: #7f1d1d; border: 1px solid #fecaca; }
          .totals-row { background-color: #f1f5f9; font-weight: bold; font-size: 11px; border-top: 2px solid #64748b; border-bottom: 2px solid #64748b; height: 30px; }
        </style>
      </head>
      <body>
        <table>
          <!-- Title & Metadata -->
          <tr>
            <th colspan="${totalCols}" class="title-row">CENTRAL BANK OF INDIA - COST BENEFIT ANALYSIS FOR PAYMENT AGGREGATION</th>
          </tr>
          <tr>
            <th colspan="${totalCols}" class="meta-row">
              Application ID: #${customerDetails?.applicationId || 'N/A'} | Customer: ${customerDetails?.customerName || 'N/A'} | Category: ${customerDetails?.category || 'N/A'} | Export Date: ${dayjs().format('DD-MMM-YYYY HH:mm')}
            </th>
          </tr>
          <tr><td colspan="${totalCols}" style="height: 10px;"></td></tr>

          <!-- Top Headers -->
          <tr>
            <th colspan="7" class="cba-top-header">Cost Benefit Analysis for Payment Aggregation (Online)</th>
    `;

    activeAggs.forEach(agg => {
      const isFinalized = Boolean(
        (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
        (finalizedAggregatorId && (Number(agg.aggregatorId) === Number(finalizedAggregatorId) || String(agg.aggregatorId) === String(finalizedAggregatorId)))
      );
      const rankIndex = sortedActiveAggs.findIndex(a => a.aggregatorId === agg.aggregatorId) + 1;
      const rankLabel = rankIndex > 0 ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}` : "";

      const aggClass = isAccepted
        ? (isFinalized ? "agg-finalized-header" : "agg-rejected-header")
        : (isFinalized ? "agg-finalized-header" : "agg-ranking-header");

      const statusText = isFinalized
        ? "✓ Selected (Finalized)"
        : (isAccepted ? "✗ Rejected" : `(${rankLabel})`);

      tableHtml += `
        <th colspan="3" class="${aggClass}">
          ${agg.aggregatorName}<br/>
          <span style="font-size: 9px; font-weight: normal;">${statusText}</span>
        </th>
      `;
    });

    tableHtml += `</tr><tr>`;

    // Sub-headers
    const subHeaders = [
      "% Share Transaction Count",
      "% Share Transaction Value",
      "Type of Transaction",
      "Estimated No of Transactions",
      "Aggregate amount (Rs)",
      "Charges proposed",
      "Gross Amount Received from Charges (Rs)"
    ];

    subHeaders.forEach(sh => {
      tableHtml += `<th class="cba-sub-header">${sh}</th>`;
    });

    activeAggs.forEach(agg => {
      const isFinalized = Boolean(
        (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
        (finalizedAggregatorId && (Number(agg.aggregatorId) === Number(finalizedAggregatorId) || String(agg.aggregatorId) === String(finalizedAggregatorId)))
      );
      const subClass = isAccepted
        ? (isFinalized ? "agg-finalized-sub" : "agg-rejected-sub")
        : (isFinalized ? "agg-finalized-sub" : "agg-ranking-sub");

      tableHtml += `
        <th class="${subClass}">Rate</th>
        <th class="${subClass}">Vendor Share (Rs)</th>
        <th class="${subClass}">Expected Revenue (Rs)</th>
      `;
    });

    tableHtml += `</tr>`;

    // Data rows
    baseRows.forEach(row => {
      const isSubBank = row.isIB;
      const countVal = isSubBank ? "" : formatPercent(row.transactionCount);
      const valueVal = isSubBank ? "" : formatPercent(row.transactionValue);
      const typeVal = isSubBank && row.transactionTypePercent ? `&nbsp;&nbsp;&nbsp;${row.transactionType} (${row.transactionTypePercent})` : row.transactionType;
      const estTxns = Math.round(row.estimatedTransactions) || 0;
      const aggAmt = row.aggregateAmount ? formatNumber(row.aggregateAmount) : "0.00";
      const chargesProp = row.allow ? (row.unit === PERCENTAGE ? `${row.chargesProposed}%` : formatNumber(row.chargesProposed)) : "";
      const grossAmt = row.allow ? formatNumber(row.grossAmount) : "";

      const rowClass = isSubBank ? "sub-bank-cell" : "";

      tableHtml += `
        <tr>
          <td class="cell cell-right ${rowClass}">${countVal}</td>
          <td class="cell cell-right ${rowClass}">${valueVal}</td>
          <td class="cell cell-left ${rowClass}">${typeVal}</td>
          <td class="cell cell-right ${rowClass}">${estTxns.toLocaleString()}</td>
          <td class="cell cell-right ${rowClass}">${aggAmt}</td>
          <td class="cell cell-right ${rowClass}">${chargesProp}</td>
          <td class="cell cell-right ${rowClass}">${grossAmt}</td>
      `;

      activeAggs.forEach(agg => {
        const isFinalized = Boolean(
          (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
          (finalizedAggregatorId && (Number(agg.aggregatorId) === Number(finalizedAggregatorId) || String(agg.aggregatorId) === String(finalizedAggregatorId)))
        );
        const aggCellClass = isAccepted
          ? (isFinalized ? "finalized-cell" : "rejected-cell")
          : (isFinalized ? "finalized-cell" : "");

        const aggProjList = allProjections[agg.aggregatorId] || [];
        const aggRow = aggProjList.find(r => r.transactionType === row.transactionType) || {};

        const rateStr = row.allow ? (aggRow.rate !== undefined && aggRow.rate !== null && aggRow.rate !== "" ? (aggRow.unit === PERCENTAGE ? `${aggRow.rate}%` : formatNumber(aggRow.rate)) : "0") : "";
        const vShareStr = row.allow ? (aggRow.vendorShare !== undefined ? formatNumber(aggRow.vendorShare) : "0.00") : "";
        const expRevStr = row.allow ? (aggRow.expectedRevenue !== undefined ? formatNumber(aggRow.expectedRevenue) : "0.00") : "";

        tableHtml += `
          <td class="cell cell-right ${aggCellClass} ${rowClass}">${rateStr}</td>
          <td class="cell cell-right ${aggCellClass} ${rowClass}">${vShareStr}</td>
          <td class="cell cell-right ${aggCellClass} ${rowClass}">${expRevStr}</td>
        `;
      });

      tableHtml += `</tr>`;
    });

    // Totals row
    tableHtml += `
      <tr class="totals-row">
        <td class="cell cell-center totals-row"></td>
        <td class="cell cell-center totals-row"></td>
        <td class="cell cell-left totals-row">TOTAL</td>
        <td class="cell cell-right totals-row">${(baseTotals.totalEstimatedTransactions || 0).toLocaleString()}</td>
        <td class="cell cell-right totals-row">${formatNumber(baseTotals.totalAggregateAmount || 0)}</td>
        <td class="cell cell-center totals-row"></td>
        <td class="cell cell-right totals-row">${formatNumber(baseTotals.totalGrossAmount || 0)}</td>
    `;

    activeAggs.forEach(agg => {
      const isFinalized = Boolean(
        (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
        (finalizedAggregatorId && (Number(agg.aggregatorId) === Number(finalizedAggregatorId) || String(agg.aggregatorId) === String(finalizedAggregatorId)))
      );
      const aggCellClass = isAccepted
        ? (isFinalized ? "finalized-cell" : "rejected-cell")
        : (isFinalized ? "finalized-cell" : "");

      const totals = aggregatorTotals[agg.aggregatorId] || {};
      tableHtml += `
        <td class="cell cell-center totals-row ${aggCellClass}"></td>
        <td class="cell cell-right totals-row ${aggCellClass}">${formatNumber(totals.totalVendorShare || 0)}</td>
        <td class="cell cell-right totals-row ${aggCellClass}">${formatNumber(totals.totalExpectedRevenue || 0)}</td>
      `;
    });

    tableHtml += `</tr></table></body></html>`;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    saveAs(blob, `Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}_App${customerDetails?.applicationId || ""}.xls`);
    successNotification("✅ Premium styled Excel report exported successfully!");
  };

  const cbaTableRef = React.useRef(null);

  const handleExportPDF = async () => {
    try {
      const element = cbaTableRef.current;
      if (!element) return;

      const oldWidth = element.style.width;
      const oldOverflow = element.style.overflow;
      const fullWidth = Math.max(element.scrollWidth, 1200);

      // Expand to full content width so no columns get clipped
      element.style.width = `${fullWidth}px`;
      element.style.overflow = "visible";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: fullWidth + 80,
        scrollX: 0,
        scrollY: 0,
      });

      // Restore original styling
      element.style.width = oldWidth;
      element.style.overflow = oldOverflow;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const printWidth = pageWidth - (margin * 2);
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", margin, margin, printWidth, Math.min(printHeight, pageHeight - (margin * 2)));
      pdf.save(`Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}_App${customerDetails?.applicationId || ""}.pdf`);
      successNotification("✅ High-resolution PDF exported successfully!");
    } catch (err) {
      console.error("PDF generation error: ", err);
      errorNotification("Failed to generate PDF");
    }
  };

  const baseHeaderCellSx = {
    fontWeight: 700,
    fontSize: "11px",
    py: "8px !important",
    px: "6px !important",
    color: "#ffffff !important",
    whiteSpace: "normal !important",
    wordBreak: "break-word",
    lineHeight: 1.2,
    verticalAlign: "middle",
    textTransform: "none !important",
    border: "1px solid rgba(255, 255, 255, 0.3) !important",
    borderBottom: "2px solid #062545 !important",
  };

  const leftHeaderCellSx = {
    ...baseHeaderCellSx,
    background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%) !important",
    border: "1px solid #0B3D6D !important",
    borderBottom: "2px solid #062545 !important",
  };

  const baseSubHeaderCellSx = {
    fontWeight: 700,
    fontSize: "10px",
    py: "6px !important",
    px: "4px !important",
    color: "#ffffff !important",
    whiteSpace: "normal !important",
    wordBreak: "break-word",
    lineHeight: 1.15,
    verticalAlign: "middle",
    textTransform: "none !important",
    border: "1px solid rgba(255, 255, 255, 0.3) !important",
    borderBottom: "2px solid #062545 !important",
  };

  const leftSubHeaderCellSx = {
    ...baseSubHeaderCellSx,
    background: "linear-gradient(90deg, #062545 0%, #0E4F8D 100%) !important",
    border: "1px solid #062545 !important",
    borderBottom: "2px solid #062545 !important",
  };

  const cellSx = {
    fontSize: "11px",
    py: "6px !important",
    px: "8px !important",
    whiteSpace: "normal",
    wordBreak: "break-word",
    border: "1px solid #cbd5e1 !important",
  };

  const totalCellSx = {
    fontWeight: 800,
    fontSize: "11px",
    py: "8px !important",
    px: "8px !important",
    bgcolor: "#f1f5f9",
    border: "1px solid #94a3b8 !important",
    borderTop: "2px solid #64748b !important",
    borderBottom: "2px solid #64748b !important",
  };

  const isAccepted = Boolean(
    customerDetails?.isFinalApproved ||
    customerDetails?.isQuoteAcceptRO ||
    customerDetails?.isQuoteAcceptReviewByCO ||
    finalizedAggregatorId
  );

  return (
    <Box sx={{ width: "100%", mt: 2, p: 2 }}>
      {/* Downloader & Legend Bar */}
      {isAccepted && (
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, bgcolor: "#f8fafc", p: 1.5, borderRadius: "0px", border: "1px solid #cbd5e1" }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {finalizedAggregatorId && (
              <span>
                ℹ️ Color Legend: <strong style={{ color: "#16a34a" }}>Green columns</strong> represent the Finalized Aggregator. <strong style={{ color: "#dc2626" }}>Red columns</strong> represent other rejected aggregators.
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
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0px" }}
            >
              Download Excel
            </Button>
            {activeAggs.length === 1 && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Download />}
                onClick={handleExportPDF}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0px" }}
              >
                Download PDF
              </Button>
            )}
          </Stack>
        </Box>
      )}

      <Box ref={cbaTableRef} sx={{ p: 1, bgcolor: "#ffffff", width: "100%", overflowX: "auto" }}>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            overflowX: "auto !important",
            maxWidth: "100%",
            borderRadius: "10px 10px 0 0",
            border: "1px solid #cbd5e1",
            boxShadow: "none",
            "&::-webkit-scrollbar": {
              height: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f5f9",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#94a3b8",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "#64748b",
              },
            },
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: `${680 + activeAggs.length * 360}px`,
              width: "100%",
              tableLayout: "auto",
              borderCollapse: "collapse"
            }}
          >
            <TableHead>
              {/* Row 1: Aggregator Headers */}
              <TableRow>
                <TableCell colSpan={7} sx={{ ...leftHeaderCellSx, borderTopLeftRadius: "9px" }} align="center">
                  Cost Benefit Analysis for Payment Aggregation (Online)
                </TableCell>
                {activeAggs.map((agg, aIdx) => {
                  const isLastAgg = aIdx === activeAggs.length - 1;
                  const isFinalized = Boolean(
                    (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
                    (finalizedAggregatorId && (
                      Number(agg.aggregatorId) === Number(finalizedAggregatorId) ||
                      String(agg.aggregatorId) === String(finalizedAggregatorId)
                    )) ||
                    (customerDetails?.finalAggregatorId && (
                      Number(agg.aggregatorId) === Number(customerDetails.finalAggregatorId) ||
                      String(agg.aggregatorId) === String(customerDetails.finalAggregatorId)
                    )) ||
                    agg?.isFinalized === true ||
                    agg?.isAccepted === true ||
                    String(agg?.status || '').toLowerCase() === 'approved' ||
                    String(agg?.status || '').toLowerCase() === 'accepted' ||
                    String(agg?.status || '').toLowerCase() === 'finalized'
                  );

                  const headerBg = isAccepted
                    ? (isFinalized ? "#16a34a" : "#dc2626")
                    : (isFinalized ? "#16a34a" : "#0f766e");
                  const headerBorder = isAccepted
                    ? (isFinalized ? "#15803d" : "#b91c1c")
                    : (isFinalized ? "#15803d" : "#0f766e");
                  const rankIndex = sortedActiveAggs.findIndex(a => a.aggregatorId === agg.aggregatorId) + 1;
                  const rankLabel = rankIndex > 0 ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}` : "";
                  return (
                    <TableCell
                      key={agg.aggregatorId}
                      colSpan={3}
                      style={{ background: headerBg, backgroundColor: headerBg }}
                      sx={{
                        ...baseHeaderCellSx,
                        background: `${headerBg} !important`,
                        backgroundColor: `${headerBg} !important`,
                        border: `1px solid ${headerBorder} !important`,
                        color: "#ffffff !important",
                        py: "8px !important",
                        borderTopRightRadius: isLastAgg ? "9px" : "0px",
                      }}
                      align="center"
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "11.5px", color: "#ffffff", letterSpacing: "0.2px" }}>
                          {agg.aggregatorName}
                        </Typography>
                        <Typography sx={{ fontSize: "9.5px", opacity: 0.95, fontWeight: 700, color: "#ffffff", mt: 0.2 }}>
                          {isFinalized
                            ? "✓ Selected (Finalized)"
                            : (isAccepted ? "✗ Rejected" : `(${rankLabel})`)
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
              {/* Row 2: Sub-headers */}
              <TableRow>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>% Share Transaction Count</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>% Share Transaction Value</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "150px" }}>Type of Transaction</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "110px" }}>Estimated No of Transactions</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "120px" }}>Aggregate amount (Rs)</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>Charges proposed</TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "140px" }}>Gross Amount Received from Charges (Rs)</TableCell>
                {activeAggs.map((agg) => {
                  const isFinalized = Boolean(
                    (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
                    (finalizedAggregatorId && (
                      Number(agg.aggregatorId) === Number(finalizedAggregatorId) ||
                      String(agg.aggregatorId) === String(finalizedAggregatorId)
                    )) ||
                    (customerDetails?.finalAggregatorId && (
                      Number(agg.aggregatorId) === Number(customerDetails.finalAggregatorId) ||
                      String(agg.aggregatorId) === String(customerDetails.finalAggregatorId)
                    )) ||
                    agg?.isFinalized === true ||
                    agg?.isAccepted === true ||
                    String(agg?.status || '').toLowerCase() === 'approved' ||
                    String(agg?.status || '').toLowerCase() === 'accepted' ||
                    String(agg?.status || '').toLowerCase() === 'finalized'
                  );

                  const subHeaderBg = isAccepted
                    ? (isFinalized ? "#15803d" : "#b91c1c")
                    : (isFinalized ? "#15803d" : "#0d635c");
                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell style={{ background: subHeaderBg, backgroundColor: subHeaderBg }} sx={{ ...baseSubHeaderCellSx, background: `${subHeaderBg} !important`, backgroundColor: `${subHeaderBg} !important`, border: `1px solid ${subHeaderBg} !important`, minWidth: "80px" }}>Rate</TableCell>
                      <TableCell style={{ background: subHeaderBg, backgroundColor: subHeaderBg }} sx={{ ...baseSubHeaderCellSx, background: `${subHeaderBg} !important`, backgroundColor: `${subHeaderBg} !important`, border: `1px solid ${subHeaderBg} !important`, minWidth: "90px" }}>Vendor Share (Rs)</TableCell>
                      <TableCell style={{ background: subHeaderBg, backgroundColor: subHeaderBg }} sx={{ ...baseSubHeaderCellSx, background: `${subHeaderBg} !important`, backgroundColor: `${subHeaderBg} !important`, border: `1px solid ${subHeaderBg} !important`, minWidth: "100px" }}>Expected Revenue (Rs)</TableCell>
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
                      const isFinalized = Boolean(
                        (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
                        (finalizedAggregatorId && (
                          Number(agg.aggregatorId) === Number(finalizedAggregatorId) ||
                          String(agg.aggregatorId) === String(finalizedAggregatorId)
                        )) ||
                        (customerDetails?.finalAggregatorId && (
                          Number(agg.aggregatorId) === Number(customerDetails.finalAggregatorId) ||
                          String(agg.aggregatorId) === String(customerDetails.finalAggregatorId)
                        )) ||
                        agg?.isFinalized === true ||
                        agg?.isAccepted === true ||
                        String(agg?.status || '').toLowerCase() === 'approved' ||
                        String(agg?.status || '').toLowerCase() === 'accepted' ||
                        String(agg?.status || '').toLowerCase() === 'finalized'
                      );

                      const columnBg = isAccepted
                        ? (isFinalized ? "#f0fdf4" : "#fef2f2")
                        : (isFinalized ? "#f0fdf4" : "#f8fafc");
                      const columnBorder = isAccepted
                        ? (isFinalized ? "#86efac" : "#fca5a5")
                        : (isFinalized ? "#86efac" : "#e2e8f0");
                      const textCol = isAccepted
                        ? (isFinalized ? "#14532d" : "#7f1d1d")
                        : "inherit";

                      return (
                        <React.Fragment key={agg.aggregatorId}>
                          <TableCell sx={{ ...cellSx, bgcolor: `${columnBg} !important`, border: `1px solid ${columnBorder} !important`, color: textCol }} align="right">
                            {aggRow.allow && aggRow.rate !== undefined ? (aggRow.unit === PERCENTAGE ? `${aggRow.rate}${PERCENTAGE}` : `${aggRow.rate}`) : ""}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, bgcolor: `${columnBg} !important`, border: `1px solid ${columnBorder} !important`, color: textCol, fontWeight: isFinalized ? 600 : 400 }} align="right">
                            {aggRow.allow ? formatNumber(aggRow.vendorShare) : ""}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, bgcolor: `${columnBg} !important`, border: `1px solid ${columnBorder} !important`, color: textCol, fontWeight: isFinalized ? 700 : 400 }} align="right">
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
                  const isFinalized = Boolean(
                    (activeAggs.length === 1 && (customerDetails?.isFinalApproved || customerDetails?.isQuoteAcceptRO || finalizedAggregatorId)) ||
                    (finalizedAggregatorId && (
                      Number(agg.aggregatorId) === Number(finalizedAggregatorId) ||
                      String(agg.aggregatorId) === String(finalizedAggregatorId)
                    )) ||
                    (customerDetails?.finalAggregatorId && (
                      Number(agg.aggregatorId) === Number(customerDetails.finalAggregatorId) ||
                      String(agg.aggregatorId) === String(customerDetails.finalAggregatorId)
                    )) ||
                    agg?.isFinalized === true ||
                    agg?.isAccepted === true ||
                    String(agg?.status || '').toLowerCase() === 'approved' ||
                    String(agg?.status || '').toLowerCase() === 'accepted' ||
                    String(agg?.status || '').toLowerCase() === 'finalized'
                  );

                  const totalsBg = isAccepted
                    ? (isFinalized ? "#dcfce7" : "#fee2e2")
                    : (isFinalized ? "#dcfce7" : "#e6f4f1");
                  const totalsBorder = isAccepted
                    ? (isFinalized ? "#4ade80" : "#f87171")
                    : (isFinalized ? "#4ade80" : "#cbd5e1");
                  const totalTextColor = isAccepted
                    ? (isFinalized ? "#15803d" : "#b91c1c")
                    : (isFinalized ? "#15803d" : "#0f172a");

                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell sx={{ ...totalCellSx, bgcolor: `${totalsBg} !important`, border: `1px solid ${totalsBorder} !important` }}></TableCell>
                      <TableCell sx={{ ...totalCellSx, bgcolor: `${totalsBg} !important`, border: `1px solid ${totalsBorder} !important`, color: `${totalTextColor} !important`, fontWeight: 800 }} align="right">
                        {formatNumber(totals.totalVendorShare)}
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, bgcolor: `${totalsBg} !important`, border: `1px solid ${totalsBorder} !important`, color: `${totalTextColor} !important`, fontWeight: 800 }} align="right">
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
