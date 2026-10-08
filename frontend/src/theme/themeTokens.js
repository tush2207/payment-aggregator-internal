/**
 * Centralized Design Tokens for CBI Payment Aggregator Portal.
 * Eliminates all raw hex color strings and provides standard theme mixins.
 */

export const CBI_COLORS = {
  royalBlue: '#176FC1',
  darkBlue: '#0E4F8D',
  deepNavy: '#062545',
  lightBlueBg: '#f0f7ff',
  softBlueBorder: '#bae6fd',
  crimsonRed: '#CE0F3E',
  darkRed: '#9B0A2E',
  lightRedBg: '#fee2e2',
  gold: '#f6d365',
  goldHover: '#fda085',
  successGreen: '#15803d',
  lightGreenBg: '#dcfce7',
  warningAmber: '#b45309',
  lightAmberBg: '#fff8e1',
  slateText: '#1e293b',
  mutedText: '#64748b',
  subtleText: '#94a3b8',
  borderLight: '#cbd5e1',
  borderSubtle: '#e2e8f0',
  surfaceLight: '#f8fafc',
  white: '#ffffff',
};

export const CBI_GRADIENTS = {
  header: 'linear-gradient(90deg, #176FC1 0%, #135FA6 40%, #9B0A2E 80%, #CE0F3E 100%)',
  tableHeader: 'linear-gradient(90deg, #0E4F8D 0%, #176FC1 100%)',
  tableHeaderAlt: 'linear-gradient(90deg, #062545 0%, #0E4F8D 50%, #176FC1 100%)',
  redAction: 'linear-gradient(90deg, #CE0F3E 0%, #9B0A2E 100%)',
  redActionHover: 'linear-gradient(90deg, #B20D35 0%, #850826 100%)',
  blueAction: 'linear-gradient(90deg, #176FC1 0%, #0E4F8D 100%)',
  goldAccent: 'linear-gradient(90deg, #f6d365 0%, #fda085 100%)',
  cardSurface: 'linear-gradient(135deg, #176FC1 0%, #0E4F8D 100%)',
  modalHeader: 'linear-gradient(135deg, #0E4F8D 0%, #176FC1 100%)',
};

export const CBI_SHADOWS = {
  card: '0 4px 16px rgba(0, 0, 0, 0.06)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  modal: '0 24px 70px rgba(0, 0, 0, 0.35)',
  redGlow: '0 4px 14px rgba(206, 15, 62, 0.35)',
  blueGlow: '0 4px 14px rgba(23, 111, 193, 0.35)',
};

export default {
  CBI_COLORS,
  CBI_GRADIENTS,
  CBI_SHADOWS,
};
