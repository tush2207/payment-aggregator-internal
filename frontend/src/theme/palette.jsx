import { alpha } from '@mui/material';

/* ═══════════════════════════════════════════════════════════
   OFFICIAL CBI BRAND TOKENS
   Primary Blue: #176FC1 | Secondary Red: #CE0F3E | Pure White: #FFFFFF
  ═══════════════════════════════════════════════════════════ */

/* ── Core CBI brand colours (Official CBI Royal Blue & Crimson Red) ── */
export const NAVY = {
    50: '#E8F3FC',
    100: '#C5E1F8',
    200: '#9ECBF3',
    300: '#75B4EE',
    400: '#54A3E9',
    500: '#176FC1' /* Official CBI Blue */,
    600: '#1460A7',
    700: '#0E4F8D' /* Dark Blue */,
    800: '#0B3D6D',
    900: '#062545',
    main: '#176FC1',
    light: '#3D8CD4',
    dark: '#0E4F8D',
    contrastText: '#ffffff',
};

export const RED = {
    50: '#FCE7EB',
    100: '#F7C3CD',
    200: '#F29BAC',
    300: '#EC718B',
    400: '#E75071',
    500: '#CE0F3E' /* Official CBI Red */,
    600: '#B60D37',
    700: '#9B0A2E' /* Dark Red */,
    800: '#7B0825',
    900: '#4F0518',
    main: '#CE0F3E',
    light: '#E14569',
    dark: '#9B0A2E',
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

/* ── Semantic colours ── */
export const INFO = {
    light: '#74caff',
    main: '#176FC1',
    dark: '#0E4F8D',
    contrastText: '#fff',
};

export const SUCCESS = {
    light: '#aaf27f',
    main: '#2E7D32',
    dark: '#1B5E20',
    contrastText: '#fff',
};

export const WARNING = {
    light: '#ffe16a',
    main: '#ffc107',
    dark: '#b78103',
    contrastText: GREY[800],
};

export const ERROR = {
    light: '#E14569',
    main: '#CE0F3E',
    dark: '#9B0A2E',
    contrastText: '#fff',
};

/* ── CBI gradient presets (Official CBI Blue-to-Red Brand Gradients) ── */
export const GRADIENTS = {
    cbiHeader: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
    cbiTable: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)',
    navy: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)',
    navyDark: 'linear-gradient(90deg, #062545 0%, #0E4F8D 50%, #176FC1 100%)',
    header: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
    red: 'linear-gradient(135deg, #CE0F3E 0%, #E14569 100%)',
    redHover: 'linear-gradient(135deg, #9B0A2E 0%, #CE0F3E 100%)',
    gold: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
    accent: 'linear-gradient(90deg, #CE0F3E, #176FC1, #CE0F3E)',
    card: 'linear-gradient(135deg, #176FC1 0%, #0E4F8D 100%)',
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
        RED.main /* #CE0F3E */,
        NAVY.main /* #176FC1 */,
        GOLD.main /* #f6d365 */,
        '#2E7D32' /* green */,
        '#0E4F8D' /* dark blue */,
        '#E14569' /* light red */,
    ],

    gradients: GRADIENTS,
};

export default palette;
