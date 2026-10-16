import React from 'react';
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
  CircularProgress,
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
import { useAdminRoleSwitcher } from '&src/hooks/useAdminRoleSwitcher';

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
  const {
    role,
    validationError,
    zonesList,
    regionsList,
    branchesList,
    loadingLocations,
    selectedZone,
    selectedRegion,
    selectedBranch,
    selectedZoneLabel,
    selectedRegionLabel,
    selectedBranchLabel,
    handleRoleChange,
    handleZoneChange,
    handleRegionChange,
    handleBranchChange,
    handleApply,
    handleResetToDefault,
  } = useAdminRoleSwitcher({ open, currentUser, onClose });

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
          background: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
          backgroundColor: '#176FC1',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.8,
          px: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          borderBottom: '3px solid #CE0F3E',
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
            <AdminPanelSettingsRounded sx={{ color: '#ffffff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#ffffff', lineHeight: 1.2 }}>
              Switch Role & Scope View
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.75rem' }}>
              Digital Ambassador Portal Role & Location Simulator
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#ffffff',
            bgcolor: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {validationError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', py: 0.5 }}>
            {validationError}
          </Alert>
        )}

        {/* 1. Role Selection Grid */}
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
                  onClick={() => handleRoleChange(opt.value)}
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

        {/* 2. Location Selection Hierarchy */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            2. Select Location Hierarchy
          </Typography>
          {loadingLocations && <CircularProgress size={16} sx={{ color: '#176FC1' }} />}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Zone Autocomplete */}
          {(role === 'ZO' || role === 'RO' || role === 'BO') && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.6, display: 'block' }}>
                ZONE {role === 'ZO' && '(Required)'}
              </Typography>
              <Autocomplete
                options={zonesList}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.zoneName ? `${option.zoneName}${option.zoneId ? ` (${option.zoneId})` : ''}` : '';
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!val) return false;
                  if (typeof val === 'string') return option.zoneName === val || option.zoneId === val;
                  return option.zoneId === val.zoneId || option.zoneName === val.zoneName;
                }}
                value={selectedZone}
                onChange={(e, val) => handleZoneChange(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Select Zone (e.g. MUMBAI ZONE, WEST ZONE)..."
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
                options={regionsList}
                disabled={!selectedZone}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.regionName ? `${option.regionName}${option.regionId ? ` (${option.regionId})` : ''}` : '';
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!val) return false;
                  if (typeof val === 'string') return option.regionName === val || option.regionId === val;
                  return option.regionId === val.regionId || option.regionName === val.regionName;
                }}
                value={selectedRegion}
                onChange={(e, val) => handleRegionChange(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={!selectedZone ? "Select Zone first to choose Region" : "Select Region (e.g. MUMBAI REGION, THANE REGION)..."}
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

          {/* Branch Autocomplete */}
          {role === 'BO' && (
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 0.6, display: 'block' }}>
                BRANCH (Required)
              </Typography>
              <Autocomplete
                freeSolo
                options={branchesList}
                disabled={!selectedRegion}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.branchName ? `${option.branchName}${option.branchId ? ` (${option.branchId})` : ''}` : '';
                }}
                isOptionEqualToValue={(option, val) => {
                  if (!val) return false;
                  if (typeof val === 'string') return option.branchName === val || option.branchId === val;
                  return option.branchId === val.branchId || option.branchName === val.branchName;
                }}
                value={selectedBranch}
                onChange={(e, val) => handleBranchChange(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder={!selectedRegion ? "Select Region first to choose Branch" : "Select or Enter Branch Name (e.g. CHEMBUR, NARIMAN POINT)..."}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PlaceRounded sx={{ color: '#94a3b8', fontSize: 18, mr: 0.5 }} />
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

          {/* Central Office info card */}
          {role === 'CO' && (
            <Box sx={{ p: 2, background: 'rgba(23, 111, 193, 0.05)', borderRadius: '12px', border: '1px dashed rgba(23, 111, 193, 0.3)' }}>
              <Typography variant="body2" sx={{ color: '#176FC1', fontSize: '0.85rem', fontWeight: 600 }}>
                 Central Office Scope Active:
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.78rem', display: 'block', mt: 0.4 }}>
                Full organization-wide administrative view across all 15+ zones, 80+ regions, and 4500+ branches.
              </Typography>
            </Box>
          )}

          {/* Scope summary pill */}
          {role !== 'CO' && (
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 0.5 }}>
              {selectedZoneLabel && (
                <Chip label={`Zone: ${selectedZoneLabel}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
              {selectedRegionLabel && (
                <Chip label={`Region: ${selectedRegionLabel}`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.72rem' }} />
              )}
              {selectedBranchLabel && (
                <Chip label={`Branch: ${selectedBranchLabel}`} size="small" sx={{ bgcolor: '#fff8e1', color: '#b45309', fontWeight: 600, fontSize: '0.72rem' }} />
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
