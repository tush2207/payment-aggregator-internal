import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, Paper
} from "@mui/material";
import { PERCENTAGE, RS } from "&src/utils";

export default function TransactionRateTable({ projectionDetails: initialDetails }) {
  // keep data in state so edits update the same JSON
  const [projectionDetails, setProjectionDetails] = useState(initialDetails);

  // handle rate input change
  const handleRateChange = (index, value) => {
    const updated = [...projectionDetails];
    updated[index].rate = value;
    setProjectionDetails(updated);
  };

  // handle rateType dropdown change
  const handleRateTypeChange = (index, value) => {
    const updated = [...projectionDetails];
    updated[index].rateType = value;
    setProjectionDetails(updated);
  };

  return (
    <TableContainer component={Paper} >
      <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
        <TableHead>
          <TableRow>
            <TableCell>Sr No</TableCell>
            <TableCell>Transaction Type</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Unit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(() => {
            let serial = 1; // counter for Sr No

            return projectionDetails
              ?.filter(
                (row) =>
                  row.transactionType === "Internet banking" || row.allow === true
              )
              .map((row, index) => (
                <TableRow key={index}>
                  {/* Sr No (skip for isIB, continuous for others) */}
                  <TableCell>
                    {row.isIB ? "" : serial++}
                  </TableCell>

                  {/* Transaction Type */}
                  <TableCell>
                    <span>{row.transactionType}</span>
                  </TableCell>

                  {/* Rate */}
                  <TableCell>
                    {row.transactionType === "Internet banking" ? (
                      "-" // disable for parent IB
                    ) : (
                      <input
                        type="text"
                        value={row.rate}
                        maxLength={4}
                        onChange={(e) => handleRateChange(index, e.target.value)}
                        style={{
                          border: "1px solid #1976d1",
                          borderRadius: "4px",
                          fontSize: "14px",
                          width: "65%",
                          height: "25px",
                          textAlign: "end",
                        }}
                      />
                    )}
                  </TableCell>

                  {/* Unit */}
                  <TableCell>
                    {row.transactionType === "Internet banking" ? (
                      "-" // disable for parent IB
                    ) : (
                      <select
                        value={row.rateType}
                        onChange={(e) => handleRateTypeChange(index, e.target.value)}
                        style={{
                          width: "58%",
                          padding: "6px 8px",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      >
                        <option value={RS}>Flat</option>
                        <option value={PERCENTAGE}>Percentage</option>
                      </select>
                    )}
                  </TableCell>
                </TableRow>
              ));
          })()}
        </TableBody>

      </Table >
    </TableContainer >
  );
}
