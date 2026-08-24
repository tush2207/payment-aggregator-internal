import { alpha } from '@mui/material';
import { GRADIENTS, GOLD, GREY, NAVY, RED } from './palette';

export const getComponentsOverride = () => ({
    /* ── AppBar ── */
    MuiAppBar: {
        styleOverrides: {
            root: {
                background: GRADIENTS.cbiHeader,
                backgroundColor: NAVY.main,
                color: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                borderBottom: `3px solid ${RED.main}`,
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

            /* ── Contained Primary (Official CBI Blue) ── */
            containedPrimary: {
                background: `${NAVY.main} !important`,
                backgroundColor: `${NAVY.main} !important`,
                color: '#ffffff !important',
                boxShadow: `0 4px 14px ${alpha(NAVY.main, 0.25)}`,
                '&:hover': {
                    background: `${NAVY.dark} !important`,
                    backgroundColor: `${NAVY.dark} !important`,
                    boxShadow: `0 6px 18px ${alpha(NAVY.main, 0.35)}`,
                    transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                    background: `${GREY[300]} !important`,
                    backgroundColor: `${GREY[300]} !important`,
                    color: `${GREY[500]} !important`,
                    boxShadow: 'none',
                },
            },

            /* ── Contained Secondary (Official CBI Red) ── */
            containedSecondary: {
                background: `${RED.main} !important`,
                backgroundColor: `${RED.main} !important`,
                color: '#ffffff !important',
                boxShadow: `0 4px 18px ${alpha(RED.main, 0.25)}`,
                '&:hover': {
                    background: `${RED.dark} !important`,
                    backgroundColor: `${RED.dark} !important`,
                    boxShadow: `0 6px 22px ${alpha(RED.main, 0.35)}`,
                    transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                    background: `${GREY[300]} !important`,
                    backgroundColor: `${GREY[300]} !important`,
                    color: `${GREY[500]} !important`,
                    boxShadow: 'none',
                },
            },

            /* ── Contained Success (Solid Green) ── */
            containedSuccess: {
                background: '#2E7D32 !important',
                backgroundColor: '#2E7D32 !important',
                color: '#ffffff !important',
                boxShadow: '0 4px 14px rgba(46, 125, 50, 0.25)',
                '&:hover': {
                    background: '#1B5E20 !important',
                    backgroundColor: '#1B5E20 !important',
                    boxShadow: '0 6px 18px rgba(46, 125, 50, 0.35)',
                    transform: 'translateY(-1px)',
                },
            },

            /* ── Contained Error (Solid Red) ── */
            containedError: {
                background: `${RED.main} !important`,
                backgroundColor: `${RED.main} !important`,
                color: '#ffffff !important',
                boxShadow: `0 4px 14px ${alpha(RED.main, 0.25)}`,
                '&:hover': {
                    background: `${RED.dark} !important`,
                    backgroundColor: `${RED.dark} !important`,
                    boxShadow: `0 6px 18px ${alpha(RED.main, 0.35)}`,
                    transform: 'translateY(-1px)',
                },
            },

            /* ── Outlined ── */
            outlinedPrimary: {
                borderWidth: '1.5px !important',
                borderColor: `${NAVY.main} !important`,
                color: `${NAVY.main} !important`,
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                '&:hover': {
                    borderColor: `${NAVY.dark} !important`,
                    color: `${NAVY.dark} !important`,
                    background: `${alpha(NAVY.main, 0.08)} !important`,
                    backgroundColor: `${alpha(NAVY.main, 0.08)} !important`,
                    transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                    borderColor: `${GREY[300]} !important`,
                    color: `${GREY[400]} !important`,
                },
            },

            outlinedSecondary: {
                borderWidth: '1.5px !important',
                borderColor: `${RED.main} !important`,
                color: `${RED.main} !important`,
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                '&:hover': {
                    borderColor: `${RED.dark} !important`,
                    color: `${RED.dark} !important`,
                    background: `${alpha(RED.main, 0.08)} !important`,
                    backgroundColor: `${alpha(RED.main, 0.08)} !important`,
                    transform: 'translateY(-1px)',
                },
                '&.Mui-disabled': {
                    borderColor: `${GREY[300]} !important`,
                    color: `${GREY[400]} !important`,
                },
            },

            /* ── Text ── */
            textPrimary: {
                color: `${NAVY.main} !important`,
                '&:hover': {
                    background: `${alpha(NAVY.main, 0.08)} !important`,
                    transform: 'translateY(-1px)',
                },
            },

            textSecondary: {
                color: `${RED.main} !important`,
                '&:hover': {
                    background: `${alpha(RED.main, 0.08)} !important`,
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
                    background: alpha(NAVY.main, 0.1),
                },
            },
            colorPrimary: {
                color: NAVY.main,
                '&:hover': { background: alpha(NAVY.main, 0.1) },
            },
            colorSecondary: {
                color: RED.main,
                '&:hover': { background: alpha(RED.main, 0.1) },
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
                background: alpha(NAVY.main, 0.12),
                color: NAVY.main,
                border: `1px solid ${alpha(NAVY.main, 0.25)}`,
            },
            colorSecondary: {
                background: alpha(RED.main, 0.12),
                color: RED.main,
                border: `1px solid ${alpha(RED.main, 0.25)}`,
            },
            colorSuccess: {
                background: 'rgba(46, 125, 50, 0.15)',
                color: '#2E7D32',
                border: '1px solid rgba(46, 125, 50, 0.30)',
            },
            colorWarning: {
                background: alpha(GOLD.main, 0.2),
                color: GOLD[700],
                border: `1px solid ${alpha(GOLD.main, 0.4)}`,
            },
            colorError: {
                background: alpha(RED.main, 0.15),
                color: RED.main,
                border: `1px solid ${alpha(RED.main, 0.3)}`,
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
                        borderColor: NAVY.main,
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: RED.main,
                        borderWidth: '2px',
                        boxShadow: `0 0 0 3px ${alpha(RED.main, 0.12)}`,
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
                    color: NAVY.main,
                    '&.Mui-focused': {
                        color: RED.main,
                        fontWeight: 600,
                    },
                    '&.Mui-error': { color: RED.main },
                },

                '& .MuiOutlinedInput-root.Mui-error fieldset': {
                    borderColor: `${RED.main} !important`,
                    boxShadow: `0 0 0 3px ${alpha(RED.main, 0.1)}`,
                },

                '& .MuiFormHelperText-root.Mui-error': {
                    fontWeight: 600,
                    color: RED.main,
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
                    borderColor: RED.main,
                    borderWidth: '2px',
                },
            },
            icon: {
                color: NAVY.main,
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
                '&:hover fieldset': { borderColor: NAVY.main },
                '&.Mui-focused fieldset': {
                    borderColor: RED.main,
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
                borderRadius: '10px 10px 0 0',
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                boxShadow: 'none',
                backgroundColor: '#ffffff',
            },
        },
    },

    /* ── Table Head ── */
    MuiTableHead: {
        styleOverrides: {
            root: {
                background: GRADIENTS.cbiTable,
                backgroundColor: NAVY.main,
                borderBottom: '2px solid #062545',
                '& tr, & .MuiTableRow-root, & .MuiTableRow-head': {
                    boxShadow: 'none',
                },
                '& th, & .MuiTableCell-root, & .MuiTableCell-head': {
                    color: '#ffffff',
                    padding: '10px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderBottom: '2px solid #062545',
                },
                '& tr:first-of-type th:first-of-type': {
                    borderTopLeftRadius: '9px',
                },
                '& tr:first-of-type th:last-of-type': {
                    borderTopRightRadius: '9px',
                },
                '& th *, & .MuiTableCell-root *, & .MuiTableCell-head *': {
                    color: '#ffffff',
                },
            },
        },
    },

    /* ── Table Row ── */
    MuiTableRow: {
        styleOverrides: {
            root: {
                transition: 'background-color 0.2s ease',
                'tbody &:hover, &.MuiTableRow-hover:hover': {
                    background: '#f8fafc !important',
                    backgroundColor: '#f8fafc !important',
                },
                'thead &, thead &:hover, &.MuiTableRow-head, &.MuiTableRow-head:hover': {
                    background: 'transparent !important',
                    backgroundColor: 'transparent !important',
                },
                '&.Mui-selected, &.Mui-selected:hover': {
                    background: `${alpha(NAVY.main, 0.08)} !important`,
                    backgroundColor: `${alpha(NAVY.main, 0.08)} !important`,
                },
            },
            head: {
                background: 'transparent !important',
                backgroundColor: 'transparent !important',
                '&:hover': {
                    background: 'transparent !important',
                    backgroundColor: 'transparent !important',
                },
            },
        },
    },

    /* ── Table Cell ── */
    MuiTableCell: {
        styleOverrides: {
            root: {
                padding: '10px 14px',
                fontSize: '12.5px',
                border: '1px solid #cbd5e1',
                color: GREY[800],
            },
            head: {
                fontWeight: 700,
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderBottom: '2px solid #062545',
                textTransform: 'uppercase',
                fontSize: '12px',
                letterSpacing: '0.4px',
            },
        },
    },

    /* ── Table Sort Label ── */
    MuiTableSortLabel: {
        styleOverrides: {
            root: {
                color: '#ffffff !important',
                '&:hover': {
                    color: '#ffffff !important',
                },
                '&.Mui-active': {
                    color: '#ffffff !important',
                    '& .MuiTableSortLabel-icon': {
                        color: `${GOLD.main} !important`,
                    },
                },
            },
            icon: {
                color: '#ffffff !important',
            },
        },
    },

    /* ── DataGrid ── */
    MuiDataGrid: {
        styleOverrides: {
            root: {
                border: 'none !important',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                backgroundColor: '#ffffff',
                '& .MuiDataGrid-topContainer, & .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderRow, & .MuiDataGrid-columnHeadersInner': {
                    background: `${GRADIENTS.cbiTable} !important`,
                    backgroundColor: `${NAVY.main} !important`,
                    color: '#ffffff !important',
                    borderBottom: 'none !important',
                    borderRight: 'none !important',
                    borderLeft: 'none !important',
                    outline: 'none !important',
                    '&:focus, &:focus-within': {
                        outline: 'none !important',
                    },
                },
                '& .MuiDataGrid-columnHeader:hover, & .MuiDataGrid-columnHeaderRow:hover, & .MuiDataGrid-columnHeaders:hover': {
                    background: `${GRADIENTS.cbiTable} !important`,
                    backgroundColor: `${NAVY.main} !important`,
                    color: '#ffffff !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                    color: '#ffffff !important',
                    fontWeight: '700 !important',
                    fontSize: '12px !important',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                    color: '#ffffff !important',
                },
                '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton, & .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-iconButtonContainer *': {
                    color: '#ffffff !important',
                    fill: '#ffffff !important',
                },
                '& .MuiDataGrid-columnSeparator': { display: 'none !important' },
                '& .MuiDataGrid-row': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        background: '#f8fafc !important',
                    },
                },
                '& .MuiDataGrid-row.Mui-selected': {
                    background: `${alpha(RED.main, 0.06)} !important`,
                },
                '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f1f5f9',
                    borderRight: 'none !important',
                    borderLeft: 'none !important',
                    fontSize: '13px',
                    color: GREY[800],
                    '&:focus, &:focus-within': {
                        outline: 'none !important',
                    },
                },
                '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid #e2e8f0',
                    background: '#ffffff',
                },
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
                background: GRADIENTS.cbiHeader,
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
                background: alpha(NAVY.main, 0.1),
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
                borderBottom: `3px solid ${NAVY.main}`,
                boxShadow: '0 4px 14px rgba(14, 79, 141, 0.18)',
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
                color: `${NAVY.main} !important`,
                opacity: 1,
                background: alpha(NAVY.main, 0.08),
                '&:hover': {
                    background: alpha(NAVY.main, 0.15),
                    color: `${NAVY.dark} !important`,
                },
                '&.Mui-selected': {
                    background: `${GRADIENTS.cbiTable} !important`,
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
                    background: alpha(NAVY.main, 0.06),
                    color: NAVY.main,
                },
                '&.Mui-selected': {
                    background: `${alpha(RED.main, 0.08)} !important`,
                    color: RED.main,
                    fontWeight: 700,
                },
            },
        },
    },

    /* ── Tooltip ── */
    MuiTooltip: {
        styleOverrides: {
            tooltip: {
                background: NAVY.dark,
                color: '#ffffff',
                fontSize: '0.72rem',
                fontWeight: 500,
                borderRadius: '8px',
                padding: '6px 12px',
                boxShadow: '0 4px 14px rgba(10,35,66,0.30)',
            },
            arrow: {
                color: NAVY.dark,
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
                    background: `${RED.main} !important`,
                    backgroundColor: `${RED.main} !important`,
                    color: '#ffffff',
                    boxShadow: `0 4px 12px ${alpha(RED.main, 0.35)}`,
                    '&:hover': {
                        background: `${RED.dark} !important`,
                        backgroundColor: `${RED.dark} !important`,
                    },
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
                background: alpha(NAVY.main, 0.1),
                color: NAVY.dark,
                border: `1px solid ${alpha(NAVY.main, 0.25)}`,
            },
            standardSuccess: {
                background: 'rgba(46, 125, 50, 0.10)',
                color: '#2E7D32',
                border: '1px solid rgba(46, 125, 50, 0.25)',
            },
            standardWarning: {
                background: alpha(GOLD.main, 0.15),
                color: GOLD[700],
                border: `1px solid ${alpha(GOLD.main, 0.35)}`,
            },
            standardError: {
                background: alpha(RED.main, 0.1),
                color: RED.dark,
                border: `1px solid ${alpha(RED.main, 0.25)}`,
            },
        },
    },

    /* ── Skeleton ── */
    MuiSkeleton: {
        styleOverrides: {
            root: {
                borderRadius: '8px',
                background: alpha(NAVY.main, 0.08),
                '&::after': {
                    background: `linear-gradient(90deg, transparent, ${alpha(
                        NAVY.main,
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
                borderColor: alpha(NAVY.main, 0.1),
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
                    color: NAVY.main,
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { color: RED.main },
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
                background: RED.main,
            },
        },
    },

    /* ── Switch ── */
    MuiSwitch: {
        styleOverrides: {
            switchBase: {
                '&.Mui-checked': {
                    color: RED.main,
                    '& + .MuiTarget-track, & + .MuiSwitch-track': {
                        background: RED.main,
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
                '&.Mui-checked': { color: RED.main },
                '&.MuiCheckbox-indeterminate': { color: NAVY.main },
            },
        },
    },

    /* ── Radio ── */
    MuiRadio: {
        styleOverrides: {
            root: {
                color: GREY[400],
                '&.Mui-checked': { color: RED.main },
            },
        },
    },

    /* ── Fab ── */
    MuiFab: {
        styleOverrides: {
            root: {
                background: `${RED.main} !important`,
                backgroundColor: `${RED.main} !important`,
                color: '#ffffff',
                boxShadow: `0 6px 18px ${alpha(RED.main, 0.40)}`,
                '&:hover': {
                    background: `${RED.dark} !important`,
                    backgroundColor: `${RED.dark} !important`,
                    boxShadow: `0 8px 24px ${alpha(RED.main, 0.55)}`,
                    transform: 'scale(1.06)',
                },
            },
        },
    },

    /* ── Snackbar / Notification ── */
    MuiSnackbarContent: {
        styleOverrides: {
            root: {
                background: NAVY.dark,
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
                border: `1px solid ${alpha(NAVY.main, 0.12)}`,
            },
            option: {
                fontSize: '0.85rem',
                fontWeight: 500,
                '&[aria-selected="true"]': {
                    background: `${alpha(RED.main, 0.08)} !important`,
                    color: RED.main,
                    fontWeight: 700,
                },
                '&:hover': {
                    background: alpha(NAVY.main, 0.05),
                },
            },
        },
    },
});

export default getComponentsOverride;
