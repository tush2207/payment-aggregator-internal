import React, { useState } from 'react';
import { Box, Button, Typography, Stack, Paper, Divider, Grid } from '@mui/material';
import { ApplicationFlowTable, ApplicationFlowDialog } from '&src/components/ApplicationFlow';
import SectionHeader from '&src/components/Headers/SectionHeader';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import ApplicationForm from '&src/modules/PaymentAggregator/ApplicationForm';

// The initial mock state based on the payload you provided
const INITIAL_MOCK_DATA = {
  mobileNo: 7418529000,
  status: "applicationSubmitted",
  isApplicationSubmittedBR: true,
  isReviewByZO: true,
  isReviewByRO: true,
  isReviewByCO: true,
  regionName: "Thane",
  branchName: 'Thane',
  zoneName: 'MMZO',

  // Custom states we need for the UI to progress`
  isProjectionAdded: true,
  isAggregatorAdded: true,
  isQuoteAddedPA: false,
  isMarkUpAddedCO: false,
  isQuoteAcceptRO: false,
  isFinalApproved: false,

  applicationId: 221,
  customerName: "Tushar Events",
  accountNo: 7418520,
  category: "Entertainment & Media",
  createdAt: "2026-03-02T17:30:55",
};

const INITIAL_MOCK_LIST = [
  {
    ...INITIAL_MOCK_DATA,
    applicationId: 221,
    customerName: "Tushar Events",
    createdAt: new Date().toISOString(),
    isProjectionAdded: true,
    isAggregatorAdded: null,
    aggregateDepositAmt: 5000000,
  },
  {
    ...INITIAL_MOCK_DATA,
    applicationId: 222,
    customerName: "Kasbe Digital",
    createdAt: "2025-08-15T11:20:00",
    isProjectionAdded: true,
    isAggregatorAdded: true,
    isQuoteAddedPA: true,
    isMarkUpAddedCO: true,
    isQuoteAcceptRO: true,
    isFinalApproved: true,
    aggregateDepositAmt: 12000000,
  },
  {
    ...INITIAL_MOCK_DATA,
    applicationId: 223,
    customerName: "Apex Retailers",
    createdAt: "2024-12-05T09:45:30",
    isProjectionAdded: true,
    isAggregatorAdded: true,
    isQuoteAddedPA: true,
    isMarkUpAddedCO: true,
    isQuoteAcceptRO: true,
    isFinalApproved: true,
    aggregateDepositAmt: 8500000,
  }
];

export default function TestApplicationFlow() {
  const [mockApp, setMockApp] = useState(INITIAL_MOCK_LIST);
  const [open, setOpen] = useState(false);
  const [isReview, setIsReview] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  const handleClose = () => {
    setApplicationData(null);
    setOpen(false);
  };

  const handleView = (row) => {
    setApplicationData(row);
    setIsReview(false);
    setOpen(true);
  };

  const handleVerify = (row) => {
    setApplicationData(row);
    setIsReview(true);
    setOpen(true);
  };

  // A helper function to simulate the progression of state 
  // when an action is taken inside the ApplicationFlowRow modals
  const handleRefreshSimulation = () => {
    setMockApp(prev => prev.map((item, index) => {
      if (index !== 0) return item; // only progress first item for simple simulation
      const next = { ...item };

      // If CO just reviewed, next step is Projections
      // In this test, we assume if it reaches here and projections are missing, they just added them
      if (next.isReviewByCO && !next.isProjectionAdded) {
        next.isProjectionAdded = true;
      }
      // If projections are added, next step is sending to aggregators
      else if (next.isProjectionAdded && next.isAggregatorAdded === null) {
        next.isAggregatorAdded = true;
      }
      // Note: `isQuoteAddedPA` requires external aggregator action, handled by the manual button above
      else if (next.isQuoteAddedPA && !next.isMarkUpAddedCO) {
        next.isMarkUpAddedCO = true;
      }
      else if (next.isMarkUpAddedCO && !next.isQuoteAcceptRO) {
        next.isQuoteAcceptRO = true;
      }
      else if (next.isQuoteAcceptRO && !next.isFinalApproved) {
        next.isFinalApproved = true;
        next.status = 'finalapproval'; // Visual update
      }

      return next;
    }));
  };

  // For the step where we wait for PA (Aggregator) to actually send the quote back
  const simulateAggregatorQuote = () => {
    setMockApp(prev => prev.map((item, index) => {
      if (index !== 0) return item;
      return {
        ...item,
        isQuoteAddedPA: true,
        status: "quotesubmission"
      };
    }));
  };

  const resetFlow = () => {
    setMockApp(INITIAL_MOCK_LIST);
  };

  return (
    <Box p={3}>
      <SectionHeader title="Application Flow Testing Sandbox" />

      <ApplicationFlowTable
        applicationDetails={mockApp}
        onRefresh={handleRefreshSimulation}
        onView={handleView}
        onVerify={handleVerify}
      />
      <ApplicationFlowDialog />

      <DialogWithHeader
        open={open}
        onClose={handleClose}
        maxWidth="md"
        headerText={isReview ? "Review Customer Application" : "Customer Application Details"}
      >
        <ApplicationForm
          fetchAllApplications={handleRefreshSimulation}
          updateDetails={applicationData}
          handleClose={handleClose}
          formClosed={open}
        />
      </DialogWithHeader>
    </Box>
  );
}
