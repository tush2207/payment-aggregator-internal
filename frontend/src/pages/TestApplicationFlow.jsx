import React, { useState } from 'react';
import { Box, Button, Typography, Stack, Paper, Divider, Grid } from '@mui/material';
import { ApplicationFlowTable } from '&src/components/ApplicationFlow';
import SectionHeader from '&src/components/Headers/SectionHeader';

// The initial mock state based on the payload you provided
const INITIAL_MOCK_DATA = {
  mobileNo: 7418529000,
  status: "applicationSubmitted",
  isApplicationSubmittedBR: true,
  isReviewByZO: false,
  isReviewByRO: false,
  isReviewByCO: false,
  regionName: "Thane",
  branchName: 'Thane',
  zoneName: 'MMZO',

  // Custom states we need for the UI to progress`
  isProjectionAdded: false,
  isAggregatorAdded: false,
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

export default function TestApplicationFlow() {
  const [mockApp, setMockApp] = useState({ ...INITIAL_MOCK_DATA });

  // A helper function to simulate the progression of state 
  // when an action is taken inside the ApplicationFlowRow modals
  const handleRefreshSimulation = () => {
    setMockApp(prev => {
      const next = { ...prev };

      // If CO just reviewed, next step is Projections
      // In this test, we assume if it reaches here and projections are missing, they just added them
      if (next.isReviewByCO && !next.isProjectionAdded) {
        next.isProjectionAdded = true;
      }
      // If projections are added, next step is sending to aggregators
      else if (next.isProjectionAdded && !next.isAggregatorAdded) {
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
    });
  };

  // For the step where we wait for PA (Aggregator) to actually send the quote back
  const simulateAggregatorQuote = () => {
    setMockApp(prev => ({
      ...prev,
      isQuoteAddedPA: true,
      status: "quotesubmission"
    }));
  };

  const resetFlow = () => {
    setMockApp({ ...INITIAL_MOCK_DATA });
  };

  return (
    <Box p={3}>
      <SectionHeader title="Application Flow Testing Sandbox" />

      <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Test Controller
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Expand the row in the table below to see the Next Actions. When you complete an action in a modal, the state will automatically advance here.
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mr: 2 }}>
                Current Progress:
              </Typography>

              <Button size="small" variant={mockApp.isProjectionAdded ? "contained" : "outlined"} color="info" disabled>
                Projections Added
              </Button>
              <Button size="small" variant={mockApp.isAggregatorAdded ? "contained" : "outlined"} color="info" disabled>
                Sent to PA
              </Button>
              <Button size="small" variant={mockApp.isQuoteAddedPA ? "contained" : "outlined"} color="warning"
                onClick={simulateAggregatorQuote}
                disabled={!mockApp.isAggregatorAdded || mockApp.isQuoteAddedPA}
              >
                {mockApp.isQuoteAddedPA ? "PA Sent Quote" : "Click to Simulate PA Sending Quote"}
              </Button>
              <Button size="small" variant={mockApp.isMarkUpAddedCO ? "contained" : "outlined"} color="info" disabled>
                Markup Added
              </Button>
              <Button size="small" variant={mockApp.isQuoteAcceptRO ? "contained" : "outlined"} color="info" disabled>
                Customer Accepted
              </Button>
              <Button size="small" variant={mockApp.isFinalApproved ? "contained" : "outlined"} color="success" disabled>
                Final PO Frozen
              </Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button variant="outlined" color="error" onClick={resetFlow}>
              Reset Flow
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <ApplicationFlowTable
        applicationDetails={[mockApp]}
        onRefresh={handleRefreshSimulation}
        onView={() => console.log('View Clicked')}
        onEdit={() => console.log('Edit Clicked')}
      />
    </Box>
  );
}
