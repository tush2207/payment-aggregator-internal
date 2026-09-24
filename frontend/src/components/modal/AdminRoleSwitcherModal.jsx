import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Autocomplete,
  Divider,
  IconButton,
  Card,
  CardActionArea,
  Chip,
  Alert,
} from '@mui/material';
import {
  Close,
  AdminPanelSettingsRounded,
  RestartAltRounded,
  CheckCircleRounded,
  AccountBalanceRounded,
  ApartmentRounded,
  LocationCityRounded,
  StorefrontRounded,
  SearchRounded,
  PlaceRounded,
} from '@mui/icons-material';
import {
  CBI_ZONES,
  CBI_REGIONS,
  CBI_DEFAULT_LOCATIONS,
} from '&src/constants/PaymentAggregratorConstant';

const ROLE_OPTIONS = [
  {
    value: 'CO',
    label: 'Central Office',
    code: 'CO',
    icon: <AccountBalanceRounded sx={{ fontSize: 24, color: '#CE0F3E' }} />,
    description: 'All-India Organization Scope',
    accent: '#CE0F3E',
  },
  {
    value: 'ZO',
    label: 'Zonal Office',
    code: 'ZO',
    icon: <ApartmentRounded sx={{ fontSize: 24, color: '#176FC1' }} />,
    description: 'Zone level performance & regions',
    accent: '#176FC1',
  },
  {
    value: 'RO',
    label: 'Regional Office',
    code: 'RO',
    icon: <LocationCityRounded sx={{ fontSize: 24, color: '#2e7d32' }} />,
    description: 'Region level applications & workflow',
    accent: '#2e7d32',
  },
  {
    value: 'BO',
    label: 'Branch Office',
    code: 'BO',
    icon: <StorefrontRounded sx={{ fontSize: 24, color: '#d97706' }} />,
    description: 'Branch applications & merchant onboarding',
    accent: '#d97706',
  },
];

export const AdminRoleSwitcherModal = ({ open, onClose, currentUser }) => {
  const [role, setRole] = useState(currentUser?.role || 'CO');
  const [validationError, setValidationError] = useState('');

  // Selected values
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    if (open) {
      const curRole = currentUser?.role || sessionStorage.getItem('role') || 'CO';
      setRole(curRole);
      setValidationError('');

      const zName = currentUser?.zoneName || currentUser?.Zone_Name || (CBI_DEFAULT_LOCATIONS[curRole]?.zoneName) || 'West Zone';
      const rName = currentUser?.regionName || currentUser?.Region_Name || (CBI_DEFAULT_LOCATIONS[curRole]?.regionName) || 'Mumbai Region';
      const bName = currentUser?.branchName || currentUser?.Branch_Name || (CBI_DEFAULT_LOCATIONS[curRole]?.branchName) || '';

      setSelectedZone(zName);
      setSelectedRegion(rName);
      setSelectedBranch(bName);
    }
  }, [open, currentUser]);

  const zoneOptions = useMemo(() => CBI_ZONES, []);
  const regionOptions = useMemo(() => CBI_REGIONS, []);

  const handleApply = () => {
    if (role === 'ZO' && !selectedZone) {
      setValidationError('Please select a Zone to continue.');
      return;
    }
    if (role === 'RO' && !selectedRegion) {
      setValidationError('Please select a Region to continue.');
      return;
    }
    if (role === 'BO' && !selectedBranch) {
      setValidationError('Please enter or select a Branch to continue.');
      return;
    }

    const updated = {
      ...currentUser,
      role,
      locationType: role,
      zoneId: role === 'CO' ? '1109' : (selectedZone ? '1109' : ''),
      zoneName: role === 'CO' ? 'Central Office' : (selectedZone || 'Central Office'),
      Zone_Name: role === 'CO' ? 'Central Office' : (selectedZone || 'Central Office'),
      regionId: role === 'CO' || role === 'ZO' ? (role === 'CO' ? '1169' : '') : (selectedRegion ? '1169' : ''),
      regionName: role === 'CO' || role === 'ZO' ? (role === 'CO' ? 'Central Office' : '') : (selectedRegion || ''),
      Region_Name: role === 'CO' || role === 'ZO' ? (role === 'CO' ? 'Central Office' : '') : (selectedRegion || ''),
      branchId: role === 'BO' ? (selectedBranch ? '2394' : '') : (role === 'CO' ? '2394' : ''),
      branchName: role === 'BO' ? (selectedBranch || '') : (role === 'CO' ? 'CENTRAL OFFICE' : ''),
      Branch_Name: role === 'BO' ? (selectedBranch || '') : (role === 'CO' ? 'CENTRAL OFFICE' : ''),
    };

    sessionStorage.setItem('role', role);
    if (role === 'RO' || role === 'ZO' || role === 'BO') {
      sessionStorage.setItem('simulatedRegion', selectedRegion || selectedZone);
      sessionStorage.setItem('adminViewMode', 'true');
    } else {
      sessionStorage.removeItem('simulatedRegion');
      sessionStorage.removeItem('adminViewMode');
    }

    sessionStorage.setItem('userDetails', JSON.stringify(updated));
    window.dispatchEvent(new Event('user-session-changed'));
    window.dispatchEvent(new Event('storage'));
    if (onClose) onClose();
    window.location.reload();
  };

  const handleResetToDefault = () => {
    const defaultProfile = {
      ...currentUser,
      role: 'CO',
      locationType: 'CO',
      zoneId: '1109',
      zoneName: 'Central Office',
      Zone_Name: 'Central Office',
      regionId: '1169',
      regionName: 'Central Office',
      Region_Name: 'Central Office',
      branchId: '2394',
      branchName: 'CENTRAL OFFICE',
      Branch_Name: 'CENTRAL OFFICE',
    };
    sessionStorage.setItem('role', 'CO');
    sessionStorage.removeItem('simulatedRegion');
    sessionStorage.removeItem('adminViewMode');
    sessionStorage.setItem('userDetails', JSON.stringify(defaultProfile));
    window.dispatchEvent(new Event('user-session-changed'));
    window.dispatchEvent(new Event('storage'));
    if (onClose) onClose();
    window.location.reload();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          background: '#ffffff',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AdminPanelSettingsRounded sx={{ color: '#f6d365', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Switch Role & Scope View
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.74rem' }}>
              Digital Ambassador Portal Role Simulator
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff', background: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.25)' } }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {validationError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', py: 0.5 }}>
            {validationError}
          </Alert>
        )}

        {/* Role Selection Cards Grid */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.2, display: 'block' }}>
          1. Select Role
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.2, mb: 3 }}>
          {ROLE_OPTIONS.map((opt) => {
            const isSelected = role === opt.value;
            return (
              <Card
                key={opt.value}
                variant="outlined"
                sx={{
                  borderRadius: '12px',
                  borderColor: isSelected ? opt.accent : '#e2e8f0',
                  borderWidth: isSelected ? '2px' : '1px',
                  background: isSelected ? `${opt.accent}0D` : '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 4px 12px ${opt.accent}25` : 'none',
                }}
              >
                <CardActionArea
                  onClick={() => {
                    setRole(opt.value);
                    setValidationError('');
                    const defaults = CBI_DEFAULT_LOCATIONS[opt.value] || CBI_DEFAULT_LOCATIONS.CO;
                    setSelectedZone(defaults.zoneName || 'West Zone');
                    setSelectedRegion(defaults.regionName || 'Mumbai Region');
                    setSelectedBranch(defaults.branchName || (opt.value === 'BO' ? 'Chembur Branch' : ''));
                  }}
                  sx={{ p: 1.4 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    {opt.icon}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.88rem', color: isSelected ? opt.accent : '#1e293b' }}>
                        {opt.label} ({opt.code})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.70rem', display: 'block', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {opt.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>

        {/* Location Selection Section */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.2, display: 'block' }}>
          2. Select Location Hierarchy
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Zone Autocomplete */}
          {(role === 'ZO' || role === 'RO' || role === 'BO') && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.6, display: 'block' }}>
                ZONE {role === 'ZO' && '(Required)'}
              </Typography>
              <Autocomplete
                options={zoneOptions}
                value={selectedZone}
                onChange={(e, val) => {
                  setSelectedZone(val || '');
                  setValidationError('');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select or Search Zone (e.g., West Zone, Mumbai Zone)..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                    }}
                  />
                )}
              />
            </Box>
          )}

          {/* Region Autocomplete */}
          {(role === 'RO' || role === 'BO') && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.6, display: 'block' }}>
                REGION {role === 'RO' && '(Required)'}
              </Typography>
              <Autocomplete
                options={regionOptions}
                value={selectedRegion}
                onChange={(e, val) => {
                  setSelectedRegion(val || '');
                  setValidationError('');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select or Search Region (e.g., Mumbai Region, Pune Region)..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                    }}
                  />
                )}
              />
            </Box>
          )}

          {/* Branch Autocomplete / Input */}
          {role === 'BO' && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.6, display: 'block' }}>
                BRANCH (Required)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setValidationError('');
                }}
                placeholder="Enter Branch Name (e.g. Chembur Branch, Nariman Point Branch)"
                InputProps={{
                  startAdornment: <PlaceRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
                }}
              />
            </Box>
          )}

          {/* Central Office info card */}
          {role === 'CO' && (
            <Box sx={{ p: 2, background: 'rgba(23, 111, 193, 0.05)', borderRadius: '12px', border: '1px dashed rgba(23, 111, 193, 0.3)' }}>
              <Typography variant="body2" sx={{ color: '#176FC1', fontSize: '0.85rem', fontWeight: 600 }}>
                🏢 Central Office Scope Active:
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.78rem', display: 'block', mt: 0.4 }}>
                Full organization-wide administrative view across all 15+ zones, 80+ regions, and 4500+ branches.
              </Typography>
            </Box>
          )}

          {/* Scope summary pill */}
          {role !== 'CO' && (
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.5 }}>
              {selectedZone && (
                <Chip label={`Zone: ${selectedZone}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
              {selectedRegion && (
                <Chip label={`Region: ${selectedRegion}`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
              {selectedBranch && (
                <Chip label={`Branch: ${selectedBranch}`} size="small" sx={{ bgcolor: '#fff8e1', color: '#b45309', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
        <Button
          startIcon={<RestartAltRounded />}
          onClick={handleResetToDefault}
          color="inherit"
          sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', borderRadius: '8px' }}
        >
          Reset to Default CO
        </Button>

        <Box sx={{ display: 'flex', gap: 1.2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b', borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleRounded />}
            onClick={handleApply}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #CE0F3E 0%, #9B0A2E 100%)',
              boxShadow: '0 4px 14px rgba(206, 15, 62, 0.35)',
              px: 2.8,
              py: 0.9,
              '&:hover': {
                background: 'linear-gradient(90deg, #B20D35 0%, #850826 100%)',
              },
            }}
          >
            Apply View
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AdminRoleSwitcherModal;
