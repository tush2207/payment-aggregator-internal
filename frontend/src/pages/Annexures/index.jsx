import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  DescriptionRounded,
  DownloadRounded,
  VerifiedUserOutlined,
  AddRounded,
  EditRounded,
  DeleteOutlineRounded,
  SearchRounded,
  CloseRounded,
  CloudUploadRounded,
  InsertDriveFileRounded,
  CheckCircleOutlineRounded,
  WarningAmberRounded,
  FileDownloadRounded,
} from '@mui/icons-material';
import DialogWithHeader from '&src/components/Dialog/DialogWithHeader';
import SectionHeader from '&src/components/Headers/SectionHeader';
import useStatusWiseAlert from '&src/components/feedback/ToastNotifications/useStatusWiseAlert';
import axios from 'axios';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.doc', '.docx'];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '35.5 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (isoString) => {
  if (!isoString) return 'Standard Format';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Standard Format';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Standard Format';
  }
};

export default function AnnexuresPage() {
  const [annexures, setAnnexures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingFile, setDownloadingFile] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);

  // Modal states for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    file: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const { errorNotification, successNotification } = useStatusWiseAlert();

  const userRole = (sessionStorage.getItem('role') || 'BO').toUpperCase();
  const currentUserId = String(sessionStorage.getItem('userId') || '');
  const canManage = userRole === 'CO' || userRole === 'ADMIN' || currentUserId === '139822';

  const fetchAnnexures = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await axios.get('/api/annexures', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (Array.isArray(response.data)) {
        setAnnexures(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch annexures:', err);
      errorNotification('Failed to load agreement annexures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnexures();
  }, []);

  // Filtered Annexures based on search query
  const filteredAnnexures = useMemo(() => {
    if (!searchQuery.trim()) return annexures;
    const q = searchQuery.toLowerCase();
    return annexures.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.filename?.toLowerCase().includes(q)
    );
  }, [annexures, searchQuery]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setModalMode('add');
    setSelectedItem(null);
    setFormData({
      title: '',
      file: null,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      title: item.title || '',
      file: null,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // File selection & validation (doc/docx only, max 5MB)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = `.${file.name.split('.').pop()}`.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormErrors((prev) => ({
        ...prev,
        file: 'Invalid file format. Only Microsoft Word documents (.doc, .docx) are allowed.',
      }));
      errorNotification('Invalid file format. Only .doc and .docx files are permitted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFormErrors((prev) => ({
        ...prev,
        file: `File size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 5 MB.`,
      }));
      errorNotification('File size exceeds 5 MB. Please choose a file smaller than 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFormErrors((prev) => ({ ...prev, file: null }));
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleRemoveSelectedFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submission (Add or Edit)
  const handleSubmitForm = async () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Annexure title is required.';
    }
    if (modalMode === 'add' && !formData.file) {
      errors.file = 'Please upload a .doc or .docx annexure file (max 5 MB).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    const token = sessionStorage.getItem('accessToken');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('description', '');
      if (formData.file) {
        data.append('file', formData.file);
      }

      if (modalMode === 'add') {
        const response = await axios.post('/api/annexures', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...authHeaders,
          },
        });
        successNotification(response.data?.message || 'Annexure added successfully!');
      } else {
        const itemId = selectedItem.id || selectedItem.filename;
        const response = await axios.put(`/api/annexures/${encodeURIComponent(itemId)}`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...authHeaders,
          },
        });
        successNotification(response.data?.message || 'Annexure updated successfully!');
      }

      setModalOpen(false);
      await fetchAnnexures();
    } catch (err) {
      console.error('Error saving annexure:', err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Failed to save annexure.';
      errorNotification(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const itemId = itemToDelete.id || itemToDelete.filename;
      const response = await axios.delete(`/api/annexures/${encodeURIComponent(itemId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      successNotification(response.data?.message || 'Annexure deleted successfully.');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      await fetchAnnexures();
    } catch (err) {
      console.error('Failed to delete annexure:', err);
      errorNotification(err?.response?.data?.detail || 'Failed to delete annexure.');
    } finally {
      setDeleting(false);
    }
  };

  // Download Individual Annexure
  const handleDownload = async (item) => {
    setDownloadingFile(item.filename);
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await axios.get(`/api/annexures/download/${encodeURIComponent(item.filename)}`, {
        responseType: 'blob',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const ext = item.filename.endsWith('.doc') ? '.doc' : '.docx';
      const blob = new Blob([response.data], {
        type: ext === '.doc' ? 'application/msword' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      successNotification(`Downloaded "${item.title}" successfully.`);
    } catch (err) {
      console.error('Download failed:', err);
      errorNotification('Failed to download document. Please try again.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // Download / Export All Annexures as ZIP (available to BO, ZO, RO, CO, Admin)
  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await axios.get('/api/annexures/download-all', {
        responseType: 'blob',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Central_Bank_of_India_Agreement_Annexures.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      successNotification('Exported and downloaded all Agreement Annexures successfully!');
    } catch (err) {
      console.error('Export all failed:', err);
      errorNotification('Failed to export all annexures. Please try again.');
    } finally {
      setExportingAll(false);
    }
  };

  // Header Actions matching Dashboard styling
  const headerActions = useMemo(() => {
    const actions = [
      {
        label: exportingAll ? 'Exporting...' : 'Export All',
        startIcon: exportingAll ? <CircularProgress size={16} color="inherit" /> : <FileDownloadRounded />,
        variant: 'outlined',
        color: 'primary',
        onClick: handleExportAll,
        disabled: exportingAll,
        sx: {
          fontWeight: 700,
          borderRadius: '8px',
          px: 2.2,
          py: 0.9,
          boxShadow: '0 2px 8px rgba(155, 10, 46, 0.25)',
        },
      },
    ];

    if (canManage) {
      actions.push({
        label: 'Add Annexure',
        startIcon: <AddRounded />,
        variant: 'contained',
        color: 'primary',
        onClick: handleOpenAdd,
        sx: {
          fontWeight: 700,
          borderRadius: '8px',
          px: 2.2,
          py: 0.9,
          boxShadow: '0 4px 14px rgba(23, 111, 193, 0.25)',
          background: 'linear-gradient(90deg, #176FC1 0%, #0E4F8D 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #135FA6 0%, #0A3C6D 100%)',
          },
        },
      });
    }

    return actions;
  }, [canManage, exportingAll]);

  return (
    <Box sx={{ pb: 4, width: '100%', minWidth: 0 }}>
      {/* ── Standard SectionHeader ── */}
      <SectionHeader
        title="Official Agreement Annexures & Regulatory Formats"
        description="Standard contractual schedules, technical specifications, and RBI compliance annexures for Payment Aggregator onboarding."
        icon={<DescriptionRounded />}
        actions={headerActions}
      />

      {/* ── Compliance Info & Search Strip ── */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2.5,
          borderRadius: '10px',
          bgcolor: '#f8fafc',
          borderColor: '#e2e8f0',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
          <VerifiedUserOutlined sx={{ color: '#0284c7', fontSize: 26, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ fontSize: '0.85rem' }}>
              Central Bank of India Standards {canManage ? '(CO / Admin Mode: Document Management Enabled)' : '(Standard Download Access)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
              Standardized Word formats (.doc, .docx | Max 5 MB). Click Download or Export All to access official formats.
            </Typography>
          </Box>
        </Stack>

        <TextField
          size="small"
          placeholder="Search annexures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: { xs: '100%', sm: 260 },
            '& .MuiOutlinedInput-root': {
              bgcolor: '#ffffff',
              borderRadius: '8px',
              fontSize: '12.5px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ fontSize: 18, color: '#94a3b8' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Paper>

      {/* ── Cards Grid ── */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={260}>
          <CircularProgress />
        </Box>
      ) : filteredAnnexures.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 5,
            textAlign: 'center',
            borderRadius: '12px',
            borderColor: '#e2e8f0',
            bgcolor: '#ffffff',
          }}
        >
          <DescriptionRounded sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700} color="#475569">
            No Annexure Documents Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            {searchQuery ? 'No annexures match your search criteria.' : 'Click "Add Annexure" to upload your first agreement document.'}
          </Typography>
          {canManage && (
            <Button variant="outlined" startIcon={<AddRounded />} onClick={handleOpenAdd} size="small">
              Add Annexure
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredAnnexures.map((item, index) => {
            const isDownloading = downloadingFile === item.filename;
            const isDocx = item.filename?.toLowerCase().endsWith('.docx');

            return (
              <Grid item xs={12} sm={6} md={4} key={item.id || item.filename || index}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2.2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '12px',
                    borderColor: '#cbd5e1',
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                    position: 'relative',
                    '&:hover': {
                      borderColor: '#176FC1',
                      boxShadow: '0 8px 24px rgba(23, 111, 193, 0.12)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  <Box>
                    {/* Card Top Strip */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          icon={<InsertDriveFileRounded sx={{ fontSize: '14px !important' }} />}
                          label={isDocx ? 'DOCX' : 'DOC'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '11px',
                            height: 22,
                            bgcolor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                          }}
                        />
                        <Chip
                          label={formatBytes(item.sizeBytes)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '10.5px',
                            height: 22,
                            bgcolor: '#f1f5f9',
                            color: '#475569',
                          }}
                        />
                      </Stack>

                      {canManage && (
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Edit Annexure Details & File" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(item)}
                              sx={{
                                color: '#0284c7',
                                bgcolor: '#f0f9ff',
                                '&:hover': { bgcolor: '#e0f2fe' },
                              }}
                            >
                              <EditRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Annexure" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(item)}
                              sx={{
                                color: '#dc2626',
                                bgcolor: '#fef2f2',
                                '&:hover': { bgcolor: '#fee2e2' },
                              }}
                            >
                              <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      color="#0f172a"
                      sx={{
                        fontSize: '14px',
                        lineHeight: 1.4,
                        mb: 1.2,
                        minHeight: 42,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </Typography>
                  </Box>

                  {/* Card Bottom / Actions */}
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11.5px' }}>
                        Updated: {formatDate(item.modifiedAt)}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />

                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                      {canManage ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditRounded sx={{ fontSize: 14 }} />}
                          onClick={() => handleOpenEdit(item)}
                          sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '11px',
                            borderRadius: '6px',
                            py: 0.5,
                            px: 1.2,
                            borderColor: '#cbd5e1',
                            color: '#334155',
                            '&:hover': { borderColor: '#176FC1', bgcolor: '#f8fafc' },
                          }}
                        >
                          Edit File
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                          Official Format
                        </Typography>
                      )}

                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={isDownloading}
                        startIcon={
                          isDownloading ? (
                            <CircularProgress size={13} color="inherit" />
                          ) : (
                            <DownloadRounded sx={{ fontSize: 16 }} />
                          )
                        }
                        onClick={() => handleDownload(item)}
                        sx={{
                          fontWeight: 700,
                          textTransform: 'none',
                          fontSize: '11.5px',
                          borderRadius: '6px',
                          py: 0.5,
                          px: 1.8,
                          boxShadow: 'none',
                          background: 'linear-gradient(90deg, #176FC1 0%, #0E4F8D 100%)',
                          '&:hover': {
                            background: 'linear-gradient(90deg, #135FA6 0%, #0A3C6D 100%)',
                          },
                        }}
                      >
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </Button>
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── ADD / EDIT ANNEXURE POPUP DIALOG ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <DialogWithHeader
        open={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={modalMode === 'add' ? 'Add Agreement Annexure' : 'Edit Agreement Annexure'}
        subtitle="Central Bank of India Official Standard Document Management"
        icon={DescriptionRounded}
        maxWidth="sm"
        actions={
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ width: '100%' }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={submitting}
              onClick={() => setModalOpen(false)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineRounded />}
              onClick={handleSubmitForm}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '8px',
                px: 3,
                background: 'linear-gradient(90deg, #176FC1 0%, #0E4F8D 100%)',
                '&:hover': { background: 'linear-gradient(90deg, #135FA6 0%, #0A3C6D 100%)' },
              }}
            >
              {submitting ? 'Saving Document...' : modalMode === 'add' ? 'Add Annexure' : 'Save Changes'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {/* Title Field */}
          <TextField
            fullWidth
            label="Annexure Title / Name"
            placeholder="e.g., Annexure VIII - Settlement & Reconciliation Format"
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: null }));
            }}
            error={Boolean(formErrors.title)}
            helperText={formErrors.title}
            required
            size="small"
          />

          {/* File Upload Box */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 0.8, fontSize: '12.5px' }}>
              Document Attachment (Word .doc, .docx only | Max 5 MB) {modalMode === 'add' && '*'}
            </Typography>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
            />

            {formData.file ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: '#f0fdf4',
                  borderColor: '#86efac',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                  <InsertDriveFileRounded sx={{ color: '#16a34a', fontSize: 28, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="#15803d" noWrap sx={{ fontSize: '13px' }}>
                      {formData.file.name}
                    </Typography>
                    <Typography variant="caption" color="#166534">
                      {formatBytes(formData.file.size)} • Word Document
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={handleRemoveSelectedFile} sx={{ color: '#dc2626' }}>
                  <CloseRounded fontSize="small" />
                </IconButton>
              </Paper>
            ) : (
              <Paper
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: formErrors.file ? '#fef2f2' : '#f8fafc',
                  borderColor: formErrors.file ? '#ef4444' : '#cbd5e1',
                  borderStyle: 'dashed',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                    borderColor: '#176FC1',
                  },
                }}
              >
                <CloudUploadRounded sx={{ fontSize: 36, color: formErrors.file ? '#ef4444' : '#176FC1', mb: 0.8 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ fontSize: '13px' }}>
                  {modalMode === 'edit'
                    ? 'Click to Replace Document (Optional)'
                    : 'Click or Drag to Upload Word Document'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                  Supported formats: <strong>.doc, .docx</strong> (Strict maximum: <strong>5 MB</strong>)
                </Typography>

                {modalMode === 'edit' && selectedItem?.filename && (
                  <Typography variant="caption" color="#0369a1" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
                    Current File: {selectedItem.filename} ({formatBytes(selectedItem.sizeBytes)})
                  </Typography>
                )}
              </Paper>
            )}

            {formErrors.file && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.8, fontWeight: 600 }}>
                {formErrors.file}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogWithHeader>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── DELETE CONFIRMATION MODAL ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <WarningAmberRounded sx={{ color: '#dc2626', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Delete Annexure?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>"{itemToDelete?.title}"</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            This will permanently remove the document from the server repository.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="outlined"
            color="inherit"
            disabled={deleting}
            onClick={() => setDeleteDialogOpen(false)}
            size="small"
            sx={{ textTransform: 'none', borderRadius: '6px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineRounded />}
            onClick={handleConfirmDelete}
            size="small"
            sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 700 }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
