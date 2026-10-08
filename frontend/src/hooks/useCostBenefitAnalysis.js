import { useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatNumber, PERCENTAGE } from '&src/utils';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';
import { calculateTotals, getChannelOrder, calculateQuoteRow, getProjectionsForCustomer } from '&src/utils/calculation';
import useStatusWiseAlert from '&src/components/ToastNotifications/useStatusWiseAlert';

/**
 * Custom hook managing business calculations, L1 rankings, and export routines
 * for Cost Benefit Analysis (CBA).
 */
export const useCostBenefitAnalysis = ({
  filteredAggregators = [],
  allProjections = {},
  customerDetails = {},
  finalizedAggregatorId,
}) => {
  const { errorNotification, successNotification } = useStatusWiseAlert();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreenCBA, setIsFullScreenCBA] = useState(false);
  const cbaTableRef = useRef(null);

  // Active aggregators sorted by Lowest Vendor Share (L1, L2, L3...)
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

      const hasA = shareA > 0 || (a.status === 'submitted' && rateA > 0);
      const hasB = shareB > 0 || (b.status === 'submitted' && rateB > 0);

      if (hasA && hasB) {
        if (shareA !== shareB) return shareA - shareB;
        return (a.aggregatorId || 0) - (b.aggregatorId || 0);
      }
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;

      return (a.aggregatorId || 0) - (b.aggregatorId || 0);
    });
  }, [filteredAggregators, allProjections]);

  // Baseline rows construction and customer projection calculations
  const baseRows = useMemo(() => {
    const chargesMap = new Map();
    const unitMap = new Map();

    Object.values(allProjections || {}).forEach((aggRows) => {
      if (Array.isArray(aggRows)) {
        aggRows.forEach((r) => {
          const key = (r.transactionType || '').trim().toLowerCase();
          if (key && (r.chargesProposed !== undefined && r.chargesProposed !== null && r.chargesProposed !== '' && Number(r.chargesProposed) > 0)) {
            if (!chargesMap.has(key) || Number(r.chargesProposed) > Number(chargesMap.get(key))) {
              chargesMap.set(key, r.chargesProposed);
              unitMap.set(key, r.bankUnit || r.unit || PERCENTAGE);
            }
          }
        });
      }
    });

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

    baselineList.forEach((b) => {
      const key = (b.transactionType || '').trim().toLowerCase();
      if (key && (b.chargesProposed !== undefined && b.chargesProposed !== null && b.chargesProposed !== '' && Number(b.chargesProposed) > 0)) {
        if (!chargesMap.has(key)) {
          chargesMap.set(key, b.chargesProposed);
          unitMap.set(key, b.bankUnit || b.unit || PERCENTAGE);
        }
      }
    });

    const subBankCharges = {
      sbi: { val: '25', unit: '₹' },
      hdfc: { val: '25', unit: '₹' },
      icici: { val: '25', unit: '₹' },
      axis: { val: '25', unit: '₹' },
      others: { val: '25', unit: '₹' },
      upi: { val: '0.00', unit: '%' },
      'debit card - rupay': { val: '0.00', unit: '%' },
      'debit card - master/visa': { val: '0.90', unit: '%' },
      'debit card - master/visa (upto 2000)': { val: '0.40', unit: '%' },
      'debit card - master/visa (> 2000)': { val: '0.90', unit: '%' },
      'credit cards': { val: '1.10', unit: '%' },
      'wallets & prepaid cards': { val: '1.50', unit: '%' },
    };
    Object.entries(subBankCharges).forEach(([k, item]) => {
      if (!chargesMap.has(k)) {
        chargesMap.set(k, item.val);
        unitMap.set(k, item.unit);
      }
    });

    let longestRows = [];
    activeAggs.forEach((agg) => {
      const projs = allProjections[agg.aggregatorId] || [];
      if (projs.length > longestRows.length) {
        longestRows = projs;
      }
    });

    const source = longestRows.length ? longestRows : baselineList;

    const rows = source.map((r, idx) => {
      const key = (r.transactionType || '').trim().toLowerCase();
      const resolvedCharges =
        chargesMap.get(key) ||
        (r.chargesProposed !== undefined && r.chargesProposed !== null && r.chargesProposed !== '' ? r.chargesProposed : 0);
      const resolvedUnit = unitMap.get(key) || r.bankUnit || r.unit || PERCENTAGE;

      const calc = calculateQuoteRow(
        {
          ...r,
          chargesProposed: resolvedCharges,
          bankUnit: resolvedUnit,
          unit: resolvedUnit,
          rate: 0,
        },
        totTxns,
        totAmt
      );

      return {
        ...r,
        id: r.id || idx + 1,
        order: r.order || idx + 1,
        chargesProposed: resolvedCharges,
        bankUnit: resolvedUnit,
        unit: resolvedUnit,
        grossAmount: calc.grossAmount,
        vendorShare: 0,
        expectedRevenue: calc.grossAmount,
        estimatedTransactions: calc.estimatedTransactions,
        aggregateAmount: calc.aggregateAmount,
      };
    });

    return rows.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
  }, [allProjections, customerDetails, activeAggs]);

  // L1 lowest bidder identification
  const l1Aggregator = activeAggs[0] || null;

  // Totals mapping per aggregator
  const aggTotalsMap = useMemo(() => {
    const map = {};
    activeAggs.forEach((agg) => {
      const rows = allProjections[agg.aggregatorId] || [];
      const totals = calculateTotals(rows);
      map[agg.aggregatorId] = totals;
    });
    return map;
  }, [activeAggs, allProjections]);

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const data = [];

      // Header row
      const headers = ['#', 'Payment Channel', 'Proposed Charges', 'Gross Amount (₹)'];
      activeAggs.forEach((agg, idx) => {
        headers.push(`${agg.aggregatorName || `Aggregator ${idx + 1}`} Rate`);
        headers.push(`${agg.aggregatorName || `Aggregator ${idx + 1}`} Vendor Share (₹)`);
        headers.push(`${agg.aggregatorName || `Aggregator ${idx + 1}`} Bank Share (₹)`);
      });
      data.push(headers);

      // Rows
      baseRows.forEach((row, idx) => {
        const rowData = [
          idx + 1,
          row.transactionType,
          `${row.chargesProposed || 0} ${row.bankUnit || '%'}`,
          Number(row.grossAmount || 0),
        ];
        activeAggs.forEach((agg) => {
          const p = (allProjections[agg.aggregatorId] || []).find(
            (item) => (item.transactionType || '').trim().toLowerCase() === (row.transactionType || '').trim().toLowerCase()
          );
          rowData.push(p ? `${p.rate || 0} ${p.unit || '%'}` : '—');
          rowData.push(p ? Number(p.vendorShare || 0) : 0);
          rowData.push(p ? Number(p.expectedRevenue || 0) : 0);
        });
        data.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Cost Benefit Analysis');
      const filename = `CBA_Analysis_${customerDetails?.applicationId || 'Report'}_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
      XLSX.writeFile(wb, filename);
      successNotification('Cost Benefit Analysis exported to Excel.');
    } catch (err) {
      console.error('Failed to export Excel:', err);
      errorNotification('Failed to export Excel.');
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!cbaTableRef.current) return;
    try {
      const canvas = await html2canvas(cbaTableRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      const filename = `CBA_Analysis_${customerDetails?.applicationId || 'Report'}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
      pdf.save(filename);
      successNotification('Cost Benefit Analysis exported to PDF.');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      errorNotification('Failed to export PDF.');
    }
  };

  return {
    isExpanded,
    setIsExpanded,
    isFullScreenCBA,
    setIsFullScreenCBA,
    cbaTableRef,
    activeAggs,
    baseRows,
    l1Aggregator,
    aggTotalsMap,
    handleExportExcel,
    handleExportPDF,
  };
};

export default useCostBenefitAnalysis;
