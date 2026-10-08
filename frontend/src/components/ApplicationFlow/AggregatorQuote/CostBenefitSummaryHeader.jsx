import React from 'react';
import { Box, Typography, Stack, Button, Chip, Tooltip } from '@mui/material';
import {
  FileDownloadRounded,
  PictureAsPdfRounded,
  FullscreenRounded,
  FullscreenExitRounded,
  UnfoldMoreRounded,
  UnfoldLessRounded,
  AnalyticsRounded,
  EmojiEventsRounded,
} from '@mui/icons-material';
import { formatNumber } from '&src/utils';

/**
 * Presentational header and control toolbar for Cost Benefit Analysis View.
 */
export const CostBenefitSummaryHeader = ({
  activeAggsCount = 0,
  l1Aggregator = null,
  totalVolume = 0,
  totalTxns = 0,
  isExpanded = false,
  isFullScreen = false,
  onToggleExpand,
  onToggleFullScreen,
  onExportExcel,
  onExportPDF,
}) => {
  return (
    <Box
      sx={(theme) => ({
        p: 2,
        borderRadius: '10px 10px 0 0',
        background: theme.palette.cbi?.gradients?.tableHeader || 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '8px',
            bgcolor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnalyticsRounded sx={{ color: '#f6d365', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
            Comparative Cost Benefit Analysis (CBA) Matrix
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.74rem' }}>
            Multi-aggregator fee breakdown, vendor payouts, and bank revenue ranking
          </Typography>
        </Box>

        {l1Aggregator && (
          <Chip
            icon={<EmojiEventsRounded sx={{ color: '#f6d365 !important', fontSize: 18 }} />}
            label={`L1 Lowest Bidder: ${l1Aggregator.aggregatorName || 'Aggregator'}`}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.3)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.75rem',
              border: '1px solid rgba(246, 211, 101, 0.5)',
              ml: 1,
            }}
          />
        )}
      </Box>

      {/* Control Buttons */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          size="small"
          variant="contained"
          startIcon={<FileDownloadRounded />}
          onClick={onExportExcel}
          sx={(theme) => ({
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'none',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
          })}
        >
          Excel
        </Button>

        <Button
          size="small"
          variant="contained"
          startIcon={<PictureAsPdfRounded />}
          onClick={onExportPDF}
          sx={(theme) => ({
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'none',
            borderRadius: '6px',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
          })}
        >
          PDF
        </Button>

        <Tooltip title={isFullScreen ? 'Exit Fullscreen' : 'View Fullscreen'} arrow>
          <Button
            size="small"
            variant="contained"
            onClick={onToggleFullScreen}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              minWidth: 36,
              p: 0.8,
              borderRadius: '6px',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
            }}
          >
            {isFullScreen ? <FullscreenExitRounded fontSize="small" /> : <FullscreenRounded fontSize="small" />}
          </Button>
        </Tooltip>

        <Tooltip title={isExpanded ? 'Collapse Matrix' : 'Expand Matrix'} arrow>
          <Button
            size="small"
            variant="contained"
            onClick={onToggleExpand}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              minWidth: 36,
              p: 0.8,
              borderRadius: '6px',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.35)' },
            }}
          >
            {isExpanded ? <UnfoldLessRounded fontSize="small" /> : <UnfoldMoreRounded fontSize="small" />}
          </Button>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default CostBenefitSummaryHeader;
