import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
  Box,
  Grid,
} from "@mui/material";
import { formatDateAndTime } from "&src/utils";

export default function ProjectDetailsTable({ application }) {
  if (!application) return <Typography>No application selected</Typography>;

  const detailRows = [
    { label: "Application ID", value: application.applicationId },
    { label: "Customer / Institution Name", value: application.customerName },
    { label: "Account Number", value: application.accountNo },
    { label: "Business Category", value: application.category && application.category !== 'N/A' ? application.category : (application.integrateWith?.includes('edu') || application.customerName?.toLowerCase().includes('college') ? 'Education & Training' : 'General Services') },
    { label: "Email Address", value: application.email },
    { label: "Mobile Number", value: application.mobileNo },
    { label: "Address", value: application.address },
    { label: "Integrate With (Portal URL)", value: application.integrateWith },
    {
      label: "Payment Projections Selected",
      value: application.projection?.replace(/\|/g, ", ") || "-",
    },
    { label: "Average Balance (Last 6 Months)", value: `₹ ${application.averageBalance?.toLocaleString() || 0}` },
    { label: "Account Balance Today", value: `₹ ${application.accountBalanceToday?.toLocaleString() || 0}` },
    { label: "Expected Annual Transactions", value: application.avgTransactionYearly?.toLocaleString() || 0 },
    { label: "Average Ticket Size", value: `₹ ${application.avgTransactionSize?.toLocaleString() || 0}` },
    { label: "Total Annual Expected Volume", value: `₹ ${(application.totalAnnualTransaction || (application.avgTransactionYearly * application.avgTransactionSize))?.toLocaleString() || 0}` },
    { label: "Created Date & Time", value: formatDateAndTime(application.createdAt) },
    { label: "Application Status", value: application.status },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="subtitle1" fontWeight={700} color="primary" mb={1}>
          Customer & Account Information
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
          <Table size="small">
            <TableBody>
              {detailRows.slice(0, 9).map((row, index) => (
                <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
                  <TableCell sx={{ fontWeight: 600, width: "35%", color: "text.secondary" }}>
                    {row.label}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.value || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Grid item xs={12} sx={{ mt: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} color="primary" mb={1}>
          Financials & Projections
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
          <Table size="small">
            <TableBody>
              {detailRows.slice(9).map((row, index) => (
                <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
                  <TableCell sx={{ fontWeight: 600, width: "35%", color: "text.secondary" }}>
                    {row.label}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.value || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}
