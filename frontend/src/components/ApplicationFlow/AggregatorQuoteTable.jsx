import React from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import {
  Groups2,
  AnalyticsRounded,
  CheckCircle,
  Add,
} from '@mui/icons-material';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import useAggregatorDetails from '&src/hooks/useAggregatorDetails';
import { useAggregatorQuoteTable } from '&src/hooks/useAggregatorQuoteTable';
import {
  AggregatorEmailDialog,
  AggregatorListView,
  CostBenefitAnalysisView,
  WaiverForwardDialog,
} from './AggregatorQuote';
import AddCharges from './AddCharges';

/**
 * Aggregator Quote Management & Commercial Analysis Container.
 * Strict < 250 lines, modular, theme-driven.
 */
export const AggregatorQuoteTable = ({ customerDetails }) => {
  const { aggregatorsList, loadingAggregators } = useAggregatorDetails();
  const {
    loading,
    viewMode,
    setViewMode,
    allProjections,
    projectionsLoading,
    emailPreviewOpen,
    setEmailPreviewOpen,
    acceptanceModalOpen,
    setAcceptanceModalOpen,
    targetAggregatorForForward,
    setTargetAggregatorForForward,
    waiverChoice,
    setWaiverChoice,
    waiverSubmitting,
    isAdmin,
    handleFinalizeQuote,
    fetchAggregatorProjections,
  } = useAggregatorQuoteTable({ customerDetails });

  const { applicationId, finalizedAggregatorId } = customerDetails || {};

  return (
    <Box sx={{ width: '100%' }}>
      {(loading || projectionsLoading || loadingAggregators) && <FullScreenLoader />}

      {/* ── View Toggle Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs
          value={viewMode}
          onChange={(e, val) => setViewMode(val)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              minHeight: 44,
            },
          }}
        >
          <Tab
            icon={<Groups2 fontSize="small" />}
            iconPosition="start"
            label="Aggregator Quotes & Rates"
            value="aggregator"
          />
          <Tab
            icon={<AnalyticsRounded fontSize="small" />}
            iconPosition="start"
            label="Comparative Cost Benefit Analysis (CBA)"
            value="cba"
          />
        </Tabs>
      </Box>

      {/* ── Tab 1: Aggregator Quotes List View ── */}
      {viewMode === 'aggregator' && (
        <AggregatorListView
          customerDetails={customerDetails}
          aggregatorsList={aggregatorsList}
          allProjections={allProjections}
          finalizedAggregatorId={finalizedAggregatorId}
          isAdmin={isAdmin}
          onFinalizeQuote={handleFinalizeQuote}
          onOpenForwardModal={(agg) => {
            setTargetAggregatorForForward(agg);
            setAcceptanceModalOpen(true);
          }}
          onRefresh={fetchAggregatorProjections}
        />
      )}

      {/* ── Tab 2: Cost Benefit Analysis (CBA) Matrix ── */}
      {viewMode === 'cba' && (
        <CostBenefitAnalysisView
          filteredAggregators={aggregatorsList}
          allProjections={allProjections}
          projectionsLoading={projectionsLoading}
          finalizedAggregatorId={finalizedAggregatorId}
          customerDetails={customerDetails}
        />
      )}

      {/* ── Waiver / Commercial Forwarding Dialog ── */}
      {acceptanceModalOpen && targetAggregatorForForward && (
        <WaiverForwardDialog
          open={acceptanceModalOpen}
          onClose={() => {
            setAcceptanceModalOpen(false);
            setTargetAggregatorForForward(null);
          }}
          targetAggregator={targetAggregatorForForward}
          customerDetails={customerDetails}
          onSuccess={() => {
            setAcceptanceModalOpen(false);
            setTargetAggregatorForForward(null);
            fetchAggregatorProjections();
          }}
        />
      )}
    </Box>
  );
};

export default AggregatorQuoteTable;
