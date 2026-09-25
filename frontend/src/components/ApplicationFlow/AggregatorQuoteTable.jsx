import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  Add,
  CheckCircle,
  CurrencyRupee,
  Gavel,
  InfoOutlined,
  Send
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import {
  MANAGE_AGGREGATOR_TABLE_COLUMNS,
  PROJECTION_CAL_DETAILS
} from "&src/constants/PaymentAggregratorConstant";
import useAggregatorDetails from "&src/hooks/useAggregatorDetails";
import aggregatorByApplication from "&src/services/aggregatorByApplication";
import aggregatorProjections from "&src/services/aggregatorProjections";
import applicationServices from "&src/services/applications";
import {
  calculateProjectionDetails,
  calculateQuoteRow,
  calculateTotals,
  getProjectionsForCustomer,
  getChannelOrder
} from "&src/utils/calculation";
import { sortAggregatorsByQuote, isUserAdmin } from "&src/utils";

import DatePicker from "&src/components/DatePicker";
import DialogWithHeader from "&src/components/Dialog/DialogWithHeader";
import FullScreenLoader from "&src/components/Loaders/FullScreenLoader";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";
import ManageAggregatorForm from "&src/modules/ManageAggregrator/ManageAggregatorForm";
import {
  fetchApplicationDetails,
  updateApplicationWorkflow
} from "&src/store/applicationFlowSlice";

import AddCharges from "./AddCharges";
import {
  AggregatorEmailDialog,
  AggregatorListView,
  CostBenefitAnalysisView,
  WaiverForwardDialog
} from "./AggregatorQuote";

const AggregatorQuoteTable = ({ customerDetails }) => {
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

  // Official Central Bank of India Email Template Editable States
  const [emailSubject, setEmailSubject] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("Tarun (standard)");
  const [emailIntroText, setEmailIntroText] = useState(
    "We request you to share the quotation for merchant onboarding whose details are mentioned below:"
  );
  const [emailModes, setEmailModes] = useState(
    "Credit cards/Debit cards/ Netbanking/ UPI/ Any Other mode (optional case to case basis)"
  );
  const [emailBizType, setEmailBizType] = useState("");
  const [emailCategory, setEmailCategory] = useState("standard");
  const [emailAvgTicket, setEmailAvgTicket] = useState("");
  const [emailExpectedTxns, setEmailExpectedTxns] = useState("");
  const [emailWhoBearsCharges, setEmailWhoBearsCharges] = useState("");
  const [emailAdditionalDetails, setEmailAdditionalDetails] = useState("");
  const [emailDeadline, setEmailDeadline] = useState("");
  const [emailSubmissionTo, setEmailSubmissionTo] = useState(
    "smit1dptb@centralbank.bank.in"
  );
  const [emailManagerName, setEmailManagerName] = useState("Shraddha Saxena");
  const [emailManagerDesig, setEmailManagerDesig] = useState("Manager");
  const [emailManagerDept, setEmailManagerDept] = useState(
    "Neo Banking & Emerging Technologies"
  );
  const [emailManagerOffice, setEmailManagerOffice] = useState("Central Office");
  const [emailManagerPhone, setEmailManagerPhone] = useState("022-49197333");
  const [emailCustomNotes, setEmailCustomNotes] = useState("");

  const userDetails = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("userDetails") || "{}");
    } catch {
      return {};
    }
  }, []);
  const isAdmin = isUserAdmin(userDetails);
  const currentUserId =
    sessionStorage.getItem("userId") ||
    sessionStorage.getItem("user_id") ||
    userDetails.employeeId ||
    userDetails.pfNumber;
  const isReadOnlyUser = String(currentUserId) === "115019" || !isAdmin;
  const isRejected =
    customerDetails?.status?.toLowerCase()?.includes("reject") ||
    Boolean(customerDetails?.reasonOfRejection) ||
    Boolean(customerDetails?.rejectedDate);

  // Waiver / Acceptance Dialog States
  const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false);
  const [targetAggregatorForForward, setTargetAggregatorForForward] = useState(null);
  const [waiverChoice, setWaiverChoice] = useState("YES");
  const [waiverSubmitting, setWaiverSubmitting] = useState(false);

  const {
    applicationId,
    aggregateDepositAmt,
    avgTransactionYearly,
    isQuoteAcceptRO,
    finalizedAggregatorId,
    category,
    avgTransactionSize
  } = customerDetails || {};

  const requestedChannels = useMemo(() => {
    const rawProjs = customerDetails?.projection;
    let baseList = [];
    if (rawProjs) {
      baseList =
        typeof rawProjs === "string"
          ? rawProjs
              .split("|")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
    }
    if (appProjectionsList && appProjectionsList.length > 0) {
      const listFromProjs = appProjectionsList
        .map((p) => p.transactionType)
        .filter(Boolean);
      for (const t of listFromProjs) {
        if (!baseList.includes(t)) baseList.push(t);
      }
    }
    if (baseList.length > 0) return baseList;
    return [
      "UPI",
      "Internet banking",
      "Debit card - Rupay",
      "Debit card - Master/Visa",
      "Credit cards"
    ];
  }, [appProjectionsList, customerDetails?.projection]);

  const hasAddedCharges = useMemo(() => {
    if (customerDetails?.isMarkUpAddedCO || customerDetails?.isQuoteReviewCO) return true;
    return Object.values(allProjections || {}).some((rows) =>
      Array.isArray(rows) && rows.some((r) => Number(r.chargesProposed) > 0)
    );
  }, [customerDetails?.isMarkUpAddedCO, customerDetails?.isQuoteReviewCO, allProjections]);

  const isQuoteAcceptedAndFinalized = Boolean(
    customerDetails?.isFinalApproved ||
      (customerDetails?.isQuoteAcceptReviewByCO &&
        customerDetails?.isQuoteAcceptRO)
  );

  const generateInitialBaseline = useCallback(
    (list) => {
      if (!applicationId || !list?.length) return {};
      const projectionList = getProjectionsForCustomer(
        PROJECTION_CAL_DETAILS,
        customerDetails?.projection,
        avgTransactionSize,
        applicationId
      );
      const baselineCalculated = calculateProjectionDetails({
        projectionDetails: projectionList,
        avgTransactionYearly,
        aggregateDepositAmt,
        applicationId
      });

      const baselineMap = {};
      list.forEach((agg) => {
        baselineMap[agg.aggregatorId] = baselineCalculated.map((p) => ({
          ...p,
          aggregatorId: agg.aggregatorId,
          rate: 0,
          chargesProposed: 0,
          grossAmount: 0,
          vendorShare: 0,
          expectedRevenue: 0
        }));
      });
      return baselineMap;
    },
    [
      applicationId,
      customerDetails?.projection,
      avgTransactionSize,
      avgTransactionYearly,
      aggregateDepositAmt
    ]
  );

  const fetchAllProjections = useCallback(
    async (aggregatorsList) => {
      const list = aggregatorsList || selectedAggregatorsDetails;
      if (!applicationId || !list?.length) return;
      try {
        setProjectionsLoading(true);
        const promises = list.map(async (agg) => {
          let rawData = [];
          try {
            const response = await aggregatorProjections.getAllProjections(
              applicationId,
              agg.aggregatorId
            );
            rawData = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
              ? response
              : [];
          } catch (apiErr) {
            console.warn(`Could not fetch projections for agg ${agg.aggregatorId}, using fallback:`, apiErr);
          }

          if (!rawData.length) {
            const projectionList = getProjectionsForCustomer(
              PROJECTION_CAL_DETAILS,
              customerDetails?.projection,
              avgTransactionSize,
              applicationId
            );
            rawData = calculateProjectionDetails({
              projectionDetails: projectionList,
              avgTransactionYearly,
              aggregateDepositAmt,
              applicationId
            }).map((p) => ({
              ...p,
              aggregatorId: agg.aggregatorId,
              rate: 0,
              chargesProposed: 0,
              grossAmount: 0,
              vendorShare: 0,
              expectedRevenue: 0
            }));
          }

          const cleanData = rawData.filter(
            (p) =>
              Number(p.applicationId) === Number(applicationId) &&
              (Number(p.aggregatorId) === Number(agg.aggregatorId) ||
                !p.aggregatorId ||
                Number(p.aggregatorId) === 0)
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

          // If Internet banking exists, ensure sub-bank bifurcation rows are present
          const ibIndex = uniqueData.findIndex(
            (p) => p.transactionType === "Internet banking" && !p.isIB
          );
          const hasIbChildren = uniqueData.some((p) => p.isIB);

          let finalData = [...uniqueData];
          if (ibIndex !== -1 && !hasIbChildren) {
            const ibParent = uniqueData[ibIndex];
            const ibChildren = [
              {
                transactionType: "SBI",
                transactionTypePercent: "68.61%",
                isIB: true,
                allow: true
              },
              {
                transactionType: "HDFC",
                transactionTypePercent: "10.78%",
                isIB: true,
                allow: true
              },
              {
                transactionType: "ICICI",
                transactionTypePercent: "5.57%",
                isIB: true,
                allow: true
              },
              {
                transactionType: "AXIS",
                transactionTypePercent: "4.47%",
                isIB: true,
                allow: true
              },
              {
                transactionType: "OTHERS",
                transactionTypePercent: "10.56%",
                isIB: true,
                allow: true
              }
            ].map((bank, bIdx) => {
              const percent =
                parseFloat(bank.transactionTypePercent) / 100 || 0;
              return {
                ...bank,
                id: `ib_${ibParent.id || "ib"}_${bIdx}`,
                applicationId,
                aggregatorId: agg.aggregatorId,
                order: (ibParent.order || 1) + (bIdx + 1) * 0.1,
                estimatedTransactions:
                  (ibParent.estimatedTransactions || 0) * percent,
                aggregateAmount:
                  (ibParent.aggregateAmount || 0) * percent,
                rate: 0,
                unit: "₹",
                chargesProposed: 0,
                grossAmount: 0,
                vendorShare: 0,
                expectedRevenue: 0
              };
            });

            finalData.splice(ibIndex + 1, 0, ...ibChildren);
          }

          // 1. Build baseline map from customer projection rules
          const totTxns = Number(
            avgTransactionYearly ||
            (customerDetails?.totalAnnualTransaction && Number(customerDetails.totalAnnualTransaction)) ||
            0
          );
          const totAmt = Number(
            aggregateDepositAmt ||
            customerDetails?.totalBankCollection ||
            customerDetails?.totalAnnualTransaction ||
            (avgTransactionSize * avgTransactionYearly) ||
            0
          );

          const baselineList = getProjectionsForCustomer(
            PROJECTION_CAL_DETAILS,
            customerDetails?.projection,
            avgTransactionSize,
            applicationId
          );
          const baselineMap = new Map();
          baselineList.forEach((b) => {
            const key = (b.transactionType || "").toLowerCase().trim();
            if (key) baselineMap.set(key, b);
          });

          // First pass: Merge baseline counts/values and compute parent volumes
          const pass1 = finalData.map((row) => {
            let r = { ...row, aggregatorId: agg.aggregatorId };
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

          const ibParent = pass1.find((r) => r.transactionType?.toLowerCase().includes("internet") && !r.isIB);

          // Second pass: Compute sub-bank rows and calculate commercial values
          const calculated = pass1
            .filter((r) => {
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
              const effectiveCharges = (r?.chargesProposed !== undefined && r?.chargesProposed !== null && r?.chargesProposed !== "" && Number(r?.chargesProposed) > 0)
                ? r?.chargesProposed
                : (Number(r?.rate) > 0 ? r?.rate : (r?.chargesProposed ?? ""));
              return calculateQuoteRow(r, effectiveCharges, r?.unit, r?.rate);
            });

          calculated.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
          return { aggregatorId: agg.aggregatorId, data: calculated };
        });
        const results = await Promise.all(promises);
        const mapped = {};
        results.forEach((res) => {
          mapped[res.aggregatorId] = res.data;
        });
        setAllProjections((prev) => ({ ...prev, ...mapped }));
      } catch (err) {
        console.error("[ERROR] Failed to fetch all projections:", err);
      } finally {
        setProjectionsLoading(false);
      }
    },
    [
      applicationId,
      avgTransactionSize,
      avgTransactionYearly,
      aggregateDepositAmt,
      selectedAggregatorsDetails,
      customerDetails?.projection
    ]
  );



  const showAddAggregatorSection = !customerDetails?.isAggregatorAdded;
  const { aggregatorDetails, fetchAllAggregators } = useAggregatorDetails();
  const [openAddModal, setOpenAddModal] = useState(false);

  // Tab State
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

  /** Fetch Selected Aggregators for this Application */
  const fetchSelectedAggregatorDetails = useCallback(async () => {
    if (!applicationId) return;
    try {
      setLoading(true);
      const response =
        await aggregatorByApplication.getAllAggregatorsByApplication(
          applicationId
        );
      const data = response?.data || response;
      const sorted = Array.isArray(data) ? sortAggregatorsByQuote(data) : [];
      setSelectedAggregatorsDetails(sorted);
      if (sorted.length > 0) {
        const initialMap = generateInitialBaseline(sorted);
        setAllProjections((prev) => ({ ...initialMap, ...prev }));
        fetchAllProjections(sorted);
      }
    } catch (error) {
      console.error("[ERROR] Failed to fetch aggregators:", error);
      errorNotification(
        error?.response?.data?.message || "Failed to fetch aggregators"
      );
    } finally {
      setLoading(false);
    }
  }, [applicationId, generateInitialBaseline, fetchAllProjections, errorNotification]);

  useEffect(() => {
    if (applicationId && customerDetails?.isAggregatorAdded) {
      fetchSelectedAggregatorDetails();
    }
  }, [applicationId, customerDetails?.isAggregatorAdded]);

  useEffect(() => {
    if (selectedAggregatorsDetails?.length > 0) {
      fetchAllProjections(selectedAggregatorsDetails);
    }
  }, [viewMode, isQuoteAcceptedAndFinalized, finalApprovedTab, selectedAggregatorsDetails?.length]);

  const handleRefresh = useCallback(async () => {
    await fetchSelectedAggregatorDetails();
  }, [fetchSelectedAggregatorDetails]);

  /** Open Confirmation & Waiver Dialog */
  const handleOpenAcceptanceModal = (agg) => {
    if (!agg || !applicationId) return;
    setTargetAggregatorForForward(agg);
    setWaiverChoice("YES");
    setAcceptanceModalOpen(true);
  };

  /** Execute Forward with Customer Acceptance or Waiver */
  const handleExecuteForwardWithWaiver = async () => {
    const agg = targetAggregatorForForward;
    if (!agg || !applicationId) return;
    setWaiverSubmitting(true);
    setForwardingAggId(agg.aggregatorId);
    try {
      // Fetch latest saved projections from backend to get verified rates and chargesProposed
      let dbRows = [];
      try {
        const response = await aggregatorProjections.getAllProjections(
          applicationId,
          agg.aggregatorId
        );
        dbRows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
      } catch (err) {
        console.warn("Could not fetch db projections, falling back to state:", err);
      }

      let localRows = allProjections[agg.aggregatorId] || [];

      // Merge: Start with dbRows, overlay any modified localRows if valid
      let rawData = [];
      if (dbRows.length > 0) {
        rawData = dbRows.map((dbRow) => {
          const localMatch = localRows.find(
            (lr) =>
              (lr.transactionId && lr.transactionId === dbRow.transactionId) ||
              (lr.transactionType && lr.transactionType === dbRow.transactionType)
          );
          if (localMatch) {
            return {
              ...dbRow,
              ...localMatch,
              chargesProposed:
                localMatch.chargesProposed !== undefined &&
                localMatch.chargesProposed !== null &&
                localMatch.chargesProposed !== "" &&
                Number(localMatch.chargesProposed) !== 0
                  ? localMatch.chargesProposed
                  : dbRow.chargesProposed,
              rate:
                localMatch.rate !== undefined &&
                localMatch.rate !== null &&
                localMatch.rate !== "" &&
                Number(localMatch.rate) !== 0
                  ? localMatch.rate
                  : dbRow.rate,
              unit:
                localMatch.unit ||
                dbRow.unit ||
                localMatch.bankUnit ||
                dbRow.bankUnit,
              bankUnit:
                localMatch.bankUnit ||
                dbRow.bankUnit ||
                localMatch.unit ||
                dbRow.unit
            };
          }
          return dbRow;
        });
      } else {
        rawData = localRows;
      }

      if (!rawData.length) {
        errorNotification(
          `No quotation projections found for ${agg.aggregatorName}. Please add rates first.`
        );
        setWaiverSubmitting(false);
        setForwardingAggId(null);
        return;
      }

      const calculatedRows = rawData.map((row) => {
        return calculateQuoteRow(
          row,
          row?.chargesProposed,
          row?.unit,
          row?.rate
        );
      });

      const totals = calculateTotals(calculatedRows);
      const userId =
        sessionStorage.getItem("userId") ||
        sessionStorage.getItem("user_id") ||
        1;
      const isWaived = waiverChoice === "NO";

      const appPayload = {
        isMarkUpAddedCO: true,
        isQuoteReviewCO: true,
        customerAcceptanceRequired: !isWaived,
        approvedByCOId: userId,
        finalizedAggregatorId: agg.aggregatorId,
        finalizedAggregatorName: agg.aggregatorName
      };

      if (isWaived) {
        appPayload.isQuoteAcceptRO = true;
        appPayload.status = "quoteaccepted";
      } else {
        appPayload.status = "reviewquote";
      }

      const [res, resAgg, resApp] = await Promise.all([
        aggregatorProjections.updateProjection(
          applicationId,
          agg.aggregatorId,
          calculatedRows
        ),
        aggregatorByApplication.updateAggregatorByApplication(
          applicationId,
          agg.aggregatorId,
          {
            ...totals,
            sumOfRate: agg.sumOfRate || 0,
            status: "submitted"
          }
        ),
        applicationServices.updateApplication(applicationId, appPayload)
      ]);

      const allSuccess = [res, resAgg, resApp].every(
        (r) => r?.status === 200 || r?.status === 201
      );

      if (!allSuccess) {
        throw new Error("One or more API calls failed.");
      }

      if (isWaived) {
        successNotification(
          ` Quotation for ${agg.aggregatorName} approved! Customer acceptance waived — jumped straight to PO stage.`
        );
      } else {
        successNotification(
          ` Quotation for ${agg.aggregatorName} forwarded to RO for customer acceptance.`
        );
      }

      setAcceptanceModalOpen(false);
      if (applicationId) {
        dispatch(fetchApplicationDetails(applicationId));
      }
      handleRefresh();
    } catch (err) {
      console.error("Error in handleExecuteForwardWithWaiver:", err);
      errorNotification(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to forward for customer acceptance"
      );
    } finally {
      setWaiverSubmitting(false);
      setForwardingAggId(null);
    }
  };

  /** Resend Quote Email to Aggregator */
  const handleResendQuoteEmail = async (agg) => {
    setResendingAggId(agg.aggregatorId);
    try {
      const payload =
        customerDetails?.status === "negotiation_requested"
          ? {
              isRevision: true,
              negotiationRemarks: customerDetails?.negotiationRemarks
            }
          : {};
      const res = await aggregatorProjections.resendQuoteEmail(
        applicationId,
        agg.aggregatorId,
        payload
      );
      if (res?.data?.status === "success" || res?.status === "success") {
        successNotification(
          res?.data?.message ||
            res?.message ||
            `Quotation email resent to ${agg.aggregatorName} successfully!`
        );
      } else {
        errorNotification(
          res?.data?.message || "Email queued. Check SMTP configuration in .env."
        );
      }
    } catch (err) {
      console.error("Error resending quote email:", err);
      errorNotification(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to resend quotation email"
      );
    } finally {
      setResendingAggId(null);
    }
  };

  /** Open Quote Preview Modal */
  const handleOpenQuotePreview = async () => {
    if (!selectedAggregators?.length) {
      return errorNotification(
        "Please select at least one aggregator from the list."
      );
    }

    const projectionList = getProjectionsForCustomer(
      PROJECTION_CAL_DETAILS,
      customerDetails?.projection,
      avgTransactionSize,
      applicationId
    );
    setAppProjectionsList(projectionList.filter((p) => !p.isIB));

    const deadlineDate = endDate
      ? typeof endDate === "string"
        ? endDate
        : dayjs(endDate).format("DD/MM/YYYY")
      : dayjs().add(2, "day").format("DD/MM/YYYY");
    setEmailSubject(
      `Quote submission mail - Application #${applicationId || ""} - Central Bank of India`
    );
    setEmailRecipient(
      selectedAggregators.length === 1
        ? selectedAggregators[0].contactPerson ||
            `${selectedAggregators[0].aggregatorName} Team` ||
            "Partner"
        : "Respective Aggregator (Personalized per recipient)"
    );
    setEmailIntroText(
      "We request you to share the quotation for merchant onboarding whose details are mentioned below:"
    );
    setEmailBizType(
      customerDetails?.businessCategory ||
        customerDetails?.category ||
        "standard"
    );
    setEmailCategory(customerDetails?.category || "standard");
    setEmailAvgTicket(
      customerDetails?.avgTransactionSize
        ? `₹ ${Number(customerDetails?.avgTransactionSize).toLocaleString("en-IN")}`
        : "standard"
    );
    setEmailExpectedTxns(
      customerDetails?.avgTransactionYearly
        ? Number(customerDetails?.avgTransactionYearly).toLocaleString("en-IN")
        : "standard"
    );
    setEmailWhoBearsCharges("");
    setEmailAdditionalDetails("");
    setEmailDeadline(deadlineDate);
    setEmailSubmissionTo("smit1dptb@centralbank.bank.in");
    setEmailManagerName("Shraddha Saxena");
    setEmailManagerDesig("Manager");
    setEmailManagerDept("Neo Banking & Emerging Technologies");
    setEmailManagerOffice("Central Office");
    setEmailManagerPhone("022-49197333");

    setQuoteConsent(false);
    setDispatchedAggregators(selectedAggregators);
    setEmailPreviewOpen(true);
  };

  /** Confirm & Dispatch Quotation Requests */
  const handleConfirmSendForQuote = async () => {
    if (!selectedAggregators?.length) {
      return errorNotification("Please select at least one aggregator");
    }

    try {
      setLoading(true);

      const customEmailData = {
        subject: emailSubject,
        recipient_name: emailRecipient,
        introText: emailIntroText,
        modesOfCollection: emailModes,
        businessCategory: emailBizType,
        category: emailCategory,
        avgTransactionSize: emailAvgTicket,
        avgTransactionYearly: emailExpectedTxns,
        whoBearsCharges: emailWhoBearsCharges ? emailWhoBearsCharges.trim() : "",
        additionalDetails: emailAdditionalDetails
          ? emailAdditionalDetails.trim()
          : "",
        submissionDeadline: emailDeadline,
        submissionEmail: emailSubmissionTo,
        managerName: emailManagerName,
        managerDesignation: emailManagerDesig,
        managerDept: emailManagerDept,
        managerOffice: emailManagerOffice,
        managerPhone: emailManagerPhone,
        customNotes: emailCustomNotes
      };

      const formattedEndDate = endDate
        ? typeof endDate.format === "function"
          ? endDate.format("YYYY-MM-DD")
          : String(endDate)
        : null;

      const aggregatorPayload = selectedAggregators.map((agg) => ({
        aggregatorId: agg.aggregatorId,
        aggregatorName: agg.aggregatorName,
        email: agg.email,
        endDate: formattedEndDate,
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
        customEmailData
      }));

      const aggResponse =
        await aggregatorByApplication.createAggregatorByApplication(
          applicationId,
          aggregatorPayload
        );
      const isSuccessStatus =
        !aggResponse?.status ||
        aggResponse?.status === 200 ||
        aggResponse?.status === 201;
      if (!isSuccessStatus) {
        throw new Error("Failed to add aggregator");
      }

      try {
        await dispatch(
          updateApplicationWorkflow({
            applicationId,
            payload: {
              isAggregatorAdded: true,
              isReviewByCO: true,
              status: "quoterequested"
            }
          })
        );
        dispatch(fetchApplicationDetails(applicationId));
      } catch (wfErr) {
        console.warn("Workflow stage update warning:", wfErr);
      }

      const names = selectedAggregators.map((a) => a.aggregatorName).join(", ");
      const emails = selectedAggregators
        .map((a) => a.email)
        .filter(Boolean)
        .join(", ");
      successNotification(
        `Quotation request & projection schedule successfully dispatched to ${names} (${emails})`
      );

      setEmailPreviewOpen(false);
      await fetchSelectedAggregatorDetails();
      await fetchAllProjections();
    } catch (err) {
      console.error("Error in handleConfirmSendForQuote:", err);
      errorNotification(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const sortAggregator = useCallback(
    (data) => {
      if (!Array.isArray(data)) return [];
      return [...data].sort((a, b) => {
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
        const rateA = Number(a.sumOfRate || 0);
        const rateB = Number(b.sumOfRate || 0);

        const hasA = shareA > 0 || (a.status === "submitted" && rateA > 0);
        const hasB = shareB > 0 || (b.status === "submitted" && rateB > 0);

        // Both have submitted quotes: lowest vendor share first (L1, L2, L3...)
        if (hasA && hasB) {
          if (shareA !== shareB) return shareA - shareB;
          return (a.aggregatorId || 0) - (b.aggregatorId || 0);
        }
        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;

        return (a.aggregatorId || 0) - (b.aggregatorId || 0);
      });
    },
    [allProjections]
  );

  const filteredAggregators =
    tabValue === "finalizedAggregator" && finalizedAggregatorId
      ? sortAggregator(
          selectedAggregatorsDetails.filter(
            (agg) => agg.aggregatorId === customerDetails.finalizedAggregatorId
          )
        )
      : sortAggregator(selectedAggregatorsDetails);

  return (
    <Box sx={{ width: "100%" }}>
      {loading && <FullScreenLoader />}

      {/* Rejection Banner for Rejected Applications */}
      {isRejected && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontWeight: 700,
            borderRadius: "8px",
            border: "1.5px solid #ef4444"
          }}
        >
          This application is REJECTED. All actions (sending quotes, entering
          rates, forwarding, approvals) are hidden and locked. Only
          inspection/viewing is available.
          {customerDetails?.reasonOfRejection
            ? ` Reason: ${customerDetails.reasonOfRejection}`
            : ""}
        </Alert>
      )}

      {/*  Add Aggregator Section */}
      {showAddAggregatorSection && !isRejected && (
        <Box sx={{ p: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight="bold">
              Payment Aggregators for Quote
              {!isReadOnlyUser && (
                <Button
                  variant="outlined"
                  className="ml-2"
                  startIcon={<Add />}
                  onClick={() => setOpenAddModal(true)}
                  sx={{ ml: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Add New Aggregator
                </Button>
              )}
            </Typography>

            {!isReadOnlyUser && (
              <Stack direction="row" spacing={2} alignItems="center">
                <DatePicker disablePast value={endDate} onChange={setEndDate} />
                <Tooltip
                  title="Choose the desired end date for quotation submission"
                  arrow
                  placement="top"
                >
                  <IconButton size="small">
                    <InfoOutlined color="primary" />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  onClick={handleOpenQuotePreview}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Send for Quote
                </Button>
              </Stack>
            )}
          </Box>

          <DataGrid
            checkboxSelection={!isReadOnlyUser}
            columns={MANAGE_AGGREGATOR_TABLE_COLUMNS}
            rows={aggregatorDetails || []}
            getRowId={(row) => row.aggregatorId}
            hideFooter
            autoHeight
            onRowSelectionModelChange={(selectionModel) => {
              setSelectedAggregators(
                aggregatorDetails.filter((row) =>
                  selectionModel.includes(row.aggregatorId)
                )
              );
            }}
          />
        </Box>
      )}

      {/* Dialog for adding a brand new aggregator */}
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
      <AggregatorEmailDialog
        open={emailPreviewOpen}
        onClose={() => setEmailPreviewOpen(false)}
        dispatchedAggregators={dispatchedAggregators}
        applicationId={applicationId}
        customerDetails={customerDetails}
        endDate={endDate}
        requestedChannels={requestedChannels}
        loading={loading}
        onConfirmSend={handleConfirmSendForQuote}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailRecipient={emailRecipient}
        setEmailRecipient={setEmailRecipient}
        emailIntroText={emailIntroText}
        setEmailIntroText={setEmailIntroText}
        emailModes={emailModes}
        setEmailModes={setEmailModes}
        emailBizType={emailBizType}
        setEmailBizType={setEmailBizType}
        emailCategory={emailCategory}
        setEmailCategory={setEmailCategory}
        emailAvgTicket={emailAvgTicket}
        setEmailAvgTicket={setEmailAvgTicket}
        emailExpectedTxns={emailExpectedTxns}
        setEmailExpectedTxns={setEmailExpectedTxns}
        emailWhoBearsCharges={emailWhoBearsCharges}
        setEmailWhoBearsCharges={setEmailWhoBearsCharges}
        emailAdditionalDetails={emailAdditionalDetails}
        setEmailAdditionalDetails={setEmailAdditionalDetails}
        emailDeadline={emailDeadline}
        setEmailDeadline={setEmailDeadline}
        emailSubmissionTo={emailSubmissionTo}
        setEmailSubmissionTo={setEmailSubmissionTo}
        emailManagerName={emailManagerName}
        setEmailManagerName={setEmailManagerName}
        emailManagerDesig={emailManagerDesig}
        setEmailManagerDesig={setEmailManagerDesig}
        emailManagerDept={emailManagerDept}
        setEmailManagerDept={setEmailManagerDept}
        emailManagerOffice={emailManagerOffice}
        setEmailManagerOffice={setEmailManagerOffice}
        emailManagerPhone={emailManagerPhone}
        setEmailManagerPhone={setEmailManagerPhone}
        emailCustomNotes={emailCustomNotes}
        setEmailCustomNotes={setEmailCustomNotes}
        quoteConsent={quoteConsent}
        setQuoteConsent={setQuoteConsent}
      />

      {/*  Added Aggregators Section */}
      {!showAddAggregatorSection && (
        <>
          {/* Rate Negotiation Banner for CO */}
          {Boolean(
            customerDetails?.status === "negotiation_requested" ||
              customerDetails?.isNegotiationRequested
          ) && (
            <Paper
              elevation={0}
              sx={{
                mx: 2,
                mb: 2,
                p: 2,
                bgcolor: "#fffbeb",
                border: "1px solid #f59e0b",
                borderLeft: "5px solid #d97706",
                borderRadius: "8px",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { sm: "center" },
                justifyContent: "space-between",
                gap: 2
              }}
            >
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <InfoOutlined
                  sx={{ color: "#d97706", fontSize: 24, mt: 0.3 }}
                />
                <Box>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.5}
                    flexWrap="wrap"
                  >
                    <Typography
                      sx={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#92400e"
                      }}
                    >
                      Customer Requested Rate Negotiation (Quote Revision #
                      {customerDetails?.currentQuoteVersion || 1})
                    </Typography>
                    <Chip
                      size="small"
                      label="Action Required by CO"
                      sx={{
                        bgcolor: "#fef3c7",
                        color: "#92400e",
                        fontWeight: 700,
                        fontSize: "11px",
                        height: "20px"
                      }}
                    />
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#78350f",
                      lineHeight: 1.5
                    }}
                  >
                    <strong>Merchant Counter-Proposal / Remarks:</strong>{" "}
                    {customerDetails?.negotiationRemarks ||
                      "Customer requested revised quote."}
                  </Typography>
                  {customerDetails?.negotiationRequestedDate && (
                    <Typography
                      sx={{ fontSize: "11px", color: "#a16207", mt: 0.5 }}
                    >
                      Requested on:{" "}
                      {dayjs(
                        customerDetails?.negotiationRequestedDate
                      ).format("DD MMM YYYY, hh:mm A")}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          )}

          <Box
            display="flex"
            justifyContent="space-between"
            mx={0}
            mb={1.5}
            alignItems="center"
          >
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
                  <Tab
                    value="all"
                    label="View All Aggregators (Side-by-Side)"
                  />
                </Tabs>
              )}
            </Box>
            <Box>
              {!isQuoteAcceptedAndFinalized &&
                !customerDetails?.isQuoteAcceptRO &&
                !isReadOnlyUser &&
                !isRejected && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      startIcon={<CurrencyRupee />}
                      variant="contained"
                      size="small"
                      onClick={() => setOpenModal(true)}
                      sx={{
                        bgcolor: "#0E4F8D",
                        color: "#ffffff",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "6px",
                        boxShadow: "0 2px 6px rgba(14, 79, 141, 0.25)",
                        "&:hover": { bgcolor: "#0B3D6D" }
                      }}
                    >
                      Add Charges
                    </Button>
                    <Tooltip
                      title="Add or update proposed charges as per projection details"
                      placement="top"
                      arrow
                    >
                      <IconButton size="small">
                        <InfoOutlined color="primary" fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
            </Box>
          </Box>

          {isQuoteAcceptedAndFinalized && (
            <Tabs
              value={finalApprovedTab}
              onChange={(e, val) => setFinalApprovedTab(val)}
              sx={{
                mx: 0,
                mb: 1.5,
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
                    bgcolor:
                      finalApprovedTab === "finalized" ? "#16a34a" : "#0E4F8D",
                    color: "#ffffff !important",
                    boxShadow:
                      finalApprovedTab === "finalized"
                        ? "0 2px 6px rgba(22, 163, 74, 0.25)"
                        : "0 2px 6px rgba(14, 79, 141, 0.25)"
                  }
                }
              }}
            >
              <Tab
                value="finalized"
                label="Finalized Aggregator Cost Benefit Analysis"
              />
              <Tab value="all" label="View All Aggregators" />
            </Tabs>
          )}

          {isQuoteAcceptedAndFinalized ? (
            <CostBenefitAnalysisView
              filteredAggregators={
                finalApprovedTab === "finalized"
                  ? sortAggregator(
                      selectedAggregatorsDetails.filter((agg) =>
                        finalizedAggregatorId
                          ? Number(agg.aggregatorId) ===
                              Number(finalizedAggregatorId) ||
                            String(agg.aggregatorId) ===
                              String(finalizedAggregatorId)
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
            <CostBenefitAnalysisView
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
                <Box
                  display="flex"
                  justifyContent="flex-start"
                  mb={1.5}
                  mx={0}
                >
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
                          bgcolor:
                            tabValue === "finalizedAggregator"
                              ? "#16a34a"
                              : "#0E4F8D",
                          color: "#ffffff !important",
                          boxShadow:
                            tabValue === "finalizedAggregator"
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

              <AggregatorListView
                filteredAggregators={filteredAggregators}
                selectedAggregatorsDetails={selectedAggregatorsDetails}
                allProjections={allProjections}
                openRow={openRow}
                setOpenRow={setOpenRow}
                finalizedAggregatorId={finalizedAggregatorId}
                customerDetails={customerDetails}
                isReadOnlyUser={isReadOnlyUser}
                isRejected={isRejected}
                resendingAggId={resendingAggId}
                forwardingAggId={forwardingAggId}
                onResendQuoteEmail={handleResendQuoteEmail}
                onOpenAcceptanceModal={handleOpenAcceptanceModal}
                onRefresh={handleRefresh}
              />
            </>
          )}
        </>
      )}

      {/*  Customer Acceptance Waiver Modal */}
      <WaiverForwardDialog
        open={acceptanceModalOpen}
        onClose={() => !waiverSubmitting && setAcceptanceModalOpen(false)}
        targetAggregator={targetAggregatorForForward}
        waiverChoice={waiverChoice}
        setWaiverChoice={setWaiverChoice}
        waiverSubmitting={waiverSubmitting}
        onConfirm={handleExecuteForwardWithWaiver}
      />

      <AddCharges
        openModal={openModal}
        setOpenModal={setOpenModal}
        applicationDetails={customerDetails}
        onSaveSuccess={handleRefresh}
      />
    </Box>
  );
};

export default AggregatorQuoteTable;
