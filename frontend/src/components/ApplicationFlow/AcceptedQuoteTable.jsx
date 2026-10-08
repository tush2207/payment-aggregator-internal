import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  CancelOutlined,
  PictureAsPdfRounded,
} from '@mui/icons-material';
import { CommonAppTable, CommonTableHeader, CommonTableRow, CommonTableCell, CommonTableEmptyState } from '&src/components/Tables/common';
import FullScreenLoader from '&src/components/Loaders/FullScreenLoader';
import { useAcceptedQuoteTable } from '&src/hooks/useAcceptedQuoteTable';

const ACCEPTED_COLUMNS = [
  { label: 'SR NO', width: 80, align: 'center' },
  { label: 'TYPE OF TRANSACTION / PAYMENT CHANNEL', minWidth: 260 },
  { label: 'CHARGES PROPOSED', align: 'center', width: 180 },
];

/**
 * Accepted Quotation Review View.
 * Strict < 200 lines, theme-driven, modular.
 */
export const AcceptedQuoteTable = ({
  applicationDetails,
  aggregatorId,
  isViewOnly = false,
}) => {
  const {
    quoteDetails,
    loading,
    accepted,
    setAccepted,
    confirmModalOpen,
    setConfirmModalOpen,
    actionType,
    setActionType,
    reason,
    setReason,
    tableRef,
    handleConfirmAction,
    handleExportPDF,
  } = useAcceptedQuoteTable({ applicationDetails, aggregatorId });

  return (
    <Box sx={{ width: '100%', p: 1 }}>
      {loading && <FullScreenLoader />}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<PictureAsPdfRounded />}
          onClick={handleExportPDF}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
        >
          Download PDF
        </Button>
      </Box>

      <div ref={tableRef}>
        <CommonAppTable sx={{ mb: 3 }}>
          <Table size="small" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <CommonTableHeader columns={ACCEPTED_COLUMNS} />

            <TableBody>
              {quoteDetails.length > 0 ? (
                quoteDetails.map((row, idx) => (
                  <CommonTableRow key={row.id || idx}>
                    <CommonTableCell align="center" sx={{ width: 80, color: 'text.secondary' }}>
                      {idx + 1}
                    </CommonTableCell>
                    <CommonTableCell sx={{ fontWeight: 700, pl: row.isIB ? 4 : 2 }}>
                      {row.transactionType}
                    </CommonTableCell>
                    <CommonTableCell align="center" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                      {row.chargesProposed ? `${row.chargesProposed} ${row.bankUnit || '%'}` : '—'}
                    </CommonTableCell>
                  </CommonTableRow>
                ))
              ) : (
                <CommonTableEmptyState colSpan={3} message="No Quotation Details Found" />
              )}
            </TableBody>
          </Table>
        </CommonAppTable>
      </div>

      {/* ── Acceptance Declaration & Action Controls ── */}
      {!isViewOnly && (
        <Box sx={(theme) => ({ p: 2.5, bgcolor: theme.palette.background.default, borderRadius: '10px', border: `1px solid ${theme.palette.divider}` })}>
          <FormControlLabel
            control={<Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} color="primary" />}
            label={<Typography variant="body2" fontWeight={600}>I hereby confirm and accept the finalized aggregator quotation charges.</Typography>}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlined />}
              onClick={() => {
                setActionType('reject');
                setConfirmModalOpen(true);
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px' }}
            >
              Reject Quote
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              disabled={!accepted || loading}
              onClick={() => {
                setActionType('accept');
                setConfirmModalOpen(true);
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '6px', px: 3 }}
            >
              Accept & Finalize
            </Button>
          </Box>
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {actionType === 'accept' ? 'Confirm Quotation Acceptance' : 'Confirm Rejection'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {actionType === 'accept'
              ? 'Are you sure you want to approve and finalize this aggregator quotation?'
              : 'Please provide a reason for rejecting this quotation:'}
          </Typography>
          {actionType === 'reject' && (
            <TextField
              label="Rejection Reason"
              fullWidth
              multiline
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmModalOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'accept' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={actionType === 'reject' && !reason.trim()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcceptedQuoteTable;