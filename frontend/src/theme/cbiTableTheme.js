/**
 * Central Bank of India (CBI) Centralized Theme & Table Tokens
 * Official Scheme: CBI Primary Blue (#176FC1), CBI Secondary Red (#CE0F3E), Pure White (#FFFFFF)
 */

export const CBI_THEME = {
  // Brand Colors
  blue: '#176FC1',
  blueLight: '#3D8CD4',
  blueDark: '#0E4F8D',
  red: '#CE0F3E',
  redLight: '#E14569',
  redDark: '#9B0A2E',
  white: '#FFFFFF',
  gold: '#f6d365',

  // Chart & Metric Colors
  chartColors: {
    target: '#176FC1',
    achieved: '#2E7D32',
    percentage: '#CE0F3E',
    pending: '#E14569',
    neutral: '#8A9AB5',
    warning: '#ffc107',
  },

  // Official Brand Gradients
  gradients: {
    cbiHeader: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
    cbiTable: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)',
    navy: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)',
    navyDark: 'linear-gradient(90deg, #062545 0%, #0E4F8D 50%, #176FC1 100%)',
    red: 'linear-gradient(135deg, #CE0F3E 0%, #E14569 100%)',
    redHover: 'linear-gradient(135deg, #9B0A2E 0%, #CE0F3E 100%)',
    accent: 'linear-gradient(90deg, #CE0F3E, #176FC1, #CE0F3E)',
    card: 'linear-gradient(135deg, #176FC1 0%, #0E4F8D 100%)',
  },

  // Standard Table Styles
  table: {
    headerBackground: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 50%, #0E4F8D 100%)',
    headerColor: '#FFFFFF',
    headerFontSize: '12px',
    headerFontWeight: 700,
    headerLetterSpacing: '0.4px',
    rowHoverBackground: '#f8fafc',
    selectedRowBackground: 'rgba(23, 111, 193, 0.08)',
    borderColor: '#e2e8f0',
    cellBorderColor: '#f1f5f9',
  },

  // Standard Status Badges Config
  statusBadges: {
    approved: {
      bg: 'rgba(46, 125, 50, 0.12)',
      color: '#2E7D32',
      border: '1px solid rgba(46, 125, 50, 0.3)',
    },
    completed: {
      bg: 'rgba(23, 111, 193, 0.12)',
      color: '#176FC1',
      border: '1px solid rgba(23, 111, 193, 0.3)',
    },
    pending: {
      bg: 'rgba(225, 69, 105, 0.12)',
      color: '#CE0F3E',
      border: '1px solid rgba(206, 15, 62, 0.3)',
    },
    rejected: {
      bg: 'rgba(206, 15, 62, 0.15)',
      color: '#CE0F3E',
      border: '1px solid rgba(206, 15, 62, 0.35)',
    },
  },
};

export default CBI_THEME;
