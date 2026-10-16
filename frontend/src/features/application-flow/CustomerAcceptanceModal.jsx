import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Box,
  Paper,
  Stack,
  Divider,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Checkbox,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Close,
  CloudUpload,
  PictureAsPdfRounded,
  InsertDriveFile,
  DeleteOutline,
  CheckCircleOutline,
  VerifiedUser,
  Business,
  AssignmentTurnedIn
} from '@mui/icons-material';
import aggregatorProjections from '&src/services/aggregatorProjections';
import aggregatorByApplication from '&src/services/aggregatorByApplication';
import { PROJECTION_CAL_DETAILS } from '&src/constants/PaymentAggregratorConstant';
import { getProjectionsForCustomer, getChannelOrder } from '&src/utils/calculation';
import { formatNumber } from '&src/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CustomerAcceptanceModal({
  open,
  onClose,
  applicationData = {},
  onSubmitAcceptance
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [waiverChoice, setWaiverChoice] = useState('YES');
  const [remarks, setRemarks] = useState('');
  const [isAccepted, setIsAccepted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [finalizedAggregator, setFinalizedAggregator] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);

  const applicationId = applicationData?.applicationId;
  const targetAggId = applicationData?.finalizedAggregatorId;

  // Load quotation details for PDF and preview
  useEffect(() => {
    if (!open || !applicationId) return;

    setSelectedFile(null);
    setWaiverChoice('YES');
    setRemarks('');
    setIsAccepted(true);
    setDragActive(false);

    const loadQuotation = async () => {
      try {
        setLoadingQuotes(true);

        // 1. Fetch Aggregators
        let aggObj = null;
        try {
          const aggRes = await aggregatorByApplication.getAllAggregatorsByApplication(applicationId);
          const aggList = Array.isArray(aggRes?.data) ? aggRes.data : (Array.isArray(aggRes) ? aggRes : []);
          if (targetAggId) {
            aggObj = aggList.find((a) => String(a.aggregatorId) === String(targetAggId));
          }
          if (!aggObj && aggList.length > 0) {
            aggObj = aggList.find((a) => a.isFinalApproved || a.isCustomerAccepted || a.isQuoteAcceptRO) || aggList[0];
          }
        } catch (err) {
          console.warn('Could not load aggregator list:', err);
        }
        setFinalizedAggregator(aggObj);

        // 2. Fetch Benchmark Charges (aggregatorId = 0)
        let benchmarkCharges = [];
        try {
          const benchRes = await aggregatorProjections.getAllProjections(applicationId, 0);
          benchmarkCharges = Array.isArray(benchRes?.data) ? benchRes.data : (Array.isArray(benchRes) ? benchRes : []);
        } catch (benchErr) {
          console.warn('Could not load benchmark charges:', benchErr);
        }

        const benchMap = new Map();
        benchmarkCharges.forEach((b) => {
          const k = (b.transactionType || '').trim().toLowerCase();
          if (k && b.chargesProposed !== undefined && b.chargesProposed !== null && b.chargesProposed !== '' && Number(b.chargesProposed) > 0) {
            benchMap.set(k, {
              chargesProposed: b.chargesProposed,
              bankUnit: b.chargeType || b.bankUnit || b.unit || '%'
            });
          }
        });

        // 3. Fetch Aggregator Projections
        let rawData = [];
        const effectiveAggId = targetAggId || aggObj?.aggregatorId;
        if (effectiveAggId) {
          try {
            const res = await aggregatorProjections.getAllProjections(applicationId, effectiveAggId);
            rawData = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
          } catch (apiErr) {
            console.warn('Could not load projections for aggregator:', apiErr);
          }
        }

        // 4. Baseline Channels
        const baselineProjs = getProjectionsForCustomer(
          PROJECTION_CAL_DETAILS,
          applicationData?.projection,
          applicationData?.avgTransactionSize,
          applicationId
        );

        let merged = [];
        if (rawData.length > 0) {
          merged = rawData.map((row, idx) => {
            const k = (row.transactionType || '').trim().toLowerCase();
            let charges = row.chargesProposed;
            let unit = row.chargeType || row.bankUnit || row.unit || '%';
            if ((charges === undefined || charges === null || charges === '' || Number(charges) === 0) && benchMap.has(k)) {
              const b = benchMap.get(k);
              charges = b.chargesProposed;
              unit = b.bankUnit;
            }
            return {
              id: row.id || row.projectionId || idx + 1,
              transactionType: row.transactionType,
              isIB: row.isIB,
              chargesProposed: (charges !== undefined && charges !== null && charges !== '' && Number(charges) > 0) ? charges : '',
              bankUnit: unit
            };
          });
        } else {
          merged = baselineProjs.map((row, idx) => {
            const k = (row.transactionType || '').trim().toLowerCase();
            let charges = '';
            let unit = row.chargeType || row.bankUnit || row.unit || '%';
            if (benchMap.has(k)) {
              const b = benchMap.get(k);
              charges = b.chargesProposed;
              unit = b.bankUnit;
            }
            return {
              id: row.id || idx + 1,
              transactionType: row.transactionType,
              isIB: row.isIB,
              chargesProposed: charges,
              bankUnit: unit
            };
          });
        }

        merged.sort((a, b) => getChannelOrder(a) - getChannelOrder(b));
        setQuoteDetails(merged);
      } catch (err) {
        console.error('Failed to load customer acceptance quote details:', err);
      } finally {
        setLoadingQuotes(false);
      }
    };

    loadQuotation();
  }, [open, applicationId, targetAggId, applicationData?.projection, applicationData?.avgTransactionSize]);

  // File drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) return;
    try {
      const canvas = await html2canvas(pdfContainerRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * (pageWidth - 20)) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, pageWidth - 20, pageHeight, undefined, 'FAST');
      pdf.save(`Quotation_Document_${applicationData?.customerName || applicationId || 'Merchant'}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (onSubmitAcceptance) {
      await onSubmitAcceptance(applicationId, {
        file: selectedFile,
        waiverChoice,
        remarks,
        isWaived: waiverChoice === 'NO'
      });
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={() => !isSubmitting && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      {/* ── Dialog Header ── */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
          backgroundColor: '#176FC1',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.8,
          px: 3,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          borderBottom: '3px solid #CE0F3E',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <AssignmentTurnedIn sx={{ color: '#ffffff', fontSize: 24 }} />
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ color: '#ffffff !important', fontSize: '16.5px', letterSpacing: '0.2px' }}
          >
            Customer Acceptance & Quotation Document
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1.5}>
          {applicationId && (
            <Chip
              label={`App ID: #${applicationId}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.35)',
              }}
            />
          )}
          <IconButton
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ── Dialog Body ── */}
      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {/* Printable Quotation Document Card */}
        <Paper
          ref={pdfContainerRef}
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '12px',
            bgcolor: '#ffffff',
            border: '1px solid #cbd5e1'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#0E4F8D" sx={{ fontSize: '17px' }}>
                Quotation Document & Commercial Terms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Official Central Bank of India Merchant Payment Aggregator Quotation
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfRounded />}
              onClick={handleDownloadPDF}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                borderColor: '#0E4F8D',
                color: '#0E4F8D',
                '&:hover': { borderColor: '#0a3866', bgcolor: 'rgba(14, 79, 141, 0.05)' }
              }}
            >
              Download Customer Quotation (.pdf)
            </Button>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Merchant & Aggregator Meta Info */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Merchant / Customer Name
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a">
                {applicationData?.customerName || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Finalized Payment Aggregator
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0E4F8D">
                {finalizedAggregator?.aggregatorName || applicationData?.finalizedAggregatorName || 'Selected Aggregator'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Expected Annual Volume
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#16a34a">
                ₹{formatNumber(applicationData?.totalAnnualTransaction || applicationData?.aggregateDepositAmt || 0)}
              </Typography>
            </Grid>
          </Grid>

          {/* Quotation Table */}
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: 240 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', bgcolor: '#f1f5f9', width: 60 }} align="center">
                    SR NO
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', bgcolor: '#f1f5f9' }}>
                    PAYMENT CHANNEL / TRANSACTION TYPE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '12px', bgcolor: '#f1f5f9', width: 180 }} align="center">
                    PROPOSED CHARGES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingQuotes ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                        Loading quotation terms...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : quoteDetails.length > 0 ? (
                  quoteDetails.map((row, idx) => (
                    <TableRow key={row.id || idx} hover>
                      <TableCell align="center" sx={{ color: 'text.secondary', fontSize: '12px' }}>
                        {idx + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: row.isIB ? 600 : 700, pl: row.isIB ? 4 : 2, fontSize: '12.5px' }}>
                        {row.transactionType}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: '#0E4F8D', fontSize: '12.5px' }}>
                        {row.chargesProposed ? `${row.chargesProposed} ${row.bankUnit || '%'}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No quotation breakdown rows available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* ── WAIVER OPTION SELECTION ── */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={1}>
            Acceptance Mode / Waiver Selection
          </Typography>
          <RadioGroup value={waiverChoice} onChange={(e) => setWaiverChoice(e.target.value)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper
                  variant="outlined"
                  onClick={() => setWaiverChoice('YES')}
                  sx={{
                    p: 1.8,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: waiverChoice === 'YES' ? '2px solid #0E4F8D' : '1px solid #cbd5e1',
                    bgcolor: waiverChoice === 'YES' ? '#f0f9ff' : '#ffffff',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <FormControlLabel
                    value="YES"
                    control={<Radio size="small" sx={{ color: '#0E4F8D', '&.Mui-checked': { color: '#0E4F8D' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          Standard Customer Acceptance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Upload signed customer acceptance letter received from merchant.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper
                  variant="outlined"
                  onClick={() => setWaiverChoice('NO')}
                  sx={{
                    p: 1.8,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: waiverChoice === 'NO' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    bgcolor: waiverChoice === 'NO' ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <FormControlLabel
                    value="NO"
                    control={<Radio size="small" sx={{ color: '#16a34a', '&.Mui-checked': { color: '#16a34a' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                          Waiver Applicable (Direct PO)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Customer acceptance waived as per sanction terms. Advance directly to PO.
                        </Typography>
                      </Box>
                    }
                    sx={{ m: 0, alignItems: 'flex-start' }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </RadioGroup>
        </Box>

        {/* ── FILE UPLOAD SECTION ── */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
            Upload Signed Customer Acceptance / Waiver Document
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Upload the signed acceptance form or sanction waiver letter (.pdf, .docx, images up to 10MB).
          </Typography>

          {!selectedFile ? (
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: dragActive ? '2px dashed #0E4F8D' : '2px dashed #cbd5e1',
                borderRadius: '10px',
                p: 2.5,
                textAlign: 'center',
                bgcolor: dragActive ? '#f0f9ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#0E4F8D' }
              }}
            >
              <CloudUpload sx={{ fontSize: 36, color: '#0E4F8D', mb: 0.5 }} />
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                Click or drag & drop signed file to upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supported formats: PDF, DOCX, JPG, PNG (Max 10MB)
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf, .docx, .doc, image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
            </Box>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: '10px',
                bgcolor: '#ffffff',
                borderColor: '#0E4F8D',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    p: 1,
                    bgcolor: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <InsertDriveFile />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to submit
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                sx={{ bgcolor: '#fee2e2', '&:hover': { bgcolor: '#fecaca' } }}
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Paper>
          )}
        </Box>

        {/* Remarks Input */}
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Customer Acceptance / Waiver Remarks"
            placeholder="Enter sanction reference, customer confirmation note, or remarks..."
            fullWidth
            multiline
            rows={2}
            size="small"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Box>

        {/* Consent Declaration */}
        <Box sx={{ px: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isAccepted}
                onChange={(e) => setIsAccepted(e.target.checked)}
                size="small"
                sx={{ color: '#0E4F8D', '&.Mui-checked': { color: '#0E4F8D' } }}
              />
            }
            label={
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', userSelect: 'none' }}>
                I hereby confirm and verify that the customer has accepted the quotation terms or sanction waiver is approved.
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      {/* ── Dialog Footer Actions ── */}
      <DialogActions
        sx={{
          py: 1.8,
          px: 3,
          bgcolor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfRounded />}
          onClick={handleDownloadPDF}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '12.5px',
            borderRadius: '8px',
            px: 2,
            py: '6px',
            borderColor: '#cbd5e1',
            color: '#0E4F8D',
            '&:hover': { bgcolor: '#f1f5f9' }
          }}
        >
          Download PDF
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              borderRadius: '8px',
              px: 2.5,
              py: '6px',
              color: '#64748b',
              borderColor: '#cbd5e1',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || !isAccepted}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              borderRadius: '8px',
              px: 3,
              py: '6px',
              bgcolor: '#0E4F8D !important',
              color: '#ffffff !important',
              boxShadow: '0 2px 8px rgba(14,79,141,0.25)',
              '&:hover': { bgcolor: '#0b3d6d !important' },
              '&.Mui-disabled': { bgcolor: '#cbd5e1 !important', color: '#94a3b8 !important' }
            }}
          >
            {isSubmitting ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} color="inherit" />
                <span>Submitting...</span>
              </Stack>
            ) : (
              <Stack direction="row" spacing={0.8} alignItems="center">
                <CheckCircleOutline sx={{ fontSize: 17 }} />
                <span>Submit Customer Acceptance</span>
              </Stack>
            )}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
