import {
  Add,
  CheckCircle,
          // Calculate totals for each aggregator
          const aggregatorTotals = {};
activeAggs.forEach((agg) => {
  aggregatorTotals[agg.aggregatorId] = calculateTotals(allProjections[agg.aggregatorId] || []);
});
aggregatorTotals[agg.aggregatorId] = calculateTotals(allProjections[ag          const baseTotals = calculateTotals(baseRows);
const baseTotals = calculateTotals(baseRows);
const sortedActiveAggs = [...activeAggs].sort((a, b) => {
  const shareA = aggregatorTotals[a.aggregatorId]?.totalVendorShare || 0;
  const shareB = aggregatorTotals[b.aggregatorId]?.totalVendorShare || 0;
  return shareA - shareB;
});
let serialNo = 0;
const handleExportExcel = () => {
  const data = [];
  // Title
  data.push([`Cost Benefit Analysis for ${customerDetails?.customerName || "Customer"}`]);
  data.push([]);
  // Headers
  const headers = [
    "% Share Txn Count",
    "% Share Txn Value",
    "Type of Transaction",
    "Estimated No of Transactions",
    "Aggregate amount (Rs)",
    "Charges proposed",
    "Gross Amount Received (Rs)"
  ];

  activeAggs.forEach(agg => {
    const isAccepted = customerDetails?.isQuoteAcceptRO;
    const label = finalizedAggregatorId
      ? (Number(agg.aggregatorId) === Number(finalizedAggregatorId) ? `${agg.aggregatorName} (FINALIZED)` : `${agg.aggregatorName} (REJECTED)`)
        ? ((Number(agg.aggregatorId) === Number(finalizedAggregatorId) && isAccepted) ? `${agg.aggregatorName} (FINALIZED)` : `${agg.aggregatorName} (REJECTED)`)
        : agg.aggregatorName;
    headers.push(`${label} - Rate`);
    headers.push(`${label} - Vendor Share (Rs)`);
    headers.push(`${label} - Expected Revenue (Rs)`);
  });
  data.push(headers);
  // Data Rows
  baseRows.forEach(row => {
    const rowData = [
      row.transactionCount ? `${row.transactionCount}%` : "",
      row.transactionValue ? `${row.transactionValue}%` : "",
      row.transactionType,
      Math.round(row.estimatedTransactions) || 0,
      row.aggregateAmount || 0,
      row.chargesProposed || 0,
      row.grossAmount || 0
    ];

    activeAggs.forEach(agg => {
      const aggProjList = allProjections[agg.aggregatorId] || [];
      const aggRow = aggProjList.find(r => r.transactionType === row.transactionType) || {};
      rowData.push(aggRow.rate || 0);
      rowData.push(aggRow.vendorShare || 0);
      rowData.push(aggRow.expectedRevenue || 0);
    });
    data.push(rowData);
  });
  // Totals
  const totalsRow = [
    "",
    "",
    "TOTAL",
    baseTotals.totalEstimatedTransactions,
    baseTotals.totalAggregateAmount,
    "",
    baseTotals.totalGrossAmount
  ];

  activeAggs.forEach(agg => {
    const totals = aggregatorTotals[agg.aggregatorId] || {};
    totalsRow.push("");
    totalsRow.push(totals.totalVendorShare || 0);
    totalsRow.push(totals.totalExpectedRevenue || 0);
  });
  data.push(totalsRow);
  // Create Excel
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cost Benefit Analysis");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}.xlsx`);
};
const cbaTableRef = React.useRef(null);
const handleExportPDF = async () => {
  try {
    const element = cbaTableRef.current;
    const oldBg = element.style.background;
    element.style.background = "#ffffff";
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    element.style.background = oldBg;
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pdfWidth = pageWidth - 20;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, pdfWidth, pdfHeight);
    pdf.save(`Cost_Benefit_Analysis_${customerDetails?.customerName || "Customer"}.pdf`);
  } catch (err) {
    console.error("PDF generation error: ", err);
  }
};
const headerCellSx = {
  fontWeight: 700,
  fontSize: "10px",
  py: "6px !important",
  px: "4px !important",
  color: "#ffffff",
  bgcolor: "#1e293b",
  whiteSpace: "normal !important",
  wordBreak: "break-word",
  lineHeight: 1.1,
  verticalAlign: "top",
  textTransform: "none !important",
  border: "1px solid #334155"
};
const subHeaderCellSx = {
  fontWeight: 700,
  fontSize: "9px",
  py: "4px !important",
  px: "3px !important",
  color: "#475569",
  bgcolor: "#f1f5f9",
  whiteSpace: "normal !important",
  wordBreak: "break-word",
  lineHeight: 1.1,
  verticalAlign: "top",
  textTransform: "none !important",
  border: "1px solid #cbd5e1"
};
const cellSx = {
  fontSize: "10px",
  p: "4px !important",
  whiteSpace: "normal",
  wordBreak: "break-word",
  border: "1px solid #e2e8f0"
};
const totalCellSx = {
  fontWeight: 700,
  fontSize: "10px",
  p: "4px !important",
  bgcolor: "#f8fafc",
  border: "1px solid #cbd5e1"
};
const isAccepted = customerDetails?.isQuoteAcceptRO;
return (
  <Box sx={{ width: "100%", mt: 2, p: 2 }}>
    {/* Downloader & Legend Bar */}
    {isAccepted && (
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, bgcolor: "#f8fafc", p: 1.5, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
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
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Download Excel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<Download />}
            onClick={handleExportPDF}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Download PDF
          </Button>
        </Stack>
      </Box>
    )}
    <Box ref={cbaTableRef} sx={{ p: 1, bgcolor: "#ffffff" }}>
      <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
        <Table size="small" sx={{ width: "100%", tableLayout: "auto", borderCollapse: "collapse" }}>
          <TableHead>
            {/* Row 1: Aggregator Headers */}
            <TableRow>
              <TableCell colSpan={7} sx={headerCellSx} align="center">
                Cost Benefit Analysis for Payment Aggregation (Online)
              </TableCell>
              {activeAggs.map((agg) => {
                const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                const headerBg = finalizedAggregatorId
                const headerBg = isAccepted
                  ? (isFinalized ? "#16a34a" : "#dc2626")
                  : "#0f766e";
                const rankIndex = sortedActiveAggs.findIndex(a => a.aggregatorId === agg.aggregatorId) + 1;
                const rankLabel = rankIndex > 0 ? `L${rankIndex}${rankIndex === 1 ? " - Lowest" : ""}` : "";
                return (
                  <TableCell key={agg.aggregatorId} colSpan={3} sx={{ ...headerCellSx, bgcolor: headerBg, border: `1px solid ${headerBg}` }} align="center">
                    {agg.aggregatorName} {finalizedAggregatorId && (isFinalized ? " (Selected)" : " (Rejected)")}
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "10px" }}>{agg.aggregatorName}</Typography>
                      <Typography sx={{ fontSize: "9px", opacity: 0.95, fontWeight: 600 }}>
                        {isAccepted
                          ? (isFinalized ? "(Selected)" : "(Rejected)")
                          : `(${rankLabel})`
                        }
                      </Typography>
                    </Box>
                  </TableCell>
                );
              })}
              <TableCell sx={{ ...subHeaderCellSx, minWidth: "140px" }}>Gross Amount Received from Charges (Rs)</TableCell>
              {activeAggs.map((agg) => {
                const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                const subHeaderBg = finalizedAggregatorId
                const subHeaderBg = isAccepted
                  ? (isFinalized ? "#dcfce7" : "#fee2e2")
                  : "#ccfbf1";
                return (
                  <React.Fragment key={agg.aggregatorId}>
                    <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "80px" }}>Rate</TableCell>
                    <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "90px" }}>Vendor Share (Rs)</TableCell>
                    <TableCell sx={{ ...subHeaderCellSx, bgcolor: subHeaderBg, minWidth: "100px" }}>Expected Revenue (Rs)</TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>ableHead>
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
                      const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                      const columnBg = finalizedAggregatorId
                        ? (isFinalized ? "#f0fdf4" : "#f0fdfa")
                        : "#f0fdfa";
                      return (
                        <React.Fragment key={agg.aggregatorId}>
                          <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
                            {aggRow.allow && aggRow.rate !== undefined ? (aggRow.unit === PERCENTAGE ? `${aggRow.rate}${PERCENTAGE}` : `${aggRow.rate}`) : ""}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
                            {aggRow.allow ? formatNumber(aggRow.vendorShare) : ""}
                          </TableCell>
                          <TableCell sx={{ ...cellSx, bgcolor: columnBg }} align="right">
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
                  const isFinalized = finalizedAggregatorId && Number(agg.aggregatorId) === Number(finalizedAggregatorId);
                  const totalsBg = finalizedAggregatorId
                    ? (isFinalized ? "#dcfce7" : "#e6f4f1")
                    : "#e6f4f1";
                  return (
                    <React.Fragment key={agg.aggregatorId}>
                      <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }}></TableCell>
                      <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }} align="right">
                        {formatNumber(totals.totalVendorShare)}
                      </TableCell>
                      <TableCell sx={{ ...totalCellSx, bgcolor: totalsBg }} align="right">
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
};
export default AggregatorDetails;