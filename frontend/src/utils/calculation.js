import { PERCENTAGE, RS } from ".";

export function generateProjectionArray(projectionDetails, avgTransactionSize) {
  const isLessThanOrEqual2K = avgTransactionSize <= 2000;

  return projectionDetails.map((item) => {
    // Upto 2000 rule
    if (item.transactionType === "Debit card - Master/Visa (Upto 2000)") {
      return {
        ...item,
        transactionCount: isLessThanOrEqual2K ? "40%" : "",
        transactionValue: isLessThanOrEqual2K ? "25%" : "",
        allow: isLessThanOrEqual2K
      };
    }

    // Above 2000 rule
    if (item.transactionType === "Debit card - Master/Visa (Above 2000)") {
      return {
        ...item,
        transactionCount: isLessThanOrEqual2K ? "" : "40%",
        transactionValue: isLessThanOrEqual2K ? "" : "25%",
        allow: !isLessThanOrEqual2K
      };
    }

    // otherwise return item unchanged
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

  // ✅ Helper function to consistently format to 3 decimals
  const formatTo3Decimals = (value) => Number(parseFloat(value || 0).toFixed(3));

  // Step 1: Pre-calculate all items
  const firstPass = projectionDetails?.map((item) => {
    console.log("➡️ Processing Item:", item, "calculateProjectionDetails 2");

    const countPercent = parseFloat(item.transactionCount) / 100 || 0;
    const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

    const estimatedTransactions = formatTo3Decimals(countPercent * parseFloat(avgTransactionYearly));
    const aggregateAmount = formatTo3Decimals(valuePercent * parseFloat(aggregateDepositAmt));

    console.log("✅ Calculated Projection: calculateProjectionDetails 3", {
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

  console.log("🔍 Internet Banking Parent: calculateProjectionDetails 4", ibParent);

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

      console.log("📊 IB Child Calculation: calculateProjectionDetails 5", {
        transactionType: item.transactionType,
        percent,
        estimatedTransactions: updatedItem.estimatedTransactions,
        aggregateAmount: updatedItem.aggregateAmount,
      });
    }

    // Allow logic
    updatedItem.allow = item.isIB
      ? true
      : item.transactionType === "Internet banking"
        ? false
        : true;

    // 🚫 Override for UPI and Rupay
    if (["UPI", "Debit card - Rupay"].includes(item.transactionType)) {
      updatedItem.allow = false;
    }

    // ✅ Ensure numeric values remain formatted to 3 decimals
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
      "⚙️ Final Item After Allow Logic: calculateProjectionDetails 6",
      updatedItem
    );

    return updatedItem;
  });

  // Step 4: Return everything without filtering
  console.log("✅ Final Result: calculateProjectionDetails 8", secondPass);

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

      console.log("➡️ Processing Item:", item, "calculateProjectionDetails 2");

      // ✅ calculate if it's in selectedProjections OR alwaysInclude
      if (projections.includes(item.transactionType)) {
        const countPercent = parseFloat(item.transactionCount) / 100 || 0;
        const valuePercent = parseFloat(item.transactionValue) / 100 || 0;

        estimatedTransactions = countPercent * avgTransactionYearly;
        aggregateAmount = valuePercent * aggregateDepositAmt;

        console.log("✅ Calculated Projection: calculateProjectionDetails 3", {
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

  console.log("🔍 Internet Banking Parent: calculateProjectionDetails 4", ibParent);

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

        console.log("📊 IB Child Calculation: calculateProjectionDetails 5", {
          transactionType: item.transactionType,
          percent,
          estimatedTransactions: updatedItem.estimatedTransactions,
          aggregateAmount: updatedItem.aggregateAmount,
        });
      }
      // Add allow field (merged getProjectionWithAllow logic)
      if (item.transactionType === "Internet banking" && !item.isIB) {
        // 🚫 Always false for Internet banking parent
        updatedItem.allow = false;
      } else {
        updatedItem.allow = !item.isIB
          ? selectedProjections?.includes(item.transactionType)
          : true;
      };

      console.log(
        "⚙️ Final Item After Allow Logic: calculateProjectionDetails 6",
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

  console.log("✅ Final Result: calculateProjectionDetails 8", finalResult);

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

// 🔹 Pure utility function for calculations
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
//     // ✅ charges means "percentage value"
//     grossAmount = (row.aggregateAmount * charges) / 100;
//     vendorShare = (row.aggregateAmount * rate) / 100;
//     expectedRevenue = grossAmount - vendorShare;
//   } else {
//     // ✅ charges means "flat value"
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
export const calculateQuoteRow = (row, newCharges, newUnit, newRate) => {
  const unit = newUnit || row.unit;         // Aggregator unit (% or ₹)
  const bankUnit = row?.bankUnit;            // Bank-side unit (% or ₹)

  const chargesStr = newCharges ?? row.chargesProposed ?? "";
  const chargesNum = parseFloat(chargesStr) || 0;

  const rateNum = newRate !== undefined ? parseFloat(newRate) || 0 : row.rate || 0;

  const aggAmt = row.aggregateAmount || 0;
  const estTxn = row.estimatedTransactions || 0;

  let grossAmount = 0;
  let vendorShare = 0;
  let expectedRevenue = 0;


  grossAmount = bankUnit === PERCENTAGE ?  (aggAmt * chargesNum) / 100 : estTxn * chargesNum;

  vendorShare = unit === PERCENTAGE ?  (aggAmt * rateNum) / 100 : estTxn * rateNum;


  // if(unit === RS){
  //   vendorShare = rateNum * estTxn
  //   grossAmount = 
  // }
  // // ----------------------------------------------------------
  // // CASE 1: SAME UNIT → Standard calculation
  // // ----------------------------------------------------------
  // if (unit === bankUnit) {
  //   if (unit === "%") {
  //     grossAmount = (aggAmt * chargesNum) / 100;
  //     vendorShare = (aggAmt * rateNum) / 100;
  //   } else {
  //     // INR (₹)
  //     grossAmount = row.isIB ? estTxn * chargesNum : aggAmt * chargesNum;
  //     vendorShare = estTxn * rateNum;
  //   }
  // }

  // // ----------------------------------------------------------
  // // CASE 2: DIFFERENT UNITS → Convert properly
  // // ----------------------------------------------------------
  // else {
  //   // unit = %, bankUnit = Rs
  //   if (unit === PERCENTAGE && bankUnit === RS) {
  //     // chargesNum is %, convert vendorShare from Rs to %
  //     grossAmount = (aggAmt * chargesNum) / 100;

  //     // bank rate (rateNum) is Rs per txn → convert to absolute
  //     vendorShare = estTxn * rateNum;
  //   }

  //   // unit = Rs, bankUnit = %
  //   else if (unit === RS && bankUnit === PERCENTAGE) {
  //     // chargesNum is Rs → absolute amount
  //     grossAmount =  estTxn * chargesNum 

  //     // bank rate is % → convert to absolute
  //     vendorShare = unit ===  PERCENTAGE ? estTxn * rateNum: (aggAmt * rateNum) / 100;
  //   }
  // }

  expectedRevenue = grossAmount - vendorShare;

  return {
    ...row,
    chargesProposed: chargesStr,
    unit,
    rate: rateNum,
    grossAmount,
    vendorShare,
    expectedRevenue,
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

// 🔹 Pure utility function for totals
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

  // ✅ Round dynamically based on precision (default = 3)
  Object.keys(totals).forEach(
    (key) => (totals[key] = Number(totals[key].toFixed(precision)))
  );

  return totals;
};


