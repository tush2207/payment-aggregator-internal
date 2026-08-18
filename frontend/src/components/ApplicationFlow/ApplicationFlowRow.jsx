import React, { useState } from 'react';
import { Box, TableCell, TableRow, Button, Stack, Divider, Typography } from '@mui/material';
import ApplicationFlowStepper from './ApplicationFlowStepper';
import ProjectionUpdateModal from './ProjectionUpdateModal';
import AggregatorSelectionModal from './AggregatorSelectionModal';
import AggregatorQuotesModal from './AggregatorQuotesModal';
import CustomerAcceptanceModal from './CustomerAcceptanceModal';
import POFreezeModal from './POFreezeModal';
import { PAYMENT_AGGREGATOR_WORKFLOW } from '&src/constants/PaymentAggregratorConstant';
import useApplicationFlowAPI from '&src/hooks/useApplicationFlowAPI';

export default function ApplicationFlowRow({ customer, onRefresh }) {
  const { 
    submitReviewZO,
    submitReviewRO,
    submitReviewCO,
    updateProjections, 
    addAggregators, 
    addMarkupAndSendToRO, 
    submitCustomerAcceptance, 
    finalizeApplicationPO 
  } = useApplicationFlowAPI();

  const steps = PAYMENT_AGGREGATOR_WORKFLOW(customer);

  // Modals state
  const [openProjection, setOpenProjection] = useState(false);
  const [openAggregatorSelect, setOpenAggregatorSelect] = useState(false);
  const [openQuotes, setOpenQuotes] = useState(false);
  const [openAcceptance, setOpenAcceptance] = useState(false);
  const [openPOFreeze, setOpenPOFreeze] = useState(false);

  // Review conditions
  const isPendingZO = customer?.isApplicationSubmittedBR === true && customer?.isReviewByZO === null;
  const isPendingRO = customer?.isReviewByZO === true && customer?.isReviewByRO === null;
  const isPendingCO = customer?.isReviewByRO === true && customer?.isReviewByCO === null;

  const showUpdateProjections = !customer?.isProjectionAdded;
  const showAddAggregators = Boolean(customer?.isProjectionAdded) && !customer?.isAggregatorAdded;
  const showQuoteAnalysis = (Boolean(customer?.isAggregatorAdded) || Boolean(customer?.isQuoteAddedPA)) && !customer?.isMarkUpAddedCO && !customer?.isQuoteReviewCO;
  const showCustomerAcceptance = (Boolean(customer?.isMarkUpAddedCO) || Boolean(customer?.isQuoteReviewCO)) && !customer?.isQuoteAcceptRO;
  const showFinalApproval = Boolean(customer?.isQuoteAcceptRO) && !customer?.isFinalApproved;

  const handleReviewAction = async (role, status) => {
    if (role === 'ZO') await submitReviewZO(customer.applicationId, status, null);
    if (role === 'RO') await submitReviewRO(customer.applicationId, status, null);
    if (role === 'CO') await submitReviewCO(customer.applicationId, status);
    onRefresh();
  };

  const handleUpdateProjections = async (id, data) => {
    await updateProjections(id, data);
    onRefresh();
  };

  const handleSendForQuote = async (id, aggIds) => {
    await addAggregators(id, aggIds);
    onRefresh();
  };

  const handleAddMarkup = async (id, markupData) => {
    await addMarkupAndSendToRO(id, markupData);
    onRefresh();
  };

  const handleSubmitAcceptance = async (id, fileData) => {
    await submitCustomerAcceptance(id, fileData);
    onRefresh();
  };

  const handleFinalizePO = async (id, poDetails) => {
    await finalizeApplicationPO(id, poDetails);
    onRefresh();
  };

  return (
    <TableRow sx={{ p: 0, bgcolor: 'grey.50' }}>
      <TableCell colSpan={11} sx={{ p: 2 }}>
        <Box display="flex" gap={4}>
          <Box flex={1}>
            <ApplicationFlowStepper steps={steps} />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box flex={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Next Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Based on the current state of the application, please proceed with the following steps.
            </Typography>

            <Stack spacing={2} alignItems="flex-start">
              {isPendingZO && (
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="success" onClick={() => handleReviewAction('ZO', 'approved')}>
                    Approve as ZO
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleReviewAction('ZO', 'rejected')}>
                    Reject as ZO
                  </Button>
                </Stack>
              )}
              {isPendingRO && (
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="success" onClick={() => handleReviewAction('RO', 'approved')}>
                    Approve as RO
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleReviewAction('RO', 'rejected')}>
                    Reject as RO
                  </Button>
                </Stack>
              )}
              {isPendingCO && (
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="success" onClick={() => handleReviewAction('CO', 'approved')}>
                    Approve as CO
                  </Button>
                  <Button variant="contained" color="error" onClick={() => handleReviewAction('CO', 'rejected')}>
                    Reject as CO
                  </Button>
                </Stack>
              )}

              {showUpdateProjections && (
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={() => setOpenProjection(true)}>
                    Update Projections
                  </Button>
                  <Button variant="outlined" color="inherit" onClick={() => handleUpdateProjections(customer.applicationId, 'SKIPPED')}>
                    Skip Update
                  </Button>
                </Stack>
              )}
              {showAddAggregators && (
                <Button variant="contained" onClick={() => setOpenAggregatorSelect(true)}>
                  Select Aggregators & Send Quote
                </Button>
              )}
              {showQuoteAnalysis && (
                <Button variant="contained" onClick={() => setOpenQuotes(true)}>
                  Analyze Quotes & Add Markup
                </Button>
              )}
              {showCustomerAcceptance && (
                <Button variant="contained" onClick={() => setOpenAcceptance(true)}>
                  Upload Customer Acceptance
                </Button>
              )}
              {showFinalApproval && (
                <Button variant="contained" color="success" onClick={() => setOpenPOFreeze(true)}>
                  Final Approval & PO Freeze
                </Button>
              )}

              {customer?.isFinalApproved && (
                <Button variant="outlined" color="primary">
                  Download PO Document
                </Button>
              )}
              
              {!isPendingZO && !isPendingRO && !isPendingCO && !showUpdateProjections && !showAddAggregators && !showQuoteAnalysis && !showCustomerAcceptance && !showFinalApproval && !customer?.isFinalApproved && (
                <Typography variant="body2" fontStyle="italic" color="text.secondary">
                  Waiting for previous steps to complete...
                </Typography>
              )}
            </Stack>
          </Box>
        </Box>

        {/* Modals */}
        <ProjectionUpdateModal 
          open={openProjection} 
          onClose={() => setOpenProjection(false)} 
          applicationData={customer}
          onUpdate={handleUpdateProjections}
        />
        <AggregatorSelectionModal 
          open={openAggregatorSelect} 
          onClose={() => setOpenAggregatorSelect(false)} 
          applicationData={customer}
          onSendForQuote={handleSendForQuote}
        />
        <AggregatorQuotesModal 
          open={openQuotes} 
          onClose={() => setOpenQuotes(false)} 
          applicationData={customer}
          onAddMarkup={handleAddMarkup}
        />
        <CustomerAcceptanceModal 
          open={openAcceptance} 
          onClose={() => setOpenAcceptance(false)} 
          applicationData={customer}
          onSubmitAcceptance={handleSubmitAcceptance}
        />
        <POFreezeModal 
          open={openPOFreeze} 
          onClose={() => setOpenPOFreeze(false)} 
          applicationData={customer}
          onFinalizePO={handleFinalizePO}
        />
      </TableCell>
    </TableRow>
  );
}
