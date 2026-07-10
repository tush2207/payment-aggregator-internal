import { alpha } from '@mui/material';
import { GRADIENTS, GOLD, GREY, NAVY, RED } from './palette';

export const getComponentsOverride = () => ({
    /* ── AppBar ── */
    MuiAppBar: {
        styleOverrides: {
            root: {
                background: GRADIENTS.navy,
                boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                /* red → gold top accent line */
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: GRADIENTS.accent,
                },
            },
        },
    },

    /* ── Paper ── */
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '16px',
                backgroundImage: 'none',
            },
            elevation1: { boxShadow: '0 2px 8px rgba(10,35,66,0.10)' },
            elevation2: { boxShadow: '0 4px 14px rgba(10,35,66,0.12)' },
            elevation3: { boxShadow: '0 6px 18px rgba(10,35,66,0.14)' },
        },
    },

    /* ── Card ── */
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 14px rgba(10,35,66,0.12)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 14px 36px rgba(10,35,66,0.20)',
                },
            },
        },
    },

    /* ── Button ── */
    MuiButton: {
        defaultProps: { disableElevation: false },
        styleOverrides: {
            root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                fontSize: '0.85rem',
                padding: '7px 18px',
                transition: 'all 0.25s ease',
                letterSpacing: '0.3px',
            },

            /* ── Contained (primary = navy) ── */
            containedPrimary: {
                background: GRADIENTS.navy,
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(10,35,66,0.30)',
                '&:hover': {
                    background: GRADIENTS.navyDark,
                    boxShadow: '0 6px 18px rgba(10,35,66,0.40)',
                    transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                    background: `${GREY[300]} !important`,
                    color: `${GREY[500]} !important`,
                    boxShadow: 'none',
                },
            },

            /* ── Contained (secondary = CBI red) ── */
            containedSecondary: {
                background: GRADIENTS.red,
                color: '#ffffff',
                boxShadow: '0 4px 18px rgba(192,57,43,0.35)',
                '&:hover': {
                    background: GRADIENTS.redHover,
                    boxShadow: '0 6px 22px rgba(192,57,43,0.50)',
                    transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                    background: `${GREY[300]} !important`,
                    color: `${GREY[500]} !important`,
                    boxShadow: 'none',
                },
            },

            /* ── Outlined ── */
            outlinedPrimary: {
                borderWidth: '1.5px !important',
                borderColor: `${NAVY[600]} !important`,
                color: NAVY[700],
                background: 'transparent',
                '&:hover': {
                    borderColor: `${NAVY[700]} !important`,
                    background: alpha(NAVY[700], 0.06),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 14px ${alpha(NAVY[700], 0.18)}`,
                },
                '&.Mui-disabled': {
                    borderColor: `${GREY[300]} !important`,
                    color: `${GREY[400]} !important`,
                },
            },

            outlinedSecondary: {
                borderWidth: '1.5px !important',
                borderColor: `${RED[600]} !important`,
                color: RED[600],
                background: 'transparent',
                '&:hover': {
                    borderColor: `${RED[700]} !important`,
                    background: alpha(RED[600], 0.06),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 14px ${alpha(RED[600], 0.2)}`,
                },
                '&.Mui-disabled': {
                    borderColor: `${GREY[300]} !important`,
                    color: `${GREY[400]} !important`,
                },
            },

            /* ── Text ── */
            textPrimary: {
                color: NAVY[700],
                '&:hover': {
                    background: alpha(NAVY[700], 0.08),
                    transform: 'translateY(-1px)',
                },
            },

            textSecondary: {
                color: RED[600],
                '&:hover': {
                    background: alpha(RED[600], 0.08),
                    transform: 'translateY(-1px)',
                },
            },
        },
    },

    /* ── IconButton ── */
    MuiIconButton: {
        styleOverrides: {
            root: {
                transition: 'all 0.25s ease',
                '&:hover': {
                    transform: 'scale(1.12)',
                    background: alpha(NAVY[700], 0.1),
                },
            },
            colorPrimary: {
                color: NAVY[700],
                '&:hover': { background: alpha(NAVY[700], 0.1) },
            },
            colorSecondary: {
                color: RED[600],
                '&:hover': { background: alpha(RED[600], 0.1) },
            },
        },
    },

    /* ── Chip ── */
    MuiChip: {
        styleOverrides: {
            root: {
                fontWeight: 600,
                borderRadius: '8px',
                fontSize: '0.72rem',
                height: 26,
            },
            colorPrimary: {
                background: alpha(NAVY[700], 0.12),
                color: NAVY[700],
                border: `1px solid ${alpha(NAVY[700], 0.25)}`,
            },
            colorSecondary: {
                background: alpha(RED[600], 0.12),
                color: RED[600],
                border: `1px solid ${alpha(RED[600], 0.25)}`,
            },
            colorSuccess: {
                background: 'rgba(67,160,71,0.15)',
                color: '#43a047',
                border: '1px solid rgba(67,160,71,0.30)',
            },
            colorWarning: {
                background: `${alpha(GOLD[500], 0.2)}`,
                color: GOLD[700],
                border: `1px solid ${alpha(GOLD[500], 0.4)}`,
            },
            colorError: {
                background: alpha(RED[600], 0.15),
                color: RED[600],
                border: `1px solid ${alpha(RED[600], 0.3)}`,
            },
        },
    },

    /* ── TextField ── */
    MuiTextField: {
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    background: '#f7f9fc',
                    transition: 'all 0.25s ease',

                    '& fieldset': {
                        borderColor: GREY[300],
                        transition: 'all 0.25s ease',
                    },
                    '&:hover fieldset': {
                        borderColor: NAVY[600],
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: RED[600],
                        borderWidth: '2px',
                        boxShadow: `0 0 0 3px ${alpha(RED[600], 0.12)}`,
                    },
                    '&.Mui-disabled': {
                        background: GREY[200],
                        opacity: 0.7,
                        '& fieldset': { borderColor: GREY[300] },
                    },
                },

                '& .MuiInputBase-input': {
                    padding: '10px 14px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&::placeholder': {
                        color: GREY[400],
                        fontWeight: 400,
                    },
                },

                '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: NAVY[600],
                    '&.Mui-focused': {
                        color: RED[600],
                        fontWeight: 600,
                    },
                    '&.Mui-error': { color: RED[600] },
                },

                '& .MuiOutlinedInput-root.Mui-error fieldset': {
                    borderColor: `${RED[600]} !important`,
                    boxShadow: `0 0 0 3px ${alpha(RED[600], 0.1)}`,
                },

                '& .MuiFormHelperText-root.Mui-error': {
                    fontWeight: 600,
                    color: RED[600],
                    fontSize: '0.72rem',
                },
            },
        },
    },

    /* ── Select ── */
    MuiSelect: {
        styleOverrides: {
            root: {
                borderRadius: '10px',
                background: '#f7f9fc',
                transition: 'all 0.25s ease',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: RED[600],
                    borderWidth: '2px',
                },
            },
            icon: {
                color: NAVY[600],
                transition: 'all 0.25s ease',
            },
        },
    },

    /* ── OutlinedInput (used by Select internally) ── */
    MuiOutlinedInput: {
        styleOverrides: {
            root: {
                borderRadius: '10px',
                '& fieldset': { borderColor: GREY[300] },
                '&:hover fieldset': { borderColor: NAVY[600] },
                '&.Mui-focused fieldset': {
                    borderColor: RED[600],
                    borderWidth: '2px',
                },
            },
            notchedOutline: {
                borderColor: GREY[300],
            },
        },
    },

    /* ── Table Container ── */
    MuiTableContainer: {
        styleOverrides: {
            root: {
                borderRadius: '16px',
                overflow: 'hidden',
                border: `1px solid ${alpha(NAVY[700], 0.1)}`,
                boxShadow: '0 4px 20px rgba(10,35,66,0.12)',
            },
        },
    },

    /* ── Table Head ── */
    MuiTableHead: {
        styleOverrides: {
            root: {
                background: GRADIENTS.navy,
                '& th': {
                    padding: '10px 14px !important',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid rgba(255,255,255,0.12)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                },
            },
        },
    },

    /* ── Table Row ── */
    MuiTableRow: {
        styleOverrides: {
            root: {
                transition: 'all 0.2s ease',
                '&:nth-of-type(even)': {
                    background: alpha(NAVY[700], 0.025),
                },
                '&:nth-of-type(odd)': {
                    background: alpha(NAVY[700], 0.025),
                },
                '&:hover': {
                    background: `${alpha(NAVY[700], 0.05)} !important`,
                    '& td': { color: NAVY[700] },
                },
                '&.Mui-selected': {
                    background: `${alpha(RED[600], 0.06)} !important`,
                    '&:hover': {
                        background: `${alpha(RED[600], 0.1)} !important`,
                    },
                },
            },
        },
    },

    /* ── Table Cell ── */
    MuiTableCell: {
        styleOverrides: {
            root: {
                padding: '9px 14px !important',
                fontSize: '13px',
                borderBottom: `1px solid ${alpha(NAVY[700], 0.07)}`,
                color: GREY[700],
            },
            head: {
                background: 'transparent',
                color: '#ffffff !important',
            },
        },
    },

    /* ── DataGrid ── */
    MuiDataGrid: {
        styleOverrides: {
            root: {
                border: 'none',
                borderRadius: '16px',
                overflow: 'hidden',
                '& .MuiDataGrid-columnHeaders': {
                    background: GRADIENTS.navy,
                    borderBottom: 'none',
                    minHeight: '48px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-row:hover': {
                    background: alpha(NAVY[700], 0.05),
                },
                '& .MuiDataGrid-row.Mui-selected': {
                    background: `${alpha(RED[600], 0.06)} !important`,
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${alpha(NAVY[700], 0.06)}`,
                    fontSize: '13px',
                    color: GREY[700],
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: `1px solid ${alpha(NAVY[700], 0.1)}`,
                    background: alpha(NAVY[700], 0.02),
                },
                '& .MuiDataGrid-sortIcon': { color: '#ffffff' },
                '& .MuiDataGrid-menuIconButton': { color: '#ffffff' },
            },
        },
    },

    /* ── Dialog ── */
    MuiDialog: {
        styleOverrides: {
            paper: {
                borderRadius: '20px',
                boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
            },
        },
    },

    /* ── Dialog Title ── */
    MuiDialogTitle: {
        styleOverrides: {
            root: {
                background: GRADIENTS.navy,
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '16px 24px',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: GRADIENTS.accent,
                },
            },
        },
    },

    /* ── Linear Progress ── */
    MuiLinearProgress: {
        styleOverrides: {
            root: {
                height: 7,
                borderRadius: 10,
                background: alpha(NAVY[700], 0.1),
            },
            barColorPrimary: {
                background: GRADIENTS.navy,
                borderRadius: 10,
            },
            barColorSecondary: {
                background: GRADIENTS.red,
                borderRadius: 10,
            },
        },
    },

    MuiTabs: {
        styleOverrides: {
            root: {
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                borderBottom: '3px solid #D32F2F',
                color: 'red',
                boxShadow: '0 4px 14px rgba(0, 31, 84, 0.18)',
                padding: '0px 0px 0px',
                overflow: 'hidden',
                '&::-webkit-scrollbar': {
                    display: 'none',
                },
                scrollbarWidth: 'none',
            },
            scroller: {
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
                overflow: 'hidden',
            },
            flexContainer: {
                gap: '10px',
                alignItems: 'flex-end',
            },
            indicator: {
                display: 'none',
            },
        },
    },

    MuiTab: {
        styleOverrides: {
            root: {
                minHeight: 48,
                padding: '12px 22px',
                borderTopLeftRadius: '14px',
                borderTopRightRadius: '14px',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: '#0B3D91 !important',
                opacity: 1,
                background: 'rgba(11, 61, 145, 0.08)',
                '&:hover': {
                    background: 'rgba(11, 61, 145, 0.15)',
                    color: '#001F54',
                },
                '&.Mui-selected': {
                    background: GRADIENTS.navy,
                    color: '#FFFFFF !important',
                    fontWeight: 800,
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.12)',
                },
            },
        },
    },

    /* ── Menu ── */
    MuiMenu: {
        styleOverrides: {
            paper: {
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 12px 40px rgba(10,35,66,0.18)',
                overflow: 'hidden',
            },
        },
    },

    MuiMenuItem: {
        styleOverrides: {
            root: {
                fontSize: '0.85rem',
                fontWeight: 500,
                padding: '10px 16px',
                transition: 'all 0.18s ease',
                '&:hover': {
                    background: alpha(NAVY[700], 0.06),
                    color: NAVY[700],
                },
                '&.Mui-selected': {
                    background: `${alpha(RED[600], 0.08)} !important`,
                    color: RED[600],
                    fontWeight: 700,
                },
            },
        },
    },

    /* ── Tooltip ── */
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                background: NAVY[700],
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 500,
                borderRadius: '8px',
                padding: '6px 12px',
                boxShadow: '0 4px 14px rgba(10,35,66,0.30)',
            },
            arrow: {
                color: NAVY[700],
            },
        },
    },

    /* ── Pagination ── */
    MuiPaginationItem: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                '&.Mui-selected': {
                    background: GRADIENTS.red,
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(192,57,43,0.35)',
                    '&:hover': { background: GRADIENTS.redHover },
                },
            },
        },
    },

    /* ── Alert ── */
    MuiAlert: {
        styleOverrides: {
            root: {
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '0.85rem',
            },
            standardInfo: {
                background: alpha('#1890ff', 0.1),
                color: '#0c53b7',
                border: `1px solid ${alpha('#1890ff', 0.25)}`,
            },
            standardSuccess: {
                background: 'rgba(84,214,44,0.10)',
                color: '#229a16',
                border: '1px solid rgba(84,214,44,0.25)',
            },
            standardWarning: {
                background: `${alpha(GOLD[500], 0.15)}`,
                color: GOLD[700],
                border: `1px solid ${alpha(GOLD[500], 0.35)}`,
            },
            standardError: {
                background: alpha(RED[600], 0.1),
                color: RED[700],
                border: `1px solid ${alpha(RED[600], 0.25)}`,
            },
        },
    },

    /* ── Skeleton ── */
    MuiSkeleton: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
                background: alpha(NAVY[700], 0.08),
                '&::after': {
                    background: `linear-gradient(90deg, transparent, ${alpha(
                        NAVY[700],
                        0.04,
                    )}, transparent)`,
                },
            },
        },
    },

    /* ── Divider ── */
    MuiDivider: {
        styleOverrides: {
            root: {
                borderColor: alpha(NAVY[700], 0.1),
            },
        },
    },

    /* ── Breadcrumbs ── */
    MuiBreadcrumbs: {
        styleOverrides: {
            root: { fontSize: '0.82rem' },
            separator: { color: GREY[400] },
            li: {
                '& a': {
                    color: NAVY[600],
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { color: RED[600] },
                },
                '& p': { color: GREY[600], fontWeight: 500 },
            },
        },
    },

    /* ── Badge ── */
    MuiBadge: {
        styleOverrides: {
            colorPrimary: {
                background: GRADIENTS.navy,
                color: '#ffffff',
            },
            colorSecondary: {
                background: GRADIENTS.red,
                color: '#ffffff',
            },
            colorError: {
                background: RED[600],
            },
        },
    },

    /* ── Switch ── */
    MuiSwitch: {
        styleOverrides: {
            switchBase: {
                '&.Mui-checked': {
                    color: RED[600],
                    '& + .MuiTarget-track, & + .MuiSwitch-track': {
                        background: RED[600],
                        opacity: 0.7,
                    },
                },
            },
            track: {
                background: GREY[400],
                borderRadius: 20,
            },
        },
    },

    /* ── Checkbox ── */
    MuiCheckbox: {
        styleOverrides: {
            root: {
                color: GREY[400],
                '&.Mui-checked': { color: RED[600] },
                '&.MuiCheckbox-indeterminate': { color: NAVY[600] },
            },
        },
    },

    /* ── Radio ── */
    MuiRadio: {
        styleOverrides: {
            root: {
                color: GREY[400],
                '&.Mui-checked': { color: RED[600] },
            },
        },
    },

    /* ── Fab ── */
    MuiFab: {
        styleOverrides: {
            root: {
                background: GRADIENTS.red,
                color: '#ffffff',
                boxShadow: '0 6px 18px rgba(192,57,43,0.40)',
                '&:hover': {
                    background: GRADIENTS.redHover,
                    boxShadow: '0 8px 24px rgba(192,57,43,0.55)',
                    transform: 'scale(1.06)',
                },
            },
        },
    },

    /* ── Snackbar / Notification ── */
    MuiSnackbarContent: {
        styleOverrides: {
            root: {
                background: NAVY[700],
                color: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(10,35,66,0.35)',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: GRADIENTS.red,
                    borderRadius: '12px 0 0 12px',
                },
            },
        },
    },

    /* ── Autocomplete ── */
    MuiAutocomplete: {
        styleOverrides: {
            paper: {
                borderRadius: '12px',
                boxShadow: '0 8px 28px rgba(10,35,66,0.18)',
                border: `1px solid ${alpha(NAVY[700], 0.12)}`,
            },
            option: {
                fontSize: '0.85rem',
                fontWeight: 500,
                '&[aria-selected="true"]': {
                    background: `${alpha(RED[600], 0.08)} !important`,
                    color: RED[600],
                    fontWeight: 700,
                },
                '&:hover': {
                    background: alpha(NAVY[700], 0.05),
                },
            },
        },
    },
});

export default getComponentsOverride;
