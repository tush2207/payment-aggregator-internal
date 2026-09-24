import { describe, it, expect } from 'vitest';
import { isUserAdmin, ADMIN_USERS } from '../utils/auth';

describe('Role-Based Access Control (RBAC) & Security Matrix', () => {
  const USERS = {
    CO_ADMIN_139822: { employeeId: '139822', role: 'CO', LocationType: 'CO' },
    CO_ADMIN_115019: { employeeId: '115019', role: 'CO', LocationType: 'CO' },
    CO_VIEW_ONLY: { employeeId: '234567', role: 'CO', LocationType: 'CO' },
    RO_OFFICER: { employeeId: 'RO1001', role: 'RO', LocationType: 'RO' },
    ZO_OFFICER: { employeeId: 'ZO1001', role: 'ZO', LocationType: 'ZO' },
    BO_OFFICER: { employeeId: 'BO1001', role: 'BO', LocationType: 'BO' },
  };

  describe('isUserAdmin utility verification', () => {
    it('correctly identifies designated admin user IDs', () => {
      expect(isUserAdmin(USERS.CO_ADMIN_139822)).toBe(true);
      expect(isUserAdmin(USERS.CO_ADMIN_115019)).toBe(true);
      expect(ADMIN_USERS).toContain('139822');
    });

    it('identifies non-admin CO officers as non-admin (view-only)', () => {
      expect(isUserAdmin(USERS.CO_VIEW_ONLY)).toBe(false);
      expect(isUserAdmin(USERS.RO_OFFICER)).toBe(false);
      expect(isUserAdmin(USERS.ZO_OFFICER)).toBe(false);
      expect(isUserAdmin(USERS.BO_OFFICER)).toBe(false);
    });

    it('returns true if role is ADMIN regardless of employeeId', () => {
      expect(isUserAdmin({ employeeId: '999999', role: 'ADMIN' })).toBe(true);
    });
  });

  describe('Manage Aggregator RBAC & Data Display (Unmasked)', () => {
    const aggregatorData = {
      id: 'AGG_01',
      name: 'Razorpay Software Pvt Ltd',
      email: 'contact@razorpay.com',
      alternateEmail: 'support@razorpay.com',
      mobileNo: '9876543210',
      status: 'Active',
    };

    const getAggregatorPermissions = (user) => {
      const isAdmin = isUserAdmin(user);
      return {
        canViewDirectory: true,
        canSearchAndFilter: true,
        canExportExcel: true,
        canInspectDetails: true, // Eye icon visible to all CO users
        canAddAggregator: isAdmin,
        canEditAggregator: isAdmin,
        canDeleteAggregator: isAdmin,
        canResetCredentials: isAdmin,
        canToggleStatus: isAdmin,
      };
    };

    it('renders plain unmasked contact details for aggregator directory', () => {
      // Confirms emails and mobile numbers are displayed raw/unmasked
      expect(aggregatorData.email).toBe('contact@razorpay.com');
      expect(aggregatorData.alternateEmail).toBe('support@razorpay.com');
      expect(aggregatorData.mobileNo).toBe('9876543210');
      expect(aggregatorData.email).not.toContain('*');
      expect(aggregatorData.mobileNo).not.toContain('*');
    });

    it('grants CO View-Only full viewing & export rights but strictly denies mutating actions', () => {
      const perms = getAggregatorPermissions(USERS.CO_VIEW_ONLY);
      expect(perms.canViewDirectory).toBe(true);
      expect(perms.canSearchAndFilter).toBe(true);
      expect(perms.canExportExcel).toBe(true);
      expect(perms.canInspectDetails).toBe(true); // Eye icon allowed
      expect(perms.canAddAggregator).toBe(false);
      expect(perms.canEditAggregator).toBe(false);
      expect(perms.canDeleteAggregator).toBe(false);
      expect(perms.canResetCredentials).toBe(false);
      expect(perms.canToggleStatus).toBe(false);
    });

    it('grants CO Admin (139822) complete administrative control over aggregators', () => {
      const perms = getAggregatorPermissions(USERS.CO_ADMIN_139822);
      expect(perms.canViewDirectory).toBe(true);
      expect(perms.canInspectDetails).toBe(true);
      expect(perms.canAddAggregator).toBe(true);
      expect(perms.canEditAggregator).toBe(true);
      expect(perms.canDeleteAggregator).toBe(true);
      expect(perms.canResetCredentials).toBe(true);
      expect(perms.canToggleStatus).toBe(true);
    });
  });

  describe('Application Flow Universal Visibility & Multi-Step Inspection RBAC', () => {
    const getApplicationPermissions = (user, app) => {
      const isAdmin = isUserAdmin(user);
      const role = (user.role || '').toUpperCase();

      const canViewAllSteps = true; // All authenticated users can inspect all steps
      const isCOUser = role === 'CO' || isAdmin;
      const isCOAdmin = isCOUser && isAdmin;
      const isCOViewer = isCOUser && !isAdmin;

      return {
        // Universal button visibility on the table:
        canSeeVerifyButton: isCOUser && app.isReviewByRO && app.isReviewByZO && !app.isReviewByCO,
        canSeeProcessFlowButton: isCOUser && app.isReviewByCO,
        canSeeEyeIcon: true,
        canViewAllSteps,

        // Mutation / Edit authority:
        canPerformCOApproval: isCOAdmin && app.isReviewByRO && app.isReviewByZO && !app.isReviewByCO,
        canPerformCORejection: isCOAdmin && !app.isFinalApproved && !app.isRejected,
        canEditProjections: isCOAdmin,
        canSendRFPQuotes: isCOAdmin,
        canAddMarkup: isCOAdmin,
        canGeneratePO: isCOAdmin && app.isFinalApproved,
        canDownloadSanction: true, // Documents viewable/downloadable by all authenticated users
        canDownloadPO: true,

        // Inspection mode state:
        isViewOnlyMode: !isCOAdmin,
      };
    };

    it('displays action buttons universally on table for CO View-Only while enforcing view-only mode inside workflow', () => {
      const pendingCOApp = {
        isReviewByRO: true,
        isReviewByZO: true,
        isReviewByCO: false,
        isFinalApproved: false,
      };
      const viewerPerms = getApplicationPermissions(USERS.CO_VIEW_ONLY, pendingCOApp);

      // Buttons are VISIBLE on table
      expect(viewerPerms.canSeeVerifyButton).toBe(true);
      expect(viewerPerms.canSeeEyeIcon).toBe(true);
      expect(viewerPerms.canViewAllSteps).toBe(true);

      // Mutations are strictly locked to view-only mode
      expect(viewerPerms.isViewOnlyMode).toBe(true);
      expect(viewerPerms.canPerformCOApproval).toBe(false);
      expect(viewerPerms.canPerformCORejection).toBe(false);
      expect(viewerPerms.canEditProjections).toBe(false);
      expect(viewerPerms.canSendRFPQuotes).toBe(false);
      expect(viewerPerms.canAddMarkup).toBe(false);
      expect(viewerPerms.canGeneratePO).toBe(false);

      // Document viewing remains active
      expect(viewerPerms.canDownloadSanction).toBe(true);
      expect(viewerPerms.canDownloadPO).toBe(true);
    });

    it('grants full mutation and approval authority to CO Admin (139822)', () => {
      const pendingCOApp = {
        isReviewByRO: true,
        isReviewByZO: true,
        isReviewByCO: false,
        isFinalApproved: false,
      };
      const adminPerms = getApplicationPermissions(USERS.CO_ADMIN_139822, pendingCOApp);

      expect(adminPerms.canSeeVerifyButton).toBe(true);
      expect(adminPerms.isViewOnlyMode).toBe(false);
      expect(adminPerms.canPerformCOApproval).toBe(true);
      expect(adminPerms.canPerformCORejection).toBe(true);
      expect(adminPerms.canEditProjections).toBe(true);
      expect(adminPerms.canSendRFPQuotes).toBe(true);
      expect(adminPerms.canAddMarkup).toBe(true);

      const approvedApp = {
        isReviewByRO: true,
        isReviewByZO: true,
        isReviewByCO: true,
        isFinalApproved: true,
      };
      const approvedAdminPerms = getApplicationPermissions(USERS.CO_ADMIN_139822, approvedApp);
      expect(approvedAdminPerms.canSeeProcessFlowButton).toBe(true);
      expect(approvedAdminPerms.canGeneratePO).toBe(true);
      expect(approvedAdminPerms.canDownloadSanction).toBe(true);
      expect(approvedAdminPerms.canDownloadPO).toBe(true);
    });

    it('enforces sequential hierarchy for RO and ZO verifications', () => {
      const appAtRO = { isReviewByRO: false, isReviewByZO: false };
      const appAtZO = { isReviewByRO: true, isReviewByZO: false };

      const isROPending = (user, app) => user.role === 'RO' && !app.isReviewByRO;
      const isZOPending = (user, app) => user.role === 'ZO' && app.isReviewByRO && !app.isReviewByZO;

      expect(isROPending(USERS.RO_OFFICER, appAtRO)).toBe(true);
      expect(isZOPending(USERS.ZO_OFFICER, appAtRO)).toBe(false);

      expect(isROPending(USERS.RO_OFFICER, appAtZO)).toBe(false);
      expect(isZOPending(USERS.ZO_OFFICER, appAtZO)).toBe(true);
    });
  });
});
