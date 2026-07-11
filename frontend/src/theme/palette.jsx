import { alpha } from '@mui/material';

/* ═══════════════════════════════════════════════════════════
   CBI DESIGN TOKENS
   Mirrors: Login page · Navbar · Category cards
 ═══════════════════════════════════════════════════════════ */

/* ── Core CBI brand colours ── */
export const NAVY = {
    50: '#e8edf4',
    100: '#c2cedf',
    200: '#98abc8',
    300: '#6e88b1',
    400: '#4e6fa0',
    500: '#2e578f',
    600: '#0d3b6e' /* nav mid */,
    700: '#0a2342' /* nav base / card base */,
    800: '#071830',
    900: '#040e1d',
    main: '#0a2342',
    light: '#0d3b6e',
    dark: '#040e1d',
    contrastText: '#ffffff',
};

export const RED = {
    50: '#fcecea',
    100: '#f7c5c2',
    200: '#f09b97',
    300: '#e8716b',
    400: '#e05249',
    500: '#d83329',
    600: '#c0392b' /* CBI primary red */,
    700: '#a93226',
    800: '#922b21',
    900: '#7b241c',
    main: '#c0392b',
    light: '#e74c3c',
    dark: '#922b21',
    contrastText: '#ffffff',
};

export const GOLD = {
    50: '#fffde8',
    100: '#fff9c4',
    200: '#fff59d',
    300: '#fff176',
    400: '#ffee58',
    500: '#f6d365' /* CBI gold accent */,
    600: '#fda085',
    700: '#f57f17',
    800: '#e65100',
    900: '#bf360c',
    main: '#f6d365',
    light: '#ffe082',
    dark: '#f57f17',
    contrastText: '#0a2342',
};

/* ── Neutral greys ── */
export const GREY = {
    0: '#ffffff',
    100: '#f7f9fc',
    200: '#edf1f7',
    300: '#dde3ed',
    400: '#c4cdd8',
    500: '#8a9ab5',
    600: '#637381',
    700: '#454f5b',
    800: '#212b36',
    900: '#161c24',
};

/* ── Semantic colours (unchanged from your original) ── */
export const INFO = {
    light: '#74caff',
    main: '#1890ff',
    dark: '#0c53b7',
    contrastText: '#fff',
};

export const SUCCESS = {
    light: '#aaf27f',
    main: '#54d62c',
    dark: '#229a16',
    contrastText: GREY[800],
};

export const WARNING = {
    light: '#ffe16a',
    main: '#ffc107',
    dark: '#b78103',
    contrastText: GREY[800],
};

export const ERROR = {
    light: '#ffa48d',
    main: '#E63A46',
    dark: '#b72136',
    contrastText: '#fff',
};

/* ── CBI gradient presets (use in sx or custom theme) ── */
export const GRADIENTS = {
    navy: `linear-gradient(90deg, ${NAVY[700]} 0%, ${NAVY[600]} 50%, ${NAVY[700]} 100%)`,
    navyDark: `linear-gradient(135deg, ${NAVY[700]} 0%, ${NAVY[900]} 100%)`,
    red: `linear-gradient(135deg, ${RED[600]} 0%, ${RED.light} 100%)`,
    redHover: `linear-gradient(135deg, ${RED[700]} 0%, ${RED[600]} 100%)`,
    gold: `linear-gradient(90deg, ${GOLD[500]} 0%, ${GOLD[600]} 100%)`,
    accent: `linear-gradient(90deg, ${RED[600]}, ${RED.light}, ${GOLD[500]}, ${RED.light}, ${RED[600]})`,
    card: `linear-gradient(160deg, ${NAVY[700]} 0%, ${NAVY[600]} 100%)`,
};

/* ── Full palette ── */
const palette = {
    primary: NAVY,
    secondary: RED,
    accent: GOLD,

    common: {
        black: '#000000',
        white: '#ffffff',
        grey: GREY[600],
        lightGrey: GREY[500],
    },

    info: INFO,
    success: SUCCESS,
    warning: WARNING,
    error: ERROR,
    grey: GREY,

    divider: alpha(GREY[500], 0.24),

    text: {
        primary: GREY[800],
        secondary: GREY[600],
        disabled: GREY[500],
        inverse: '#ffffff',
        inverseSecondary: 'rgba(255,255,255,0.60)',
    },

    background: {
        default: '#f4f6fa',
        paper: '#ffffff',
        navy: NAVY[700],
        navyMid: NAVY[600],
        dark: '#0d1f35',
    },

    /* graph colours — CBI themed */
    graphColors: [
        RED[600] /* CBI red */,
        NAVY[600] /* CBI navy */,
        GOLD[500] /* CBI gold */,
        '#2e7d32' /* green */,
        '#0277bd' /* blue */,
        '#6a1b9a' /* purple */,
    ],

    gradients: GRADIENTS,
};

export default palette;
