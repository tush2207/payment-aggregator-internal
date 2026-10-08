import React from 'react';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Chip,
  InputAdornment,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  SearchRounded,
  ClearRounded,
  RestartAltRounded,
  CheckCircleRounded,
  CancelRounded,
  Groups2Rounded,
} from '@mui/icons-material';

// Helper for local date string YYYY-MM-DD
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper for default FY list
export const getDefaultFinancialYears = () => {
  const list = ['all'];
  const today = new Date();
  let currentYear = today.getFullYear();
  if (today.getMonth() < 3) {
    currentYear -= 1;
  }
  for (let i = 0; i < 2; i++) {
    const start = currentYear - i;
    const end = start + 1;
    list.push(`FY ${start}-${end.toString().slice(2)}`);
  }
  return list;
};

// Default Months list
export const DEFAULT_MONTHS = [
  { value: 'all', label: 'All Months' },
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

/**
 * CommonTableFilterSection
 * 
 * Reusable, unified, short-height (38px) single-row inline filter bar component.
 * Ensures all filter controls fit seamlessly in one line without wrapping on desktop.
 */
export default function CommonTableFilterSection({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search by ID, name, details...',
  financialYear = 'all',
  onFinancialYearChange,
  financialYears = getDefaultFinancialYears(),
  month = 'all',
  onMonthChange,
  months = DEFAULT_MONTHS,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  onReset,
  showStatusGroup = false,
  statusValue = 'ALL',
  onStatusChange,
  statusOptions = [
    { id: 'ALL', label: 'All', count: null, color: '#176FC1', icon: <Groups2Rounded sx={{ fontSize: 16 }} /> },
    { id: 'ACTIVE', label: 'Active', count: null, color: '#2E7D32', icon: <CheckCircleRounded sx={{ fontSize: 16 }} /> },
    { id: 'INACTIVE', label: 'Inactive', count: null, color: '#D32F2F', icon: <CancelRounded sx={{ fontSize: 16 }} /> },
  ],
  showSearch = true,
  showFinancialYear = true,
  showMonth = true,
  showDateRange = true,
  showReset = true,
  customSlot = null,
  containerSx = {},
}) {
  const theme = useTheme();
  const todayStr = getTodayDateString();
  const isSearchOnly = showSearch && !showFinancialYear && !showMonth && !showDateRange && !showStatusGroup;

  const commonInputSx = {
    '& .MuiInputBase-root': {
      height: 38,
      fontSize: '0.84rem',
      borderRadius: '8px',
      bgcolor: '#ffffff',
      '& fieldset': {
        borderColor: '#cbd5e1',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1.5px',
      },
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.84rem',
      top: -4,
      '&.MuiInputLabel-shrink': {
        top: 0,
      },
    },
    '& .MuiSelect-select': {
      py: 1,
      display: 'flex',
      alignItems: 'center',
    },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        maxHeight: 220,
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e2e8f0',
        '& .MuiMenuItem-root': {
          fontSize: '0.82rem',
          py: 0.8,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
          '&.Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            fontWeight: 700,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
            },
          },
        },
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 2.2,
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
        ...containerSx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          width: '100%',
        }}
      >
        {/* ── Search Input ── */}
        {showSearch && (
          <Box
            sx={{
              flex: isSearchOnly ? '0 1 340px' : { xs: '1 1 100%', sm: '1 1 200px', lg: '1.8 1 200px' },
              minWidth: isSearchOnly ? { xs: '100%', sm: 260 } : { xs: '100%', sm: 180, lg: 190 },
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              sx={commonInputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: 'text.secondary', fontSize: 19 }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange && onSearchChange('')} edge="end">
                      <ClearRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>
        )}

        {/* ── Optional Status Toggle Group (Active / Inactive / All) ── */}
        {showStatusGroup && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontSize: '0.80rem', fontWeight: 700, color: 'text.secondary' }}>
              Status:
            </Typography>
            <ToggleButtonGroup
              value={statusValue}
              exclusive
              onChange={(e, val) => {
                if (val !== null && onStatusChange) {
                  onStatusChange(val);
                }
              }}
              size="small"
              sx={{
                height: 38,
                borderRadius: '8px',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                p: '3px',
                gap: '4px',
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none !important',
                  borderRadius: '6px !important',
                  px: 1.4,
                  py: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.80rem',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  },
                },
              }}
            >
              {statusOptions.map((opt) => {
                const isSelected = statusValue === opt.id;
                const itemColor = opt.color || theme.palette.primary.main;
                return (
                  <ToggleButton
                    key={opt.id}
                    value={opt.id}
                    sx={{
                      color: isSelected ? `${itemColor} !important` : 'text.secondary',
                      bgcolor: isSelected ? `${alpha(itemColor, 0.12)} !important` : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                      {opt.icon && React.cloneElement(opt.icon, { sx: { color: isSelected ? itemColor : 'text.secondary', fontSize: 16 } })}
                      <span>{opt.label}</span>
                      {opt.count !== null && opt.count !== undefined && (
                        <Chip
                          label={opt.count}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            bgcolor: isSelected ? itemColor : '#e2e8f0',
                            color: isSelected ? '#ffffff' : 'text.secondary',
                            borderRadius: '4px',
                            px: 0.2,
                          }}
                        />
                      )}
                    </Box>
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Box>
        )}

        {/* ── Financial Year Dropdown ── */}
        {showFinancialYear && (
          <Box
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 130px', lg: '1 1 125px' },
              minWidth: { xs: '100%', sm: 120, lg: 125 },
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label="Financial Year"
              value={financialYear}
              onChange={(e) => onFinancialYearChange && onFinancialYearChange(e.target.value)}
              SelectProps={{ MenuProps: menuProps }}
              sx={commonInputSx}
            >
              {financialYears.map((fy) => (
                <MenuItem key={fy} value={fy}>
                  {fy === 'all' ? 'All FYs' : fy}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {/* ── Month Dropdown ── */}
        {showMonth && (
          <Box
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 130px', lg: '1 1 125px' },
              minWidth: { xs: '100%', sm: 120, lg: 125 },
            }}
          >
            <TextField
              select
              fullWidth
              size="small"
              label="Month"
              value={month}
              onChange={(e) => onMonthChange && onMonthChange(e.target.value)}
              SelectProps={{ MenuProps: menuProps }}
              sx={commonInputSx}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {/* ── Start Date (From Date) ── */}
        {showDateRange && (
          <Box
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 125px', lg: '1 1 120px' },
              minWidth: { xs: '100%', sm: 115, lg: 120 },
            }}
          >
            <TextField
              type="date"
              fullWidth
              size="small"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: endDate || todayStr }}
              value={startDate}
              onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
              sx={commonInputSx}
            />
          </Box>
        )}

        {/* ── End Date (To Date) ── */}
        {showDateRange && (
          <Box
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 125px', lg: '1 1 120px' },
              minWidth: { xs: '100%', sm: 115, lg: 120 },
            }}
          >
            <TextField
              type="date"
              fullWidth
              size="small"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: startDate || undefined, max: todayStr }}
              value={endDate}
              onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
              sx={commonInputSx}
            />
          </Box>
        )}

        {/* ── Custom Slot (if provided) ── */}
        {customSlot}

        {/* ── Clear Filter Button ── */}
        {showReset && (
          <Box sx={{ flexShrink: 0, minWidth: 105, ml: { xs: 0, lg: 'auto' } }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<RestartAltRounded sx={{ fontSize: 18 }} />}
              onClick={onReset}
              sx={{
                height: 38,
                px: 1.8,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                '&:hover': {
                  borderColor: theme.palette.secondary.main,
                  bgcolor: alpha(theme.palette.secondary.main, 0.06),
                  color: theme.palette.secondary.main,
                },
              }}
            >
              Clear Filter
            </Button>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
