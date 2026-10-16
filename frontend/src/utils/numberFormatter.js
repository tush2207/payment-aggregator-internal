/**
 * Centralized Number & Currency Formatter for Central Bank of India (PAPG)
 * Single source of truth for numeric representation.
 */

export const FORMAT_MODES = {
  FORMATTED: 'formatted',
  ACTUAL: 'actual',
};

/**
 * Main number formatting function.
 * @param {number|string} value - Value to format
 * @param {'formatted'|'actual'} mode - Active mode ('formatted' or 'actual')
 * @param {number} decimals - Maximum fraction digits
 * @returns {string} Formatted number string
 */
export const formatAppNumber = (value, mode = FORMAT_MODES.ACTUAL, decimals = 2) => {
  if (value === null || value === undefined || value === '' || value === '—' || value === '-') {
    return '—';
  }

  if (typeof value === 'string') {
    if (value.includes('₹') || value.includes('%') || value.includes('/-') || value.includes('—')) {
      return value;
    }
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    if (isNaN(parsed)) return value;
    value = parsed;
  }

  const num = Number(value);
  if (isNaN(num)) return String(value);

  const absNum = Math.abs(num);

  if (mode === FORMAT_MODES.FORMATTED && absNum >= 1000) {
    const lakhs = num / 100000;
    const formattedLakhs = Number(lakhs.toFixed(decimals)).toString();
    return `${formattedLakhs}L`;
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrencyINR = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const formatted = formatAppNumber(value, FORMAT_MODES.ACTUAL, 2);
  return formatted === '—' ? '—' : `₹ ${formatted}`;
};

export default formatAppNumber;
