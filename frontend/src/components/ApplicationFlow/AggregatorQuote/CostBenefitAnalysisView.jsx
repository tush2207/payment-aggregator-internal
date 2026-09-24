import React, { useState, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Dialog,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {
  Download,
  FullscreenExitRounded,
  FullscreenRounded,
  UnfoldLess,
  UnfoldMore
} from "@mui/icons-material";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import { formatNumber, PERCENTAGE } from "&src/utils";
import { PROJECTION_CAL_DETAILS } from "&src/constants/PaymentAggregratorConstant";
import { calculateTotals, getChannelOrder, calculateQuoteRow, getProjectionsForCustomer } from "&src/utils/calculation";
import useStatusWiseAlert from "&src/components/ToastNotifications/useStatusWiseAlert";

const CostBenefitAnalysisView = ({
  filteredAggregators = [],
  allProjections = {},
  projectionsLoading = false,
  finalizedAggregatorId,
  customerDetails = {}
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreenCBA, setIsFullScreenCBA] = useState(false);
  const cbaTableRef = useRef(null);

  const activeAggs = useMemo(() => {
    if (!filteredAggregators || !filteredAggregators.length) return [];
    return [...filteredAggregators].sort((a, b) => {
      const shareA = Number(
        (allProjections[a.aggregatorId] || []).reduce((s, r) => s + (Number(r.vendorShare) || 0), 0) ||
        a.totalVendorShare || 0
      );
      const shareB = Number(
        (allProjections[b.aggregatorId] || []).reduce((s, r) => s + (Number(r.vendorShare) || 0), 0) ||
        b.totalVendorShare || 0
      );
      const rateA = Number(a.sumOfRate || 0);
      const rateB = Number(b.sumOfRate || 0);

      const hasA = shareA > 0 || (a.status === "submitted" && rateA > 0);
      const hasB = shareB > 0 || (b.status === "submitted" && rateB > 0);

      if (hasA && hasB) {
        if (shareA !== shareB) return shareA - shareB;
        return (a.aggregatorId || 0) - (b.aggregatorId || 0);
      }
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      return (a.aggregatorId || 0) - (b.aggregatorId || 0);
    });
  }, [filteredAggregators, allProjections]);

  const baseRows = useMemo(() => {
    // 1. Extract highest proposed charges from all active aggregator projections
    const chargesMap = new Map();
    const unitMap = new Map();
    Object.values(allProjections || {}).forEach((aggRows) => {
      if (Array.isArray(aggRows)) {
        aggRows.forEach((r) => {
          const key = (r.transactionType || "").trim().toLowerCase();
          if (key && (r.chargesProposed !== undefined && r.chargesProposed !== null && r.chargesProposed !== "" && Number(r.chargesProposed) > 0)) {
            if (!chargesMap.has(key) || Number(r.chargesProposed) > Number(chargesMap.get(key))) {
              chargesMap.set(key, r.chargesProposed);
              unitMap.set(key, r.bankUnit || r.unit || PERCENTAGE);
            }
          }
        });
      }
    });

    // 2. Build baseline items from customer projection rules
    const totTxns = Number(
      customerDetails?.avgTransactionYearly ||
      (customerDetails?.totalAnnualTransaction && Number(customerDetails.totalAnnualTransaction)) ||
      0
    );
    const totAmt = Number(
      customerDetails?.aggregateDepositAmt ||
      customerDetails?.totalBankCollection ||
      (customerDetails?.avgTransactionSize * customerDetails?.avgTransactionYearly) ||
      0
    );

    const baselineList = getProjectionsForCustomer(
      PROJECTION_CAL_DETAILS,
      customerDetails?.projection,
      customerDetails?.avgTransactionSize,
      customerDetails?.applicationId
    );

    // Fallback charges from baseline & sub-banks if not in projections
    baselineList.forEach((b) => {
      const key = (b.transactionType || "").trim().toLowerCase();
      if (key && (b.chargesProposed !== undefined && b.chargesProposed !== null && b.chargesProposed !== "" && Number(b.chargesProposed) > 0)) {
        if (!chargesMap.has(key)) {
          chargesMap.set(key, b.chargesProposed);
          unitMap.set(key, b.bankUnit || b.unit || PERCENTAGE);
        }
      }
    });

    const subBankCharges = {
      sbi: { val: "25", unit: "₹" },
      hdfc: { val: "25", unit: "₹" },
      icici: { val: "25", unit: "₹" },
      axis: { val: "25", unit: "₹" },
      others: { val: "25", unit: "₹" },
      upi: { val: "0.00", unit: "%" },
      "debit card - rupay": { val: "0.00", unit: "%" },
      "debit card - master/visa": { val: "0.90", unit: "%" },
      "debit card - master/visa (upto 2000)": { val: "0.40", unit: "%" },
      "debit card - master/visa (> 2000)": { val: "0.90", unit: "%" },
      "credit cards": { val: "1.10", unit: "%" },
      "wallets & prepaid cards": { val: "1.50", unit: "%" },
    };
    Object.entries(subBankCharges).forEach(([k, item]) => {
      if (!chargesMap.has(k)) {
        chargesMap.set(k, item.val);
        unitMap.set(k, item.unit);
      }
    });

    let rows = [];
    let longestRows = [];
    activeAggs.forEach((agg) => {
      const projs = allProjections[agg.aggregatorId] || [];
      if (projs.length > longestRows.length) {
        longestRows = projs;
      }
    });

    if (longestRows.length > 0) {
      rows = longestRows.map((r) => ({ ...r }));
    } else {
      rows = baselineList.map((q, idx) => {
        const count = parseInt(q.transactionCount, 10) || 0;
        const val = parseInt(q.transactionValue, 10) || 0;
        return {
          ...q,
          id: `base_${idx + 1}`,
          order: q.order || idx + 1,
          transactionCount: q.isIB ? "" : `${count}%`,
          transactionValue: q.isIB ? "" : `${val}%`,
          estimatedTransactions: q.isIB ? 0 : Math.round(totTxns * (count / 100)),
          aggregateAmount: q.isIB ? 0 : totAmt * (val / 100),
          chargesProposed: "",
          unit: PERCENTAGE,
          bankUnit: PERCENTAGE
        };
      });
    }

    // Ensure sub-bank bifurcation rows (SBI, HDFC, ICICI, AXIS, OTHERS) are present
    const ibIndex = rows.findIndex((p) => p.transactionType === "Internet banking" && !p.isIB);
    const hasIbChildren = rows.some((p) => p.isIB);
    if (ibIndex !== -1 && !hasIbChildren) {
      const ibParent = rows[ibIndex];
      const countP = parseFloat(ibParent.transactionCount) / 100 || 0;
      const valP = parseFloat(ibParent.transactionValue) / 100 || 0;
      const parentTxns = (ibParent.estimatedTransactions && Number(ibParent.estimatedTransactions) > 0) ? Number(ibParent.estimatedTransactions) : Math.round(totTxns * countP);
      const parentAmt = (ibParent.aggregateAmount && Number(ibParent.aggregateAmount) > 0) ? Number(ibParent.aggregateAmount) : totAmt * valP;
      ibParent.estimatedTransactions = parentTxns;
      ibParent.aggregateAmount = parentAmt;

      const ibChildren = [
        { transactionType: "SBI", transactionTypePercent: "68.61%", isIB: true, allow: true, order: 2 },
        { transactionType: "HDFC", transactionTypePercent: "10.78%", isIB: true, allow: true, order: 3 },
        { transactionType: "ICICI", transactionTypePercent: "5.57%", isIB: true, allow: true, order: 4 },
        { transactionType: "AXIS", transactionTypePercent: "4.47%", isIB: true, allow: true, order: 5 },
        { transactionType: "OTHERS", transactionTypePercent: "10.56%", isIB: true, allow: true, order: 6 },
      ].map((bank, bIdx) => {
        const percent = parseFloat(bank.transactionTypePercent) / 100 || 0;
        return {
          ...bank,
          id: `ib_base_${bIdx}`,
          order: bank.order,
          estimatedTransactions: Math.round(parentTxns * percent),
          aggregateAmount: parentAmt * percent,
          chargesProposed: "",
          unit: "₹",
          bankUnit: "₹"
        };
      });
      rows.splice(ibIndex + 1, 0, ...ibChildren);
    }

    // 3. Enrich rows with baseline rules and calculate volumes and gross amount
    const baselineMap = new Map();
    baselineList.forEach((b) => {
      const k = (b.transactionType || "").toLowerCase().trim();
      if (k) baselineMap.set(k, b);
    });

    // Compute parent volumes
    const pass1 = rows.map((row) => {
      let r = { ...row };
      const k = (r.transactionType || "").toLowerCase().trim();
      const bData = baselineMap.get(k);
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
        if ((!r.estimatedTransactions || Number(r.estimatedTransactions) === 0) && countP > 0 && totTxns > 0) {
          r.estimatedTransactions = Math.round(totTxns * countP);
        }
        if ((!r.aggregateAmount || Number(r.aggregateAmount) === 0) && valP > 0 && totAmt > 0) {
          r.aggregateAmount = totAmt * valP;
        }
      }
      return r;
    });

    const ibParentPass1 = pass1.find((r) => r.transactionType?.toLowerCase().includes("internet") && !r.isIB);

    // Compute sub-banks and final quote calculation
    const calculatedRows = pass1.map((row) => {
      let r = { ...row };
      const k = (r.transactionType || "").toLowerCase().trim();
      if (r.isIB && ibParentPass1) {
        const percent = parseFloat(r.transactionTypePercent) / 100 || 0;
        if (!r.estimatedTransactions || Number(r.estimatedTransactions) === 0) {
          r.estimatedTransactions = Math.round((ibParentPass1.estimatedTransactions || 0) * percent);
        }
        if (!r.aggregateAmount || Number(r.aggregateAmount) === 0) {
          r.aggregateAmount = (ibParentPass1.aggregateAmount || 0) * percent;
        }
      }

      // Attach benchmark chargesProposed if missing or 0
      const benchmarkCharge = chargesMap.get(k);
      const benchmarkUnit = unitMap.get(k);
      if ((r.chargesProposed === undefined || r.chargesProposed === null || r.chargesProposed === "" || Number(r.chargesProposed) === 0) && benchmarkCharge) {
        r.chargesProposed = benchmarkCharge;
        r.unit = benchmarkUnit || r.unit;
        r.bankUnit = benchmarkUnit || r.bankUnit;
      }

      return calculateQuoteRow(r, r.chargesProposed, r.unit, 0);
    });

    // Filter out rows that are not in projections or have 0 volume & 0 txns & 0 amount
    const filteredRows = calculatedRows.filter((r) => {
      if (r.isIB) return true;
      const count = parseFloat(r.transactionCount) || 0;
      const val = parseFloat(r.transactionValue) || 0;
      const estTxns = Number(r.estimatedTransactions) || 0;
      const aggAmt = Number(r.aggregateAmount) || 0;

      const hasValidProjections = activeAggs.some((agg) => {
        const aggRows = allProjections[agg.aggregatorId] || [];
        const match = aggRows.find((ar) => ar.transactionType === r.transactionType);
        return match && (Number(match.rate) > 0 || Number(match.vendorShare) > 0 || Number(match.chargesProposed) > 0);
      });

      if (count === 0 && val === 0 && estTxns === 0 && aggAmt === 0 && !hasValidProjections) {
        return false;
      }
      return true;
    });

    const hasIbParent = filteredRows.some((r) => r.transactionType?.toLowerCase().includes("internet") && !r.isIB);
    const finalRows = filteredRows.filter((r) => {
      if (r.isIB && !hasIbParent) return false;
      return true;
    });

    finalRows.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
    return finalRows;
  }, [activeAggs, allProjections, customerDetails]);

  const aggregatorTotals = useMemo(() => {
    const totals = {};
    activeAggs.forEach((agg) => {
      totals[agg.aggregatorId] = calculateTotals(
        allProjections[agg.aggregatorId] || []
      );
    });
    return totals;
  }, [activeAggs, allProjections]);

  const totalCountPercent = useMemo(() => {
    if (!Array.isArray(baseRows)) return 0;
    return baseRows
      .filter((r) => !r.isIB)
      .reduce((acc, r) => acc + (parseFloat(r.transactionCount) || 0), 0);
  }, [baseRows]);

  const totalValuePercent = useMemo(() => {
    if (!Array.isArray(baseRows)) return 0;
    return baseRows
      .filter((r) => !r.isIB)
      .reduce((acc, r) => acc + (parseFloat(r.transactionValue) || 0), 0);
  }, [baseRows]);

  const baseTotals = useMemo(() => calculateTotals(baseRows), [baseRows]);

  const sortedActiveAggs = useMemo(() => {
    return [...activeAggs]
      .filter((a) => {
        const share = Number(aggregatorTotals[a.aggregatorId]?.totalVendorShare || a.totalVendorShare || 0);
        return share > 0 || (a.status === "submitted" && Number(a.sumOfRate) > 0);
      })
      .sort((a, b) => {
        const shareA = aggregatorTotals[a.aggregatorId]?.totalVendorShare || a.totalVendorShare || 0;
        const shareB = aggregatorTotals[b.aggregatorId]?.totalVendorShare || b.totalVendorShare || 0;
        return shareA - shareB;
      });
  }, [activeAggs, aggregatorTotals]);

  const isAccepted = Boolean(
    customerDetails?.isFinalApproved ||
    customerDetails?.isQuoteAcceptRO ||
    customerDetails?.isQuoteAcceptReviewByCO ||
    finalizedAggregatorId ||
    customerDetails?.finalizedAggregatorId ||
    customerDetails?.finalizedAggregatorName
  );

  const isAggFinalized = (agg) => {
    if (!agg) return false;
    const aggId = String(agg.aggregatorId || "");
    const finalId = String(finalizedAggregatorId || customerDetails?.finalizedAggregatorId || customerDetails?.finalAggregatorId || "");
    const selectedId = String(customerDetails?.selectedAggregatorId || "");
    const finalName = String(customerDetails?.finalizedAggregatorName || customerDetails?.selectedAggregatorName || "").toLowerCase().trim();
    const aggName = String(agg.aggregatorName || "").toLowerCase().trim();

    if (finalId && aggId && (aggId === finalId || aggId === selectedId)) return true;
    if (finalName && aggName && (finalName === aggName || finalName.includes(aggName) || aggName.includes(finalName))) return true;
    if (activeAggs.length === 1 && (isAccepted || finalId || finalName)) return true;
    if (agg.isFinalized === true || agg.isAccepted === true) return true;
    const st = String(agg?.status || "").toLowerCase();
    if (st === "approved" || st === "accepted" || st === "finalized") return true;
    return false;
  };

  const handleExportExcel = () => {
    const CHUNK_SIZE = 3;
    const aggChunks = [];
    for (let i = 0; i < activeAggs.length; i += CHUNK_SIZE) {
      aggChunks.push(activeAggs.slice(i, i + CHUNK_SIZE));
    }

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
              ${aggChunks
                .map(
                  (chunk, idx) => `
                <x:ExcelWorksheet>
                  <x:Name>CBA ${aggChunks.length > 1 ? `Part ${idx + 1}` : "Analysis"}</x:Name>
                  <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                </x:ExcelWorksheet>
              `
                )
                .join("")}
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11px; margin-bottom: 25px; }
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
    `;

    aggChunks.forEach((chunk, chunkIdx) => {
      const chunkTotalCols = 7 + chunk.length * 3;
      const startAggNum = chunkIdx * CHUNK_SIZE + 1;
      const endAggNum = startAggNum + chunk.length - 1;
      const chunkLabel =
        aggChunks.length > 1
          ? ` (Aggregators ${startAggNum} to ${endAggNum} of ${activeAggs.length})`
          : "";

      tableHtml += `
        <table>
          <tr>
            <th colspan="${chunkTotalCols}" class="title-row">CENTRAL BANK OF INDIA - COST BENEFIT ANALYSIS FOR PAYMENT AGGREGATION${chunkLabel}</th>
          </tr>
          <tr>
            <th colspan="${chunkTotalCols}" class="meta-row">
              Application ID: #${customerDetails?.applicationId || "N/A"} | Customer: ${customerDetails?.customerName || "N/A"} | Category: ${customerDetails?.category || "N/A"} | Export Date: ${dayjs().format("DD-MMM-YYYY HH:mm")}
            </th>
          </tr>
          <tr><td colspan="${chunkTotalCols}" style="height: 10px;"></td></tr>

          <tr>
            <th colspan="7" class="cba-top-header">Cost Benefit Analysis for Payment Aggregation (Online)</th>
      `;

      chunk.forEach((agg) => {
        const isFinal = isAggFinalized(agg);
        const rankIndex =
          sortedActiveAggs.findIndex((a) => a.aggregatorId === agg.aggregatorId) +
          1;
        const rankLabel =
          rankIndex > 0 ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}` : "";

        const aggClass = isAccepted
          ? isFinal
            ? "agg-finalized-header"
            : "agg-rejected-header"
          : isFinal
          ? "agg-finalized-header"
          : "agg-ranking-header";

        const statusText = isFinal
          ? "✓ Selected (Finalized)"
          : isAccepted
          ? "✗ Rejected"
          : `(${rankLabel})`;

        tableHtml += `
          <th colspan="3" class="${aggClass}">
            ${agg.aggregatorName}<br/>
            <span style="font-size: 9px; font-weight: normal;">${statusText}</span>
          </th>
        `;
      });

      tableHtml += `</tr><tr>`;

      const subHeaders = [
        "% Share Transaction Count",
        "% Share Transaction Value",
        "Type of Transaction",
        "Estimated No of Transactions",
        "Aggregate amount (Rs)",
        "Charges proposed",
        "Gross Amount Received from Charges (Rs)"
      ];

      subHeaders.forEach((sh) => {
        tableHtml += `<th class="cba-sub-header">${sh}</th>`;
      });

      chunk.forEach((agg) => {
        const isFinal = isAggFinalized(agg);
        const subClass = isAccepted
          ? isFinal
            ? "agg-finalized-sub"
            : "agg-rejected-sub"
          : isFinal
          ? "agg-finalized-sub"
          : "agg-ranking-sub";

        tableHtml += `
          <th class="${subClass}">Rate</th>
          <th class="${subClass}">Vendor Share (Rs)</th>
          <th class="${subClass}">Expected Revenue (Rs)</th>
        `;
      });

      tableHtml += `</tr>`;

      baseRows.forEach((row) => {
        const isSubBank = row.isIB;
        const countVal = isSubBank ? "" : formatPercent(row.transactionCount);
        const valueVal = isSubBank ? "" : formatPercent(row.transactionValue);
        const typeVal =
          isSubBank && row.transactionTypePercent
            ? `&nbsp;&nbsp;&nbsp;${row.transactionType} (${row.transactionTypePercent})`
            : row.transactionType;
        const estTxns = Math.round(row.estimatedTransactions) || 0;
        const aggAmt = row.aggregateAmount
          ? formatNumber(row.aggregateAmount)
          : "0.00";
        const chargesProp = row.allow
          ? row.unit === PERCENTAGE
            ? `${row.chargesProposed}%`
            : formatNumber(row.chargesProposed)
          : "";
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

        chunk.forEach((agg) => {
          const isFinal = isAggFinalized(agg);
          const aggCellClass = isAccepted
            ? isFinal
              ? "finalized-cell"
              : "rejected-cell"
            : isFinal
            ? "finalized-cell"
            : "";

          const aggProjList = allProjections[agg.aggregatorId] || [];
          const aggRow =
            aggProjList.find((r) => r.transactionType === row.transactionType) ||
            {};

          const rateStr = row.allow
            ? aggRow.rate !== undefined &&
              aggRow.rate !== null &&
              aggRow.rate !== ""
              ? aggRow.unit === PERCENTAGE
                ? `${aggRow.rate}%`
                : formatNumber(aggRow.rate)
              : "0"
            : "";
          const vShareStr = row.allow
            ? aggRow.vendorShare !== undefined
              ? formatNumber(aggRow.vendorShare)
              : "0.00"
            : "";
          const expRevStr = row.allow
            ? aggRow.expectedRevenue !== undefined
              ? formatNumber(aggRow.expectedRevenue)
              : "0.00"
            : "";

          tableHtml += `
            <td class="cell cell-right ${aggCellClass} ${rowClass}">${rateStr}</td>
            <td class="cell cell-right ${aggCellClass} ${rowClass}">${vShareStr}</td>
            <td class="cell cell-right ${aggCellClass} ${rowClass}">${expRevStr}</td>
          `;
        });

        tableHtml += `</tr>`;
      });

      tableHtml += `
        <tr class="totals-row">
          <td class="cell cell-right totals-row">${Math.round(totalCountPercent)}%</td>
          <td class="cell cell-right totals-row">${Math.round(totalValuePercent)}%</td>
          <td class="cell cell-left totals-row">TOTAL</td>
          <td class="cell cell-right totals-row">${(
            baseTotals.totalEstimatedTransactions || 0
          ).toLocaleString()}</td>
          <td class="cell cell-right totals-row">${formatNumber(
            baseTotals.totalAggregateAmount || 0
          )}</td>
          <td class="cell cell-center totals-row">—</td>
          <td class="cell cell-right totals-row">${formatNumber(
            baseTotals.totalGrossAmount || 0
          )}</td>
      `;

      chunk.forEach((agg) => {
        const isFinal = isAggFinalized(agg);
        const aggCellClass = isAccepted
          ? isFinal
            ? "finalized-cell"
            : "rejected-cell"
          : isFinal
          ? "finalized-cell"
          : "";

        const totals = aggregatorTotals[agg.aggregatorId] || {};
        tableHtml += `
          <td class="cell cell-center totals-row ${aggCellClass}"></td>
          <td class="cell cell-right totals-row ${aggCellClass}">${formatNumber(
          totals.totalVendorShare || 0
        )}</td>
          <td class="cell cell-right totals-row ${aggCellClass}">${formatNumber(
          totals.totalExpectedRevenue || 0
        )}</td>
        `;
      });

      tableHtml += `</tr></table>`;

      if (chunkIdx < aggChunks.length - 1) {
        tableHtml += `<div style="page-break-before:always; mso-special-format:page-break; height: 35px;"></div><br/>`;
      }
    });

    tableHtml += `</body></html>`;

    const blob = new Blob([tableHtml], {
      type: "application/vnd.ms-excel;charset=utf-8"
    });
    saveAs(
      blob,
      `Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}_App${
        customerDetails?.applicationId || ""
      }.xls`
    );
    successNotification("✅ Premium styled Excel report exported successfully!");
  };

  const handleExportPDF = async () => {
    try {
      const element = cbaTableRef.current;
      if (!element) return;

      const oldWidth = element.style.width;
      const oldOverflow = element.style.overflow;
      const fullWidth = Math.max(element.scrollWidth, 1200);

      element.style.width = `${fullWidth}px`;
      element.style.overflow = "visible";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: fullWidth + 80,
        scrollX: 0,
        scrollY: 0
      });

      element.style.width = oldWidth;
      element.style.overflow = oldOverflow;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 8;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        printWidth,
        Math.min(printHeight, pageHeight - margin * 2)
      );
      pdf.save(
        `Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}_App${
          customerDetails?.applicationId || ""
        }.pdf`
      );
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
    position: "sticky !important",
    top: "0px !important",
    zIndex: "12 !important",
  };

  const leftHeaderCellSx = {
    ...baseHeaderCellSx,
    background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%) !important",
    border: "1px solid #0B3D6D !important",
    borderBottom: "2px solid #062545 !important",
    position: "sticky !important",
    top: "0px !important",
    zIndex: "12 !important",
  };

  const baseSubHeaderCellSx = {
    fontWeight: 700,
    fontSize: "10px",
    py: "6px !important",
    px: "4px !important",
    color: "#ffffff !important",
    whiteSpace: "normal !important",
    wordBreak: "normal !important",
    overflowWrap: "normal !important",
    lineHeight: 1.15,
    verticalAlign: "middle",
    textTransform: "none !important",
    border: "1px solid rgba(255, 255, 255, 0.3) !important",
    borderBottom: "2px solid #062545 !important",
    position: "sticky !important",
    top: "35px !important",
    zIndex: "11 !important",
  };

  const leftSubHeaderCellSx = {
    ...baseSubHeaderCellSx,
    background: "linear-gradient(90deg, #062545 0%, #0E4F8D 100%) !important",
    border: "1px solid #062545 !important",
    borderBottom: "2px solid #062545 !important",
    position: "sticky !important",
    top: "35px !important",
    zIndex: "11 !important",
  };

  const cellSx = {
    fontSize: "11px",
    py: "6px !important",
    px: "8px !important",
    whiteSpace: "normal",
    wordBreak: "normal",
    overflowWrap: "normal",
    border: "1px solid #cbd5e1 !important"
  };

  const totalCellSx = {
    fontWeight: 800,
    fontSize: "11px",
    py: "8px !important",
    px: "8px !important",
    bgcolor: "#f1f5f9",
    border: "1px solid #94a3b8 !important",
    borderTop: "2px solid #64748b !important",
    borderBottom: "2px solid #64748b !important"
  };

  if (projectionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography variant="body2" color="text.secondary">
          Loading comparative quote analysis...
        </Typography>
      </Box>
    );
  }

  if (!activeAggs.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={4}
        border="1px dashed #cbd5e1"
        borderRadius="8px"
        bgcolor="#f8fafc"
        m={2}
      >
        <Typography variant="body2" color="text.secondary">
          No quotation projections loaded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Action Bar (Expand/Collapse Columns & Downloader Actions) */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          mb: 1.5,
          bgcolor: "#f8fafc",
          p: 1.2,
          borderRadius: "6px",
          border: "1px solid #cbd5e1"
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={
            isExpanded ? (
              <UnfoldLess sx={{ fontSize: 16 }} />
            ) : (
              <UnfoldMore sx={{ fontSize: 16 }} />
            )
          }
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12px",
            borderRadius: "4px",
            borderColor: "#0E4F8D",
            color: "#0E4F8D",
            bgcolor: "#ffffff",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "#f0f7ff", borderColor: "#0B3D6D" }
          }}
        >
          {isExpanded
            ? "Collapse to Rates Only"
            : "Expand All Columns (Vendor Share & Revenue)"}
        </Button>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
          {isAccepted && (
            <>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Download sx={{ fontSize: 16 }} />}
                onClick={handleExportExcel}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "4px",
                  fontSize: "12px",
                  whiteSpace: "nowrap"
                }}
              >
                Download Excel
              </Button>
              {activeAggs.length === 1 && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  onClick={handleExportPDF}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "4px",
                    fontSize: "12px",
                    whiteSpace: "nowrap"
                  }}
                >
                  Download PDF
                </Button>
              )}
            </>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={
              isFullScreenCBA ? (
                <FullscreenExitRounded sx={{ fontSize: 16 }} />
              ) : (
                <FullscreenRounded sx={{ fontSize: 16 }} />
              )
            }
            onClick={() => setIsFullScreenCBA(!isFullScreenCBA)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "12px",
              borderRadius: "4px",
              borderColor: "#0E4F8D",
              color: "#0E4F8D",
              bgcolor: "#ffffff",
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#f0f7ff", borderColor: "#0B3D6D" }
            }}
          >
            {isFullScreenCBA ? "Exit Full Screen" : "Full Screen View"}
          </Button>
        </Stack>
      </Box>

      <span ref={cbaTableRef}>
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            overflowX: "auto",
            overflowY: "visible",
            maxHeight: "none",
            maxWidth: "100%",
            borderRadius: "0px",
            border: "1px solid #cbd5e1",
            boxShadow: "none",
            "&::-webkit-scrollbar": {
              height: "6px"
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f5f9"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#cbd5e1",
              borderRadius: "3px",
              "&:hover": {
                backgroundColor: "#94a3b8"
              }
            }
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              minWidth: isExpanded
                ? `${680 + activeAggs.length * 340}px`
                : `${680 + activeAggs.length * 110}px`,
              width: "100%",
              tableLayout: "auto",
              borderCollapse: "collapse"
            }}
          >
            <TableHead>
              {/* Row 1: Aggregator Headers */}
              <TableRow>
                <TableCell
                  colSpan={7}
                  sx={{ ...leftHeaderCellSx, borderTopLeftRadius: "9px" }}
                  align="center"
                >
                  Cost Benefit Analysis for Payment Aggregation (Online)
                </TableCell>
                {activeAggs.map((agg, aIdx) => {
                  const isLastAgg = aIdx === activeAggs.length - 1;
                  const isFinal = isAggFinalized(agg);
                  const hasAnyFinalized = Boolean(
                    finalizedAggregatorId ||
                    customerDetails?.finalizedAggregatorId ||
                    customerDetails?.finalAggregatorId ||
                    customerDetails?.finalizedAggregatorName ||
                    customerDetails?.selectedAggregatorName ||
                    activeAggs.some((a) => isAggFinalized(a))
                  );

                  const headerBg = isFinal
                    ? "linear-gradient(135deg, #15803d 0%, #16a34a 100%)"
                    : (hasAnyFinalized || isAccepted)
                    ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
                    : "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)";
                  const headerBgSolid = isFinal
                    ? "#16a34a"
                    : (hasAnyFinalized || isAccepted)
                    ? "#dc2626"
                    : "#0E4F8D";
                  const headerBorder = isFinal
                    ? "#15803d"
                    : (hasAnyFinalized || isAccepted)
                    ? "#b91c1c"
                    : "#0B3D6D";

                  const hasSubmittedQuote = Boolean(
                    (aggregatorTotals[agg.aggregatorId]?.totalVendorShare > 0) ||
                    (Number(agg.totalVendorShare) > 0) ||
                    (Number(agg.sumOfRate) > 0)
                  );
                  const rankIdx = hasSubmittedQuote
                    ? sortedActiveAggs.findIndex(
                        (a) => a.aggregatorId === agg.aggregatorId
                      ) + 1
                    : 0;
                  const rankLabel =
                    rankIdx > 0
                      ? `L${rankIdx}${rankIdx === 1 ? " - Lowest" : ""}`
                      : "Pending Quote";

                  return (
                    <TableCell
                      key={agg.aggregatorId}
                      colSpan={isExpanded ? 3 : 1}
                      style={{ background: headerBg, backgroundColor: headerBgSolid }}
                      sx={{
                        ...baseHeaderCellSx,
                        background: `${headerBg} !important`,
                        backgroundColor: `${headerBgSolid} !important`,
                        border: `1px solid ${headerBorder} !important`,
                        color: "#ffffff !important",
                        py: "8px !important",
                        borderTopRightRadius: isLastAgg ? "9px" : "0px"
                      }}
                      align="center"
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: "11.5px",
                            color: "#ffffff",
                            letterSpacing: "0.2px"
                          }}
                        >
                          {agg.aggregatorName}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "9.5px",
                            opacity: 0.95,
                            fontWeight: 700,
                            color: "#ffffff",
                            mt: 0.2
                          }}
                        >
                          {isFinal
                            ? "✓ Selected (Finalized)"
                            : (hasAnyFinalized || isAccepted)
                            ? "✗ Rejected"
                            : `(${rankLabel})`}
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Row 2: Sub-headers */}
              <TableRow>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>
                  % Share Transaction Count
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>
                  % Share Transaction Value
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "150px" }}>
                  Type of Transaction
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "110px" }}>
                  Estimated No of Transactions
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "120px" }}>
                  Aggregate amount (Rs)
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}>
                  Charges proposed
                </TableCell>
                <TableCell sx={{ ...leftSubHeaderCellSx, minWidth: "140px" }}>
                  Gross Amount Received from Charges (Rs)
                </TableCell>
                {activeAggs.map((agg) => {
                  const isFinal = isAggFinalized(agg);
                  const hasAnyFinalized = Boolean(
                    finalizedAggregatorId ||
                    customerDetails?.finalizedAggregatorId ||
                    customerDetails?.finalAggregatorId ||
                    customerDetails?.finalizedAggregatorName ||
                    customerDetails?.selectedAggregatorName ||
                    activeAggs.some((a) => isAggFinalized(a))
                  );

                  const subHeaderBg = isFinal
                    ? "linear-gradient(135deg, #166534 0%, #15803d 100%)"
                    : (hasAnyFinalized || isAccepted)
                    ? "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)"
                    : "linear-gradient(135deg, #062545 0%, #0E4F8D 100%)";
                  const subHeaderBgSolid = isFinal
                    ? "#15803d"
                    : (hasAnyFinalized || isAccepted)
                    ? "#b91c1c"
                    : "#062545";

                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell
                        style={{
                          background: subHeaderBg,
                          backgroundColor: subHeaderBgSolid
                        }}
                        sx={{
                          ...baseSubHeaderCellSx,
                          background: `${subHeaderBg} !important`,
                          backgroundColor: `${subHeaderBgSolid} !important`,
                          border: `1px solid ${subHeaderBgSolid} !important`,
                          minWidth: "80px",
                          whiteSpace: "nowrap !important"
                        }}
                      >
                        Rate
                      </TableCell>
                      {isExpanded && (
                        <>
                          <TableCell
                            style={{
                              background: subHeaderBg,
                              backgroundColor: subHeaderBgSolid
                            }}
                            sx={{
                              ...baseSubHeaderCellSx,
                              background: `${subHeaderBg} !important`,
                              backgroundColor: `${subHeaderBgSolid} !important`,
                              border: `1px solid ${subHeaderBgSolid} !important`,
                              minWidth: "90px"
                            }}
                          >
                            Vendor Share (Rs)
                          </TableCell>
                          <TableCell
                            style={{
                              background: subHeaderBg,
                              backgroundColor: subHeaderBgSolid
                            }}
                            sx={{
                              ...baseSubHeaderCellSx,
                              background: `${subHeaderBg} !important`,
                              backgroundColor: `${subHeaderBgSolid} !important`,
                              border: `1px solid ${subHeaderBgSolid} !important`,
                              minWidth: "100px"
                            }}
                          >
                            Expected Revenue (Rs)
                          </TableCell>
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {baseRows.map((row, idx) => {
                const isSubBank = row.isIB;
                const isEven = idx % 2 === 0;
                const rowBg = isSubBank ? "#f1f5f9" : (isEven ? "#ffffff" : "#f8fafc");

                const countDisplay = !isSubBank
                  ? row.transactionCount
                    ? String(row.transactionCount).endsWith("%")
                      ? row.transactionCount
                      : `${row.transactionCount}%`
                    : ""
                  : "";
                const valueDisplay = !isSubBank
                  ? row.transactionValue
                    ? String(row.transactionValue).endsWith("%")
                      ? row.transactionValue
                      : `${row.transactionValue}%`
                    : ""
                  : "";

                return (
                  <TableRow
                    key={idx}
                    sx={{
                      bgcolor: rowBg,
                      "&:hover": { bgcolor: "#e2e8f0 !important" },
                      transition: "background-color 0.15s ease"
                    }}
                  >
                    <TableCell sx={cellSx} align="right">
                      {countDisplay}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      {valueDisplay}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...cellSx,
                        pl: isSubBank ? 3 : 1,
                        fontStyle: isSubBank ? "italic" : "normal",
                        color: isSubBank ? "#64748b" : "inherit"
                      }}
                    >
                      {row.transactionType}
                      {row.transactionTypePercent && isSubBank
                        ? ` (${row.transactionTypePercent})`
                        : ""}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      {Math.round(row.estimatedTransactions) || "0"}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      {formatNumber(row.aggregateAmount)}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      {row.allow
                        ? row.unit === PERCENTAGE
                          ? `${row.chargesProposed}${PERCENTAGE}`
                          : `${row.chargesProposed}`
                        : ""}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">
                      {row.allow ? formatNumber(row.grossAmount) : ""}
                    </TableCell>

                    {/* Aggregators Data */}
                    {activeAggs.map((agg) => {
                      const aggProjList = allProjections[agg.aggregatorId] || [];
                      const aggRow =
                        aggProjList.find(
                          (r) => r.transactionType === row.transactionType
                        ) || {};
                      const isFinal = isAggFinalized(agg);
                      const hasAnyFinalized = Boolean(
                        finalizedAggregatorId ||
                        customerDetails?.finalizedAggregatorId ||
                        customerDetails?.finalAggregatorId ||
                        customerDetails?.finalizedAggregatorName ||
                        customerDetails?.selectedAggregatorName ||
                        activeAggs.some((a) => isAggFinalized(a))
                      );

                      const columnBg = isFinal
                        ? "#f0fdf4"
                        : (hasAnyFinalized || isAccepted)
                        ? "#fef2f2"
                        : "#f8fafc";
                      const columnBorder = isFinal
                        ? "#86efac"
                        : (hasAnyFinalized || isAccepted)
                        ? "#fca5a5"
                        : "#e2e8f0";
                      const textCol = isFinal
                        ? "#14532d"
                        : (hasAnyFinalized || isAccepted)
                        ? "#7f1d1d"
                        : "inherit";

                      return (
                        <React.Fragment key={agg.aggregatorId}>
                          <TableCell
                            sx={{
                              ...cellSx,
                              bgcolor: `${columnBg} !important`,
                              border: `1px solid ${columnBorder} !important`,
                              color: textCol
                            }}
                            align="right"
                          >
                            {(() => {
                              if (!aggRow.allow) return "—";
                              const rVal = aggRow.rate !== undefined && aggRow.rate !== null && aggRow.rate !== "" ? Number(aggRow.rate) : null;
                              if (rVal === null) return "—";
                              const isPct = aggRow.unit === PERCENTAGE || aggRow.unit === "%" || aggRow.bankUnit === "%";
                              return isPct ? `${aggRow.rate}%` : `₹${aggRow.rate}`;
                            })()}
                          </TableCell>
                          {isExpanded && (
                            <>
                              <TableCell
                                sx={{
                                  ...cellSx,
                                  bgcolor: `${columnBg} !important`,
                                  border: `1px solid ${columnBorder} !important`,
                                  color: textCol,
                                  fontWeight: isFinal ? 600 : 400
                                }}
                                align="right"
                              >
                                {aggRow.allow
                                  ? formatNumber(aggRow.vendorShare)
                                  : ""}
                              </TableCell>
                              <TableCell
                                sx={{
                                  ...cellSx,
                                  bgcolor: `${columnBg} !important`,
                                  border: `1px solid ${columnBorder} !important`,
                                  color: textCol,
                                  fontWeight: isFinal ? 700 : 400
                                }}
                                align="right"
                              >
                                {aggRow.allow
                                  ? formatNumber(aggRow.expectedRevenue)
                                  : ""}
                              </TableCell>
                            </>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                );
              })}

              {/* Totals Row */}
              <TableRow>
                <TableCell sx={totalCellSx} align="right">
                  {Math.round(totalCountPercent)}%
                </TableCell>
                <TableCell sx={totalCellSx} align="right">
                  {Math.round(totalValuePercent)}%
                </TableCell>
                <TableCell sx={{ ...totalCellSx }} align="left">
                  TOTAL
                </TableCell>
                <TableCell sx={totalCellSx} align="right">
                  {baseTotals.totalEstimatedTransactions}
                </TableCell>
                <TableCell sx={totalCellSx} align="right">
                  {formatNumber(baseTotals.totalAggregateAmount)}
                </TableCell>
                <TableCell sx={totalCellSx} align="center">—</TableCell>
                <TableCell sx={totalCellSx} align="right">
                  {formatNumber(baseTotals.totalGrossAmount)}
                </TableCell>
                {activeAggs.map((agg) => {
                  const totals = aggregatorTotals[agg.aggregatorId] || {};
                  const isFinal = isAggFinalized(agg);
                  const hasAnyFinalized = Boolean(
                    finalizedAggregatorId ||
                    customerDetails?.finalizedAggregatorId ||
                    customerDetails?.finalAggregatorId ||
                    customerDetails?.finalizedAggregatorName ||
                    customerDetails?.selectedAggregatorName ||
                    activeAggs.some((a) => isAggFinalized(a))
                  );

                  const totalsBg = isFinal
                    ? "#dcfce7"
                    : (hasAnyFinalized || isAccepted)
                    ? "#fee2e2"
                    : "#e6f4f1";
                  const totalsBorder = isFinal
                    ? "#4ade80"
                    : (hasAnyFinalized || isAccepted)
                    ? "#f87171"
                    : "#cbd5e1";
                  const totalTextColor = isFinal
                    ? "#15803d"
                    : (hasAnyFinalized || isAccepted)
                    ? "#b91c1c"
                    : "#0f172a";

                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      {isExpanded ? (
                        <>
                          <TableCell
                            sx={{
                              ...totalCellSx,
                              bgcolor: `${totalsBg} !important`,
                              border: `1px solid ${totalsBorder} !important`
                            }}
                          ></TableCell>
                          <TableCell
                            sx={{
                              ...totalCellSx,
                              bgcolor: `${totalsBg} !important`,
                              border: `1px solid ${totalsBorder} !important`,
                              color: `${totalTextColor} !important`,
                              fontWeight: 800
                            }}
                            align="right"
                          >
                            {formatNumber(totals.totalVendorShare)}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...totalCellSx,
                              bgcolor: `${totalsBg} !important`,
                              border: `1px solid ${totalsBorder} !important`,
                              color: `${totalTextColor} !important`,
                              fontWeight: 800
                            }}
                            align="right"
                          >
                            {formatNumber(totals.totalExpectedRevenue)}
                          </TableCell>
                        </>
                      ) : (
                        <TableCell
                          sx={{
                            ...totalCellSx,
                            bgcolor: `${totalsBg} !important`,
                            border: `1px solid ${totalsBorder} !important`,
                            color: `${totalTextColor} !important`,
                            fontWeight: 700
                          }}
                          align="center"
                        >
                          -
                        </TableCell>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </span>

      {/* Fullscreen CBA Dialog Modal */}
      <Dialog
        fullScreen
        open={isFullScreenCBA}
        onClose={() => setIsFullScreenCBA(false)}
        PaperProps={{
          sx: { bgcolor: "#f8fafc" }
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          {/* Header Bar */}
          <Box
            sx={{
              background: "linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)",
              color: "#ffffff",
              px: 3,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              zIndex: 10,
              flexWrap: "wrap",
              gap: 1.5
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={800}
                sx={{
                  color: "#ffffff !important",
                  letterSpacing: "0.3px",
                  fontSize: "16px"
                }}
              >
                Cost Benefit Analysis for Payment Aggregation (Online) — Full View
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.9) !important",
                  display: "block",
                  fontSize: "11.5px",
                  mt: 0.2
                }}
              >
                Application ID: #{customerDetails?.applicationId || "N/A"} | Customer:{" "}
                {customerDetails?.customerName || "Customer"} | Category:{" "}
                {customerDetails?.category || "Standard"} | Avg Txns:{" "}
                {formatNumber(customerDetails?.avgTransactionYearly)} | Total Deposit: ₹
                {formatNumber(
                  customerDetails?.aggregateDepositAmt ||
                    customerDetails?.totalAnnualTransaction
                )}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <Button
                variant="contained"
                size="small"
                startIcon={
                  isExpanded ? (
                    <UnfoldLess sx={{ fontSize: 16 }} />
                  ) : (
                    <UnfoldMore sx={{ fontSize: 16 }} />
                  )
                }
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  bgcolor: "#ffffff !important",
                  color: "#0E4F8D !important",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "#f0f9ff !important",
                    color: "#0369a1 !important"
                  }
                }}
              >
                {isExpanded ? "Rates Only" : "Expand Vendor Share & Revenue"}
              </Button>

              {isAccepted && (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Download sx={{ fontSize: 16 }} />}
                    onClick={handleExportExcel}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      bgcolor: "#ffffff !important",
                      color: "#16a34a !important",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      "&:hover": { bgcolor: "#f0fdf4 !important" }
                    }}
                  >
                    Export Excel
                  </Button>
                  {activeAggs.length === 1 && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download sx={{ fontSize: 16 }} />}
                      onClick={handleExportPDF}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: "6px",
                        fontSize: "11.5px",
                        bgcolor: "#ffffff !important",
                        color: "#dc2626 !important",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        "&:hover": { bgcolor: "#fef2f2 !important" }
                      }}
                    >
                      Export PDF
                    </Button>
                  )}
                </>
              )}

              <Button
                variant="contained"
                size="small"
                startIcon={<FullscreenExitRounded />}
                onClick={() => setIsFullScreenCBA(false)}
                sx={{
                  bgcolor: "#ffffff !important",
                  color: "#0E4F8D !important",
                  fontWeight: 800,
                  fontSize: "12px",
                  textTransform: "none",
                  borderRadius: "6px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  "&:hover": {
                    bgcolor: "#f1f5f9 !important",
                    color: "#0B3D6D !important"
                  }
                }}
              >
                Exit Full Screen
              </Button>
            </Box>
          </Box>

          {/* Fullscreen Table Content */}
          <Box sx={{ flex: 1, p: 3, overflow: "auto", bgcolor: "#f8fafc" }}>
            <Paper
              elevation={2}
              sx={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #cbd5e1"
              }}
            >
              <TableContainer
                sx={{ maxHeight: "none", overflowX: "auto" }}
              >
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    minWidth: isExpanded
                      ? `${680 + activeAggs.length * 340}px`
                      : `${680 + activeAggs.length * 110}px`,
                    width: "100%",
                    tableLayout: "auto",
                    borderCollapse: "collapse"
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        sx={{ ...leftHeaderCellSx, borderTopLeftRadius: "0px" }}
                        align="center"
                      >
                        Cost Benefit Analysis for Payment Aggregation (Online)
                      </TableCell>
                      {activeAggs.map((agg, aIdx) => {
                        const isLastAgg = aIdx === activeAggs.length - 1;
                        const isFinal = isAggFinalized(agg);
                        const hasAnyFinalized = Boolean(
                          finalizedAggregatorId ||
                          customerDetails?.finalizedAggregatorId ||
                          customerDetails?.finalAggregatorId ||
                          customerDetails?.finalizedAggregatorName ||
                          customerDetails?.selectedAggregatorName ||
                          activeAggs.some((a) => isAggFinalized(a))
                        );

                        const headerBg = isFinal
                          ? "linear-gradient(135deg, #15803d 0%, #16a34a 100%)"
                          : (hasAnyFinalized || isAccepted)
                          ? "linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)"
                          : "linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)";
                        const headerBgSolid = isFinal
                          ? "#16a34a"
                          : (hasAnyFinalized || isAccepted)
                          ? "#dc2626"
                          : "#0E4F8D";
                        const headerBorder = isFinal
                          ? "#15803d"
                          : (hasAnyFinalized || isAccepted)
                          ? "#b91c1c"
                          : "#0B3D6D";

                        const rankIndex =
                          sortedActiveAggs.findIndex(
                            (a) => a.aggregatorId === agg.aggregatorId
                          ) + 1;
                        const rankLabel =
                          rankIndex > 0
                            ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}`
                            : "";

                        return (
                          <TableCell
                            key={agg.aggregatorId}
                            colSpan={isExpanded ? 3 : 1}
                            style={{
                              background: headerBg,
                              backgroundColor: headerBgSolid
                            }}
                            sx={{
                              ...baseHeaderCellSx,
                              background: `${headerBg} !important`,
                              backgroundColor: `${headerBgSolid} !important`,
                              border: `1px solid ${headerBorder} !important`,
                              color: "#ffffff !important",
                              py: "8px !important",
                              borderTopRightRadius: isLastAgg ? "0px" : "0px"
                            }}
                            align="center"
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "11.5px",
                                  color: "#ffffff",
                                  letterSpacing: "0.2px"
                                }}
                              >
                                {agg.aggregatorName}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "9.5px",
                                  opacity: 0.95,
                                  fontWeight: 700,
                                  color: "#ffffff",
                                  mt: 0.2
                                }}
                              >
                                {isFinal
                                  ? "✓ Selected (Finalized)"
                                  : (hasAnyFinalized || isAccepted)
                                  ? "✗ Rejected"
                                  : `(${rankLabel})`}
                              </Typography>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    <TableRow>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}
                      >
                        % Share Transaction Count
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}
                      >
                        % Share Transaction Value
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "150px" }}
                      >
                        Type of Transaction
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "110px" }}
                      >
                        Estimated No of Transactions
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "120px" }}
                      >
                        Aggregate amount (Rs)
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "100px" }}
                      >
                        Charges proposed
                      </TableCell>
                      <TableCell
                        sx={{ ...leftSubHeaderCellSx, minWidth: "140px" }}
                      >
                        Gross Amount Received from Charges (Rs)
                      </TableCell>
                      {activeAggs.map((agg) => {
                        const isFinal = isAggFinalized(agg);
                        const hasAnyFinalized = Boolean(
                          finalizedAggregatorId ||
                          customerDetails?.finalizedAggregatorId ||
                          customerDetails?.finalAggregatorId ||
                          customerDetails?.finalizedAggregatorName ||
                          customerDetails?.selectedAggregatorName ||
                          activeAggs.some((a) => isAggFinalized(a))
                        );

                        const subHeaderBg = isFinal
                          ? "linear-gradient(135deg, #166534 0%, #15803d 100%)"
                          : (hasAnyFinalized || isAccepted)
                          ? "linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)"
                          : "linear-gradient(135deg, #062545 0%, #0E4F8D 100%)";
                        const subHeaderBgSolid = isFinal
                          ? "#15803d"
                          : (hasAnyFinalized || isAccepted)
                          ? "#b91c1c"
                          : "#062545";

                        return (
                          <React.Fragment key={agg.aggregatorId}>
                            <TableCell
                              style={{
                                background: subHeaderBg,
                                backgroundColor: subHeaderBgSolid
                              }}
                              sx={{
                                ...baseSubHeaderCellSx,
                                background: `${subHeaderBg} !important`,
                                backgroundColor: `${subHeaderBgSolid} !important`,
                                border: `1px solid ${subHeaderBgSolid} !important`,
                                minWidth: "80px",
                                whiteSpace: "nowrap !important"
                              }}
                            >
                              Rate
                            </TableCell>
                            {isExpanded && (
                              <>
                                <TableCell
                                  style={{
                                    background: subHeaderBg,
                                    backgroundColor: subHeaderBgSolid
                                  }}
                                  sx={{
                                    ...baseSubHeaderCellSx,
                                    background: `${subHeaderBg} !important`,
                                    backgroundColor: `${subHeaderBgSolid} !important`,
                                    border: `1px solid ${subHeaderBgSolid} !important`,
                                    minWidth: "90px"
                                  }}
                                >
                                  Vendor Share (Rs)
                                </TableCell>
                                <TableCell
                                  style={{
                                    background: subHeaderBg,
                                    backgroundColor: subHeaderBgSolid
                                  }}
                                  sx={{
                                    ...baseSubHeaderCellSx,
                                    background: `${subHeaderBg} !important`,
                                    backgroundColor: `${subHeaderBgSolid} !important`,
                                    border: `1px solid ${subHeaderBgSolid} !important`,
                                    minWidth: "100px"
                                  }}
                                >
                                  Expected Revenue (Rs)
                                </TableCell>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {baseRows.map((row, idx) => {
                      const isSubBank = row.isIB;
                      const countDisplay = !isSubBank
                        ? row.transactionCount
                          ? String(row.transactionCount).endsWith("%")
                            ? row.transactionCount
                            : `${row.transactionCount}%`
                          : ""
                        : "";
                      const valueDisplay = !isSubBank
                        ? row.transactionValue
                          ? String(row.transactionValue).endsWith("%")
                            ? row.transactionValue
                            : `${row.transactionValue}%`
                        : ""
                        : "";

                      const rowBg = isSubBank
                        ? "#f8fafc"
                        : idx % 2 === 0
                        ? "#ffffff"
                        : "#fbfcfd";

                      return (
                        <TableRow
                          key={row.id || idx}
                          sx={{
                            bgcolor: rowBg,
                            "&:hover": { bgcolor: "#f1f5f9" }
                          }}
                        >
                          <TableCell
                            sx={{
                              ...cellSx,
                              fontStyle: isSubBank ? "italic" : "normal",
                              fontWeight: isSubBank ? 500 : 600
                            }}
                            align="right"
                          >
                            {countDisplay}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...cellSx,
                              fontStyle: isSubBank ? "italic" : "normal",
                              fontWeight: isSubBank ? 500 : 600
                            }}
                            align="right"
                          >
                            {valueDisplay}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...cellSx,
                              fontWeight: isSubBank ? 500 : 700,
                              color: isSubBank ? "#475569" : "#0f172a",
                              pl: isSubBank ? 3 : 1
                            }}
                          >
                            {row.transactionType}
                            {row.transactionTypePercent && isSubBank
                              ? ` (${row.transactionTypePercent})`
                              : ""}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                            {Math.round(row.estimatedTransactions)}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                            {formatNumber(row.aggregateAmount)}
                          </TableCell>
                          {!row?.allow ? (
                            <TableCell
                              colSpan={2}
                              sx={{
                                ...cellSx,
                                textAlign: "center",
                                color: "#94a3b8",
                                fontStyle: "italic"
                              }}
                            >
                              {row.transactionType === "Internet banking"
                                ? "Aggregated Above"
                                : "—"}
                            </TableCell>
                          ) : (
                            <>
                              <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                                {row?.chargesProposed || "0.00"}
                              </TableCell>
                              <TableCell sx={{ ...cellSx, textAlign: "right" }}>
                                {formatNumber(row.grossAmount) || "0.00"}
                              </TableCell>
                            </>
                          )}
                          {activeAggs.map((agg) => {
                            const aggProjs =
                              allProjections[agg.aggregatorId] || [];
                            const match = aggProjs.find(
                              (p) =>
                                p.transactionType === row.transactionType &&
                                p.isIB === row.isIB
                            );
                            const isFinal = isAggFinalized(agg);

                            const cellBg = isAccepted
                              ? isFinal
                                ? "#f0fdf4"
                                : "#fef2f2"
                              : isFinal
                              ? "#f0fdf4"
                              : idx % 2 === 0
                              ? "#ffffff"
                              : "#f8fafc";
                            const cellBorder = isAccepted
                              ? isFinal
                                ? "#bbf7d0"
                                : "#fecaca"
                              : isFinal
                              ? "#bbf7d0"
                              : "#cbd5e1";
                            const textColor = isAccepted
                              ? isFinal
                                ? "#14532d"
                                : "#7f1d1d"
                              : isFinal
                              ? "#14532d"
                              : "#0f172a";

                            return (
                              <React.Fragment key={agg.aggregatorId}>
                                <TableCell
                                  sx={{
                                    ...cellSx,
                                    bgcolor: `${cellBg} !important`,
                                    border: `1px solid ${cellBorder} !important`,
                                    color: `${textColor} !important`,
                                    fontWeight: isFinal ? 700 : 500
                                  }}
                                  align="right"
                                >
                                  {match
                                    ? match.unit === PERCENTAGE
                                      ? `${match.rate}${PERCENTAGE}`
                                      : match.rate
                                    : "—"}
                                </TableCell>
                                {isExpanded && (
                                  <>
                                    <TableCell
                                      sx={{
                                        ...cellSx,
                                        bgcolor: `${cellBg} !important`,
                                        border: `1px solid ${cellBorder} !important`,
                                        color: `${textColor} !important`,
                                        fontWeight: isFinal ? 700 : 500
                                      }}
                                      align="right"
                                    >
                                      {match
                                        ? formatNumber(match.vendorShare)
                                        : "0.00"}
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        ...cellSx,
                                        bgcolor: `${cellBg} !important`,
                                        border: `1px solid ${cellBorder} !important`,
                                        color: `${textColor} !important`,
                                        fontWeight: isFinal ? 700 : 500
                                      }}
                                      align="right"
                                    >
                                      {match
                                        ? formatNumber(match.expectedRevenue)
                                        : "0.00"}
                                    </TableCell>
                                  </>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableRow>
                      );
                    })}

                    {/* Totals Row */}
                    <TableRow
                      sx={{
                        bgcolor: "#f1f5f9",
                        borderTop: "2px solid #64748b",
                        borderBottom: "2px solid #64748b"
                      }}
                    >
                      <TableCell sx={{ ...totalCellSx, textAlign: "right" }}>
                        {Math.round(totalCountPercent)}%
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, textAlign: "right" }}>
                        {Math.round(totalValuePercent)}%
                      </TableCell>
                      <TableCell
                        sx={{ ...totalCellSx, textAlign: "left" }}
                      >
                        TOTAL
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, textAlign: "right" }}>
                        {baseTotals.totalEstimatedTransactions}
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, textAlign: "right" }}>
                        {formatNumber(baseTotals.totalAggregateAmount)}
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, textAlign: "center" }}>
                        —
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, textAlign: "right" }}>
                        {formatNumber(baseTotals.totalGrossAmount)}
                      </TableCell>
                      {activeAggs.map((agg) => {
                        const totals = aggregatorTotals[agg.aggregatorId] || {};
                        const isFinal = isAggFinalized(agg);

                        const totalsBg = isAccepted
                          ? isFinal
                            ? "#dcfce7"
                            : "#fee2e2"
                          : isFinal
                          ? "#dcfce7"
                          : "#e6f4f1";
                        const totalsBorder = isAccepted
                          ? isFinal
                            ? "#4ade80"
                            : "#f87171"
                          : isFinal
                          ? "#4ade80"
                          : "#cbd5e1";
                        const totalTextColor = isAccepted
                          ? isFinal
                            ? "#15803d"
                            : "#b91c1c"
                          : isFinal
                          ? "#15803d"
                          : "#0f172a";

                        return (
                          <React.Fragment key={agg.aggregatorId}>
                            {isExpanded ? (
                              <>
                                <TableCell
                                  sx={{
                                    ...totalCellSx,
                                    bgcolor: `${totalsBg} !important`,
                                    border: `1px solid ${totalsBorder} !important`
                                  }}
                                ></TableCell>
                                <TableCell
                                  sx={{
                                    ...totalCellSx,
                                    bgcolor: `${totalsBg} !important`,
                                    border: `1px solid ${totalsBorder} !important`,
                                    color: `${totalTextColor} !important`,
                                    fontWeight: 800
                                  }}
                                  align="right"
                                >
                                  {formatNumber(totals.totalVendorShare)}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    ...totalCellSx,
                                    bgcolor: `${totalsBg} !important`,
                                    border: `1px solid ${totalsBorder} !important`,
                                    color: `${totalTextColor} !important`,
                                    fontWeight: 800
                                  }}
                                  align="right"
                                >
                                  {formatNumber(totals.totalExpectedRevenue)}
                                </TableCell>
                              </>
                            ) : (
                              <TableCell
                                sx={{
                                  ...totalCellSx,
                                  bgcolor: `${totalsBg} !important`,
                                  border: `1px solid ${totalsBorder} !important`,
                                  color: `${totalTextColor} !important`,
                                  fontWeight: 700
                                }}
                                align="center"
                              >
                                -
                              </TableCell>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};

export default CostBenefitAnalysisView;
