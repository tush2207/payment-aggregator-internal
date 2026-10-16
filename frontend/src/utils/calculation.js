import { PERCENTAGE, RS } from ".";

/**
 * Canonical channel ordering helper.
 * Standard base channels follow strict banking order:
 * 1: Internet banking
 * 2: SBI
 * 3: HDFC
 * 4: ICICI
 * 5: AXIS
 * 6: OTHERS
 * 7: UPI
 * 8: Debit card - Rupay
 * 9: Debit card - Master/Visa (Upto 2000)
 * 10: Debit card - Master/Visa (Above 2000)
 * 11: Credit cards
 * 12: Wallets & Prepaid Cards
 * Any newly added custom channels/keys will always be placed at the bottom (>= 100).
 */
export function getChannelOrder(item) {
  if (!item) return 999;
  const t = (item.transactionType || '').toLowerCase().trim();
  if (t === 'internet banking' && !item.isIB) return 1;
  if (t === 'sbi') return 2;
  if (t === 'hdfc') return 3;
  if (t === 'icici') return 4;
  if (t === 'axis') return 5;
  if (t === 'others') return 6;
  if (t === 'upi') return 7;
  if (t.includes('rupay') || (t.includes('debit') && !t.includes('master') && !t.includes('visa'))) return 8;
  if (t.includes('master') || t.includes('visa')) {
    return (t.includes('above') || t.includes('>')) ? 10 : 9;
  }
  if (t.includes('credit')) return 11;
  if (t.includes('wallet') || t.includes('prepaid')) return 12;
  if (typeof item.order === 'number' && item.order >= 100) return item.order;
  return 100 + (typeof item.id === 'number' ? item.id : 0);
}

/**
 * Dynamically builds and filters baseline projections for a customer application.
 * - Shows only selected channels if customerProjection is provided
 * - If default channel is missing from customerProjection, removes it
 * - If new custom channel is present in customerProjection, dynamically adds it
 * - Preserves exact default percentages for matched instruments
 * - Applies <= 2000 vs > 2000 ticket size rule for Master/Visa
 */
export function getProjectionsForCustomer(
  defaultProjections = [],
  customerProjection = '',
  avgTransactionSize = 0,
  applicationId = null
) {
  const isLessThanOrEqual2K = Number(avgTransactionSize) <= 2000;
  const rawList = Array.isArray(customerProjection)
    ? customerProjection.map((s) => String(s).trim()).filter(Boolean)
    : typeof customerProjection === 'string' && customerProjection.trim()
    ? customerProjection.split('|').map((s) => s.trim()).filter(Boolean)
    : [];

  const selectedProjs = rawList.map((s) => s.toLowerCase());
  const hasFilter = selectedProjs.length > 0;

  const resultList = [];
  let nextOrder = 1;

  // 1. Process and Filter Standard Default Channels
  (defaultProjections || []).forEach((q) => {
    const typeLower = (q.transactionType || '').toLowerCase();
    let shouldInclude = true;

    if (hasFilter) {
      if (q.isIB) {
        // Keep Net Banking sub-banks if Internet banking is selected
        shouldInclude = selectedProjs.some(
          (p) => p.includes('internet') || p.includes('banking') || p.includes('netbanking')
        );
      } else if (typeLower.includes('internet') || typeLower.includes('banking')) {
        shouldInclude = selectedProjs.some(
          (p) => p.includes('internet') || p.includes('banking') || p.includes('netbanking')
        );
      } else if (typeLower.includes('upi')) {
        shouldInclude = selectedProjs.some((p) => p.includes('upi'));
      } else if (typeLower.includes('rupay')) {
        shouldInclude = selectedProjs.some(
          (p) => p.includes('rupay') || (p.includes('debit') && !p.includes('master') && !p.includes('visa'))
        );
      } else if (typeLower.includes('master') || typeLower.includes('visa')) {
        shouldInclude = selectedProjs.some(
          (p) => p.includes('master') || p.includes('visa') || (p.includes('debit') && !p.includes('rupay'))
        );
      } else if (typeLower.includes('credit')) {
        shouldInclude = selectedProjs.some((p) => p.includes('credit'));
      } else {
        shouldInclude = selectedProjs.some((p) => p === typeLower);
      }
    }

    if (shouldInclude) {
      let count = q.transactionCount ? parseInt(q.transactionCount, 10) || 0 : 0;
      let val = q.transactionValue ? parseInt(q.transactionValue, 10) || 0 : 0;

      // Master/Visa 2000 ticket size condition
      if (q.transactionType === 'Debit card - Master/Visa (Upto 2000)') {
        count = isLessThanOrEqual2K ? (parseInt(q.transactionCount, 10) || 40) : 0;
        val = isLessThanOrEqual2K ? (parseInt(q.transactionValue, 10) || 25) : 0;
      } else if (q.transactionType === 'Debit card - Master/Visa (Above 2000)') {
        count = isLessThanOrEqual2K ? 0 : (parseInt(q.transactionCount, 10) || 40);
        val = isLessThanOrEqual2K ? 0 : (parseInt(q.transactionValue, 10) || 25);
      }

      // If this is an inactive Master/Visa row (0 count and 0 value), do not include it
      if (q.transactionType?.includes('Debit card - Master/Visa') && count === 0 && val === 0) {
        return;
      }

      resultList.push({
        ...q,
        id: nextOrder,
        order: nextOrder,
        applicationId: applicationId || q.applicationId || null,
        aggregatorId: q.aggregatorId || null,
        transactionType: q.transactionType,
        transactionCount: count,
        transactionValue: val,
        transactionTypePercent: q.transactionTypePercent || '',
        isIB: q.isIB || false,
        allow: q.allow ?? (!q.isIB && q.transactionType !== 'Internet banking'),
        rate: q.rate ?? 0,
        unit: q.unit || '₹',
        bankUnit: q.bankUnit || '₹',
        chargesProposed: q.chargesProposed ?? 0,
        grossAmount: q.grossAmount ?? 0,
        vendorShare: q.vendorShare ?? 0,
        expectedRevenue: q.expectedRevenue ?? 0,
        estimatedTransactions: q.estimatedTransactions ?? 0,
        aggregateAmount: q.aggregateAmount ?? 0,
        isDeleted: false,
        quoteVersion: 1,
        revisionRemarks: null,
        isCustom: false,
      });
      nextOrder++;
    }
  });

  // 2. Add New Custom Channels from Customer Application Form
  if (hasFilter) {
    rawList.forEach((projName) => {
      const pLower = projName.toLowerCase();
      const isStandard =
        pLower.includes('internet') ||
        pLower.includes('banking') ||
        pLower.includes('upi') ||
        pLower.includes('debit') ||
        pLower.includes('credit') ||
        pLower.includes('rupay') ||
        pLower.includes('master') ||
        pLower.includes('visa');

      if (!isStandard) {
        const alreadyExists = resultList.some(
          (item) => item.transactionType.toLowerCase() === pLower
        );
        if (!alreadyExists) {
          const existingItem = (defaultProjections || []).find(
            (d) => (d.transactionType || '').toLowerCase() === pLower
          );
          const count = existingItem?.transactionCount !== undefined && existingItem?.transactionCount !== null && existingItem?.transactionCount !== ''
            ? (parseInt(existingItem.transactionCount, 10) || 0)
            : 0;
          const val = existingItem?.transactionValue !== undefined && existingItem?.transactionValue !== null && existingItem?.transactionValue !== ''
            ? (parseInt(existingItem.transactionValue, 10) || 0)
            : 0;

          resultList.push({
            id: nextOrder,
            order: nextOrder,
            applicationId: applicationId || null,
            aggregatorId: null,
            transactionType: projName,
            transactionCount: count,
            transactionValue: val,
            transactionTypePercent: `${val}%`,
            isIB: false,
            allow: true,
            rate: existingItem?.rate ?? 0,
            unit: existingItem?.unit || '%',
            bankUnit: existingItem?.bankUnit || '%',
            chargesProposed: existingItem?.chargesProposed ?? 0,
            grossAmount: existingItem?.grossAmount ?? 0,
            vendorShare: existingItem?.vendorShare ?? 0,
            expectedRevenue: existingItem?.expectedRevenue ?? 0,
            estimatedTransactions: existingItem?.estimatedTransactions ?? 0,
            aggregateAmount: existingItem?.aggregateAmount ?? 0,
            isDeleted: false,
            quoteVersion: 1,
            revisionRemarks: null,
            isCustom: true,
          });
          nextOrder++;
        }
      }
    });
  }

  return resultList;
}

export function generateProjectionArray(projectionDetails, avgTransactionSize) {
  const isLessThanOrEqual2K = Number(avgTransactionSize) <= 2000;

  return projectionDetails
    .filter((item) => {
      if (item.transactionType === "Debit card - Master/Visa (Upto 2000)" && !isLessThanOrEqual2K) {
        return false;
      }
      if (item.transactionType === "Debit card - Master/Visa (Above 2000)" && isLessThanOrEqual2K) {
        return false;
      }
      return true;
    })
    .map((item) => {
      if (item.transactionType === "Debit card - Master/Visa (Upto 2000)") {
        return {
          ...item,
          transactionCount: "40%",
          transactionValue: "25%",
          allow: true
        };
      }
      if (item.transactionType === "Debit card - Master/Visa (Above 2000)") {
        return {
          ...item,
          transactionCount: "40%",
          transactionValue: "25%",
          allow: true
        };
      }
      return item;
    });
}


export function calculateProjectionDetails({
  projectionDetails,
  avgTransactionYearly,
  aggregateDepositAmt,
  applicationId
}) {
  console.log(
    "Input Params:",
    { projectionDetails, avgTransactionYearly, aggregateDepositAmt },
    "calculateProjectionDetails 1"
  );

  const alwaysInclude = ["UPI", "Debit card - Rupay"];
  const projections = [...new Set([...projectionDetails.map(d => d.transactionType), ...alwaysInclude])];

  console.log(projections, "projections (all from projectionDetails + alwaysInclude)");

  //  Helper function to consistently format to 3 decimals
  const formatTo3Decimals = (value) => Number(parseFloat(value || 0).toFixed(3));

  // Step 1: Pre-calculate all items
  const firstPass = projectionDetails?.map((item) => {
    console.log(" Processing Item:", item, "calculateProjectionDetails 2");

    const countPercent = parseFloat(item.transactionCount) / 100 || 0;
    const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

    const estimatedTransactions = formatTo3Decimals(countPercent * parseFloat(avgTransactionYearly));
    const aggregateAmount = formatTo3Decimals(valuePercent * parseFloat(aggregateDepositAmt));

    console.log(" Calculated Projection: calculateProjectionDetails 3", {
      transactionType: item.transactionType,
      countPercent,
      valuePercent,
      estimatedTransactions,
      aggregateAmount,
    });

    return {
      ...item,
      estimatedTransactions,
      aggregateAmount,
      applicationId,
      isDeleted: false,
      rate: formatTo3Decimals(0),
      unit: "₹",
      chargesProposed: formatTo3Decimals(0),
      grossAmount: formatTo3Decimals(0),
      vendorShare: formatTo3Decimals(0),
      expectedRevenue: formatTo3Decimals(0),
    };
  });

  // Step 2: Find Internet Banking parent
  const ibParent = firstPass?.find((d) => d.transactionType === "Internet banking");

  console.log(" Internet Banking Parent: calculateProjectionDetails 4", ibParent);

  // Step 3: Calculate children + allow logic
  const secondPass = firstPass?.map((item) => {
    let updatedItem = { ...item };

    if (item.isIB && ibParent) {
      const percent = parseFloat(item.transactionTypePercent) / 100 || 0;

      updatedItem = {
        ...item,
        estimatedTransactions: formatTo3Decimals(percent * ibParent.estimatedTransactions),
        aggregateAmount: formatTo3Decimals(percent * ibParent.aggregateAmount),
      };

      console.log(" IB Child Calculation: calculateProjectionDetails 5", {
        transactionType: item.transactionType,
        percent,
        estimatedTransactions: updatedItem.estimatedTransactions,
        aggregateAmount: updatedItem.aggregateAmount,
      });
    }

    // Allow logic: all instruments except Internet Banking parent row are allowed
    updatedItem.allow = item.isIB
      ? true
      : item.transactionType === "Internet banking"
        ? false
        : true;

    //  Ensure numeric values remain formatted to 3 decimals
    updatedItem = {
      ...updatedItem,
      estimatedTransactions: formatTo3Decimals(updatedItem.estimatedTransactions),
      aggregateAmount: formatTo3Decimals(updatedItem.aggregateAmount),
      chargesProposed: formatTo3Decimals(updatedItem.chargesProposed),
      grossAmount: formatTo3Decimals(updatedItem.grossAmount),
      vendorShare: formatTo3Decimals(updatedItem.vendorShare),
      expectedRevenue: formatTo3Decimals(updatedItem.expectedRevenue),
    };

    console.log(
      " Final Item After Allow Logic: calculateProjectionDetails 6",
      updatedItem
    );

    return updatedItem;
  });

  // Step 4: Return everything without filtering
  console.log(" Final Result: calculateProjectionDetails 8", secondPass);

  return secondPass;
}

export function calculateProjectionDetails1(
  projectionDetails,
  avgTransactionYearly,
  aggregateDepositAmt,
  projectionList = []
) {
  // Step 1: Pre-calculate all non-IB items (including parent Internet Banking)
  const firstPass = projectionDetails?.map(item => {
    let estimatedTransactions = 0;
    let aggregateAmount = 0;

    if (!item.isIB && projectionList.includes(item.projectionType)) {
      const countPercent = parseFloat(item.transactionCount) / 100 || 0;
      const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

      estimatedTransactions = countPercent * avgTransactionYearly;
      aggregateAmount = valuePercent * aggregateDepositAmt;
    }

    return {
      ...item,
      estimatedTransactions: Math.round(estimatedTransactions),
      aggregateAmount: Number(aggregateAmount.toFixed(2))
    };
  });

  // Step 2: Find Internet Banking parent
  const ibParent = firstPass?.length > 0 && firstPass?.find(d => d.transactionType === "Internet Banking");

  // Step 3: Calculate children using parent values + add allow logic
  return firstPass?.length > 0 && firstPass?.map(item => {
    let updatedItem = { ...item };

    if (item.isIB && ibParent) {
      const percent = parseFloat(item.transactionTypePercent) / 100 || 0;
      updatedItem = {
        ...item,
        estimatedTransactions: Math.round(percent * ibParent.estimatedTransactions),
        aggregateAmount: Number((percent * ibParent.aggregateAmount).toFixed(2))
      };
    }

    // Add allow field (merged getProjectionWithAllow logic)
    updatedItem.allow = !item.isIB
      ? projectionList.includes(item.transactionType)
      : true;
    //in this i want to add if "Internet banking" is there for that i always  want false
    return updatedItem;
  });
}
// export function calculateProjectionDetails(
//   projectionDetails,
//   avgTransactionYearly,
//   aggregateDepositAmt,
//   selectedProjections = []
// ) {

//   console.log(projectionDetails,
//     avgTransactionYearly,
//     aggregateDepositAmt,
//     selectedProjections, 'calculateProjectionDetails')

//   // Step 1: Pre-calculate all non-IB items (including parent Internet Banking)
//   const firstPass = projectionDetails?.length > 0 && projectionDetails?.map(item => {
//     let estimatedTransactions = 0;
//     let aggregateAmount = 0;

//     console.log(item.transactionType, 'calculateProjectionDetails', item)


//     if (selectedProjections?.length > 0 && selectedProjections?.includes(item.transactionType)) {
//       const countPercent = parseFloat(item.transactionCount) / 100 || 0;
//       const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

//       console.log(item.transactionType, 'calculateProjectionDetails', item)
//       estimatedTransactions = countPercent * avgTransactionYearly;
//       aggregateAmount = valuePercent * aggregateDepositAmt;
//     }

//     return {
//       ...item,
//       estimatedTransactions: Math.round(estimatedTransactions),
//       aggregateAmount: Number(aggregateAmount.toFixed(2))
//     };
//   });

//   // Step 2: Find Internet Banking parent
//   const ibParent = firstPass?.length > 0 && firstPass?.find(d => d.transactionType === "Internet Banking");

//   // Step 3: Calculate children + add allow logic
//   const secondPass = firstPass?.length > 0 && firstPass?.map(item => {
//     let updatedItem = { ...item };

//     if (item.isIB && ibParent) {
//       const percent = parseFloat(item.transactionTypePercent) / 100 || 0;
//       updatedItem = {
//         ...item,
//         estimatedTransactions: Math.round(percent * ibParent.estimatedTransactions),
//         aggregateAmount: Number((percent * ibParent.aggregateAmount).toFixed(2))
//       };
//     }

//     updatedItem.allow = !item.isIB
//       ? projectionList.includes(item.transactionType)
//       : true;

//     return updatedItem;
//   });

//   // Step 4: Return only rows where transactionType is in projectionList (or IB child if parent included)
//   return secondPass?.length > 0 && secondPass?.filter(item =>
//     item.isIB
//       ? !!ibParent && projectionList.includes(ibParent.transactionType)
//       : projectionList.includes(item.transactionType)
//   );
// }
export function calculateProjectionDetails_working({
  projectionDetails,
  avgTransactionYearly,
  aggregateDepositAmt,
  selectedProjections,
  applicationId
}
) {
  console.log(
    "Input Params:",
    { projectionDetails, avgTransactionYearly, aggregateDepositAmt, selectedProjections },
    "calculateProjectionDetails 1"
  );

  const alwaysInclude = ["UPI", "Rupay"];
  const projections = [...new Set([...selectedProjections, ...alwaysInclude])]; // merge without duplicates

  console.log(projections, "projections (with alwaysInclude)");

  // Step 1: Pre-calculate all non-IB items (including parent Internet Banking)
  const firstPass =
    projectionDetails?.length > 0 &&
    projectionDetails.map((item) => {
      let estimatedTransactions = 0;
      let aggregateAmount = 0;

      console.log(" Processing Item:", item, "calculateProjectionDetails 2");

      //  calculate if it's in selectedProjections OR alwaysInclude
      if (projections.includes(item.transactionType)) {
        const countPercent = parseFloat(item.transactionCount) / 100 || 0;
        const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

        estimatedTransactions = countPercent * avgTransactionYearly;
        aggregateAmount = valuePercent * aggregateDepositAmt;

        console.log(" Calculated Projection: calculateProjectionDetails 3", {
          transactionType: item.transactionType,
          countPercent,
          valuePercent,
          estimatedTransactions,
          aggregateAmount,
        });
      }

      return {
        ...item,
        estimatedTransactions: Math.round(estimatedTransactions),
        aggregateAmount: Number(aggregateAmount.toFixed(2)),
        applicationId
      };
    });

  // Step 2: Find Internet Banking parent
  const ibParent =
    firstPass?.length > 0 &&
    firstPass.find((d) => d.transactionType === "Internet banking");

  console.log(" Internet Banking Parent: calculateProjectionDetails 4", ibParent);

  // Step 3: Calculate children + add allow logic
  const secondPass =
    firstPass?.length > 0 &&
    firstPass.map((item) => {
      let updatedItem = { ...item };

      if (item.isIB && ibParent) {
        const percent = parseFloat(item.transactionTypePercent) / 100 || 0;
        updatedItem = {
          ...item,
          estimatedTransactions: Math.round(percent * ibParent.estimatedTransactions),
          aggregateAmount: Number((percent * ibParent.aggregateAmount).toFixed(2)),
        };

        console.log(" IB Child Calculation: calculateProjectionDetails 5", {
          transactionType: item.transactionType,
          percent,
          estimatedTransactions: updatedItem.estimatedTransactions,
          aggregateAmount: updatedItem.aggregateAmount,
        });
      }
      // Add allow field (merged getProjectionWithAllow logic)
      if (item.transactionType === "Internet banking" && !item.isIB) {
        //  Always false for Internet banking parent
        updatedItem.allow = false;
      } else {
        updatedItem.allow = !item.isIB
          ? selectedProjections?.includes(item.transactionType)
          : true;
      }

      console.log(
        " Final Item After Allow Logic: calculateProjectionDetails 6",
        updatedItem
      );

      return updatedItem;
    });

  // Step 4: Final filter (keep selected OR alwaysInclude OR IB child if parent included)
  const finalResult =
    secondPass?.length > 0 &&
    secondPass.filter((item) =>
      item.isIB
        ? !!ibParent && projections.includes(ibParent.transactionType)
        : projections.includes(item.transactionType)
    );

  console.log(" Final Result: calculateProjectionDetails 8", finalResult);

  return finalResult;
}

export function getProjectionWithAllow(data, projectionList = []) {
  return data.map(item => ({
    ...item,
    allow: !item.isIB ? projectionList.includes(item.transactionType) : true
  }));
}

export function markAllowedIBTransactions(data, projectionList = []) {
  return data.map(item => {
    if (item.isIB) {
      return {
        ...item,
        allow: projectionList.includes(item.transactionType)
      };
    }
    return item; // leave non-IB rows unchanged
  });
}

//  Pure utility function for calculations
// export const calculateQuoteRow = (row, newCharges, newUnit, newRate) => {
//   const charges = newCharges !== undefined ? parseFloat(newCharges) || 0 : row.chargesProposed || 0;
//   const unit = newUnit || row.unit;
//   const rate = newRate !== undefined ? parseFloat(newRate) || row.rate : row.rate;

//   const grossAmount = row.estimatedTransactions * charges;

//   let vendorShare = 0;
//   let expectedRevenue = 0;

//   if (unit === PERCENTAGE) {
//     vendorShare = (grossAmount * rate) / 100;
//     expectedRevenue = grossAmount - vendorShare;
//   } else {
//     // Flat = per transaction flat rate
//     vendorShare = row.estimatedTransactions * rate;
//     expectedRevenue = grossAmount - vendorShare;
//   }

//   return {
//     ...row,
//     chargesProposed: charges,
//     unit,
//     rate,
//     grossAmount,
//     vendorShare,
//     expectedRevenue,
//   };
// };
// export const calculateQuoteRow = (row, newCharges, newUnit, newRate) => {
//   const unit = newUnit || row.unit;

//   // keep charges as string for input, parseFloat only for calculation
//   const charges =
//     newCharges !== undefined && newCharges !== ""
//       ? newCharges
//       : row.chargesProposed || 0;

//   const rate =
//     newRate !== undefined && newRate !== ""
//       ? newRate
//       : row.rate || 0;

//   let grossAmount = 0;
//   let vendorShare = 0;
//   let expectedRevenue = 0;

//   if (unit === PERCENTAGE) {
//     //  charges means "percentage value"
//     grossAmount = (row.aggregateAmount * charges) / 100;
//     vendorShare = (row.aggregateAmount * rate) / 100;
//     expectedRevenue = grossAmount - vendorShare;
//   } else {
//     //  charges means "flat value"
//     grossAmount = row.isIB ? row.estimatedTransactions * charges : row.aggregateAmount * charges;
//     vendorShare = row.estimatedTransactions * rate;
//     expectedRevenue = grossAmount - vendorShare;
//   }

//   return {
//     ...row,
//     chargesProposed: newCharges, // string for input
//     unit,
//     rate,
//     grossAmount,
//     vendorShare,
//     expectedRevenue,
//   };
// };
/**
 * Helper to identify whether a channel has 0% projection / zero volume.
 */
export function isZeroProjectionChannel(item) {
  if (!item) return true;
  if (item.isIB) {
    const pct = parseFloat(String(item.transactionTypePercent || '').replace(/[%₹,\s]/g, '')) || 0;
    const est = Number(item.estimatedTransactions) || 0;
    const amt = Number(item.aggregateAmount) || 0;
    return pct === 0 && est === 0 && amt === 0;
  }

  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const cleaned = String(val).replace(/[%₹,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const count = parseNum(item.transactionCount);
  const value = parseNum(item.transactionValue);
  const estTxn = parseNum(item.estimatedTransactions);
  const aggAmt = parseNum(item.aggregateAmount);

  if (count > 0 || value > 0 || estTxn > 0 || aggAmt > 0) {
    return false;
  }
  return true;
}

export const calculateQuoteRow = (row, newCharges, newUnit, newRate) => {
  if (!row) return row;

  if (isZeroProjectionChannel(row)) {
    return {
      ...row,
      chargesProposed: "",
      rate: 0,
      grossAmount: 0,
      vendorShare: 0,
      expectedRevenue: 0,
    };
  }

  const unit = newUnit || row.unit || "₹";         // Aggregator unit (% or ₹)
  const rateNum = newRate !== undefined && !Number.isNaN(Number(newRate))
    ? parseFloat(newRate) || 0
    : (parseFloat(row.rate) || 0);

  // Clean charges string: sanitize NaN, null, undefined
  let rawCharges = newCharges !== undefined ? newCharges : row.chargesProposed;
  if (rawCharges === "NaN" || Number.isNaN(rawCharges) || Number.isNaN(Number(rawCharges))) {
    rawCharges = "";
  }

  let chargesStr = rawCharges !== undefined && rawCharges !== null && rawCharges !== "" && Number(rawCharges) > 0
    ? String(rawCharges)
    : "";

  const bankUnit = row?.bankUnit || unit;            // Bank-side unit (% or ₹)
  const aggAmt = Number(row.aggregateAmount) || 0;
  const estTxn = Number(row.estimatedTransactions) || 0;
  const existingGross = Number(row.grossAmount) || 0;

  let chargesNum = chargesStr !== "" ? (parseFloat(chargesStr) || 0) : 0;

  // If charges are 0 but grossAmount exists, dynamically compute the proposed charge
  if (chargesNum === 0 && existingGross > 0) {
    if ((bankUnit === PERCENTAGE || bankUnit === "%") && aggAmt > 0) {
      chargesNum = (existingGross * 100) / aggAmt;
      chargesStr = String(parseFloat(chargesNum.toFixed(4)));
    } else if (estTxn > 0) {
      chargesNum = existingGross / estTxn;
      chargesStr = String(parseFloat(chargesNum.toFixed(4)));
    }
  }

  let grossAmount = 0;
  let vendorShare = 0;
  let expectedRevenue = 0;

  grossAmount = chargesStr !== "" && chargesNum > 0
    ? ((bankUnit === PERCENTAGE || bankUnit === "%") ? (aggAmt * chargesNum) / 100 : estTxn * chargesNum)
    : existingGross;

  vendorShare = (unit === PERCENTAGE || unit === "%") ? (aggAmt * rateNum) / 100 : estTxn * rateNum;
  expectedRevenue = grossAmount - vendorShare;

  return {
    ...row,
    chargesProposed: chargesStr,
    bankUnit,
    unit,
    rate: Number.isNaN(rateNum) ? 0 : rateNum,
    grossAmount: Number.isNaN(grossAmount) ? 0 : grossAmount,
    vendorShare: Number.isNaN(vendorShare) ? 0 : vendorShare,
    expectedRevenue: Number.isNaN(expectedRevenue) ? 0 : expectedRevenue,
  };
};

//working code
// export const calculateQuoteRow = (row, newCharges, newUnit, newRate) => {
//   console.log('calculateAll', row)

//   const unit = newUnit || row.unit;
//   const bankUnit = row.bankUnit;


//   // keep charges as string for input
//   const chargesStr = newCharges !== undefined ? newCharges : row.chargesProposed || "";
//   const chargesNum = parseFloat(chargesStr) || 0;

//   const rateNum = newRate !== undefined ? parseFloat(newRate) || 0 : row.rate || 0;

//   let grossAmount = 0;
//   let vendorShare = 0;
//   let expectedRevenue = 0;

//   if (unit === bankUnit === PERCENTAGE){
    
//   }

//   if (unit  === PERCENTAGE) {
//     grossAmount = (row.aggregateAmount * chargesNum) / 100;
//     vendorShare = (row.aggregateAmount * rateNum) / 100;
//     expectedRevenue = grossAmount - vendorShare;
//   } else {
//     grossAmount = row.isIB ? row.estimatedTransactions * chargesNum : row.aggregateAmount * chargesNum;
//     vendorShare = row.estimatedTransactions * rateNum;
//     expectedRevenue = grossAmount - vendorShare;
//   }

//   return {
//     ...row,
//     chargesProposed: chargesStr, // keep string for input
//     unit,
//     rate: rateNum,
//     grossAmount,
//     vendorShare,
//     expectedRevenue,
//   };
// };

//  Pure utility function for totals
export const calculateTotals = (rows, precision = 3) => {
  const totals = {
    totalEstimatedTransactions: 0,
    totalAggregateAmount: 0,
    totalGrossAmount: 0,
    totalVendorShare: 0,
    totalExpectedRevenue: 0,
  };

  for (const row of rows) {
    if (!row) continue;
    const isIB = Boolean(row.isIB);

    if (!isIB) {
      totals.totalEstimatedTransactions += Number(row.estimatedTransactions) || 0;
      totals.totalAggregateAmount += Number(row.aggregateAmount) || 0;
    }
    console.log(rows,'rowsrowsrows')
    totals.totalGrossAmount += Number(row.grossAmount) || 0;
    totals.totalVendorShare += Number(row.vendorShare) || 0;
    totals.totalExpectedRevenue += Number(row.expectedRevenue) || 0;
  }

  //  Round dynamically based on precision (default = 3)
  Object.keys(totals).forEach(
    (key) => (totals[key] = Number(totals[key].toFixed(precision)))
  );

  return totals;
};


