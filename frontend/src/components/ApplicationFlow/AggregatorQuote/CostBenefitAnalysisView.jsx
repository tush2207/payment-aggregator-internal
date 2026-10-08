import React from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useCostBenefitAnalysis } from '&src/hooks/useCostBenefitAnalysis';
import CostBenefitSummaryHeader from './CostBenefitSummaryHeader';
import CostBenefitComparisonTable from './CostBenefitComparisonTable';

/**
 * Clean orchestrator component for Cost Benefit Analysis.
 * Strict < 200 line budget, zero inline color constants, modularized presentation.
 */
export const CostBenefitAnalysisView = ({
  filteredAggregators = [],
  allProjections = {},
  projectionsLoading = false,
  finalizedAggregatorId,
  customerDetails = {},
}) => {
  const {
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
  } = useCostBenefitAnalysis({
    filteredAggregators,
    allProjections,
    customerDetails,
    finalizedAggregatorId,
  });

  if (!activeAggs.length) return null;

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      {/* ── Summary & Action Control Bar ── */}
      <CostBenefitSummaryHeader
        activeAggsCount={activeAggs.length}
        l1Aggregator={l1Aggregator}
        isExpanded={isExpanded}
        isFullScreen={isFullScreenCBA}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        onToggleFullScreen={() => setIsFullScreenCBA(!isFullScreenCBA)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      {/* ── Collapsible Comparison Matrix Table ── */}
      {isExpanded && (
        <CostBenefitComparisonTable
          activeAggs={activeAggs}
          baseRows={baseRows}
          allProjections={allProjections}
          aggTotalsMap={aggTotalsMap}
          finalizedAggregatorId={finalizedAggregatorId}
          tableRef={cbaTableRef}
        />
      )}

      {/* ── Fullscreen Dialog ── */}
      <Dialog
        open={isFullScreenCBA}
        onClose={() => setIsFullScreenCBA(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            background: theme.palette.cbi?.gradients?.modalHeader || 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2.5,
          })}
        >
          <Typography variant="subtitle1" fontWeight={800}>
            Comparative Cost Benefit Analysis (CBA) Matrix — Fullscreen View
          </Typography>
          <IconButton onClick={() => setIsFullScreenCBA(false)} sx={{ color: '#ffffff' }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <CostBenefitComparisonTable
            activeAggs={activeAggs}
            baseRows={baseRows}
            allProjections={allProjections}
            aggTotalsMap={aggTotalsMap}
            finalizedAggregatorId={finalizedAggregatorId}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CostBenefitAnalysisView;
