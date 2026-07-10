import { alpha } from '@mui/material';

const GREY = {
    0: '#ffffff',
    100: '#f9fafb',
    200: '#f4f6f8',
    300: '#dfe3e8',
    400: '#c4cdd5',
    500: '#919eab',
    600: '#637381',
    700: '#454f5b',
    800: '#212b36',
    900: '#161c24',
};

const INFO = {
    light: '#74caff',
    main: '#1890ff',
    dark: '#0c53b7',
    contrastText: '#fff',
};

const SUCCESS = {
    light: '#aaf27f',
    main: '#54d62c',
    dark: '#229a16',
    contrastText: GREY[800],
};

const WARNING = {
    light: '#ffe16a',
    main: '#ffc107',
    dark: '#b78103',
    contrastText: GREY[800],
};

const ERROR = {
    light: '#ffa48d',
    main: '#E63A46',
    dark: '#b72136',
};

const PURPLE = {
    light: '#8a6d9d',
    main: '#69547E',
    dark: '#5c4772',
    lightest: '#C7B7D8',
};

const MO_PALETTE = {
    orange: '#FFA500',
    deepLavender: '#6d5882',
    jazzBerryJam: '#9e1f64',
    treePoppy: '#f7941d',
    darkCornflowerBlue: '#21409a',
    lemonYellow: '#ffde17',
    teal: '#008870',
    mediumTurquoise: '#6cc5c0',
    lightPink: '#ffefe7',
    red: '#FF3B3B',
    lightRed: '#FFEFE8',
    peach: '#FF9966',
    paleTurquoise: '#DDF9F8',
    champagne: '#FAEBCF',
    blue: '#4F9AF7',
    lightBlue: '#EAF6FF',
    blueGrey: '#48535F',
    rebrandingBlue: '#2B2E8C',
    rebrandingHighlightBlue: '#373CD3',
    rebrandingGrey: '#D3D7DD'
};

const graphCustomColors = [
    '#F7941D',
    '#21409A',
    '#FFDE17',
    '#008870',
    '#6CC5C0',
    '#9E1F64',
];

const palette = {
    primary: PURPLE,
    common: { black: '#000', white: '#fff', grey: '#727272', lightGrey: '#A7A7A7' },
    moPalette: MO_PALETTE,
    info: INFO,
    success: SUCCESS,
    warning: WARNING,
    error: ERROR,
    grey: GREY,
    purple: PURPLE,
    divider: alpha(GREY[500], 0.24),
    text: {
        primary: GREY[800],
        secondary: GREY[600],
        disabled: GREY[500],
    },
    graphColors: graphCustomColors,
};

export default palette;
