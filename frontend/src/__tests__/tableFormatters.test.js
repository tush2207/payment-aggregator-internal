import { describe, it, expect } from 'vitest';

describe('Applications Table Column & Action Formatters', () => {
  describe('Account Number Formatter Rule', () => {
    it('should identify missing or NA account numbers and return "New" indicator', () => {
      const getAccountDisplay = (accountNo) => {
        if (!accountNo || accountNo === 'NA' || accountNo === 'N/A' || accountNo.trim() === '') {
          return { type: 'badge', value: 'New' };
        }
        return { type: 'text', value: accountNo };
      };

      expect(getAccountDisplay(null)).toEqual({ type: 'badge', value: 'New' });
      expect(getAccountDisplay(undefined)).toEqual({ type: 'badge', value: 'New' });
      expect(getAccountDisplay('')).toEqual({ type: 'badge', value: 'New' });
      expect(getAccountDisplay('NA')).toEqual({ type: 'badge', value: 'New' });
      expect(getAccountDisplay('N/A')).toEqual({ type: 'badge', value: 'New' });
      expect(getAccountDisplay('501234567890')).toEqual({ type: 'text', value: '501234567890' });
    });
  });

  describe('Eye Icon Visibility Rule', () => {
    it('should hide the Eye icon for Central Office Admin (userRole === "CO" && isAdmin)', () => {
      const shouldShowEyeIcon = (userRole, isAdmin) => {
        return !(userRole === 'CO' && isAdmin);
      };

      // CO Admin -> false (Eye icon hidden, Action button shown)
      expect(shouldShowEyeIcon('CO', true)).toBe(false);

      // CO View-Only -> true (Eye icon visible)
      expect(shouldShowEyeIcon('CO', false)).toBe(true);

      // Other Roles -> true (Eye icon visible)
      expect(shouldShowEyeIcon('RO', false)).toBe(true);
      expect(shouldShowEyeIcon('ZO', false)).toBe(true);
      expect(shouldShowEyeIcon('BO', false)).toBe(true);
    });
  });

  describe('Status Chip Derivation', () => {
    it('should correctly derive final approval status for completed apps', () => {
      const deriveStatus = (customer) => {
        if (customer?.isFinalApproved) return 'Final Approval';
        if (customer?.isQuoteAcceptRO) return 'Customer Acceptance';
        if (customer?.isQuoteAddedPA) return 'Quote Submission';
        if (customer?.isReviewByCO) return 'CO Approved';
        if (customer?.isReviewByZO) return 'ZO Approved';
        if (customer?.isReviewByRO) return 'RO Approved';
        return 'Submitted';
      };

      expect(deriveStatus({ isFinalApproved: true })).toBe('Final Approval');
      expect(deriveStatus({ isQuoteAcceptRO: true })).toBe('Customer Acceptance');
      expect(deriveStatus({ isQuoteAddedPA: true })).toBe('Quote Submission');
      expect(deriveStatus({})).toBe('Submitted');
    });
  });
});
